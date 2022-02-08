import React from "react";
import { Dropdown, Menu, Button } from "antd";
import { DownOutlined } from "@ant-design/icons";

function NetworkSwitch({ networkOptions, selectedNetwork, setSelectedNetwork, NETWORKS, targetNetwork }) {
  const menu = (
    <Menu>
      {networkOptions
        .filter(i => i !== selectedNetwork)
        .map(i => (
          <Menu.Item key={i}>
            <button
              onClick={async () => {
                if (targetNetwork.chainId !== NETWORKS[i].chainId) {
                  window.localStorage.setItem("network", i);
                  setSelectedNetwork(i);
                  targetNetwork = NETWORKS[i];
                  const ethereum = window.ethereum;
                  const data = [
                    {
                      chainId: "0x" + targetNetwork.chainId.toString(16),
                      chainName: targetNetwork.name,
                      nativeCurrency: targetNetwork.nativeCurrency,
                      rpcUrls: [targetNetwork.rpcUrl],
                      blockExplorerUrls: [targetNetwork.blockExplorer],
                    },
                  ];
                  try {
                    await ethereum.request({
                      method: "wallet_switchEthereumChain",
                      params: [{ chainId: "0x" + targetNetwork.chainId.toString(16) }],
                    });
                  } catch (switchError) {
                    // if failed, try a network switch instead
                    await ethereum
                      .request({
                        method: "wallet_addEthereumChain",
                        params: data,
                      })
                      .catch();
                  }
                }
              }}
            >
              <span style={{ textTransform: "capitalize", color: NETWORKS[i].color }}>{i}</span>
            </button>
          </Menu.Item>
        ))}
    </Menu>
  );

  return (
    <div>
      <Dropdown overlay={menu} placement="bottomRight" trigger={["click"]}>
        <Button size="large">
          <span style={{ textTransform: "capitalize", color: NETWORKS[selectedNetwork].color }}>
            {selectedNetwork} <DownOutlined />
          </span>
        </Button>
      </Dropdown>
    </div>
  );
}

export default NetworkSwitch;
