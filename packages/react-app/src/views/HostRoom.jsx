import React, { useEffect, useState, useRef } from "react";
import { Button, List, notification, Card, Input, Collapse, Tabs, Menu, Dropdown, Popover, Tag } from "antd";
import { CloseOutlined, ExportOutlined, InfoCircleOutlined, CopyOutlined } from "@ant-design/icons";
import { Address, PayButton, TransactionHash, AddressModal, TokenModal, TokenList } from "../components";
import { useParams } from "react-router-dom";
import { ethers } from "ethers";
import { CSVLink } from "react-csv";
import copy from "copy-to-clipboard";
import * as storage from "../utils/storage";
import { useTokenImport } from "../hooks";
//import useWindowSize from 'react-use/lib/useWindowSize'
import Confetti from "react-confetti";
import { NETWORK } from "../constants";
import "./HostRoom.css";

export default function HostRoom({
  appServer,
  web3Modal,
  address,
  userSigner,
  mainnetProvider,
  writeContracts: oldWriteContracts,
  readContracts: oldReadContracts,
  yourLocalBalance,
  localProvider,
  chainId,
  selectedChainId,
  tx,
  nativeCurrency,
}) {
  const { room } = useParams();

  const [amount, setAmount] = useState(0);
  const [token, setToken] = useState(nativeCurrency);
  const [spender, setSpender] = useState("");
  const [addresses, setAddresses] = useState([]);
  const [importedAddresses, setImportedAddresses] = useState([]);
  const [txHash, setTxHash] = useState([]);
  const [blacklist, setBlacklist] = useState([]);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [availableTokens, setAvailableTokens] = useState([]);
  const [importToken, setImportToken] = useState(false);
  const [importAddressModal, setImportAddressModal] = useState(false);
  const [numberOfConfettiPieces, setNumberOfConfettiPieces] = useState(0);
  const [contracts, loadContracts, addContracts] = useTokenImport(localProvider, userSigner);
  const allAddresses = [...addresses, ...importedAddresses];
  const [loadedTokenList, setLoadedTokenList] = useState({});

  const { readContracts, writeContracts } = contracts;
  const numericalAmount = amount[0] === "." ? "0" + amount : amount;
  const explorer = chainId ? NETWORK(chainId).blockExplorer : `https://etherscan.io/`;

  const subs = useRef([]);

  useEffect(() => {
    if (oldWriteContracts?.TokenDistributor) {
      setSpender(oldWriteContracts?.TokenDistributor?.address);
      addContracts({ writeContracts: oldWriteContracts, readContracts: oldReadContracts });
    }
  }, [oldWriteContracts]);

  useEffect(() => {
    if (addresses.includes(address.toLowerCase())) {
      setIsSignedIn(true);
    }
  }, [addresses, address]);

  useEffect(() => {
    //Import addresses from local storage
    const imports = localStorage.getItem(room);
    if (imports) {
      const parsedImports = JSON.parse(imports);
      setImportedAddresses(parsedImports);
    }
  }, [room]);

  useEffect(() => {
    //Import tokens from local storage
    const importLocalStorageTokens = localStorage.getItem(`${chainId}+token`);
    if (importLocalStorageTokens) {
      const parsedImports = JSON.parse(importLocalStorageTokens);
      setLoadedTokenList(parsedImports);
    }
  }, [chainId]);

  useEffect(() => {
    // clear existing subscriptions
    subs.current.map(sub => sub());

    // start new subscriptions
    if (chainId) {
      subs.current.push(storage.watchRoom(room, handleListUpdate));
      subs.current.push(storage.watchRoomTx(room, chainId, handleTransactionUpdate));
    }
  }, [room, chainId]);

  const amountChangeHandler = e => {
    // clean validation for only numbers (including decimal numbers): https://stackoverflow.com/a/43067857
    const re = /^\d*\.?\d*$/;

    if (e.target.value === "" || re.test(e.target.value)) {
      setAmount(e.target.value);
    }
  };

  const handleTokenImport = async tokenAddress => {
    const tokenSymbol = await loadContracts(tokenAddress);
    if (availableTokens.includes(tokenSymbol)) {
      notification.error({
        message: "The ERC20 token address is avaialable in the token drop down.",
        placement: "topRight",
      });
    } else if (tokenSymbol) {
      setToken(tokenSymbol);
      const temp = {};
      temp[tokenSymbol] = { tokenAddress };
      localStorage.setItem(`${chainId}+token`, JSON.stringify({ ...loadedTokenList, ...temp }));
      setImportToken(false);
      notification.success({
        message: "The ERC20 Token has been added",
        placement: "topRight",
      });
    } else {
      notification.error({
        message: "This ERC20 Address is not Valid",
        placement: "topRight",
      });
    }
  };

  const handleAddressImport = async addressesToImport => {
    //removes all of the spaces
    const str = addressesToImport.replace(/\s/g, "");

    //Splits the string into an array of addresses
    let arr = str.split(",");

    //loop through each element in array
    for (let index = 0; index < arr.length; index++) {
      const element = arr[index];
      if (!ethers.utils.isAddress(element)) {
        try {
          let addr = await mainnetProvider.resolveName(element);
          if (addr) {
            if (allAddresses.includes(addr)) {
              return notification.error({
                message: "Failed to Add Address",
                description: element + " is already included!",
                placement: "bottomRight",
              });
            }
            //changes ens in the array to address
            arr[index] = addr;
          }
          //error if ens is not address
          else {
            throw "error";
          }
        } catch (e) {
          return notification.error({
            message: "Failed to Add Address",
            description: element + " is not a valid Ethereum address",
            placement: "bottomRight",
          });
        }
      }
      if (allAddresses.includes(element)) {
        return notification.error({
          message: "Failed to Add Address",
          description: element + " is already included!",
          placement: "bottomRight",
        });
      }
    }

    // sets the addresses to local storage + changes the state
    Promise.all(arr).then(arr => {
      localStorage.setItem(room, JSON.stringify([...importedAddresses, ...arr]));
      setImportedAddresses([...importedAddresses, ...arr]);
      setImportAddressModal(false);

      return notification.success({
        message: "Successfully Added Addresses",
        placement: "bottomRight",
      });
    });
  };

  const handleConfetti = e => {
    setNumberOfConfettiPieces(200);
    setTimeout(() => {
      setNumberOfConfettiPieces(0);
    }, 4000);
  };

  const handleListUpdate = list => {
    const updatedList = new Set([...addresses, ...list]);
    // update addresses list
    setAddresses([...updatedList]);
  };

  const handleTransactionUpdate = newTx => {
    const update = new Set([...newTx, ...txHash]);
    setTxHash([...update]);
  };

  const ethPayHandler = async () => {
    const result = tx(
      writeContracts.TokenDistributor.splitEth(allAddresses, room, {
        value: ethers.utils.parseEther(numericalAmount),
      }),
      async update => {
        await handleResponseHash(update);
        console.log("📡 Transaction Update:", update);
        if (update && (update.status === "confirmed" || update.status === 1)) {
          console.log(" 🍾 Transaction " + update.hash + " finished!");
          console.log(
            " ⛽️ " +
              update.gasUsed +
              "/" +
              (update.gasLimit || update.gas) +
              " @ " +
              parseFloat(update.gasPrice) / 1000000000 +
              " gwei",
          );
          notification.success({
            message: "Payout successful",
            description: (
              <div>
                <p>
                  Each user received {numericalAmount / allAddresses.length} {token}
                </p>
                <p>
                  Transaction link:{" "}
                  <a target="_blank" href={`${explorer}tx/${update.hash}`} rel="noopener noreferrer">
                    {update.hash.substr(0, 20)}
                  </a>
                </p>
              </div>
            ),
            placement: "topRight",
          });
          handleConfetti();
        }
      },
    );
    console.log("awaiting metamask/web3 confirm result...", result);
    console.log(await result);
    setAmount(0);
  };

  const tokenPayHandler = async opts => {
    const result = tx(
      writeContracts.TokenDistributor.splitTokenFromUser(
        allAddresses,
        ethers.utils.parseUnits(numericalAmount, opts.decimals),
        opts.address,
        room,
      ),
      async update => {
        await handleResponseHash(update);
        console.log("📡 Transaction Update:", update);
        if (update && (update.status === "confirmed" || update.status === 1)) {
          console.log(" 🍾 Transaction " + update.hash + " finished!");
          console.log(
            " ⛽️ " +
              update.gasUsed +
              "/" +
              (update.gasLimit || update.gas) +
              " @ " +
              parseFloat(update.gasPrice) / 1000000000 +
              " gwei",
          );
          notification.success({
            message: "Payout successful",
            description: (
              <div>
                <p>
                  Each user received {numericalAmount / allAddresses.length} {token}
                </p>
                <p>
                  Transaction link:{" "}
                  <a target="_blank" href={`${explorer}tx/${update.hash}`} rel="noopener noreferrer">
                    {update.hash.substr(0, 20)}
                  </a>
                </p>
              </div>
            ),
            placement: "topRight",
          });
          handleConfetti();
        }
      },
    );
    console.log("awaiting metamask/web3 confirm result...", result);
    console.log(await result);
    setAmount(0);
  };

  const handleResponseHash = async result => {
    if (result.hash && selectedChainId && room) {
      await storage.registerTransactionForRoom(room, result.hash, selectedChainId);
    }
  };

  const reList = index => {
    const addressChanged = blacklist[index];
    const updatedAddressesList = [...blacklist];
    updatedAddressesList.splice(index, 1);
    setBlacklist([...updatedAddressesList]);
    setAddresses([...addresses, addressChanged]);
  };

  const unList = index => {
    const addressChanged = addresses[index];
    const updatedAddressesList = [...addresses];
    updatedAddressesList.splice(index, 1);
    setAddresses([...updatedAddressesList]);
    setBlacklist([...blacklist, addressChanged]);
  };
  const removeImportedAddress = index => {
    const updatedImportList = [...importedAddresses];
    updatedImportList.splice(index, 1);
    setImportedAddresses([...updatedImportList]);
    localStorage.setItem(room, JSON.stringify([...updatedImportList]));
  };

  const copyToClipBoard = () => {
    copy(allAddresses, {
      debug: true,
      message: "Copied List to ClipBoard",
    });
    notification.success({
      message: "Copied List To ClipBoard",
      placement: "bottomRight",
    });
  };

  const exportMenu = (
    <Menu>
      <Menu.Item key="export_csv">
        <CSVLink data={allAddresses.toString()} filename={`tip-party-addresses-${Date.now()}.csv`}>
          Export CSV
        </CSVLink>
      </Menu.Item>
      <Menu.Item key="copy_to_clipboard">
        <a target="_blank" onClick={copyToClipBoard}>
          Copy to Clipboard
        </a>
      </Menu.Item>
    </Menu>
  );

  return (
    <div className="bg-purple-darkpurple">
      <h2 id="title">Tip Your Party!</h2>
      <h3>
        {" "}
        You are a <b>Host</b> for "<b>{room}</b>" room{" "}
        <Button
          onClick={() => {
            try {
              const el = document.createElement("input");
              el.value = window.location.href;
              document.body.appendChild(el);
              el.select();
              document.execCommand("copy");
              document.body.removeChild(el);
              return notification.success({
                message: "Room link copied to clipboard",
                placement: "topRight",
              });
            } catch (err) {
              return notification.success({
                message: "Failed to copy room link to clipboard",
                placement: "topRight",
              });
            }
          }}
          type="primary"
          size="medium"
        >
          <CopyOutlined />
        </Button>
      </h3>
      <div
        className="Room"
        style={{
          margin: "20px auto",
          marginBottom: 30,
          width: 500,
          padding: 20,
          paddingBottom: 40,
        }}
      >
        <Confetti recycle={true} run={true} numberOfPieces={numberOfConfettiPieces} tweenDuration={3000} />
        <div>
          <Tabs defaultActiveKey="1" centered>
            <Tabs.TabPane tab="Room" key="1">
              <div>
                <AddressModal
                  visible={importAddressModal}
                  handleAddress={handleAddressImport}
                  onCancel={() => setImportAddressModal(false)}
                  okText="Submit"
                  mainnetProvider={mainnetProvider}
                />
                <div style={{ width: "100%", display: "flex", justifyContent: "flex-end" }}>
                  <a
                    href="#"
                    onClick={e => {
                      e.preventDefault();

                      setImportAddressModal(true);
                    }}
                  >
                    Import Address +
                  </a>
                </div>

                <div style={{ flex: 1 }}>
                  <Collapse defaultActiveKey={["1"]}>
                    <Collapse.Panel
                      header={`Pay List - ${addresses.length}`}
                      key="1"
                      extra={
                        <div onClick={e => e.stopPropagation()}>
                          <Dropdown overlay={exportMenu} placement="bottomRight" arrow trigger="hover">
                            <ExportOutlined />
                          </Dropdown>
                        </div>
                      }
                    >
                      {allAddresses.length == 0 && <h2>This room is currently empty </h2>}
                      {allAddresses.length > 0 && (
                        <List
                          bordered
                          dataSource={allAddresses}
                          renderItem={(item, index) => (
                            <List.Item key={`${item.toLowerCase()}-${index}`}>
                              <div
                                style={{
                                  width: "100%",
                                  flex: 1,
                                  display: "flex",
                                  flexDirection: "row",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                }}
                              >
                                <Address address={item} ensProvider={mainnetProvider} fontSize={14} />
                                {importedAddresses.includes(item) && <Tag color="grey">imported</Tag>}
                                <Button
                                  onClick={() => {
                                    if (importedAddresses.includes(item))
                                      removeImportedAddress(index - addresses.length);
                                    else unList(index);
                                  }}
                                  size="medium"
                                >
                                  <CloseOutlined />
                                </Button>
                              </div>
                            </List.Item>
                          )}
                        />
                      )}
                    </Collapse.Panel>
                    {blacklist.length > 0 && (
                      <Collapse.Panel
                        header="Blacklist"
                        key="2"
                        extra={
                          <Popover
                            title="Blacklist:"
                            content="Addresses in the blacklist are temporarily removed from the pay list and will not be included in the payout."
                          >
                            <InfoCircleOutlined />
                          </Popover>
                        }
                      >
                        <List
                          bordered
                          dataSource={blacklist}
                          renderItem={(item, index) => (
                            <List.Item>
                              <div
                                style={{
                                  width: "100%",
                                  flex: 1,
                                  display: "flex",
                                  flexDirection: "row",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                }}
                              >
                                <Address address={item} ensProvider={mainnetProvider} fontSize={12} />
                                <Button onClick={() => reList(index)} size="medium">
                                  <CloseOutlined />
                                </Button>
                              </div>
                            </List.Item>
                          )}
                        />
                      </Collapse.Panel>
                    )}
                  </Collapse>
                </div>

                <div style={{ width: "100%", display: "flex", margin: "10px auto" }}>
                  <div>
                    {/* TODO : disable input until ERC-20 token is selected */}
                    <Input
                      value={amount}
                      addonBefore="Total Amount to Distribute"
                      addonAfter={
                        <TokenList
                          token={token}
                          setToken={setToken}
                          readContracts={readContracts}
                          tokenListHandler={tokens => setAvailableTokens(tokens)}
                          nativeCurrency={nativeCurrency}
                          loadedTokenList={loadedTokenList}
                          availableTokens={availableTokens}
                        />
                      }
                      style={{ marginTop: "10px" }}
                      onChange={amountChangeHandler}
                    />

                    <TokenModal
                      visible={importToken}
                      handleAddress={handleTokenImport}
                      onCancel={() => setImportToken(false)}
                      okText="Import Token"
                    />

                    <div style={{ width: "100%", marginTop: 7, display: "flex", justifyContent: "flex-end" }}>
                      <a
                        href="#"
                        onClick={e => {
                          e.preventDefault();

                          setImportToken(true);
                        }}
                      >
                        import ERC20 token...
                      </a>
                    </div>
                    <PayButton
                      style={{ marginTop: 20 }}
                      token={token}
                      appName="Tip.party"
                      tokenListHandler={tokens => setAvailableTokens(tokens)}
                      callerAddress={address}
                      maxApproval={numericalAmount}
                      amount={numericalAmount}
                      spender={spender}
                      yourLocalBalance={yourLocalBalance}
                      readContracts={readContracts}
                      writeContracts={writeContracts}
                      ethPayHandler={ethPayHandler}
                      tokenPayHandler={tokenPayHandler}
                      nativeCurrency={nativeCurrency}
                      loadContracts={loadContracts}
                      loadedTokenList={loadedTokenList}
                      userSigner={userSigner}
                    />
                  </div>
                </div>
              </div>
            </Tabs.TabPane>
            <Tabs.TabPane tab="Payouts" key="2">
              {/* Transactions */}
              <div style={{ marginBottom: 25, flex: 1 }}>
                <Card title={txHash.length > 0 ? "Payout Transactions" : ""} style={{ width: "100%" }}>
                  {txHash.length == 0 && <h2>No payouts have been administered for this room </h2>}
                  {txHash.length > 0 && (
                    <List
                      bordered
                      dataSource={txHash}
                      renderItem={(item, index) => (
                        <List.Item>
                          <div
                            style={{
                              width: "100%",
                            }}
                          >
                            <TransactionHash
                              localProvider={localProvider}
                              chainId={chainId}
                              hash={item}
                              fontSize={14}
                            />
                          </div>
                        </List.Item>
                      )}
                    />
                  )}
                </Card>
              </div>
            </Tabs.TabPane>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
