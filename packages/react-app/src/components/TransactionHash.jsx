import React, { useEffect, useState } from "react";
import { useThemeSwitcher } from "react-css-theme-switcher";
import { Typography } from "antd";
import { NETWORK } from "../constants";

export default function TransactionHash({ hash, localProvider, chainId, ...props }) {
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

  const explorer = NETWORK(chainId).blockExplorer || `https://etherscan.io/`;

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

            <a
              target="_blank"
              href={`${explorer}tx/${hash}`}
              rel="noopener noreferrer"
            >
              {hash.substr(0, 10)}
            </a>
        {loading ? (
          <div style={{ fontStyle: "italic", color: "#efefef" }}>In Progress...</div>
        ) : (
          <>
            {txData && txData.status === 1 ? (
              <div style={{ fontStyle: "normal", fontWeight: "bold", color: "green" }}>Success</div>
            ) : (
              <div style={{ fontStyle: "normal", fontWeight: "bold", color: "red" }}>Fail</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
