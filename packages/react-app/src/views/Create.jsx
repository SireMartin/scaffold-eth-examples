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

export default function Create({contractName, updateFrontendEvents, signaturesRequired, address, userProvider, mainnetProvider, localProvider, yourLocalBalance, price, tx, readContracts, writeContracts, blockExplorer }) {

  const history = useHistory();

  const [signerToAdd, setSignerToAdd] = useState();
  const [addedSignerColl, setAddedSignerColl] = useState([]);
  
  const [rewardReceiver, setRewardReceiver] = useLocalStorage("rewardReceiver");
  const [challengeDescription, setChallengeDescription] = useLocalStorage("newChallengeDescription");
  const [rewardValue, setRewardValue] = useLocalStorage("rewardValue");
  const [qtySignatureRequired, setQtySignatureRequired] = useLocalStorage("qtySignatureRequired");

  return (
    <div style={{ margin: "auto", width: "40vw" }}>

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
        <List
          dataSource={addedSignerColl}
          renderItem={item => (
            <List.Item>
              <Address address={item} ensProvider={mainnetProvider} />
            </List.Item>
          )}
        />
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
