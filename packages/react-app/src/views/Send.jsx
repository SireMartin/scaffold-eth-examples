import React, { useCallback, useEffect, useState } from "react";
import { Select, Button, List, Divider, Input, Card, DatePicker, Slider, Switch, Progress, Spin, Tooltip, Statistic } from "antd";
import { useContractExistsAtAddress } from "../hooks";

const { Option } = Select;

export default function Send({contractName, ownerEvents, signaturesRequired, address, userProvider, mainnetProvider, localProvider, yourLocalBalance, price, tx, readContracts, writeContracts, blockExplorer }) {

  const [triggerRendering, setTriggerRendering] = useState();
  const [nonce, setNonce] = useState("");
  const [signature, setSignature] = useState("");

  //wordt uitgevoerd bij mounten en unmounten deze service component
  useEffect(() => {
    async function fetchData(){
      if(readContracts && readContracts[contractName]){
        
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

      <div style={{margin:8,padding:8}}>
        Nonce
        <Input
          ensProvider={mainnetProvider}
          placeholder="nonce"
          value={nonce}
          onChange={(e)=>{setNonce(e.target.value)}}
        />
      </div>

      <div style={{margin:8,padding:8}}>
        Signature
        <Input
          ensProvider={mainnetProvider}
          placeholder="signature"
          value={signature}
          onChange={(e)=>{setSignature(e.target.value)}}
        />
      </div>

      { nonce.length > 0 && signature.length > 0 &&
        <div style={{margin:8,padding:8}}>
          <Button onClick={async () =>{
              tx(writeContracts[contractName].sign(nonce, signature));
              setNonce("");
              setSignature("");
              setTriggerRendering(triggerRendering + 1);
            }}>Send Signature
          </Button>
        </div>
      }
      
    </div>
  );
}
