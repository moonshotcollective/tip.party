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
  Tag,
} from "antd";
import { CloseOutlined, ExportOutlined, InfoCircleOutlined } from "@ant-design/icons";
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
import { unmountComponentAtNode } from "react-dom";

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
  const [importedAddresses, setImportedAddresses] = useState([]);
  const [txHash, setTxHash] = useState([]);
  const [blacklist, setBlacklist] = useState([]);
  const [isSigning, setIsSigning] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [availableTokens, setAvailableTokens] = useState([]);
  const [isFiltering, setIsFiltering] = useState(false);
  const [importToken, setImportToken] = useState(false);
  const [importAddressModal, setImportAddressModal] = useState(false);
  const [numberOfConfettiPieces, setNumberOfConfettiPieces] = useState(0);
  const [contracts, loadContracts, addContracts] = useTokenImport(localProvider, userSigner);
  const allAddresses = [...addresses, ...importedAddresses];

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

  const handleAddressImport = async addressesToImport => {
    //removes all of the spaces
    const str = addressesToImport.replace(/\s/g, '');

    //Splits the string into an array of addresses
    let arr = str.split(",");

   for(let index=0; index< arr.length;index++){
     const element = arr[index];
     if(!ethers.utils.isAddress(element)){
      try{
      let addr = await mainnetProvider.resolveName(element);
        if(addr){
          if(allAddresses.includes(addr)){
            return notification.error({
              message: "Failed to Add Address",
              description: element + " is already included!",
              placement: "bottomRight",
            });
           }
          //changes ens in arr to address
          arr[index] = addr;
        }
        else {
          return notification.error({
            message: "Failed to Add Address",
            description: element + " is not a valid Ethereum address",
            placement: "bottomRight",
          });
        }

    
      } catch(e){
        return notification.error({
          message: "Failed to Add Address",
          description: element + " is not a valid Ethereum address",
          placement: "bottomRight",
        });
      }
     }
     if(allAddresses.includes(element)){
      return notification.error({
        message: "Failed to Add Address",
        description: element + " is already included!",
        placement: "bottomRight",
      });
     }
     
   }

    Promise.all(arr).then(arr =>{
    localStorage.setItem(room, JSON.stringify([...importedAddresses, ...arr]));
    setImportedAddresses([...importedAddresses, ...arr]);
    setImportAddressModal(false);
 
 
    return notification.success({
     message: "Successfully added address",
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

  useEffect(() => {
    if (addresses.includes(address.toLowerCase())) {
      setIsSignedIn(true);
    }
  }, [addresses, address]);

  useEffect(() => {
    //console.log("imported addresses: " + localStorage.getItem("importedAddresses"));
    const imports = localStorage.getItem(room);
    if (imports) {
      const parsedImports = JSON.parse(imports);
      setImportedAddresses(parsedImports);
    }
  }, [room]);

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

    if ((e.target.value === "" || re.test(e.target.value)) && e.target.value !== ".") {
      setAmount(e.target.value);
    }
  };

  const ethPayHandler = async () => {
    const result = tx(
      writeContracts.TokenDistributor.splitEth(allAddresses, room, {
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
            description: "Each user received " + amount / allAddresses.length + " " + token,
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
        ethers.utils.parseUnits(amount, opts.decimals),
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
            description: "Each user received " + amount / allAddresses.length + " " + token,
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
        You are the <b>Host</b> for "<b>{room}</b>" room{" "}
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
                  okText="Add Address"
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
                                  if (importedAddresses.includes(item)) removeImportedAddress(index - addresses.length);
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
