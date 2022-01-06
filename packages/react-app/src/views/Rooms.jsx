import React, { useState, useEffect } from "react";
import { HostRoom, GuestRoom } from ".";
import { Space, Switch } from "antd";
import { useParams } from "react-router-dom";


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
}) {
  const [isHost, setHost] = useState(false);
  const { room } = useParams();


  useEffect(() => {
      const userType = localStorage.getItem(room+"userType");
      console.log("userType: " + userType);
      if(userType == "host"){
        setHost(true)
      }
      
  }, [room]);

  const toggleHost = checked => {
    setHost(checked);
    if(checked){
      localStorage.setItem(room+"userType","host");
    }
    else{
      localStorage.setItem(room+"userType","guest");
    }
  };
  return (
    <div>
      <Space style={{ position: "fixed", right: 8, bottom: 8 }}>
        <span> Toggle Host: </span>
        <Switch checkedChildren="Host" checked={isHost} unCheckedChildren="Guest" onChange={toggleHost} />
      </Space>
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
          />
        </div>
      )}
    </div>
  );
}
