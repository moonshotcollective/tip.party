import React, { useEffect, useState } from "react";
import { useThemeSwitcher } from "react-css-theme-switcher";
import { Typography } from "antd";
import { ethers } from "ethers";

export default function TransactionHash({ hash, localProvider, selectedChainId, ...props }) {
  const { currentTheme } = useThemeSwitcher();
  const [loading, updateLoading] = useState(true);
  const [txData, updateTxData] = useState({});

  const checkTx = async () => {
    const _tx = await localProvider.waitForTransaction(hash, 1);

    console.log(txData);
    updateTxData(_tx);
    updateLoading(false);
  };

  useEffect(() => {
    // get transaction status
    checkTx();
  }, []);

  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          flex: 1,
          display: "flex",
          width: "100%",
          flexDirection: "row",
          justifyContent: "space-between",
          paddingLeft: 5,
          fontSize: props.fontSize ? props.fontSize : 20,
        }}
      >
        <div>
          <Typography.Text copyable={{ text: hash }}>
            <a
              style={{ color: currentTheme === "light" ? "#222222" : "#ddd" }}
              target="_blank"
              href={`https://etherscan.io/tx/${hash}`}
              rel="noopener noreferrer"
            >
              {hash.substr(0, 10)}
            </a>
          </Typography.Text>
        </div>
        {loading ? (
          <div style={{ fontStyle: "italic", color: "#efefef" }}>In Progress...</div>
        ) : (
          <div style={{ fontStyle: "normal", fontWeight: "bold", color: "green" }}>Completed</div>
        )}
      </div>
    </div>
  );
}
