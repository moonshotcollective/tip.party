import React, { useEffect, useState } from "react";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { NETWORK } from "../constants";
import AddressResolved from "./AddressResolved";

export default function TransactionHash({ mainnetProvider, hash, localProvider, chainId, ...props }) {
  const [loading, updateLoading] = useState(true);
  const [txData, updateTxData] = useState({});

  const checkTx = async () => {
    const _tx = await localProvider.waitForTransaction(hash, 1);
    updateTxData(_tx);
    updateLoading(false);
  };

  useEffect(() => {
    // get transaction status
    checkTx();
  }, []);

  const explorer = chainId ? NETWORK(chainId).blockExplorer : `https://etherscan.io/`;

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
          textAlign: "left",
        }}
      >
        <a target="_blank" href={`${explorer}tx/${hash}`} rel="noopener noreferrer">
          {hash.substr(0, 6)}
        </a>
        {txData && txData.from && (
          <AddressResolved
            address={txData.from}
            ensProvider={mainnetProvider}
            blockExplorer={explorer}
            fontSize={props.fontSize ? props.fontSize : 20}
          />
        )}
        {loading ? (
          <div style={{ fontStyle: "italic", color: "#efefef" }}>In Progress...</div>
        ) : (
          <>
            {txData && txData.status === 1 ? (
              <>
                <div>
                  <CheckOutlined style={{ fontStyle: "normal", fontWeight: "bold", color: "green" }} />
                </div>
              </>
            ) : (
              <div>
                <CloseOutlined style={{ fontStyle: "normal", fontWeight: "bold", color: "red" }} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
