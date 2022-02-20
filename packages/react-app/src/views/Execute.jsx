import React, { useCallback, useEffect, useState } from "react";
import { Select, Button, List, Divider, Input, Card, DatePicker, Slider, Switch, Progress, Spin, Tooltip, Statistic, Badge } from "antd";
import { CheckCircleTwoTone, CloseCircleTwoTone } from '@ant-design/icons';
import { useContractExistsAtAddress } from "../hooks";
import { Address } from "../components";

export default function Execute({contractName, ownerEvents, signaturesRequired, address, userProvider, mainnetProvider, localProvider, yourLocalBalance, price, tx, readContracts, writeContracts, blockExplorer }) {

  const [triggerRendering, setTriggerRendering] = useState();
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

        for(var i = 0; i < ownedNonces.length; ++i)
        {
          var iterMultiSig = await readContracts[contractName].multiSigColl(ownedNonces[i]);
          var iterMultiSigSigners = await readContracts[contractName].getSigners(ownedNonces[i]);
          console.log("iterMultiSig = ", iterMultiSig);
          console.log("iterMultiSigSigners = ", iterMultiSigSigners);

          var qtySign = 0;
          var activeSigners = [];
          for(var j = 0; j < iterMultiSigSigners.length; ++j)
          {
            if(iterMultiSigSigners[j][0] != 0) //address
            {
              activeSigners.push(iterMultiSigSigners[j])

              if(iterMultiSigSigners[j][1]) //hasSigned bool
              {
                ++qtySign;
              }
            }
          }
          if(iterMultiSig.isCompleted)
          {
            _completedMultiSigColl.push({multisig: iterMultiSig, signers: activeSigners, qtySigned: qtySign, nonce: ownedNonces[i]});
          }
          else
          {
            _actualMultiSigColl.push({multisig: iterMultiSig, signers: activeSigners, qtySigned: qtySign, nonce: ownedNonces[i]});
          }
        }

        setCompletedMultiSigColl(_completedMultiSigColl);
        setActualMultiSigColl(_actualMultiSigColl);
      }
    }
    fetchData();
  }, [triggerRendering]);

  const contractIsDeployed = useContractExistsAtAddress(userProvider, address);

  if(!contractIsDeployed)
  {
    return <div>Loading...</div>
  }
  return (
    <div style={{ margin: "auto", width: "40vw" }}>
      <div>Still To Execute</div>
      <List 
        dataSource={actualMultiSigColl}
        renderItem={item => (
          <List.Item>
            {item.multisig[6]} ({item.qtySigned} / {item.multisig[1]})
            { item.qtySigned >= item.multisig[1] &&
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
                    <Address address={signer[0]} ensProvider={mainnetProvider} />
                    { signer[1] && 
                      <CheckCircleTwoTone twoToneColor="#52c41a" width="3em" height="3em" />
                    }
                    { !signer[1] &&
                      <CloseCircleTwoTone twoToneColor="red" width="3em" height="3em" />
                    }
                </List.Item>
              )}
            />
          </List.Item>
        )}
      />

      <div>Has Been Executed</div>
      <List 
        dataSource={completedMultiSigColl}
        renderItem={item => (
          <List.Item>
            {item.multisig[6]} ({item.qtySigned} / {item.multisig[1]})
            <List
              dataSource={item.signers}
              renderItem={signer => (
                <List.Item>
                    <Address address={signer[0]} ensProvider={mainnetProvider} />
                    { signer[1] && 
                      <CheckCircleTwoTone twoToneColor="#52c41a" width="3em" height="3em" />
                    }
                    { !signer[1] &&
                      <CloseCircleTwoTone twoToneColor="red" width="3em" height="3em" />
                    }
                </List.Item>
              )}
            />
          </List.Item>
        )}
      />
      
    </div>
  );
}
