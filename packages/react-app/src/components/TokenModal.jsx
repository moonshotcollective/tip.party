import { Modal } from "antd";
import React, { useState } from "react";
import { AddressInput } from ".";

function ImportModal({ handleAddress, ...props }) {
  const [tokenAddress, setTokenAddress] = useState("");

  const onOk = () => {
    setTokenAddress("");
    handleAddress(tokenAddress.toLowerCase());
  };

  return (
    <Modal title="Import ERC-20 Token" centered {...props} onOk={onOk}>
      <p>Note: Imported tokens can only be seen by the current host</p>
      <AddressInput value={tokenAddress} onChange={setTokenAddress} />
    </Modal>
  );
}

export default ImportModal;
