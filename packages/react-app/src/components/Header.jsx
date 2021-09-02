import { PageHeader } from "antd";
import React from "react";

// displays a page header

export default function Header() {
  return (
    <a href="https://tip.party" target="_blank" rel="noopener noreferrer">
      <PageHeader title="Tip.Party | Decentralized Tipping Platform" subTitle="" style={{ cursor: "pointer" }} />
    </a>
  );
}
