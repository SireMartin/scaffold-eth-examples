import React, { useCallback, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { Select, Button, List, Divider, Input, Card, DatePicker, Slider, Switch, Progress, Spin, Tooltip, Statistic } from "antd";
import { CloseOutlined, SyncOutlined } from '@ant-design/icons';
import { Address, AddressInput, Balance, Blockie } from "../components";
import { parseEther, formatEther, parseUnits } from "@ethersproject/units";
import { ethers } from "ethers";
import { useContractReader, useEventListener, useLocalStorage } from "../hooks";
import { useContractLoader, useContractExistsAtAddress } from "../hooks";
import { isTerminating } from "apollo-link/lib/linkUtils";

const { Option } = Select;

export default function Sign({contractName, updateFrontendEvents, signaturesRequired, address, userProvider, mainnetProvider, localProvider, yourLocalBalance, price, tx, readContracts, writeContracts, blockExplorer }) {

  const history = useHistory();

  const [noncesToSign, setNoncesToSign] = useState([]);
  const [signedMultiSigInstances, setSignedMultiSigInstances] = useState([]);
  const [unsignedMultiSigInstances, setUnsignedMultiSigInstances] = useState([]);
  const [generatedSignature, setGeneratedSignature] = useState("");
  const [nonceForGeneratedSignature, setNonceForGeneratedSignature] = useState(0)
  const [calculatedHash, setCalculatedHash] = useState();

  //wordt uitgevoerd bij mounten en unmounten deze service component
  useEffect(() => {
    async function fetchData(){
      if(readContracts && readContracts[contractName]){
        //get the nonces the current addres is signer of (this contains a boolean if still an active signer for nonce (signer could be removed))
        var _noncesToSign = await readContracts[contractName].getNoncesToSign(address);
        console.log("nonces to sign = ", _noncesToSign);
        setNoncesToSign(_noncesToSign);
        console.log("length = ", _noncesToSign.length);
        var unsignedInstanceColl = [];
        var signedInstanceColl = [];
        //iterate all nonces (= multisig instance keys) the user is signer of
        for(const iterNonce of _noncesToSign)
        {
          console.log("iter current nonce = ", iterNonce);
          //we iterate the signerhas the signer has not been removed from the multisig instance
          if(iterNonce.isValid)
          {
            //for each nonce, get the multisig instance
            var instance = await readContracts[contractName].multiSigColl(iterNonce.nonce);
            console.log("multisig instance = ", instance);

            //get the signers for the multisig instance and their signing status
            var instanceSigningInfo = await readContracts[contractName].getSigners(iterNonce.nonce);
            var userHasSigned = false;
            //iterate the signers of the multisig instance, they have a boolean about the signing status
            for(const iterSigningInfo of instanceSigningInfo)
            {
              //if the client address, add to structures for use in view (if the address is 0, the signer has been removed from the multisig instance)
              if(iterSigningInfo.addr == address)
              {
                console.log("address found");
                if(iterSigningInfo.hasSigned)
                { //for overview
                  signedInstanceColl.push({multisig: instance, nonce: iterNonce.nonce});
                }
                else
                { //for signing
                  unsignedInstanceColl.push({multisig: instance, nonce: iterNonce.nonce});
                }
              }
            }
          }
        }
        setUnsignedMultiSigInstances(unsignedInstanceColl);
        setSignedMultiSigInstances(signedInstanceColl);
      }
    }
    fetchData();
  }, [updateFrontendEvents]);

  const contractIsDeployed = useContractExistsAtAddress(userProvider, address);

  if(!contractIsDeployed)
  {
    return <div>Loading...</div>
  }
  return (
    <div style={{ margin: "auto", width: "40vw" }}>

      <h3>Unsigned MultiSig Instances:</h3>
      <List
        bordered
        dataSource={unsignedMultiSigInstances}
        renderItem={item => {
          console.log("iterItem = ", item);
          return (
            <Card title={item.multisig.shortDescription}>
              <div style={{margin:8,padding:8}}>{formatEther(item.multisig.amount)} ETH to <Address address={item.multisig.to} userProvider={mainnetProvider} /></div>
              <Button onClick={async () =>{
                var hash = await readContracts[contractName].calculateHash(item.nonce ,item.multisig[2], item.multisig[4]);
                setCalculatedHash(hash);
                console.log("nonce = ", item.nonce);
                console.log("hash = ", hash);
                console.log("address = ", address);
                const signature = await userProvider.send("personal_sign", [hash, address]);
                console.log("signature = ", signature);
                setGeneratedSignature(signature);
                setNonceForGeneratedSignature(item.nonce)
              }}>Sign</Button>

              {generatedSignature.length > 0 && nonceForGeneratedSignature == item.nonce &&
                <div>
                  <div>
                    <Statistic title="nonce" value={item.nonce} />
                    <Statistic title="Hash" value={generatedSignature} />
                  </div>
                  <Button onClick={async () =>{
                    console.log("signature = ", generatedSignature);
                    const recover = await readContracts[contractName].recover(calculatedHash, generatedSignature);
                    console.log("recover = ", recover);
                    tx(writeContracts[contractName].sign(item.nonce, generatedSignature));
                    setGeneratedSignature("");
                    setCalculatedHash("");
                    setNonceForGeneratedSignature(0);
                  }}>Send Signature</Button>
                </div>
              }
            </Card>
          );
        }}
      />

      <h3>Signed MultiSig Instances:</h3>
      <List
        bordered
        dataSource={signedMultiSigInstances}
        renderItem={item => {
          return(
            <Card title={item.multisig.shortDescription}>
              <div style={{margin:8,padding:8}}>{formatEther(item.multisig.amount)} ETH to <Address address={item.multisig.to} userProvider={mainnetProvider} /> </div>
            </Card>
          )
        }}
      />
    </div>
  );
}
