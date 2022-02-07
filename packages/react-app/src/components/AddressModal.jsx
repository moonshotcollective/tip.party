import { Modal, Input } from "antd";
import React, { useState } from "react";
import { AddressInput } from ".";
const { TextArea } = Input;

function ImportModal({ handleAddress, ...props }) {
  const [addresses, setAddresses] = useState("");

  const onOk = () => {
    handleAddress(addresses.toLowerCase());
    setAddresses("");
  };

  return (
    <Modal title="Import Addresses" centered {...props} onOk={onOk}>
      <p>Note: Imported addresses can only be seen by the current host.</p>
      <p>When adding addresses in bulk, separate addresses with commas.</p>
      <TextArea
        autoSize
        autoComplete="off"
        placeholder="Enter Addresses"
        value={addresses}
        onChange={e =>{setAddresses(e.target.value)}}
      />
    </Modal>
  );
}

export default ImportModal;
