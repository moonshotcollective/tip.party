import React, { useState } from "react";
import { HostRoom, GuestRoom } from ".";
import { Space, Switch } from "antd";

export default function Rooms({
  appServer,
  web3Modal,
  address,
  userSigner,
  mainnetProvider,
  writeContracts,
  readContracts,
  yourLocalBalance,
  localProvider,
  chainId,
  selectedChainId,
  tx,
  nativeCurrency,
  isHost,
  toggleSwitch,
}) {
  return (
    <div>
      <div>
        {isHost && (
          <HostRoom
            address={address}
            appServer={appServer}
            web3Modal={web3Modal}
            userSigner={userSigner}
            mainnetProvider={mainnetProvider}
            readContracts={readContracts}
            writeContracts={writeContracts}
            localProvider={localProvider}
            yourLocalBalance={yourLocalBalance}
            chainId={chainId}
            selectedChainId={selectedChainId}
            tx={tx}
            nativeCurrency={nativeCurrency}
            toggleSwitch={toggleSwitch}
          />
        )}
      </div>
      {!isHost && (
        <div>
          <GuestRoom
            address={address}
            appServer={appServer}
            web3Modal={web3Modal}
            userSigner={userSigner}
            mainnetProvider={mainnetProvider}
            readContracts={readContracts}
            writeContracts={writeContracts}
            localProvider={localProvider}
            yourLocalBalance={yourLocalBalance}
            chainId={chainId}
            selectedChainId={selectedChainId}
            tx={tx}
            nativeCurrency={nativeCurrency}
            toggleSwitch={toggleSwitch}
          />
        </div>
      )}
    </div>
  );
}
