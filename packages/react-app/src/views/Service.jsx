import React, { useCallback, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { Select, Button, List, Divider, Input, Card, DatePicker, Slider, Switch, Progress, Spin } from "antd";
import { SyncOutlined } from '@ant-design/icons';
import { Address, AddressInput, Balance, Blockie } from "../components";
import { parseEther, formatEther } from "@ethersproject/units";
import { ethers } from "ethers";
import { useContractReader, useEventListener, useLocalStorage } from "../hooks";
import { FACTORY_ADDRESS } from "@uniswap/sdk";
const { Option } = Select;

export default function Service({contractName, ownerEvents, signaturesRequired, address, nonce, userProvider, mainnetProvider, localProvider, yourLocalBalance, price, tx, readContracts, writeContracts, blockExplorer }) {

  const history = useHistory();

  const [to, setTo] = useLocalStorage("to");
  const [amount, setAmount] = useLocalStorage("amount","0");
  const [methodName, setMethodName] = useLocalStorage("addSigner");
  const [newOwner, setNewOwner] = useLocalStorage("newOwner");
  const [newSignaturesRequired, setNewSignaturesRequired] = useLocalStorage("newSignaturesRequired");
  const [data, setData] = useLocalStorage("data","0x");
  const [currentNonce, setCurrentNonce] = useState(); //state waarden binnen deze component

  //wordt uitgevoerd bij mounten en unmounten deze service component
  useEffect(async() => {
      setCurrentNonce(await readContracts[contractName].currentNonce()); //alles behalve de return wordt uitgevoerd bij mounten
      //return fct() voert cleanup actie uit bij unmounten (enkel de return)
  }/*, [dependency]*/); //dependency: als deze value wijzigt wordt useEffect opnieuw opgeroepen

  return (
    <div>
      <h1> current Nonce = { currentNonce } </h1>
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
