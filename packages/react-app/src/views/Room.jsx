import React, { useEffect, useState, useRef } from "react";
import { Button, List, notification, Divider, Card, Input, Select, Collapse, Tabs, Menu, Dropdown, Space } from "antd";
import { CloseOutlined, ExportOutlined } from "@ant-design/icons";
import { Address, PayButton, TransactionHash, AddressModal } from "../components";
import { useParams } from "react-router-dom";
import { ethers, utils } from "ethers";
import { filterLimit } from "async";
import { CSVLink } from "react-csv";
import copy from "copy-to-clipboard";
import * as storage from "../utils/storage";
import { useTokenImport } from "../hooks";
import { NoDistributorRoom, DistributorRoom } from ".";
//import useWindowSize from 'react-use/lib/useWindowSize'
import Confetti from "react-confetti";
import "./Room.css";

export default function Rooms({
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
  const [numberOfConfettiPieces, setNumberOfConfettiPieces] = useState(0);
  const [contracts, loadContracts, addContracts] = useTokenImport(localProvider, userSigner);
  const [distributors, setDistributors] = useState([]);

  const { readContracts, writeContracts } = contracts;

  const subs = useRef([]);

  useEffect(() => {
    if (oldWriteContracts?.TokenDistributor) {
      setSpender(oldWriteContracts?.TokenDistributor?.address);
      addContracts({ writeContracts: oldWriteContracts, readContracts: oldReadContracts });
    }
  }, [oldWriteContracts]);

  const handleDistributorState = distributor => {
    setDistributors([distributor]);
    notification.success({
      message: "Signed in successfully",
      placement: "bottomRight",
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
  const handleDistributorUpdate = list => {
    const updatedList = new Set([...addresses, ...list]);
    // update addresses list
    setDistributors([...updatedList]);
  };

  const handleTransactionUpdate = newTx => {
    const update = new Set([...newTx, ...txHash]);
    setTxHash([...update]);
  };

  useEffect(() => {
    if (addresses.includes(address.toLowerCase())) {
      setIsSignedIn(true);
    }
  }, [addresses, address]);

  // useEffect(() => {
  //   const dist =  storage.getRoomDistributor(room);
  //   setDistributor(dist);
  //   console.log("Distributor: " + dist)
  // }, [room] );

  useEffect(() => {
    // clear existing subscriptions
    subs.current.map(sub => sub());

    // start new subscriptions
    if (chainId) {
      subs.current.push(storage.watchRoom(room, handleListUpdate));
      subs.current.push(storage.watchRoomTx(room, chainId, handleTransactionUpdate));
      subs.current.push(storage.watchRoomDistributor(room, handleDistributorUpdate));
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
      setAddresses([...addresses, address]);
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

  const canRenderComponents = addresses && addresses.length > 0;

  return (
    <div>
      {!(distributors.length>0) && ( 
        <div>
          <NoDistributorRoom
                    address={address}
                    appServer={appServer}
                    web3Modal={web3Modal}
                    userSigner={userSigner}
                    mainnetProvider={mainnetProvider}
                    readContracts={readContracts}
                    writeContracts={writeContracts}
                    localProvider={localProvider}
                    yourLocalBalance={yourLocalBalance}
                    chainId={chainId}
                    selectedChainId={selectedChainId}
                    tx={tx}
                    nativeCurrency= {nativeCurrency}
                    handleDistributorState={handleDistributorState}
                  />
        </div>
      )}
      {distributors.length>0 && address.toLowerCase() == distributors[0] && ( 
        <div>
          <DistributorRoom
                    address={address}
                    appServer={appServer}
                    web3Modal={web3Modal}
                    userSigner={userSigner}
                    mainnetProvider={mainnetProvider}
                    readContracts={readContracts}
                    writeContracts={writeContracts}
                    localProvider={localProvider}
                    yourLocalBalance={yourLocalBalance}
                    chainId={chainId}
                    selectedChainId={selectedChainId}
                    tx={tx}
                    nativeCurrency= {nativeCurrency}
                  />
        </div>
      )}
      {distributors.length > 0 && address.toLowerCase() != distributors[0] &&(
      <div>
        <h2 id="title">Welcome to the Tip Party!</h2>

          <Space>
            <h3>The host of this party is : </h3> <Address address={distributors[0]} ensProvider={mainnetProvider} />{" "}
          </Space>

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

          <div style={{ marginTop: "10px", marginBottom: "10px" }}>
            <Tabs defaultActiveKey="1" centered>
              <Tabs.TabPane tab="Room" key="1">
                <div style={{ marginTop: 10 }}>
                  {/* <div style={{ marginBottom: 20 }}>
                <h2>Sign In</h2>
              </div> */}
                  <div style={{ marginBottom: 20 }}>
                    <Button
                      type="primary"
                      shape="round"
                      onClick={handleSignIn}
                      disabled={isSignedIn}
                      loading={isSigning}
                    >
                      Sign Into "{room}" Room
                    </Button>
                  </div>
                  {/* <Divider /> */}

                  <div style={{ flex: 1 }}>
                    <Collapse defaultActiveKey={["1"]}>
                      <Collapse.Panel
                        header={`Signed In - ${addresses.length}`}
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
                              </div>
                            </List.Item>
                          )}
                        />
                      </Collapse.Panel>
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
                  </Card>
                </div>
              </Tabs.TabPane>
            </Tabs>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
