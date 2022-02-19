import React, { useCallback, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { Select, Button, List, Divider, Input, Card, DatePicker, Slider, Switch, Progress, Spin, Row, Col, Tooltip } from "antd";
import { SyncOutlined } from '@ant-design/icons';
import { Address, AddressInput, Balance, Blockie } from "../components";
import { parseEther, parseUnits, formatEther } from "@ethersproject/units";
import { BigNumber, ethers } from "ethers";
import { useContractReader, useEventListener, useLocalStorage } from "../hooks";
import { FACTORY_ADDRESS } from "@uniswap/sdk";
import { _fetchData } from "ethers/lib/utils";
import { useBalance } from "../hooks";
import { useContractLoader, useContractExistsAtAddress } from "../hooks";

const { Option } = Select;

export default function Create({contractName, ownerEvents, signaturesRequired, address, userProvider, mainnetProvider, localProvider, yourLocalBalance, price, tx, readContracts, writeContracts, blockExplorer }) {

  const history = useHistory();

  const [to, setTo] = useLocalStorage("to");
  const [amount, setAmount] = useLocalStorage("amount","0");
  const [methodName, setMethodName] = useLocalStorage("addSigner");
  const [data, setData] = useLocalStorage("data","0x");
  const [currentNonce, setCurrentNonce] = useState(2); //state waarden binnen deze component

  const [currentMultiSig, setCurrentMultiSig] = useState();
  const [currentSigners, setCurrentSigners] = useState();
  const [currentBalance, setCurrentBalance] = useState();
  const [contractBalance, setContractBalance] = useState();
  const [calcHash, setCalcHash] = useState();
  const [signerToAdd, setSignerToAdd] = useState();
  const [addedSignerColl, setAddedSignerColl] = useState([]);

  const [rewardReceiver, setRewardReceiver] = useLocalStorage("rewardReceiver");
  const [challengeDescription, setChallengeDescription] = useLocalStorage("newChallengeDescription");
  const [rewardValue, setRewardValue] = useLocalStorage("rewardValue");
  const [qtySignatureRequired, setQtySignatureRequired] = useLocalStorage("qtySignatureRequired");
  const [uploadCreditValue, setUploadCreditValue] = useLocalStorage("uploadCreditValue");

  //wordt uitgevoerd bij mounten en unmounten deze service component
  useEffect(() => {
    async function fetchData(){
      if(readContracts && readContracts[contractName]){
        var cn = await readContracts[contractName].currentNonce();
        console.log("current nonce = ", cn);
        setCurrentNonce(cn.toNumber());
        
        var ms = await readContracts[contractName].multiSigColl(1);
        console.log("current multisig = ", ms);
        setCurrentMultiSig(ms);

        var k = await readContracts[contractName].getSigners(1);
        console.log("current signers = ", k);
        setCurrentSigners(k);

        var p = await readContracts[contractName].ownerInfoColl(address);
        console.log("p = ", p);
        setCurrentBalance(formatEther(p));

        var ad = await readContracts[contractName].address;
        var z = await userProvider.getBalance(ad);
        var e = formatEther(z);
        setContractBalance(e);
      }
    }
    fetchData();
  }, [calcHash]);

  const contractIsDeployed = useContractExistsAtAddress(userProvider, address);

  if(!contractIsDeployed)
  {
    return <div>Loading...</div>
  }
  return (
    <div style={{ margin: "auto", width: "40vw" }}>
      <div>
        your credits : {currentBalance}
      </div>

      <div>
        upload credits:
      </div>

      <div style={{ margin: 2 }}>
        <Input
          placeholder="transaction credit upload value"
          onChange={e => setUploadCreditValue(e.target.value)}
          value={uploadCreditValue}
          addonAfter={
            <div>
              <Tooltip placement="right" title={" * 10^18 "}>
                <div
                  type="dashed"
                  style={{ cursor: "pointer" }}
                  onClick={async () => {
                    let floatValue = parseFloat(uploadCreditValue)
                    if(floatValue) setUploadCreditValue("" + floatValue * 10 ** 18);
                  }}
                >
                  ✳️
                </div>
              </Tooltip>
            </div>
          }
        />
      </div>

      <div style={{margin:8,padding:8}}>
        <Button onClick={async ()=>{
          console.log("uploadCreditValue = ", uploadCreditValue);
          tx({to: writeContracts[contractName].address, value: parseUnits("" + uploadCreditValue, "wei")});
        }}>
        Upload Credits
        </Button>
      </div>  

      <div style={{margin:8,padding:8}}>
        <Input
          ensProvider={mainnetProvider}
          placeholder="challenge description"
          value={challengeDescription}
          onChange={(e)=>{setChallengeDescription(e.target.value)}}
        />
      </div>

      <div style={{margin:8,padding:8}}>
        <AddressInput
          autoFocus
          ensProvider={mainnetProvider}
          placeholder="reward receiver"
          value={rewardReceiver}
          onChange={setRewardReceiver}
        />
      </div>

      <div style={{margin:8,padding:8}}>
        <AddressInput
          autoFocus
          ensProvider={mainnetProvider}
          placeholder="add signer"
          value={signerToAdd}
          onChange={setSignerToAdd}
        />
      </div>

      <div style={{margin:8,padding:8}}>
        <Button onClick={()=>{
          console.log("signersToAdd before = ", addedSignerColl);
          var temp = addedSignerColl;
          temp.push(signerToAdd);
          console.log("temp = ", temp);
          setAddedSignerColl(temp);
          console.log("signersToAdd after  = ", addedSignerColl);
          setSignerToAdd(null)
        }}>
        Add Signer
        </Button>
      </div>

      <div>
        addedSignerColl = {JSON.stringify(addedSignerColl)}
      </div>
      
      <div style={{ margin: 2 }}>
        <Input
          placeholder="reward value"
          onChange={e => setRewardValue(e.target.value)}
          value={rewardValue}
          addonAfter={
            <div>
              <Tooltip placement="right" title={" * 10^18 "}>
                <div
                  type="dashed"
                  style={{ cursor: "pointer" }}
                  onClick={async () => {
                    let floatValue = parseFloat(rewardValue)
                    if(floatValue) setRewardValue("" + floatValue * 10 ** 18);
                  }}
                >
                  ✳️
                </div>
              </Tooltip>
            </div>
          }
        />
      </div>

      <div style={{margin:8,padding:8}}>
        <Input
          ensProvider={mainnetProvider}
          placeholder="qty signature required"
          value={qtySignatureRequired}
          onChange={(e)=>{setQtySignatureRequired(e.target.value)}}
        />
      </div>

      <div style={{margin:8,padding:8}}>
        <Button onClick={async ()=>{
          console.log("METHOD",setMethodName)
          console.log("rewardReceiver, rewardValue, qtySignatureRequired = ", rewardReceiver, rewardValue);
          //clear signer for next multisig instance creation
          setSignerToAdd(null)
          setAddedSignerColl([]);
          const overrides = {};
          overrides.value = parseUnits("" + rewardValue, "wei");
          tx(
            writeContracts[contractName].addMultiSig(rewardReceiver, qtySignatureRequired, addedSignerColl, challengeDescription, overrides)
          );
        }}>
        Create New MultiSig Instance
        </Button>
      </div>
    </div>
  );
}
