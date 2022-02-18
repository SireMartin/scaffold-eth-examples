import React, { useCallback, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { Select, Button, List, Divider, Input, Card, DatePicker, Slider, Switch, Progress, Spin, Tooltip } from "antd";
import { CloseOutlined, SyncOutlined } from '@ant-design/icons';
import { Address, AddressInput, Balance, Blockie } from "../components";
import { parseEther, formatEther, parseUnits } from "@ethersproject/units";
import { ethers } from "ethers";
import { useContractReader, useEventListener, useLocalStorage } from "../hooks";
import { useContractLoader, useContractExistsAtAddress } from "../hooks";

const { Option } = Select;

export default function Owners({contractName, ownerEvents, signaturesRequired, address, nonce, userProvider, mainnetProvider, localProvider, yourLocalBalance, price, tx, readContracts, writeContracts, blockExplorer }) {

  const history = useHistory();

  const [calcHash, setCalcHash] = useState();
  const [noncesToSign, setNoncesToSign] = useState([]);
  const [signedMultiSigInstances, setSignedMultiSigInstances] = useState([]);
  const [unsignedMultiSigInstances, setUnsignedMultiSigInstances] = useState([]);


  //wordt uitgevoerd bij mounten en unmounten deze service component
  useEffect(() => {
    async function fetchNonce(){
      if(readContracts && readContracts[contractName]){
        //get the nonces the current addres is signer of
        var _noncesToSign = await readContracts[contractName].getNoncesToSign(address);
        console.log("nonces to sign = ", _noncesToSign);
        setNoncesToSign(_noncesToSign);
        console.log("length = ", _noncesToSign.length);
        var unsignedInstanceColl = [];
        var signedInstanceColl = [];
        for(var i = 0; i < _noncesToSign.length; ++i)
        {
          console.log("nince = ", _noncesToSign[i]);
          //if the signer has not been removed from the multisig instance
          if(_noncesToSign[i][1])
          {
            //for each nonce, get the multisig instance
            var instance = await readContracts[contractName].multiSigColl(_noncesToSign[i][0]);
            console.log("instance = ", instance);

            var instanceSigningInfo = await readContracts[contractName].getSigners(_noncesToSign[i][0]);
            var userHasSigned = false;
            for(var x = 0; x < instanceSigningInfo.length; ++x)
            {
              if(instanceSigningInfo[x][0] == address)
              {
                console.log("address found");
                if(instanceSigningInfo[x][1])
                {
                  signedInstanceColl.push(instance);
                }
                else
                {
                  unsignedInstanceColl.push(instance);
                }
              }
            }
          }
        }
        /*_noncesToSign.foreach(async element =>
        {
          console.log("nince = ", element);
          if(element[1])
          {
            var instance = await readContracts[contractName].multiSigColl(element[0]);
            console.log("instance = ", instance);
            instanceColl.push(instance);
          }
        });*/
        setSignedMultiSigInstances(signedInstanceColl);
        setUnsignedMultiSigInstances(unsignedInstanceColl);

      }
    }
    fetchNonce();
  }, [calcHash]);

  const contractIsDeployed = useContractExistsAtAddress(userProvider, address);

  if(!contractIsDeployed)
  {
    return <div>Loading...</div>
  }
  return (
    <div style={{ margin: "auto", width: "40vw" }}>
      <div>noncesToSign = {JSON.stringify(noncesToSign)}</div>

      <div>unsignedMultiSigInstances = {JSON.stringify(unsignedMultiSigInstances)}</div>
      <List
        bordered
        dataSource={unsignedMultiSigInstances}
        renderItem={item => {
          console.log("ITE88888M", item);

          return (
            <div>
              <div>{item[6]} </div>
              <Button onClick={async () =>{
                var hash = await readContracts[contractName].calculateHash(1 ,item[2], item[4]);
                console.log("hash = ", hash);
                console.log("address = ", address);
                const signature = await userProvider.send("personal_sign", [hash, address]);
                console.log("signature = ", signature);
                const recover = await readContracts[contractName].recover(hash, signature);
                console.log("recover = ", recover);
                tx(writeContracts[contractName].sign(1, signature));
              }}>Sign</Button>
            </div>
          );
        }}
      />

      <div>signedMultiSigInstances = {JSON.stringify(signedMultiSigInstances)}</div>
      <List
        bordered
        dataSource={signedMultiSigInstances}
        renderItem={item => {
          console.log("ITE88888M", item);

          return (
            <div>{item[6]} </div>
          );
        }}
      />
    </div>
  );
}
