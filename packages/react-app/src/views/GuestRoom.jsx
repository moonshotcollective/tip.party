import React, { useEffect, useState, useRef } from "react";
import { Button, List, notification, Card, Collapse, Tabs, Menu, Dropdown } from "antd";
import { ExportOutlined, LinkOutlined } from "@ant-design/icons";
import { Address, TransactionHash } from "../components";
import { useParams } from "react-router-dom";
import { CSVLink } from "react-csv";
import copy from "copy-to-clipboard";
import { useTokenImport, useOnBlock } from "../hooks";
import axios from "axios";
import * as storage from "../utils/storage";
import { NETWORK } from "../constants";
import fetchTransaction from "../helpers/txHandler";

//import useWindowSize from 'react-use/lib/useWindowSize'
import Confetti from "react-confetti";
import "./GuestRoom.css";

export default function GuestRoom({
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

  const [spender, setSpender] = useState("");
  const [addresses, setAddresses] = useState([]);
  const [sortedAddresses, setSortedAddresses] = useState([]);
  const [txHash, setTxHash] = useState([]);
  const [isSigning, setIsSigning] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [numberOfConfettiPieces, setNumberOfConfettiPieces] = useState(0);
  const [contracts, loadContracts, addContracts] = useTokenImport(localProvider, userSigner);
  const receivedHashes= useRef([]);

  const explorer = chainId ? NETWORK(chainId).blockExplorer : `https://etherscan.io/`;

  const { readContracts, writeContracts } = contracts;

  const subs = useRef([]);

  useEffect(() => {
    // moving current user to the top of the list
    if (addresses && addresses.length > 0) {
      console.log("address:", address);
      const newAddresses = [...addresses];
      newAddresses.forEach((add, index) => {
        if (add.toLowerCase() === address.toLowerCase()) {
          newAddresses.splice(index, 1);
          newAddresses.unshift(add);
        }
      });
      setSortedAddresses(newAddresses);
    }
  }, [addresses, address]);

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
    // clear existing subscriptions
    subs.current.map(sub => sub());

    // start new subscriptions
    if (chainId) {
      subs.current.push(storage.watchRoom(room, handleListUpdate));
      subs.current.push(storage.watchRoomTx(room, chainId, handleTransactionUpdate));
    }
  }, [room, chainId]);

  useEffect(() => {
    if (isSignedIn) {
      handleHashes(localProvider);
    }
  },[isSignedIn, address, txHash]);

  const handleConfetti = e => {
    setNumberOfConfettiPieces(200);
    setTimeout(() => {
      setNumberOfConfettiPieces(0);
    }, 4000);
  };

  const handleHashes = async provider => {
    try {
      //loops through each transaction
      txHash.forEach(async hash => {
        //gets whether if the user has viewed the notification
        storage.watchTxNotifiers(room, hash, async result => {
          //if the resulting array doesn't include the addresss
          if (!result.includes(address.toLowerCase())) {
            //wait for transaction and check if it is complete
            const tx = await provider.waitForTransaction(hash, 1);
            if (tx.status === 1) {
              const blockNum = "0x" + tx.blockNumber.toString(16);

              //Uses the alchemy api function
              //Returns any token transfer a user received within the block
              const receivedTransfers = fetchTransaction(chainId, blockNum, address);

              Promise.resolve(receivedTransfers).then(async recievedTransfers => {
                //checks whether user has received tokens or the notification already
                const hasReceivedTokens = recievedTransfers.length > 0 ? true : false;
                const hasReceivedNotification = receivedHashes.current.includes(hash);

                if (hasReceivedTokens && !hasReceivedNotification) {
                  receivedHashes.current.push(hash);

                  const value = recievedTransfers[0].value;
                  const asset = recievedTransfers[0].asset;
                  const message = value && asset ? `You received ${value + " " + asset}!` : "You received tokens!";

                  notification.success({
                    message: message,
                    description: (
                      <div>
                        <p>
                          Transaction link:{" "}
                          <a target="_blank" href={`${explorer}tx/${hash}`} rel="noopener noreferrer">
                            {hash.substr(0, 20)}
                          </a>
                        </p>
                      </div>
                    ),
                    duration: 0,
                  });

                  // send user address to firebase as notified
                  await storage.addTxNotifier(room, hash, address.toLowerCase());
                }
              });
            }
          }
        });
      });
    } catch (e) {
      console.log(e);
    }
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

  const handleSignIn = async () => {
    if (typeof appServer == "undefined") {
      return notification.error({
        message: "Setup Error",
        description: "Missing REACT_APP_SERVER environment variable in localhost environment",
        placement: "bottomRight",
      });
    }

    if (web3Modal.cachedProvider === "") {
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

    if (addresses.length >= 255) {
      return notification.error({
        message: "Failed to Sign In!",
        description: "Room is at capacity!" ,
        placement: "bottomRight",
      });
    }

    setIsSigning(true);

    // sign roomId using wallet
    let signatureError;
    let signature = await userSigner.signMessage(room).catch(error => {
      if (error) {
        signatureError = `Error: ${error.code} ${error.message}`;
      }
    });

    if (signatureError) {
      setIsSigning(false);
      return notification.error({
        message: "Signature Error",
        description: signatureError,
        placement: "bottomRight",
      });
    }

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
    <div className="bg-purple-darkpurple justify-center">
      <h2 id="title">Welcome to the Tip Party!</h2>
      <h3>
        {isSignedIn ? (
          <>
            You are a <b>Guest</b> in "<b>{room}</b>" room
          </>
        ) : (
          <>
            Sign into "<b>{room}</b>" room to be a Guest
          </>
        )}
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
        <Confetti
          recycle={true}
          run={true}
          height={document.body.scrollHeight}
          numberOfPieces={numberOfConfettiPieces}
          tweenDuration={3000}
        />
        <div style={{ marginTop: "10px", marginBottom: "10px" }}>
          <Tabs defaultActiveKey="1" centered>
            <Tabs.TabPane tab="Room" key="1">
              <div style={{ marginTop: 10 }}>
                <div style={{ marginBottom: 20 }}>
                  <Button type="primary" size="large" onClick={handleSignIn} disabled={isSignedIn} loading={isSigning}>
                    Sign Into "{room}" Room{" "}
                  </Button>
                </div>
                <div style={{ flex: 1 }}>
                  <Collapse defaultActiveKey={["1"]}>
                    <Collapse.Panel
                      header={`Signed In - ${addresses.length}`}
                      key="1"
                      extra={
                        <div onClick={e => e.stopPropagation()}>
                          <Dropdown overlay={exportMenu} placement="bottomRight" arrow trigger="hover">
                            <ExportOutlined />
                          </Dropdown>
                        </div>
                      }
                    >
                      {sortedAddresses.length === 0 && <h2>This room is currently empty </h2>}
                      {sortedAddresses.length > 0 && (
                        <List
                          bordered
                          dataSource={sortedAddresses}
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
                                <Address address={item} ensProvider={mainnetProvider} fontSize={28} />
                              </div>
                            </List.Item>
                          )}
                        />
                      )}
                    </Collapse.Panel>
                  </Collapse>
                </div>
              </div>
            </Tabs.TabPane>
            <Tabs.TabPane tab="Payouts" key="2">
              {/* Transactions */}
              <div style={{ marginBottom: 25, flex: 1 }}>
                <Card title={txHash.length > 0 ? "Payout Transactions" : ""} style={{ width: "100%" }}>
                  {txHash.length == 0 && (
                    <h2>
                      No payouts have been administered for this room {chainId ? "on " + NETWORK(chainId).name : ""}
                    </h2>
                  )}
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
