import React, { useCallback, useEffect, useState } from "react";
import { Select, Button, List, Divider, Input, Card, DatePicker, Slider, Switch, Progress, Spin, Tooltip, Statistic, Badge } from "antd";
import { CheckCircleTwoTone, CloseCircleTwoTone } from '@ant-design/icons';
import { useContractExistsAtAddress } from "../hooks";
import { Address } from "../components";
import { formatEther } from "@ethersproject/units";

export default function Execute({contractName, updateFrontendEvents, signaturesRequired, address, userProvider, mainnetProvider, localProvider, yourLocalBalance, price, tx, readContracts, writeContracts, blockExplorer }) {

  const [completedMultiSigColl, setCompletedMultiSigColl] = useState([]);
  const [actualMultiSigColl, setActualMultiSigColl] = useState([]);

  //wordt uitgevoerd bij mounten en unmounten deze service component
  useEffect(() => {
    async function fetchData(){
      if(readContracts && readContracts[contractName]){
        var multiSigColl = []
        var ownedNonces = await readContracts[contractName].getOwnedNonces(address);
        console.log("ownedNonces = ", ownedNonces);
        var _completedMultiSigColl = [];
        var _actualMultiSigColl = [];

        for(const iterNonce of ownedNonces)
        {
          var iterMultiSig = await readContracts[contractName].multiSigColl(iterNonce);
          var iterMultiSigSigners = await readContracts[contractName].getSigners(iterNonce);
          console.log("iterMultiSig = ", iterMultiSig);
          console.log("iterMultiSigSigners = ", iterMultiSigSigners);

          var qtySign = 0;
          var activeSigners = [];
          for(const iterSigner of iterMultiSigSigners)
          {
            if(iterSigner.address != 0)
            {
              activeSigners.push(iterSigner)

              if(iterSigner.hasSigned)
              {
                ++qtySign;
              }
            }
          }
          if(iterMultiSig.isCompleted)
          {
            _completedMultiSigColl.push({multisig: iterMultiSig, signers: activeSigners, qtySigned: qtySign, nonce: iterNonce});
          }
          else
          {
            _actualMultiSigColl.push({multisig: iterMultiSig, signers: activeSigners, qtySigned: qtySign, nonce: iterNonce});
          }
        }
        setCompletedMultiSigColl(_completedMultiSigColl);
        setActualMultiSigColl(_actualMultiSigColl);
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
      <h1>Still To Execute</h1>
      <List 
        bordered
        dataSource={actualMultiSigColl}
        renderItem={item => (
          <List.Item>
            <Card style={{width: '100%'}} title={item.multisig.shortDescription + " (" + item.qtySigned + " signatures of " + item.multisig.qtyReqSig + ")"}>
              <div>{formatEther(item.multisig.amount)} ETH to <Address address={item.multisig.to} userProvider={mainnetProvider} /></div>
              { item.qtySigned >= item.multisig.qtyReqSig &&
                <Button onClick={ () => {
                  console.log("Calling execute for nonce ", item.nonce);
                  tx(writeContracts[contractName].execute(item.nonce));
                }}>
                  Execute
                </Button>
              }
              <List
                dataSource={item.signers}
                renderItem={signer => (
                  <List.Item>
                      <Address address={signer.addr} ensProvider={mainnetProvider} />
                      { signer.hasSigned && 
                        <CheckCircleTwoTone twoToneColor="#52c41a" width="3em" height="3em" />
                      }
                      { !signer.hasSigned &&
                        <CloseCircleTwoTone twoToneColor="red" width="3em" height="3em" />
                      }
                  </List.Item>
                )}
              />
            </Card>
          </List.Item>
        )}
      />

      <h1>Has Been Executed</h1>
      <List 
        dataSource={completedMultiSigColl}
        renderItem={item => (
          <List.Item>
            <Card style={{width: '100%'}} title={item.multisig.shortDescription + " (" + item.qtySigned + " signatures of " + item.multisig.qtyReqSig + ")"}>
              <div>{formatEther(item.multisig.amount)} ETH to <Address address={item.multisig.to} userProvider={mainnetProvider} /></div>
              <List
                dataSource={item.signers}
                renderItem={signer => (
                  <List.Item>
                      <Address address={signer.addr} ensProvider={mainnetProvider} />
                      { signer.hasSigned && 
                        <CheckCircleTwoTone twoToneColor="#52c41a" width="3em" height="3em" />
                      }
                      { !signer.hasSigned &&
                        <CloseCircleTwoTone twoToneColor="red" width="3em" height="3em" />
                      }
                  </List.Item>
                )}
              />
            </Card>
          </List.Item>
        )}
      />
      
    </div>
  );
}
