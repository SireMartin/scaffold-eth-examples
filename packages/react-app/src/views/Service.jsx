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
  const [newOwner, setNewOwner] = useLocalStorage("newOwner");
  const [newSignaturesRequired, setNewSignaturesRequired] = useLocalStorage("newSignaturesRequired");
  const [data, setData] = useLocalStorage("data","0x");
  const [currentNonce, setCurrentNonce] = useState(2); //state waarden binnen deze component
  const [currentMultiSig, setCurrentMultiSig] = useState();
  const [currentSigners, setCurrentSigners] = useState();
  const [currentBalance, setCurrentBalance] = useState();
  const [contractBalance, setContractBalance] = useState();

  //wordt uitgevoerd bij mounten en unmounten deze service component
  useEffect(() => {
    async function fetchNonce(){
      if(readContracts && readContracts[contractName]){
        var cn = readContracts && await readContracts[contractName].currentNonce();
        console.log("current nonce = ", cn);
        setCurrentNonce(cn.toNumber());
        
        var ms = readContracts && await readContracts[contractName].multiSigColl(1);
        console.log("current multisig = ", ms);
        setCurrentMultiSig(ms);

        var k = readContracts && await readContracts[contractName].getSigners(1);
        console.log("current signers = ", k);
        setCurrentSigners(k);

        var p = readContracts && await readContracts[contractName].ownerInfoColl(address);
        console.log("your current balance = ", p.balance);
        setCurrentBalance(formatEther(p.balance));

        var ad = readContracts && readContracts[contractName].address;
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
      <h2 style={{marginTop:32}}>Signatures Required: {signaturesRequired?signaturesRequired.toNumber():<Spin></Spin>}</h2>
      <List
        style={{maxWidth:400,margin:"auto",marginTop:32}}
        bordered
        dataSource={ownerEvents}
        renderItem={(item) => {
          return (
            <List.Item key={"owner_"+item[0]}>
            <Address
              address={item[0]}
              ensProvider={mainnetProvider}
              blockExplorer={blockExplorer}
              fontSize={32}
            />
            <div style={{padding:16}}>
              {item[1]?"👍":"👎"}
            </div>
            </List.Item>
          )
        }}
      />

      <div style={{border:"1px solid #cccccc", padding:16, width:400, margin:"auto",marginTop:64}}>
        <div style={{margin:8,padding:8}}>
          <Select value={methodName} style={{ width: "100%" }} onChange={ setMethodName }>
            <Option key="addSigner">Add Signer</Option>
            <Option key="removeSigner">Remove Signer</Option>
          </Select>
        </div>
        <div style={{margin:8,padding:8}}>
          <AddressInput
            autoFocus
            ensProvider={mainnetProvider}
            placeholder="signer address"
            value={newOwner}
            onChange={setNewOwner}
          />
        </div>
        <div style={{margin:8,padding:8}}>
          <Input
            ensProvider={mainnetProvider}
            placeholder="new # of signatures required"
            value={newSignaturesRequired}
            onChange={(e)=>{setNewSignaturesRequired(e.target.value)}}
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
    </div>
  );
}
