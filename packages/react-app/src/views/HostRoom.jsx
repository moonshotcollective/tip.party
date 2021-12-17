import React, { useEffect, useState, useRef } from "react";
import {
  Button,
  List,
  notification,
  Divider,
  Card,
  Input,
  Select,
  Collapse,
  Tabs,
  Menu,
  Dropdown,
  Popover,
} from "antd";
import { CloseOutlined, ExportOutlined } from "@ant-design/icons";
import { Address, PayButton, TransactionHash, AddressModal, TokenModal } from "../components";
import { useParams } from "react-router-dom";
import { ethers, utils } from "ethers";
import { filterLimit } from "async";
import { CSVLink } from "react-csv";
import copy from "copy-to-clipboard";
import * as storage from "../utils/storage";
import { useTokenImport } from "../hooks";
//import useWindowSize from 'react-use/lib/useWindowSize'
import Confetti from "react-confetti";
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
  //const { width, height } = useWindowSize()

  const [amount, setAmount] = useState(0);
  const [token, setToken] = useState(nativeCurrency);
  const [spender, setSpender] = useState("");
  const [addresses, setAddresses] = useState([]);
  const [txHash, setTxHash] = useState([]);
  const [blacklist, setBlacklist] = useState([]);
  const [isSigning, setIsSigning] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [availableTokens, setAvailableTokens] = useState([]);
  const [isFiltering, setIsFiltering] = useState(false);
  const [importToken, setImportToken] = useState(false);
  const [importAddress, setImportAddress] = useState(false);
  const [numberOfConfettiPieces, setNumberOfConfettiPieces] = useState(0);
  const [contracts, loadContracts, addContracts] = useTokenImport(localProvider, userSigner);

  const { readContracts, writeContracts } = contracts;

  const subs = useRef([]);

  useEffect(() => {
    if (oldWriteContracts?.TokenDistributor) {
      setSpender(oldWriteContracts?.TokenDistributor?.address);
      addContracts({ writeContracts: oldWriteContracts, readContracts: oldReadContracts });
    }
  }, [oldWriteContracts]);

  const handleTokenImport = async tokenAddress => {
    // load the contract to the scaffold variables
    const tokenSymbol = await loadContracts(tokenAddress);
    setToken(tokenSymbol);
    setImportToken(false);
  };

  const handleAddressImport = addressToImport => {
    if(ethers.utils.isAddress(addressToImport)){
      setAddresses([...addresses, addressToImport]);
      setImportAddress(false);
      // sign into room
      // notify user of signIn
      notification.success({
        message: "Successfully added address",
        placement: "bottomRight",
      });
    } else{
      return notification.error({
        message: "Failed to Add Address",
        description: addressToImport + " is not a valid Ethereum address",
        placement: "bottomRight",
      });
    }
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

  const hanndleTransactionUpdate = newTx => {
    const update = new Set([...newTx, ...txHash]);
    setTxHash([...update]);
  };

  useEffect(() => {
    if (addresses.includes(address.toLowerCase())) {
      setIsSignedIn(true);
    }
  }, [addresses, address]);

  useEffect(() => {
    // clear existing subscriptions
    subs.current.map(sub => sub());

    // start new subscriptions
    if (chainId) {
      subs.current.push(storage.watchRoom(room, handleListUpdate));
      subs.current.push(storage.watchRoomTx(room, chainId, hanndleTransactionUpdate));
    }
  }, [room, chainId]);

  const handleSignIn = async () => {
    if (typeof appServer == "undefined") {
      return notification.error({
        message: "Setup Error",
        description: "Missing REACT_APP_SERVER environment variable in localhost environment",
        placement: "bottomRight",
      });
    }

    if (web3Modal.cachedProvider == "") {
      return notification.error({
        message: "Failed to Sign In!",
        description: "Please Connect a wallet before Signing in",
        placement: "bottomRight",
      });
    }

    const messageLength = room && room.split(" ").length;
    if (typeof room == "undefined" || room === "" || messageLength > 1) {
      return notification.error({
        message: "Failed to Sign In!",
        description: "Message should be one word",
        placement: "bottomRight",
      });
    }

    setIsSigning(true);

    // sign roomId using wallet
    let signature = await userSigner.signMessage(room);

    try {
      // sign into room
      await storage.signIntoRoom(room, signature);

      // notify user of signIn
      setIsSignedIn(true);

      notification.success({
        message: "Signed in successfully",
        placement: "bottomRight",
      });
      handleConfetti();
    } catch (error) {
      setIsSigning(false);

      return notification.error({
        message: "Failed to Sign!",
        description: `Connection issue ${error}`,
        placement: "bottomRight",
      });
    }

    setIsSigning(false);
  };

  const amountChangeHandler = e => {
    // clean validation for only numbers (including decimal numbers): https://stackoverflow.com/a/43067857
    const re = /^\d*\.?\d*$/;

    if ((e.target.value === "" || re.test(e.target.value)) && e.target.value != ".") {
      setAmount(e.target.value);
    }
  };

  const ethPayHandler = async () => {
    const result = tx(
      writeContracts.TokenDistributor.splitEth(addresses, {
        value: ethers.utils.parseEther(amount),
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
            description: "Each user received " + amount / addresses.length + " " + token,
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
        addresses,
        ethers.utils.parseUnits(amount, opts.decimals),
        opts.address,
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
            description: "Each user received " + amount / addresses.length + " " + token,
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

  const lookupAddress = async (provider, address) => {
    if (address && utils.isAddress(address)) {
      // console.log(`looking up ${address}`)
      try {
        // Accuracy of reverse resolution is not enforced.
        // We then manually ensure that the reported ens name resolves to address
        const reportedName = await provider.lookupAddress(address);
        const resolvedAddress = await provider.resolveName(reportedName);

        if (address && utils.getAddress(address) === utils.getAddress(resolvedAddress)) {
          return reportedName;
        }
        return utils.getAddress(address);
      } catch (e) {
        return utils.getAddress(address);
      }
    }
    return 0;
  };

  const filterAddresses = async () => {
    setIsFiltering(true);
    const output = await filterLimit(addresses, 10, async address => {
      const ens = await lookupAddress(mainnetProvider, address).then(name => name);
      return ens && ens.indexOf("0x") < 0;
    });
    setAddresses(output);
    setIsFiltering(false);
  };

  const copyToClipBoard = () => {
    copy(addresses, {
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
        <CSVLink data={addresses.toString()} filename={`tip-party-addresses-${Date.now()}.csv`}>
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
    <div>
      <h2 id="title">Tip Your Party!</h2>
      <h3>
        {" "}
        You are the Host for "<b>{room}</b>" room{" "}
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
                {/* <div style={{ marginBottom: 20 }}>
                <h2>Sign In</h2>
              </div> */}
                {/* <Divider /> */}
                <AddressModal
                  visible={importAddress}
                  handleAddress={handleAddressImport}
                  onCancel={() => setImportAddress(false)}
                  okText="Add Address"
                />
                <div style={{ width: "100%", display: "flex", justifyContent: "flex-end" }}>
                  <a
                    href="#"
                    onClick={e => {
                      e.preventDefault();

                      setImportAddress(true);
                    }}
                  >
                    Add Address +
                  </a>
                </div>

                <div style={{ flex: 1 }}>
                  <Collapse defaultActiveKey={["1"]}>
                    <Collapse.Panel
                      header={`Pay List - ${addresses.length}`}
                      key="1"
                      extra={
                        <div onClick={e => e.stopPropagation()}>
                          <Dropdown overlay={exportMenu} placement="bottomRight" arrow trigger="click">
                            <ExportOutlined />
                          </Dropdown>
                        </div>
                      }
                    >
                      <List
                        bordered
                        dataSource={addresses}
                        renderItem={(item, index) => (
                          <List.Item key={item.toLowerCase()}>
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
                              <Button onClick={() => unList(index)} size="medium">
                                <CloseOutlined />
                              </Button>
                            </div>
                          </List.Item>
                        )}
                      />
                    </Collapse.Panel>
                   
                    {blacklist.length > 0 && (
                      <Collapse.Panel header="Blacklist" key="3">
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
                  {/* {canRenderAdminComponents && (
                <div style={{ marginTop: 10 }}>
                  <Button
                    disabled={isFiltering}
                    loading={isFiltering}
                    style={{ marginLeft: "10px" }}
                    onClick={filterAddresses}
                  >
                    Filter Out Non ENS Names
                  </Button>
                </div>
              )} */}
                </div>

                <div style={{ width: "100%", display: "flex", margin: "10px auto" }}>
                  <div>
                    {/* TODO : disable input until ERC-20 token is selected */}
                    <Input
                      value={amount}
                      addonBefore="Total Amount to Distribute"
                      addonAfter={
                        <Select defaultValue={nativeCurrency} value={token} onChange={value => setToken(value)}>
                          <Select.Option value={nativeCurrency}>{nativeCurrency}</Select.Option>
                          {availableTokens.map(name => (
                            <Select.Option key={name} value={name}>
                              {name}
                            </Select.Option>
                          ))}
                        </Select>
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
                      maxApproval={amount}
                      amount={amount}
                      spender={spender}
                      yourLocalBalance={yourLocalBalance}
                      readContracts={readContracts}
                      writeContracts={writeContracts}
                      ethPayHandler={ethPayHandler}
                      tokenPayHandler={tokenPayHandler}
                      nativeCurrency={nativeCurrency}
                    />
                  </div>
                </div>
              </div>
            </Tabs.TabPane>
            <Tabs.TabPane tab="Payouts" key="2">
              {/* Transactions */}
              <div style={{ marginBottom: 25, flex: 1 }}>
                <Card title="Payout Transactions" style={{ width: "100%" }}>
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
                          <TransactionHash localProvider={localProvider} chainId={chainId} hash={item} fontSize={14} />
                        </div>
                      </List.Item>
                    )}
                  />
                </Card>
              </div>
            </Tabs.TabPane>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
