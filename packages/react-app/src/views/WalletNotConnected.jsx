import React from "react";
import "./WalletNotConnected.css";

export default function Admin({ connector }) {
  return (
    <div className="Home" style={{ margin: "20px auto", width: 500, padding: 60 }}>
      <div>
        <h2 className="walletnotconnected-header">Wallet is not connected</h2>
        <p className="walletnotconnected-subheader">Please connect your wallet to distribute or receive funds.</p>
        {connector}
      </div>
    </div>
  );
}
