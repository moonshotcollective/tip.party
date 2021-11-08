import { Modal } from "antd";
import React, { useState } from "react";
import { AddressInput } from ".";
import { ethers, utils } from "ethers";

function ImportModal({ handleAddress, ...props }) {
  const [address, setAddress] = useState("");

  const onOk = () => {
    if(ethers.utils.isAddress(address)){
      setAddress("");
      handleAddress(address)
    }
    else{
    setAddress("");
    handleAddress("");
    }
  };

  return (
    <Modal title="Add Address" centered {...props} onOk={onOk}>
      <p>Note: Please input only valid Ethereum addresses, ENS names are not accepted</p>
      <AddressInput value={address} onChange={setAddress} />
    </Modal>
  );
}

export default ImportModal;
