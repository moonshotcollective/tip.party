import { Modal } from "antd";
import React, { useState } from "react";
import { AddressInput } from ".";

function ImportModal({ handleAddress, ...props }) {
  const [address, setAddress] = useState("");

  const onOk = () => {
    setTokenAddress("");
    handleAddress(tokenAddress);
  };

  return (
    <Modal title="Add Address" centered {...props} onOk={onOk}>
      <AddressInput value={address} onChange={setAddress} />
    </Modal>
  );
}

export default ImportModal;
