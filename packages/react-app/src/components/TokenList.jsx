import React, { useEffect, useState } from "react";
import { Select } from "antd";
import { ethers } from "ethers";

export default function TokenList({
  token,
  setToken,
  readContracts,
  tokenListHandler,
  nativeCurrency,
  tokenList,
  availableTokens,
}) {
  useEffect(() => {
    const erc20List = Object.keys(readContracts).reduce((acc, contract) => {
      if (typeof readContracts[contract].decimals !== "undefined") {
        acc.push(contract);
      }

      return acc;
    }, []);
    console.log("VIEW ERC20 LIST ", erc20List);
    if (tokenListHandler && (typeof tokenListHandler).toLowerCase() === "function") {
      tokenListHandler(erc20List);
    }
    if (tokenList.length > 0) {
      console.log("VIEW TOKEN LIST ", tokenList);
      tokenListHandler([...tokenList, ...erc20List]);
    }
  }, [readContracts, tokenList]);

  return (
    <Select defaultValue={nativeCurrency} value={token} onChange={value => setToken(value)}>
      <Select.Option value={nativeCurrency}>{nativeCurrency}</Select.Option>
      {availableTokens.map(name => (
        <Select.Option key={name} value={name}>
          {name}
        </Select.Option>
      ))}
    </Select>
  );
}
