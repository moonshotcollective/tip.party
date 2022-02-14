import React from "react";
import "./WalletNotConnected.css";

export default function Admin({ connector, web3Modal }) {
  return (
    <div className="Home" style={{ margin: "20px auto", width: 500, padding: 60 }}>
      <div>
        <h2 className="walletnotconnected-header">Wallet is not connected</h2>
        {web3Modal && web3Modal.cachedProvider ? <p className="walletnotconnected-subheader">Please sign into your Ethereum wallet, then refresh the page.</p>
         :<div> <p className="walletnotconnected-subheader">Please connect your wallet to distribute or receive funds.</p>
         {connector} </div>}
      </div>
    </div>
  );
}
