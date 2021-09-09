import React, { useEffect, useState, useRef } from "react";
import { Button, List, notification, Divider, Statistic, Input, Select, Collapse, Switch } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import { Address, PayButton } from "../components";
import { io } from "socket.io-client";
import { useParams } from "react-router-dom";
import { ethers, utils } from "ethers";
import { filterLimit } from "async";
//import useWindowSize from 'react-use/lib/useWindowSize'
import Confetti from "react-confetti";

export default function Rooms({
  appServer,
  web3Modal,
  address,
  userSigner,
  mainnetProvider,
  writeContracts,
  readContracts,
  admin,
  yourLocalBalance,
  tx,
}) {
  const { id } = useParams();
  const socket = useRef(null);
  //const { width, height } = useWindowSize()

  const [room, setRoom] = useState(id);
  const [amount, setAmount] = useState(0);
  const [token, setToken] = useState("ETH");
  const [spender, setSpender] = useState("");
  const [addresses, setAddresses] = useState([]);
  const [blacklist, setBlacklist] = useState([]);
  const [isSigning, setIsSigning] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [availableTokens, setAvailableTokens] = useState([]);
  const [isFiltering, setIsFiltering] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [numberOfConfettiPieces, setNumberOfConfettiPieces] = useState(0);

  useEffect(() => {
    setSpender(readContracts?.TokenDistributor?.address);
  }, [readContracts]);

const handleConfetti = e => {
    setNumberOfConfettiPieces(200)
  setTimeout(() => {
    setNumberOfConfettiPieces(0)
  }, 4000);
}

  const handleListUpdate = list => {
    const updatedList = [...addresses, ...list];
    // update addresses list
    setAddresses(updatedList);
  };

  useEffect(() => {
    if (addresses.includes(address.toLowerCase())) {
      setIsSignedIn(true);
    }
  }, [addresses, address]);

  useEffect(() => {
    // log into room as viewer
    socket.current = io(process.env.REACT_APP_SERVER, {
      query: {
        room,
      },
    });
    // add listener for room updates
    socket.current.once("list", handleListUpdate);
    socket.current.on("new-sign-in", handleListUpdate);
  }, [id]);

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
    let signature = await userSigner.signMessage(id);

    try {
      socket.current.emit("sign-in", {
        room,
        signature,
      });

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
      update => {
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
      update => {
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

  return (
    <div style={{ margin: "20px auto", width: 500, padding: 60, paddingBottom: 40, border: "3px solid" }}>
      <h2>Sign In</h2>
      <Confetti recycle={true} run={true} numberOfPieces={numberOfConfettiPieces} tweenDuration={3000} />
      <div style={{ marginTop: "10px", marginBottom: "10px" }}>
        <div>
          <Button onClick={handleSignIn} disabled={isSignedIn} loading={isSigning}>
            Sign Into "{room}" Room
          </Button>
          <Divider />
          <div style={{ marginBottom: "10px" }}>
            <Statistic title="Signed In" value={isSignedIn} valueStyle={{ color: !isSignedIn ? "red" : "green" }} />
          </div>

          <Collapse defaultActiveKey={["1"]}>
            <Collapse.Panel header="Pay List" key="1">
              <List
                bordered
                dataSource={addresses}
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
                      {admin && (
                        <Button onClick={() => unList(index)} size="medium">
                          <CloseOutlined />
                        </Button>
                      )}
                    </div>
                  </List.Item>
                )}
              />
            </Collapse.Panel>
            <Collapse.Panel header="Blacklist" key="2">
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
                      {admin && (
                        <Button onClick={() => reList(index)} size="medium">
                          <CloseOutlined />
                        </Button>
                      )}
                    </div>
                  </List.Item>
                )}
              />
            </Collapse.Panel>
          </Collapse>

          <div style={{ marginTop: "10px" }}>
            {admin && addresses && addresses.length > 0 && (
              <div>
                <Button
                  disabled={isFiltering}
                  loading={isFiltering}
                  style={{ marginLeft: "10px" }}
                  onClick={filterAddresses}
                >
                  Filter Out Non ENS Names
                </Button>
                {/* TODO : disable input until ERC-20 token is selected */}
                <Input
                  value={amount}
                  addonBefore="Total Amount to Distribute"
                  addonAfter={
                    <Select defaultValue="ETH" onChange={value => setToken(value)}>
                      <Select.Option value="ETH">ETH</Select.Option>
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
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
