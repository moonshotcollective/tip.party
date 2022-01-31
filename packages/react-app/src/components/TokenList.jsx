import React, { useEffect } from "react";
import { Select } from "antd";

export default function TokenList({
  token,
  setToken,
  readContracts,
  tokenListHandler,
  nativeCurrency,
  loadedTokenList,
  availableTokens,
}) {
  useEffect(() => {
    const erc20List = Object.keys(readContracts).reduce((acc, contract) => {
      if (typeof readContracts[contract].decimals !== "undefined") {
        acc.push(contract);
      }

      return acc;
    }, []);
    const loadedTokenArray = Object.keys(loadedTokenList);
    if (tokenListHandler && (typeof tokenListHandler).toLowerCase() === "function") {
      tokenListHandler(erc20List);
    }
    if (loadedTokenArray.length > 0) {
      // Check for list duplicates
      const tempArray = loadedTokenArray;
      for (const item in erc20List) {
        if (!tempArray.includes(item) && item.length > 2) {
          tempArray.push(item);
        }
      }
      tokenListHandler([...tempArray]);
    }
  }, [readContracts, loadedTokenList]);

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
