import React, { useEffect, useState, useRef } from "react";
import { Button, List, notification, Divider, Card, Input, Select, Collapse, Tabs, Menu, Dropdown } from "antd";
import { CloseOutlined, ExportOutlined } from "@ant-design/icons";
import { Address, PayButton, TransactionHash, AddressModal } from "../components";
import { useParams } from "react-router-dom";
import { ethers, utils } from "ethers";
import { filterLimit } from "async";
import { CSVLink } from "react-csv";
import copy from "copy-to-clipboard";
import * as storage from "../utils/storage";
import { useTokenImport } from "../hooks";
//import useWindowSize from 'react-use/lib/useWindowSize'
import Confetti from "react-confetti";
import "./Room.css";
import { useHistory } from "react-router";


export default function NoDistributorRoom({
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
  handleDistributorState
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

  const { readContracts, writeContracts } = contracts;

  const subs = useRef([]);




 



  useEffect(() => {
    if (addresses.includes(address.toLowerCase())) {
      setIsSignedIn(true);
    }
  }, [addresses, address]);

  

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
      await storage.signIntoRoomDistributor(room, signature);

      // notify user of signIn
      setIsSignedIn(true);

      handleDistributorState(address);

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

  

 
 



  return (
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
      <div>
            <h3> This room does not have a distributor </h3>
              <div style={{ marginTop: 20 }}>
                <Button type="primary"  onClick={handleSignIn} disabled={isSignedIn} loading={isSigning}>
                  Sign Into "{room}" Room as Distributor
                </Button>
              </div>
              {/* <Divider /> */}

      </div>
    </div>
  );
}
