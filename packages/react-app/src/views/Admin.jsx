import React, { useEffect, useState } from "react";
import { Address } from "../components";
import { Button, Col, Menu, Row, Input, List, notification, Select, Divider, Statistic } from "antd";
import axios from "axios";
const { ethers, BigNumber } = require("ethers");

export default function Admin({
  writeContracts,
  readContracts,
  admin,
  mainnetProvider,
  mainnetContracts,
  tx,
  appServer,
  tokenAddress,
}) {
  const [message, setMessage] = useState("");
  const [amount, setAmount] = useState(0);
  const [token, setToken] = useState("");
  const [addresses, setAddresses] = useState([]);
  const [payoutCompleted, setPayoutCompleted] = useState(false);
  const [approved, setApproved] = useState(true);
  const [newAdmin, setNewAdmin] = useState("");

  const getDecimal = async () => {
    return await mainnetContracts.GTC.decimals();
  };

  const getTokenAddress = () => {
    return mainnetContracts.GTC.address;
  };

  return (
    <div style={{ margin: "20px auto", width: 500, padding: 60, border: "3px solid" }}>
      <div style={{ marginBottom: 10 }}>
        <Input
          style={{ marginTop: "10px", marginBottom: "10px" }}
          addonBefore="Message"
          value={message}
          placeholder="Message"
          onChange={e => setMessage(e.target.value)}
        />
        <div>
          <Button
            style={{ marginLeft: "10px" }}
            onClick={async () => {
              const res = await axios.get(appServer + message);
              console.log("res", res);
              setAddresses(res.data);
            }}
          >
            Fetch Logged Accounts
          </Button>
        </div>
      </div>
      <div>
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
                <Button
                  onClick={async () => {
                    const updatedAddresses = [...addresses];
                    updatedAddresses.splice(index, 1);
                    setAddresses(updatedAddresses);
                  }}
                  size="medium"
                >
                  X
                </Button>
              </div>
            </List.Item>
          )}
        />

        {addresses && addresses.length > 0 && (
          <div>
            <Select
              defaultValue="Select token..."
              style={{ width: "100%", textAlign: "left", float: "left", marginTop: "10px" }}
              onChange={value => {
                setToken(value);
              }}
            >
              <Option value="ETH">ETH</Option>
              <Option value="GTC">GTC</Option>
            </Select>

            {/* TODO : disable input until ERC-20 token is selected */}
            <Input
              value={amount}
              addonBefore="Total Amount to Distribute"
              addonAfter={token == "" ? <span /> : token}
              style={{ marginTop: "10px" }}
              onChange={e => setAmount(e.target.value.toLowerCase())}
            />
            {token && token == "ETH" && (
              <div style={{ marginTop: "10px", marginBottom: "10px" }}>
                <Button
                  onClick={async () => {
                    /* look how you call setPurpose on your contract: */
                    /* notice how you pass a call back for tx updates too */
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
                        }
                      },
                    );
                    console.log("awaiting metamask/web3 confirm result...", result);
                    console.log(await result);
                    setApproved(true);
                  }}
                >
                  Payout
                </Button>
              </div>
            )}

            {token && token != "ETH" && (
              <div style={{ marginTop: "10px", marginBottom: "10px" }}>
                <Button
                  onClick={async () => {
                    /* look how you call setPurpose on your contract: */
                    /* notice how you pass a call back for tx updates too */
                    const decimal = await getDecimal();
                    const result = tx(
                      writeContracts.GTC.approve(
                        readContracts?.TokenDistributor.address,
                        ethers.utils.parseUnits(amount, decimal),
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
                            message: "Token successfully approved",
                            placement: "topRight",
                          });
                        }
                      },
                    );
                    console.log("awaiting metamask/web3 confirm result...", result);
                    console.log(await result);
                    setApproved(true);
                  }}
                >
                  Approve Token
                </Button>

                <Button
                  disabled={!approved}
                  style={{ marginLeft: "10px" }}
                  onClick={async () => {
                    /* look how you call setPurpose on your contract: */
                    /* notice how you pass a call back for tx updates too */
                    const decimal = await getDecimal();

                    console.log({ addresses });

                    const result = tx(
                      writeContracts.TokenDistributor.splitTokenFromUser(
                        addresses,
                        ethers.utils.parseUnits(amount, decimal),
                        getTokenAddress(),
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
                        }
                      },
                    );
                    console.log("awaiting metamask/web3 confirm result...", result);
                    console.log(await result);
                    setApproved(false);
                  }}
                >
                  Payout
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ marginTop: 50 }}>
        <h2>Add Admin</h2>
        <Input
          style={{ marginTop: "10px", marginBottom: "10px" }}
          addonBefore="Address"
          value={newAdmin}
          placeholder="Address"
          onChange={e => setNewAdmin(e.target.value)}
        />
        <div style={{ marginBottom: "10px" }}>
          {admin && (
            <div>
              <Button
                style={{ marginLeft: "10px" }}
                onClick={async () => {
                  const result = tx(writeContracts.TokenDistributor.addNewDistributor(newAdmin), update => {
                    console.log("📡 Admin Update:", update);
                    if (update && (update.status === "confirmed" || update.status === 1)) {
                      console.log(" 🍾 Transaction " + update.hash + " finished!");
                      notification.success({
                        message: "Admin add",
                        description: "successful",
                        placement: "bottomRight",
                      });
                    }
                  });
                  setNewAdmin("");
                }}
              >
                Add User As Admin
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
