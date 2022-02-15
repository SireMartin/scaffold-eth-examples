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

    uint public currentNonce;
    uint public chainId;

    mapping(uint => MultiSig) public multiSigColl; //nonce to multisig contract
    mapping(address => uint) public balances;    //balances per multisig creator for contract execution of transfers

    constructor(uint argChainId)
    {
        currentNonce = 1; //we start the nonce at 1, because this is the url param and you don't want 0 as a param
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

    function calculateHash(uint argNonce, address argTo, uint argValue) public view returns (bytes32)
    {
        return keccak256(abi.encodePacked(address(this), chainId, argNonce, argTo, argValue));
    }

    function addMultiSig(address payable argTo, uint8 argQtyReqSig, address[] memory argSigners, bytes32 argHash, string memory argDesc) public payable returns (uint) 
    {
        console.log("entering addMultiSig()");
        console.log("param argTo = ", argTo);
        console.log("param argQtyReqSig = ", argQtyReqSig);
        for(uint i = 0; i < argSigners.length; ++i)
        {
            console.log("param argSigner = ", argSigners[i]);
        }
        console.logBytes32(argHash);
        
        require(msg.value != 0, "You must provide value to this call");
        //this would be easier but error : Invalid type for argument in function call. Invalid implicit conversion from struct MultiSigService.SignerInfo memory[1] memory to struct MultiSigService.SignerInfo memory[] memory requested
        //multiSigColl[nonce] = MultiSig({isCompleted: false, to: argTo, qtyReqSig: argQtyReqSig, amount: msg.value, hash: argHash, signers: [ SignerInfo({isOwner: true, addr: msg.sender, sig: argSig}) ] });

        MultiSig storage newMultiSig = multiSigColl[currentNonce];
        newMultiSig.isCompleted = false;
        newMultiSig.qtyReqSig = argQtyReqSig;
        newMultiSig.to = argTo;
        newMultiSig.amount = msg.value;
        newMultiSig.hash = calculateHash(currentNonce, newMultiSig.to, newMultiSig.amount);
        newMultiSig.owner = msg.sender;
        newMultiSig.shortDescription = argDesc;
        for(uint i = 0; i < argSigners.length; ++i)
        {
            newMultiSig.signers.push(SignerInfo(argSigners[i], false));
        }
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
        for(uint i = 0; i < multiSigColl[argNonce].signers.length; ++i)
        {
            if(multiSigColl[argNonce].signers[i].addr == address(0))
            {
                multiSigColl[argNonce].signers[i].addr = argAddr;
                //multiSigColl[argNonce].signers[i].hasSigned = false;
                return;
            }
        }
        multiSigColl[argNonce].signers.push(SignerInfo(argAddr, false));
        multiSigColl[argNonce].qtyReqSig = argQtyReqSig;
    }

    function removeSigner(uint argNonce, address argAddr, uint8 argQtyReqSig) public onlyOwner(argNonce)
    {
        uint signerIndex = getIndexOfSigner(argNonce, argAddr);
        require(signerIndex != type(uint).max, "not able to remove unregistered signer");
        multiSigColl[argNonce].signers[signerIndex].addr = address(0);
        multiSigColl[argNonce].signers[signerIndex].hasSigned = false;
        multiSigColl[argNonce].qtyReqSig = argQtyReqSig;
    }

    //check for this address to exist as a signer and if so add signature
    function sign(uint argNonce, bytes memory argSig) public nonceExists(argNonce)
    {
        require(msg.sender == multiSigColl[argNonce].hash.recover(argSig), "signer is not the sender of this message");
        uint signerIndex = getIndexOfSigner(argNonce, msg.sender);
        require(signerIndex != type(uint).max, "you are not registered as a signer for this multisig");
        multiSigColl[argNonce].signers[signerIndex].hasSigned = true;
    }

    //if enough signers, the contract executes the payment and credits the transaction to the owner of this multisig instance
    function execute(uint argNonce) public onlyOwner(argNonce)
    {
        //the value has to be transferred prior to accounting the owners credits for the transaction, because we don't know the cost upfront 
        require(msg.sender.code.length == 0, "not allowed for a contract to call execute because of re-entrancy");
        //start by one because the owner of the multisig is also a signer
        uint8 qtyValidSig = 1;
        for(uint i = 0; i < multiSigColl[argNonce].signers.length; ++i)
        {
            if(multiSigColl[argNonce].signers[i].hasSigned)
            {
                ++qtyValidSig;
            }
        }
        require(qtyValidSig >= multiSigColl[argNonce].qtyReqSig, "not enough signatures to execute multisig");
        uint contractValueBefore = address(this).balance;
        (bool success, bytes memory result) = multiSigColl[argNonce].to.call{value: multiSigColl[argNonce].amount}("");
        require(success, "executeTransaction: failed to transfer value for this multisig");
        balances[msg.sender] -= contractValueBefore - address(this).balance - multiSigColl[argNonce].amount;
    }

    //multisig instance creator adds credits to the contract for execution of its transfers
    receive() external payable 
    {
        balances[msg.sender] += msg.value;
    }

    function getGetal() public pure returns (uint8)
    {
        return 8;
    }
}