import WalletConnectProvider from "@walletconnect/web3-provider";
//import Torus from "@toruslabs/torus-embed"
import WalletLink from "walletlink";
import { Alert, Button, Menu, Space } from "antd";
import "antd/dist/antd.css";
import React, { useCallback, useEffect, useState } from "react";
import { Link, Route, Switch, useLocation } from "react-router-dom";
import Web3Modal from "web3modal";
import "./App.css";
import { Account, NetworkSwitch } from "./components";
import { INFURA_ID, NETWORK, NETWORKS } from "./constants";
import { Transactor, Address as AddressHelper } from "./helpers";
import {
  useBalance,
  useContractLoader,
  useExchangePrice,
  useGasPrice,
  useOnBlock,
  useUserSigner,
  useStaticJsonRPC,
} from "./hooks";
import { Rooms, Home, WalletNotConnected } from "./views";

// Wallets for wallet connect
import Portis from "@portis/web3";
import Fortmatic from "fortmatic";
import Authereum from "authereum";
const { ethers } = require("ethers");

// 😬 Sorry for all the console logging
const DEBUG = true;
const NETWORKCHECK = true;

// Coinbase walletLink init
const walletLink = new WalletLink({
  appName: "coinbase",
});

// WalletLink provider
const walletLinkProvider = walletLink.makeWeb3Provider(
  "https://eth-mainnet.alchemyapi.io/v2/qCdzfF9UqXcJYIle-Ff-BN0MII8LjLQs",
  1,
);

// Portis ID: 6255fb2b-58c8-433b-a2c9-62098c05ddc9
/*
  Web3 modal helps us "connect" external wallets:
*/
const web3Modal = new Web3Modal({
  network: "mainnet", // Optional. If using WalletConnect on xDai, change network to "xdai" and add RPC info below for xDai chain.
  cacheProvider: true, // optional
  theme: "light", // optional. Change to "dark" for a dark theme.
  providerOptions: {
    walletconnect: {
      package: WalletConnectProvider, // required
      options: {
        bridge: "https://polygon.bridge.walletconnect.org",
        infuraId: INFURA_ID,
        rpc: {
          1: "https://eth-mainnet.alchemyapi.io/v2/qCdzfF9UqXcJYIle-Ff-BN0MII8LjLQs", // mainnet // For more WalletConnect providers: https://docs.walletconnect.org/quick-start/dapps/web3-provider#required
          42: `https://kovan.infura.io/v3/${INFURA_ID}`,
          100: "https://dai.poa.network", // xDai
        },
      },
    },
    portis: {
      display: {
        logo: "https://user-images.githubusercontent.com/9419140/128913641-d025bc0c-e059-42de-a57b-422f196867ce.png",
        name: "Portis",
        description: "Connect to Portis App",
      },
      package: Portis,
      options: {
        id: "6255fb2b-58c8-433b-a2c9-62098c05ddc9",
      },
    },
    fortmatic: {
      package: Fortmatic, // required
      options: {
        key: "pk_live_5A7C91B2FC585A17", // required
      },
    },
    // torus: {
    //   package: Torus,
    //   options: {
    //     networkParams: {
    //       host: "https://localhost:8545", // optional
    //       chainId: 1337, // optional
    //       networkId: 1337 // optional
    //     },
    //     config: {
    //       buildEnv: "development" // optional
    //     },
    //   },
    // },
    "custom-walletlink": {
      display: {
        logo: "https://play-lh.googleusercontent.com/PjoJoG27miSglVBXoXrxBSLveV6e3EeBPpNY55aiUUBM9Q1RCETKCOqdOkX2ZydqVf0",
        name: "Coinbase",
        description: "Connect to Coinbase Wallet (not Coinbase App)",
      },
      package: walletLinkProvider,
      connector: async (provider, options) => {
        await provider.enable();
        return provider;
      },
    },
    authereum: {
      package: Authereum, // required
    },
  },
});

// 🛰 providers
const providers = [
  "https://eth-mainnet.alchemyapi.io/v2/qCdzfF9UqXcJYIle-Ff-BN0MII8LjLQs",
  "https://eth-mainnet.gateway.pokt.network/v1/lb/611156b4a585a20035148406",
  "https://eth-mainnet.alchemyapi.io/v2/qCdzfF9UqXcJYIle-Ff-BN0MII8LjLQs",
];

