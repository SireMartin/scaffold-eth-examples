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
      <Card title="Creat a new MultiSig instance">
        <div>Job Description:</div> 
        <div style={{margin:8,padding:8}}>
          <Input
            ensProvider={mainnetProvider}
            placeholder="description of the job"
            value={challengeDescription}
            onChange={(e)=>{setChallengeDescription(e.target.value)}}
          />
        </div>

        <div>Reward Receiver:</div>
        <div style={{margin:8,padding:8}}>
          <AddressInput
            autoFocus
            ensProvider={mainnetProvider}
            placeholder="reward receiver"
            value={rewardReceiver}
            onChange={setRewardReceiver}
          />
        </div>

        <div>Reward Value (wei):</div>
        <div style={{ margin: 2 }}>
          <Input
            placeholder="reward value (wei)"
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

        <Divider />

        <div>Signers Section</div>

        <Divider/>

        <div>Qty of signatures required:</div>
        <div style={{margin:8,padding:8}}>
          <Input
            ensProvider={mainnetProvider}
            placeholder="qty signature required"
            value={qtySignatureRequired}
            onChange={(e)=>{setQtySignatureRequired(e.target.value)}}
          />
        </div>

        <div>Paste signer addresses and add to signers collection:</div>
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
            var temp = addedSignerColl;
            temp.push(signerToAdd);
            setAddedSignerColl(addedSignerColl);
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

        <Divider />

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
            setRewardReceiver("");
            setQtySignatureRequired("");
            setChallengeDescription("");
            setRewardValue("");
          }}>
          Create New MultiSig Instance
          </Button>
        </div>
      </Card>
    </div>
  );
}
