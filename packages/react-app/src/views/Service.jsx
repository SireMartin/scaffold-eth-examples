import React, { useCallback, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { Select, Button, List, Divider, Input, Card, DatePicker, Slider, Switch, Progress, Spin } from "antd";
import { SyncOutlined } from '@ant-design/icons';
import { Address, AddressInput, Balance, Blockie } from "../components";
import { parseEther, formatEther } from "@ethersproject/units";
import { BigNumber, ethers } from "ethers";
import { useContractReader, useEventListener, useLocalStorage } from "../hooks";
import { FACTORY_ADDRESS } from "@uniswap/sdk";
import { _fetchData } from "ethers/lib/utils";
import { useBalance } from "../hooks";

const { Option } = Select;

export default function Service({contractName, ownerEvents, signaturesRequired, address, nonce, userProvider, mainnetProvider, localProvider, yourLocalBalance, price, tx, readContracts, writeContracts, blockExplorer }) {

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

  const [rewardReceiver, setRewardReceiver] = useLocalStorage("rewardReceiver");
  const [challengeDescription, setChallengeDescription] = useLocalStorage("newChallengeDescription");
  const [rewardValue, setRewardValue] = useLocalStorage("rewardValue");
  const [qtySignatureRequired, setQtySignatureRequired] = useLocalStorage("qtySignatureRequired");

  //wordt uitgevoerd bij mounten en unmounten deze service component
  useEffect(() => {
    async function fetchNonce(){
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
        console.log("your current balance = ", p.balance);
        setCurrentBalance(formatEther(p.balance));

        var ad = await readContracts[contractName].address;
        var z = await userProvider.getBalance(ad);
        var e = formatEther(z);
        setContractBalance(e);
      }
    }
    fetchNonce();
  }, []);

  return (
    <div>
      <h1> current nonce    = {JSON.stringify(currentNonce)} </h1>
      <h1> current multisig = {JSON.stringify(currentMultiSig)} </h1>
      <h1> current signers  = {JSON.stringify(currentSigners)} </h1>
      <h1> your balance     = {JSON.stringify(currentBalance)} </h1>
      <h1> contract balance = {JSON.stringify(useBalance(userProvider, readContracts[contractName].address))} </h1>
      <h1> contract balance = {JSON.stringify(contractBalance)} </h1>

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

      <div style={{ margin: 2 }}>
        <Input
          placeholder="reward value"
          onChange={e => setRewardValue(e.target.value)}
          value={rewardValue}
          addonAfter={
            <div>
              <Row>
                <Col span={16}>
                  <Tooltip placement="right" title={" * 10^18 "}>
                    <div
                      type="dashed"
                      style={{ cursor: "pointer" }}
                      onClick={async () => {
                        let floatValue = parseFloat(txValue)
                        if(floatValue) setRewardValue("" + floatValue * 10 ** 18);
                      }}
                    >
                      ✳️
                    </div>
                  </Tooltip>
                </Col>
                <Col span={16}>
                  <Tooltip placement="right" title={"number to hex"}>
                    <div
                      type="dashed"
                      style={{ cursor: "pointer" }}
                      onClick={async () => {
                        setRewardValue(BigNumber.from(txValue).toHexString());
                      }}
                    >
                      #️⃣
                  </div>
                  </Tooltip>
                </Col>
              </Row>
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
          let calldata = readContracts[contractName].interface.encodeFunctionData(methodName,[newOwner,newSignaturesRequired])
          console.log("calldata",calldata)
          setData(calldata)
          setAmount("0")
          setTo(readContracts[contractName].address)
          setTimeout(()=>{
            history.push('/create')
          },777)
        }}>
        Create Tx
        </Button>
      </div>
    </div>
  );
}