function App(props) {
  // Add more networks as the dapp expands to more networks
  const configuredNetworks = ["mainnet", "polygon", "arbitrum", "optimism", "rinkeby", "xdai"];
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    configuredNetworks.push("localhost");
  }

  const cachedNetwork = configuredNetworks.includes(window.localStorage.getItem("network"))
    ? window.localStorage.getItem("network")
    : "mainnet";

  //Sets the states to be used across Tip Party
  const [injectedProvider, setInjectedProvider] = useState();
  const [address, setAddress] = useState("0x0000000000000000000000000000000000000000");
  const [isWalletConnected, setIsWalletConnected] = useState(true);
  const [isHost, setHost] = useState(false);
  const [room, setRoom] = useState();
  const [selectedNetwork, setSelectedNetwork] = useState(cachedNetwork || configuredNetworks[1]);

  if (DEBUG) console.log("📡 Connecting to New Cached Network: ", cachedNetwork);

  /// 📡 What chain are your contracts deployed to?
  //let targetNetwork = NETWORKS[cachedNetwork || "mainnet"];
  let targetNetwork = NETWORKS[selectedNetwork]; // <------- select your target frontend network (localhost, rinkeby, xdai, mainnet)

  // 🛰 providers
  if (DEBUG) console.log(`Connecting to ${selectedNetwork}`);
  if (DEBUG) console.log(`Network info: ${targetNetwork}`);

  // 🔭 block explorer URL
  const blockExplorer = targetNetwork.blockExplorer;

  // load all your providers
  const localProvider = useStaticJsonRPC([
    process.env.REACT_APP_PROVIDER ? process.env.REACT_APP_PROVIDER : targetNetwork.rpcUrl,
  ]);
  const mainnetProvider = useStaticJsonRPC(providers);

  const logoutOfWeb3Modal = async () => {
    await web3Modal.clearCachedProvider();
    if (injectedProvider && injectedProvider.provider && typeof injectedProvider.provider.disconnect == "function") {
      await injectedProvider.provider.disconnect();
    }
    setTimeout(() => {
      window.location.reload();
    }, 1);
  };

  const location = useLocation();

  useEffect(() => {
    setRoom(location.pathname.slice(6));
  }, [location]);

  /* 💵 This hook will get the price of ETH from 🦄 Uniswap: */
  const price = useExchangePrice(targetNetwork, mainnetProvider);

  /* 🔥 This hook will get the price of Gas from ⛽️ EtherGasStation */
  const gasPrice = useGasPrice(targetNetwork, "fast");

  // Use your injected provider from 🦊 Metamask or if you don't have it then instantly generate a 🔥 burner wallet.
  // we want to remove the burner wallet.
  const userSigner = useUserSigner(injectedProvider, localProvider, false);

  useEffect(() => {
    async function getAddress() {
      if (userSigner) {
        const newAddress = await userSigner.getAddress();
        setAddress(newAddress);
      }
    }
    getAddress();
  }, [userSigner]);

  // You can warn the user if you would like them to be on a specific network
  const localChainId = localProvider && localProvider._network && localProvider._network.chainId;
  const selectedChainId =
    userSigner && userSigner.provider && userSigner.provider._network && userSigner.provider._network.chainId;

  // For more hooks, check out 🔗eth-hooks at: https://www.npmjs.com/package/eth-hooks

  // The transactor wraps transactions and provides notificiations
  const tx = Transactor(userSigner, gasPrice);

  // Faucet Tx can be used to send funds from the faucet
  const faucetTx = Transactor(localProvider, gasPrice);

  // 🏗 scaffold-eth is full of handy hooks like this one to get your balance:
  const yourLocalBalance = useBalance(localProvider, address);

  // Just plug in different 🛰 providers to get your balance on different chains:
  const yourMainnetBalance = useBalance(mainnetProvider, address);

  // Load in your local 📝 contract and read a value from it:
  const readContracts = useContractLoader(localProvider);

  // If you want to make 🔐 write transactions to your contracts, use the userSigner:
  const writeContracts = useContractLoader(userSigner, { chainId: localChainId });

  // EXTERNAL CONTRACT EXAMPLE:
  //
  // If you want to bring in the mainnet DAI contract it would look like:
  const mainnetContracts = useContractLoader(mainnetProvider);

  // If you want to call a function on a new block
  useOnBlock(mainnetProvider, () => {
    console.log(`⛓ A new mainnet block is here: ${mainnetProvider._lastBlockNumber}`);
  });

  const appServer = process.env.REACT_APP_SERVER;

  /*
  const addressFromENS = useResolveName(mainnetProvider, "austingriffith.eth");
  console.log("🏷 Resolved austingriffith.eth as:",addressFromENS)
  */

  //
  // 🧫 DEBUG 👨🏻‍🔬
  //
  useEffect(() => {
    if (
      DEBUG &&
      mainnetProvider &&
      address &&
      selectedChainId &&
      yourLocalBalance &&
      yourMainnetBalance &&
      readContracts &&
      writeContracts &&
      mainnetContracts
    ) {
      console.log("_____________________________________ 🏗 scaffold-eth _____________________________________");
      console.log("🌎 mainnetProvider", mainnetProvider);
      console.log("🏠 localChainId", localChainId);
      console.log("👩‍💼 selected address:", address);
      console.log("🕵🏻‍♂️ selectedChainId:", selectedChainId);
      console.log("💵 yourLocalBalance", yourLocalBalance ? ethers.utils.formatEther(yourLocalBalance) : "...");
      console.log("💵 yourMainnetBalance", yourMainnetBalance ? ethers.utils.formatEther(yourMainnetBalance) : "...");
      console.log("📝 readContracts", readContracts);
      console.log("🌍 DAI contract on mainnet:", mainnetContracts);
      console.log("🔐 writeContracts", writeContracts);
    }

    if (readContracts) {
      setIsWalletConnected(!!web3Modal.cachedProvider);
    }
  }, [
    mainnetProvider,
    address,
    selectedChainId,
    yourLocalBalance,
    yourMainnetBalance,
    readContracts,
    writeContracts,
    mainnetContracts,
  ]);

  let networkDisplay = "";
  if (NETWORKCHECK && localChainId && selectedChainId && localChainId !== selectedChainId) {
    const networkSelected = NETWORK(selectedChainId);
    const networkLocal = NETWORK(localChainId);
    if (selectedChainId === 1337 && localChainId === 31337) {
      networkDisplay = (
        <div style={{ zIndex: 2, position: "absolute", right: 0, top: 130, padding: 16 }}>
          <Alert
            message="⚠️ Wrong Network ID"
            description={
              <div>
                You have <b>chain id 1337</b> for localhost and you need to change it to <b>31337</b> to work with
                HardHat.
                <div>(MetaMask -&gt; Settings -&gt; Networks -&gt; Chain ID -&gt; 31337)</div>
              </div>
            }
            type="error"
            closable={false}
          />
        </div>
      );
    } else {
      networkDisplay = (
        <div style={{ zIndex: 2, position: "absolute", right: 0, top: 130, padding: 16 }}>
          <Alert
            message="⚠️ Wrong Network"
            description={
              <div>
                <p>
                  You have <b>{networkSelected && networkSelected.name}</b> selected.
                </p>
                <Button
                  onClick={async () => {
                    const ethereum = window.ethereum;
                    const data = [
                      {
                        chainId: "0x" + targetNetwork.chainId.toString(16),
                        chainName: targetNetwork.name,
                        nativeCurrency: targetNetwork.nativeCurrency,
                        rpcUrls: [targetNetwork.rpcUrl],
                        blockExplorerUrls: [targetNetwork.blockExplorer],
                      },
                    ];
                    console.log("data", data);
                    // try to add new chain
                    try {
                      await ethereum.request({ method: "wallet_addEthereumChain", params: data });
                    } catch (error) {
                      // if failed, try a network switch instead
                      await ethereum
                        .request({
                          method: "wallet_switchEthereumChain",
                          params: [
                            {
                              chainId: "0x" + targetNetwork.chainId.toString(16),
                            },
                          ],
                        })
                        .catch();
                    }
                  }}
                >
                  <b>Click here to switch to {networkLocal && networkLocal.name}</b>
                </Button>
              </div>
            }
            type="error"
            closable={false}
          />
        </div>
      );
    }
  } else {
    networkDisplay = <span></span>;
  }

  const loadWeb3Modal = useCallback(async () => {
    const provider = await web3Modal.connect();
    setInjectedProvider(new ethers.providers.Web3Provider(provider));

    provider.on("chainChanged", chainId => {
      console.log(`chain changed to ${chainId}! updating providers`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    provider.on("accountsChanged", () => {
      console.log(`account changed!`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    // Subscribe to session disconnection
    provider.on("disconnect", (code, reason) => {
      console.log(code, reason);
      logoutOfWeb3Modal();
    });
  }, [setInjectedProvider]);

  useEffect(() => {
    if (web3Modal.cachedProvider) {
      loadWeb3Modal();
    }
  }, [loadWeb3Modal]);

  const [route, setRoute] = useState();
  useEffect(() => {
    setRoute(window.location.pathname);
  }, [setRoute]);

  useEffect(() => {
    if (room) {
      const userType = localStorage.getItem(room + "userType");
      if (userType === "host") {
        setHost(true);
      }
    }
  }, [room]);

  const toggleHost = () => {
    localStorage.setItem(room + "userType", isHost ? "guest" : "host");
    setHost(!isHost);
  };

  let faucetHint = "";
  const faucetAvailable = localProvider && localProvider.connection && targetNetwork.name.indexOf("local") !== -1;

  const [faucetClicked, setFaucetClicked] = useState(false);
  if (
    !faucetClicked &&
    localProvider &&
    localProvider._network &&
    localProvider._network.chainId === 31337 &&
    yourLocalBalance &&
    ethers.utils.formatEther(yourLocalBalance) <= 0
  ) {
    faucetHint = (
      <div>
        <Button
          type="primary"
          onClick={() => {
            faucetTx({
              to: address,
              value: ethers.utils.parseEther("0.01"),
            });
            setFaucetClicked(true);
          }}
        >
          💰 Grab funds from the faucet ⛽️
        </Button>
      </div>
    );
  }

  return (
    <div className="App pb-20 bg-purple-darkpurple">
      <div className="p-10 mx-auto flex flex-wrap">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex title-font font-medium items-center text-gray-900 mb-4 md:mb-0 navbar-title"
        >
          <div className="flex flex-col">
            <div className="flex flex-row text-2xl lg:text-5xl">
              Tip Party
              <svg width="56" height="55" viewBox="0 0 56 55" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M15.3726 43.8106C14.6263 44.1248 13.8338 43.4746 14.002 42.6859L18.787 20.2442C18.9433 19.5112 19.8254 19.2041 20.406 19.6805L36.8582 33.1796C37.4388 33.656 37.3035 34.5759 36.6099 34.8679L15.3726 43.8106Z"
                  stroke="#6F3FF5"
                  strokeWidth="4"
                />
                <path
                  d="M25.0475 4.63341C25.571 3.75631 26.9177 4.13128 26.9075 5.15128L26.8143 14.4007C26.8076 15.0587 26.1771 15.5322 25.5428 15.3556L20.8888 14.0598C20.2545 13.8832 19.9627 13.1528 20.3004 12.587L25.0475 4.63341Z"
                  fill="#FFCC00"
                />
                <path
                  d="M50.3606 23.8396C51.365 23.6408 51.989 24.896 51.2206 25.5694L44.2503 31.6777C43.7562 32.1107 42.9833 31.9576 42.6905 31.3687L40.5501 27.0637C40.2574 26.4748 40.6041 25.7708 41.2499 25.643L50.3606 23.8396Z"
                  fill="#FFCC00"
                />
                <path
                  d="M39.442 11.9061C40.3004 11.3494 41.3459 12.2803 40.8843 13.1904L36.6983 21.4448C36.4011 22.0309 35.6258 22.1769 35.1343 21.7393L31.5352 18.5344C31.0438 18.0968 31.1041 17.3142 31.6569 16.9557L39.442 11.9061Z"
                  fill="#FFCC00"
                />
              </svg>
            </div>

            <p className="navbar-subtitle text-base lg:text-2xl">by MOONSHOT COLLECTIVE</p>
          </div>
        </a>
        <span className="flex inline-flex sm:ml-auto sm:mt-0 flex-col lg:flex-row ml-2">
          <Account
            address={address}
            localProvider={localProvider}
            userSigner={userSigner}
            mainnetProvider={mainnetProvider}
            price={price}
            web3Modal={web3Modal}
            loadWeb3Modal={loadWeb3Modal}
            logoutOfWeb3Modal={logoutOfWeb3Modal}
            blockExplorer={blockExplorer}
            networkSelect={
              <NetworkSwitch
                networkOptions={configuredNetworks}
                selectedNetwork={selectedNetwork}
                setSelectedNetwork={setSelectedNetwork}
                NETWORKS={NETWORKS}
                targetNetwork={targetNetwork}
              />
            }
            networkDisplay={networkDisplay}
            hostToggleSwitch={
              room && (
                <div className="flex flex-col mt-5 px-7">
                  <Space>
                    <Button
                      size="large"
                      type="primary"
                      style={
                        isHost
                          ? { borderColor: "#4b3ff5", backgroundColor: "#4b3ff5" }
                          : { borderColor: "#6F3FF5", backgroundColor: "#6F3FF5" }
                      }
                      onClick={toggleHost}
                    >
                      {" "}
                      {isHost ? "Sign in as Guest" : "Become a Host"}
                    </Button>
                  </Space>
                </div>
              )
            }
          />
        </span>
      </div>

      {targetNetwork.name === "localhost" && (
        <Menu style={{ textAlign: "center" }} selectedKeys={[route]} mode="horizontal">
          <Menu.Item key="/">
            <Link
              onClick={() => {
                setRoute("/");
              }}
              to="/"
            >
              App
            </Link>
          </Menu.Item>
          {targetNetwork.name === "localhost" && (
            <Menu.Item key="/contracts">
              <Link
                onClick={() => {
                  setRoute("/contracts");
                }}
                to="/contracts"
              >
                Contracts
              </Link>
            </Menu.Item>
          )}
        </Menu>
      )}

      <main>
        <Switch>
          {!isWalletConnected ? (
            <WalletNotConnected
              connector={
                <Account
                  address={address}
                  localProvider={localProvider}
                  userSigner={userSigner}
                  mainnetProvider={mainnetProvider}
                  price={price}
                  web3Modal={web3Modal}
                  loadWeb3Modal={loadWeb3Modal}
                  logoutOfWeb3Modal={logoutOfWeb3Modal}
                  blockExplorer={blockExplorer}
                  width={300}
                />
              }
            />
          ) : (
            <>
              <Route exact path="/">
                <Home
                  writeContracts={writeContracts}
                  readContracts={readContracts}
                  address={address}
                  mainnetProvider={mainnetProvider}
                  tx={tx}
                  isWalletConnected={isWalletConnected}
                  nativeCurrency={targetNetwork.nativeCurrency}
                  isHost={isHost}
                  setHost={setHost}
                />
              </Route>
              <Route path="/room/:room">
                <Rooms
                  address={address}
                  appServer={appServer}
                  web3Modal={web3Modal}
                  userSigner={userSigner}
                  mainnetProvider={mainnetProvider}
                  readContracts={readContracts}
                  writeContracts={writeContracts}
                  localProvider={localProvider}
                  yourLocalBalance={yourLocalBalance}
                  chainId={localChainId || selectedChainId}
                  selectedChainId={selectedChainId}
                  tx={tx}
                  nativeCurrency={targetNetwork.nativeCurrency}
                  networkTokenList={targetNetwork.networkTokenList}
                  isHost={isHost}
                  isWalletConnected={isWalletConnected}
                />
              </Route>
              {/* This is used when testing out smart contracts:
              <Route exact path="/contracts">
                <Contract
                  name="TokenDistributor"
                  signer={userSigner}
                  provider={localProvider}
                  address={address}
                  blockExplorer={blockExplorer}
                />
                <Contract
                  name="GTC"
                  signer={userSigner}
                  provider={localProvider}
                  address={address}
                  blockExplorer={blockExplorer}
                />
              </Route> */}
            </>
          )}
        </Switch>
      </main>
    </div>
  );
}

export default App;
