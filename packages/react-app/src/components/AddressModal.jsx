import { Modal } from "antd";
import React, { useState } from "react";
import { AddressInput } from ".";
import { ethers, utils } from "ethers";

function ImportModal({ handleAddress, ...props }) {
  const [addresses, setAddresses] = useState("");

  const onOk = () => {
    handleAddress(addresses.toLowerCase());
    setAddresses("");
  };

  return (
    <Modal title="Import Addresses" centered {...props} onOk={onOk}>
      <p>
        Note: Imported addresses can only be seen by the current host.
      </p>
      <p>When adding addresses in bulk, separate addresses with commas.</p>
      <AddressInput
        autoFocus
        placeholder="Enter Addresses"
        value={addresses}
        onChange={setAddresses}
        ensProvider={props.mainnetProvider}
      />
    </Modal>
  );
}

export default ImportModal;
