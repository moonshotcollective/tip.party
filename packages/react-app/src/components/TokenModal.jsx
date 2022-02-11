import { Modal, Select } from "antd";
import React, { useState, useMemo } from "react";
import { ethers } from "ethers";
import searchico from "searchico";

// helpers to load token name and symbol for unlisted tokens
const ERC20ABI = ["function symbol() view returns (string)", "function name() view returns (string)"];

const loadERC20 = async (address, p) => {
  try {
    // load token information here
    const r = new ethers.Contract(address, ERC20ABI, p);
    const name = await r.name?.();
    const symbol = await r.symbol?.();
    return { name, symbol };
  } catch (error) {
    return {};
  }
};

export default function TokenModal({ list, setImportToken, onChange, chainId = 1, localProvider, ...props }) {
  const [value, setValue] = useState(null);
  const [searchResults, setSearchResults] = useState([]);

  const listCollection = useMemo(() => {
    return searchico(list, { keys: ["address", "name", "symbol"] });
  }, [list.length]);

  const children = useMemo(() => {
    if (searchResults.length < 1) {
      return [];
    }

    // use search result to format children
    return searchResults.map(i => (
      <Select.Option key={i.address} style={{ paddingTop: "5px", paddingBottom: "5px" }} value={i.address}>
        <div style={{ display: "flex", alignItems: "center" }}>
          {i.logoURI && (
            <div style={{ marginRight: "5px" }}>
              <img src={i.logoURI} alt={`${i.name} (${i.symbol})`} style={{ height: "10px" }} />
            </div>
          )}
          {i.name} - {i.symbol} {i.address?.substr(0, 5) + "..." + i.address?.substr(-4)}{" "}
          {i.unlisted && <span style={{ fontStyle: "italic", fontSize: "12px", marginLeft: "3px" }}> (unlisted) </span>}
        </div>
      </Select.Option>
    ));
  }, [JSON.stringify(searchResults)]);

  const handleSearch = async val => {
    console.log("View result ", props.networkTokenList, list);
    let collectionResult = [];

    if (val.length > 0) {
      // TODO : Do all search & filtering here
      collectionResult = (listCollection?.find(val) || []).filter(i => i.chainId === chainId);

      if (collectionResult.length < 1) {
        try {
          const checksumAddress = ethers.utils.getAddress(val);
          // load contract and try to get name and symbol if there's a provider given
          const tokenInfo = localProvider ? await loadERC20(checksumAddress, localProvider) : {};
          collectionResult = [
            {
              chainId: chainId,
              name: null,
              unlisted: true,
              symbol: null,
              address: checksumAddress,
              logoURI: "",
              ...tokenInfo,
            },
          ];
        } catch (error) {
          console.log(`Could not identify this token`);
        }
      }
    }

    setSearchResults(collectionResult);
  };

  const handleOnChange = async e => {
    setSearchResults([]);
    setValue(e);
  };

  const onOk = e => {
    onChange(e.value);
    setImportToken(false);
  };

  return (
    <Modal title="Import ERC-20 Token" centered {...props} onOk={onOk}>
      <p>Look Up ERC-20 Token or Enter Token Address</p>
      <p>Note: Imported tokens can only be seen by the current host</p>
      <Select
        showSearch
        size="large"
        showArrow={false}
        defaultActiveFirstOption={false}
        onSearch={handleSearch}
        filterOption={false}
        labelInValue={true}
        id="0xERC20TokenSelect" // name it something other than address for auto fill doxxing
        name="0xERC20TokenSelect" // name it something other than address for auto fill doxxing
        placeholder={props.placeholder ? props.placeholder : "Token search... Eg: GTC"}
        value={value}
        onChange={handleOnChange}
        notFoundContent={null}
        style={{ width: "100%" }}
      >
        {children}
      </Select>
    </Modal>
  );
}
