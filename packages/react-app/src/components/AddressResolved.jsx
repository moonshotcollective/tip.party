import { Skeleton } from "antd";
import React from "react";
import { useLookupAddress } from "../hooks";

// changed value={address} to address={address}

const blockExplorerLink = (address, blockExplorer) =>
  `${blockExplorer || "https://etherscan.io/"}${"address/"}${address}`;

export default function Address(props) {
  const address = props.value || props.address;

  const ens = useLookupAddress(props.ensProvider, address);

  if (!address) {
    return (
      <span>
        <Skeleton avatar paragraph={{ rows: 1 }} />
      </span>
    );
  }

  let displayAddress = address.substr(0, 6);

  const ensSplit = ens && ens.split(".");
  const validEnsCheck = ensSplit && ensSplit[ensSplit.length - 1] === "eth";

  if (validEnsCheck) {
    displayAddress = ens;
  } else if (props.size === "short") {
    displayAddress += "..." + address.substr(-4);
  } else if (props.size === "long") {
    displayAddress = address;
  }

  const etherscanLink = blockExplorerLink(address, props.blockExplorer);

  return (
    <a
      className="text-left"
      style={{ fontSize: props.fontSize ? props.fontSize : 20, textDecoration: "underline" }}
      target="_blank"
      href={etherscanLink}
      rel="noopener noreferrer"
    >
      {displayAddress}
    </a>
  );
}
