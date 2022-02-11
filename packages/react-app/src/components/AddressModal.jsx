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
      <p>Imported addresses can only be seen by you. Separate addresses by commas when adding in bulk</p>
      <TextArea
        autoSize
        autoComplete="off"
        placeholder="Enter Addresses"
        value={addresses}
        onChange={e => {
          setAddresses(e.target.value);
        }}
      />
    </Modal>
  );
}

export default ImportModal;
