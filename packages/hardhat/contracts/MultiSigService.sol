pragma solidity 0.8.0;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "hardhat/console.sol";

contract MultiSigService {
    using ECDSA for bytes32;

    struct SignerInfo
    {
        address addr;   //the address of the singer, added by nonce owner calling addSigner
        bool hasSigned;  //did the address already sign?
    }
    struct MultiSig 
    {
        bool isCompleted;   //the beneficiary has been paid
        uint8 qtyReqSig;    //how many have to sign
        address payable to; //the beneficiary
        address owner;  //the creator of the MultiSig, which also signs the hash when creating a new multisig contract by calling addMultiSig()
        uint amount;    //value the beneficiary receives when multisig is completed, this value is sent when the addMultiSig is called to create a new MultiSig
        bytes32 hash;   //hash of nonce, to and value
        string shortDescription;    //the goal of the MultiSig
        SignerInfo[] signers;
    }

    struct NonceInfo
    {
        uint nonce;
        bool isValid;   //true if owner or valid signer, false if signer has been removed (entries in NonceInfo will not be deleted when signer is removed, but markd as invalid)
    }

    mapping(uint => MultiSig) public multiSigColl;          //nonce to multisig contract
    mapping(address => uint[]) public ownerInfoColl;        //references to it's nonces (multisig instances created by the owner)
    mapping(address => NonceInfo[]) public signerInfoColl;  //associates signers to nonces, which are keys to multisig instances

    uint public currentNonce;
    uint public chainId;

    event UpdateFrontend();

    constructor(uint argChainId, uint argInitialNonce)
    {
        currentNonce = argInitialNonce;
        chainId = argChainId;
    }

    modifier onlyOwner(uint argNonce)
    {
        require(msg.sender == multiSigColl[argNonce].owner, "Only nonce owners can call this function");
        _;
    }

    modifier nonceExists(uint argNonce)
    {
        require(multiSigColl[argNonce].owner != address(0), "multisig contract for nonce does not exist");
        _;
    }

    function getSigners(uint argNonce) public view returns (SignerInfo[] memory)
    {
        return multiSigColl[argNonce].signers;
    }

    function getOwnedNonces(address argAddress) public view returns (uint[] memory)
    {
        return ownerInfoColl[argAddress];
    }

    function getNoncesToSign(address argAddress) public view returns (NonceInfo[] memory)
    {
        return signerInfoColl[argAddress];
    }

    function calculateHash(uint argNonce, address argTo, uint argValue) public view returns (bytes32)
    {
        return keccak256(abi.encodePacked(address(this), chainId, argNonce, argTo, argValue));
    }

    function addMultiSig(address payable argTo, uint8 argQtyReqSig, address[] memory argSigners, string memory argDesc) public payable returns (uint) 
    {
        console.log("current nonce = ", currentNonce);
        console.log("entering addMultiSig()");
        console.log("param argTo = ", argTo);
        console.log("param argQtyReqSig = ", argQtyReqSig);
        for(uint i = 0; i < argSigners.length; ++i)
        {
            console.log("param argSigner = ", argSigners[i]);
        }
        
        require(msg.value != 0, "You must provide value to this call");
        //this would be easier but error : Invalid type for argument in function call. Invalid implicit conversion from struct MultiSigService.SignerInfo memory[1] memory to struct MultiSigService.SignerInfo memory[] memory requested
        //multiSigColl[nonce] = MultiSig({isCompleted: false, to: argTo, qtyReqSig: argQtyReqSig, amount: msg.value, hash: argHash, signers: [ SignerInfo({isOwner: true, addr: msg.sender, sig: argSig}) ] });

        MultiSig storage newMultiSig = multiSigColl[currentNonce];
        newMultiSig.isCompleted = false;
        newMultiSig.qtyReqSig = argQtyReqSig;
        newMultiSig.to = argTo;
        newMultiSig.amount = msg.value;
        //we cannot calculate the has from client because of concurrency so the nonce (key of the multisig instance) is assigned here
        //after the multisig instance is created, the signers can use the nonce in the frontend to calculate the hash there
        newMultiSig.hash = calculateHash(currentNonce, newMultiSig.to, newMultiSig.amount);
        newMultiSig.owner = msg.sender;
        newMultiSig.shortDescription = argDesc;
        for(uint i = 0; i < argSigners.length; ++i)
        {
            console.log("signers.length = ", argSigners.length);
            //back-end check on signer redundancy
            bool doesNotOccur = true;
            for(uint j = 0; j < newMultiSig.signers.length; ++j)
            {
                if(newMultiSig.signers[j].addr == argSigners[i])
                {
                    doesNotOccur = false;
                    break;
                }
            }
            require(doesNotOccur, "redundant signers are not allowed");
            newMultiSig.signers.push(SignerInfo(argSigners[i], false));
            //register the nonce to the signer
            addSignerToNonce(currentNonce, argSigners[i]);
        }
        //register the nonce to the creator of the multisig instance
        ownerInfoColl[msg.sender].push(currentNonce);
        emit UpdateFrontend();
        return currentNonce++;
    }

    function getIndexOfSigner(uint argNonce, address argAddr) private view nonceExists(argNonce) returns (uint)
    {
        //i hope the compiler optimises this
        for(uint i = 0; i < multiSigColl[argNonce].signers.length; ++i)
        {
            if(multiSigColl[argNonce].signers[i].addr == argAddr)
            {
                return i;
            }
        }
        return type(uint).max;
    }

    //only add a new signer if not already present to prevent same account so sign multiple times
    function addSigner(uint argNonce, address argAddr, uint8 argQtyReqSig) public onlyOwner(argNonce)
    {
        uint signerIndex = getIndexOfSigner(argNonce, argAddr);
        require(signerIndex == type(uint).max, "signer is already registered for this multisig");
        multiSigColl[argNonce].qtyReqSig = argQtyReqSig;
        
        //register the nonce to the signer
        addSignerToNonce(argNonce, argAddr);
        
        //first check if the new signer can take the space of a previously removed signer
        for(uint i = 0; i < multiSigColl[argNonce].signers.length; ++i)
        {
            if(multiSigColl[argNonce].signers[i].addr == address(0))
            {
                multiSigColl[argNonce].signers[i].addr = argAddr;
                //multiSigColl[argNonce].signers[i].hasSigned = false;
                emit UpdateFrontend();
                return;
            }
        }
        multiSigColl[argNonce].signers.push(SignerInfo(argAddr, false));
        emit UpdateFrontend();
    }

    function removeSigner(uint argNonce, address argSignerAddr, uint8 argQtyReqSig) public onlyOwner(argNonce)
    {
        uint signerIndex = getIndexOfSigner(argNonce, argSignerAddr);
        require(signerIndex != type(uint).max, "not able to remove unregistered signer");
        multiSigColl[argNonce].signers[signerIndex].addr = address(0);
        multiSigColl[argNonce].signers[signerIndex].hasSigned = false;
        multiSigColl[argNonce].qtyReqSig = argQtyReqSig;

        //remove signer address to nonce mapping
        removeSignerFromNonce(argNonce, argSignerAddr);
        emit UpdateFrontend();
    }

    //check for this address to exist as a signer and if so add signature
    function sign(uint argNonce, bytes memory argSig) public nonceExists(argNonce)
    {
        console.log("argNonce = ", argNonce);
        console.log("hash");
        console.logBytes32(multiSigColl[argNonce].hash);
        console.log("sig");
        console.logBytes(argSig);
        address recoveredAddress = multiSigColl[argNonce].hash.toEthSignedMessageHash().recover(argSig);
        console.log("recoveredAddress = ", recoveredAddress);
        uint indexOfSigner = getIndexOfSigner(argNonce, recoveredAddress);
        console.log("indexOfSigner = ", indexOfSigner);
        require(type(uint).max != indexOfSigner, "this is not a singers signature");
        multiSigColl[argNonce].signers[indexOfSigner].hasSigned = true;
        emit UpdateFrontend();
    }

    //todo remove after testing
    function recover(bytes32 argHash, bytes memory argSig) public pure returns (address)
    {
        return argHash.toEthSignedMessageHash().recover(argSig);
    }

    //if enough signers, the contract executes the payment and credits the transaction to the owner of this multisig instance
    function execute(uint argNonce) public onlyOwner(argNonce)
    {
        //the value has to be transferred prior to accounting the owners credits for the transaction, because we don't know the cost upfront 
        require(msg.sender.code.length == 0, "not allowed for a contract to call execute because of re-entrancy");
        //start on 0 : the owner of the multisig does not count as a signer
        uint8 qtyValidSig = 0;
        for(uint i = 0; i < multiSigColl[argNonce].signers.length; ++i)
        {
            if(multiSigColl[argNonce].signers[i].hasSigned)
            {
                ++qtyValidSig;
            }
        }
        console.log("qtyValidSig = ", qtyValidSig);
        require(qtyValidSig >= multiSigColl[argNonce].qtyReqSig, "not enough signatures to execute multisig");
        (bool success, bytes memory result) = multiSigColl[argNonce].to.call{value: multiSigColl[argNonce].amount}("");
        require(success, "executeTransaction: failed to transfer value for this multisig");
        multiSigColl[argNonce].isCompleted = true;
        emit UpdateFrontend();
    }

    receive() external payable 
    {
        revert("You cannot pay directly to this contract");
    }

    //TODO: make private
    function addSignerToNonce(uint argNonce, address argSignerAddr) public
    {
        //first try to re-use an existing entity set to false
        for(uint i = 0; i < signerInfoColl[argSignerAddr].length; ++i)
        {
            if(!signerInfoColl[argSignerAddr][i].isValid)
            {
                signerInfoColl[argSignerAddr][i].nonce = argNonce;
                signerInfoColl[argSignerAddr][i].isValid = true;
                console.log("re-used existing spot");
                return;
            }
        }
        console.log("added new spot");
        //if no entry could be re-used, make a new one
        signerInfoColl[argSignerAddr].push(NonceInfo(argNonce, true));
    }

    //TODO: make private
    function removeSignerFromNonce(uint argNonce, address argSignerAddr) public
    {
        bool nonceRemovedForSigner = false;
        for(uint i; i < signerInfoColl[argSignerAddr].length; ++i)
        {
            if(signerInfoColl[argSignerAddr][i].nonce == argNonce)
            {
                console.log("removed signer");
                signerInfoColl[argSignerAddr][i].isValid = false;
                nonceRemovedForSigner = true;
            }    
        }
        require(nonceRemovedForSigner, "signer was removed from multisig instance, but unable to remove its nonce reference, probabely a bug in signer nonce ref");
    }
}