import React, { useEffect, useState } from "react";
import { Address, PayButton, AddressInput } from "../components";
import { Button, Input, InputNumber, List, notification, Select, Switch } from "antd";
import axios from "axios";
import { filterLimit } from "async";
const { ethers, utils } = require("ethers");

export default function Admin({
  writeContracts,
  readContracts,
  admin,
  address,
  yourLocalBalance,
  mainnetProvider,
  tx,
  appServer,
}) {
  const [message, setMessage] = useState("");
  const [amount, setAmount] = useState(0);
  const [token, setToken] = useState("ETH");
  const [spender, setSpender] = useState("");
  const [availableTokens, setAvailableTokens] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [newAdmin, setNewAdmin] = useState("");
  const [ensAddressFilter, setEnsAddressFilter] = useState(true);
  const [isFetching, setFetchingStatus] = useState(false);

  useEffect(() => {
    setSpender(readContracts?.TokenDistributor?.address);
  }, [readContracts]);

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
        }
      },
    );
    console.log("awaiting metamask/web3 confirm result...", result);
    console.log(await result);
    setAmount(0);
  };

  const tokenPayHandler = async opts => {
    console.log(opts);

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
        }
      },
    );
    console.log("awaiting metamask/web3 confirm result...", result);
    console.log(await result);

    setAmount(0);
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
    setFetchingStatus(true);
    const res = await axios.get(appServer + message);
    const inputAddresses = res.data;
    const output = await filterLimit(inputAddresses, 10, async (address)=> {
      const ens = await lookupAddress(mainnetProvider, address).then(name => name);
      if (ensAddressFilter) {
        return ens && ens.indexOf("0x") < 0;
      }
      return true;
    })
    setAddresses(output);
    setFetchingStatus(false);
  };

  const toggleEnsFilter = isChecked => {
    setEnsAddressFilter(isChecked)
  }

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
            disabled={isFetching}
            loading={isFetching}
            style={{ marginLeft: "10px" }}
            onClick={filterAddresses}
          >
          Fetch Logged Accounts
          </Button>
          <Switch
            checkedChildren="ENS Only"
            unCheckedChildren="All Addresses"
            defaultChecked
            style={{ marginLeft: "10px" }}
            checked={ensAddressFilter}
            onChange={toggleEnsFilter}
          />
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

      <div style={{ marginTop: 50 }}>
        <h2>Add Admin</h2>
        <div>
          <div style={{ padding: 10 }}>
            <AddressInput
              autoFocus
              ensProvider={mainnetProvider}
              placeholder="Address"
              address={newAdmin}
              onChange={setNewAdmin}
            />
          </div>
        </div>
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
