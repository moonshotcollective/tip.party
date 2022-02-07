import React from "react";
import { Dropdown, Menu } from "antd";
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
                console.log("VIEW things ", i, targetNetwork.chainId, NETWORKS[i].chainId);
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
                  console.log("data", data);
                  await ethereum
                    .request({
                      method: "wallet_switchEthereumChain",
                      params: [
                        {
                          chainId: "0x" + targetNetwork.chainId.toString(16),
                        },
                      ],
                    })
                    .catch(error => {
                      alert("VIEW ERROR ", error);
                    });
                }
              }}
            >
              <span style={{ textTransform: "capitalize" }}>{i}</span>
            </button>
          </Menu.Item>
        ))}
    </Menu>
  );

  return (
    <div>
      <Dropdown.Button overlay={menu} placement="bottomRight" trigger={["click"]} icon={<DownOutlined />} size="small">
        <span style={{ textTransform: "capitalize", color: NETWORKS[selectedNetwork].color }}>{selectedNetwork}</span>
      </Dropdown.Button>
    </div>
  );
}

export default NetworkSwitch;
