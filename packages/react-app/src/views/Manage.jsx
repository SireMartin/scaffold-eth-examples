import React, { useCallback, useEffect, useState } from "react";
import { Select, Button, List, Divider, Input, Card, DatePicker, Slider, Switch, Progress, Spin, Tooltip, Statistic } from "antd";
import { useContractExistsAtAddress } from "../hooks";
import { Address, AddressInput } from "../components";
import Modal from "antd/lib/modal/Modal";

const { Option } = Select;

export default function Manage({contractName, updateFrontendEvents, signaturesRequired, address, userProvider, mainnetProvider, localProvider, yourLocalBalance, price, tx, readContracts, writeContracts, blockExplorer }) {

  const [triggerRendering, setTriggerRendering] = useState("");
  const [activeMultiSigColl, setActiveMultiSigColl] = useState([]);
  const [selectedNonce, setSelectedNonce] = useState(0);
  const [selectedSigner, setSelectedSigner] = useState("");
  const [qtyRequiredSigs, setQtyRequiredSigs] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedAction, setSelectedAction] = useState("");

  //wordt uitgevoerd bij mounten en unmounten deze service component
  useEffect(() => {
    async function fetchData(){
      if(readContracts && readContracts[contractName]){
        var _activeMultiSigColl = [];
        console.log("address = ", address);
        var ownedNonces = await readContracts[contractName].getOwnedNonces(address);
        console.log("ownedNonces = ", ownedNonces);
        ownedNonces.forEach(async iterNonce => 
        {
          var iterMultiSig = await readContracts[contractName].multiSigColl(iterNonce);
          console.log("iterMultiSig = ", iterMultiSig);
          if(!iterMultiSig.isCompleted)
          {
            var iterMultiSigSigners = await readContracts[contractName].getSigners(iterNonce);
            console.log("iterMultiSigSigners =", iterMultiSigSigners);
            var activeSigners = [];
            iterMultiSigSigners.forEach(iterSigner =>
            {
              if(iterSigner.addr != 0)
              {
                activeSigners.push(iterSigner.addr);
              }
            });
            console.log("activeSigners = ", activeSigners);
            _activeMultiSigColl.push({multisig: iterMultiSig, signers: activeSigners, nonce: iterNonce});
          }

          setActiveMultiSigColl(_activeMultiSigColl);
        });
      }
    }
    fetchData();
  }, [triggerRendering, updateFrontendEvents]);

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleOk = () => {
    if(selectedAction == "Add")
    {
      tx(writeContracts[contractName].addSigner(selectedNonce, selectedSigner, qtyRequiredSigs));
    }
    else
    {
      tx(writeContracts[contractName].removeSigner(selectedNonce, selectedSigner, qtyRequiredSigs));
    }
    var someVar = [];
    setTriggerRendering(someVar);
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const contractIsDeployed = useContractExistsAtAddress(userProvider, address);

  if(!contractIsDeployed)
  {
    return <div>Loading...</div>
  }
  return (
    <div style={{ margin: "auto", width: "40vw" }}>
      <Modal title={selectedAction + " Signer"} visible={isModalVisible} onOk={handleOk} onCancel={handleCancel}>
      { selectedAction == "Add" &&
        <AddressInput
        autoFocus
        ensProvider={mainnetProvider}
        placeholder="address signer"
        value={selectedSigner}
        onChange={setSelectedSigner}
      /> }
      <Input
        ensProvider={mainnetProvider}
        placeholder="new qty required sigs"
        value={qtyRequiredSigs}
        onChange={(e)=>{setQtyRequiredSigs(e.target.value)}}
      />
      </Modal>
      <List
        dataSource={activeMultiSigColl}
        renderItem={item => (
          <div>
            <div>{item.multisig[6]}</div>

            <div style={{margin:8,padding:8}}>
              <Button onClick={() => {
                setSelectedNonce(item.nonce);
                setSelectedAction("Add");
                setIsModalVisible(true);
              }}>
                Add Signer
              </Button>

            </div>

            <List
              dataSource={item.signers}
              renderItem={signerAddress =>(
                <div>
                  <Address address={signerAddress} ensProvider={mainnetProvider} />
                  <Button onClick={() => {
                    setSelectedSigner(signerAddress);
                    setSelectedNonce(item.nonce);
                    setSelectedAction("Remove");
                    setIsModalVisible(true);
                  }}>
                    Remove Signer
                  </Button>
                </div>
              )}
            />
          </div>
        )}
      />
    </div>
  );
}