import { Badge, Button , Space, Menu, Dropdown } from "antd";
import React from "react";
import { useThemeSwitcher } from "react-css-theme-switcher";
import Address from "./Address";
import Balance from "./Balance";
const { SubMenu } = Menu;
const MenuItemGroup = Menu.ItemGroup;
import { DownOutlined, UserOutlined, CaretDownOutlined } from '@ant-design/icons';
// import Wallet from "./Wallet";

/*
  ~ What it does? ~

  Displays an Address, Balance, and Wallet as one Account component,
  also allows users to log in to existing accounts and log out

  ~ How can I use? ~

  <Account
    address={address}
    localProvider={localProvider}
    userProvider={userProvider}
    mainnetProvider={mainnetProvider}
    price={price}
    web3Modal={web3Modal}
    loadWeb3Modal={loadWeb3Modal}
    logoutOfWeb3Modal={logoutOfWeb3Modal}
    blockExplorer={blockExplorer}
  />

  ~ Features ~

  - Provide address={address} and get balance corresponding to the given address
  - Provide localProvider={localProvider} to access balance on local network
  - Provide userProvider={userProvider} to display a wallet
  - Provide mainnetProvider={mainnetProvider} and your address will be replaced by ENS name
              (ex. "0xa870" => "user.eth")
  - Provide price={price} of ether and get your balance converted to dollars
  - Provide web3Modal={web3Modal}, loadWeb3Modal={loadWeb3Modal}, logoutOfWeb3Modal={logoutOfWeb3Modal}
              to be able to log in/log out to/from existing accounts
  - Provide blockExplorer={blockExplorer}, click on address and get the link
              (ex. by default "https://etherscan.io/" or for xdai "https://blockscout.com/poa/xdai/")
*/

export default function Account({
  address,
  userSigner,
  localProvider,
  mainnetProvider,
  price,
  web3Modal,
  loadWeb3Modal,
  logoutOfWeb3Modal,
  blockExplorer,
  isOwner,
}) {
  const { currentTheme } = useThemeSwitcher();

  function isValidAddress (address) {
    return address && address !== "0x0000000000000000000000000000000000000000";
  }

  const menu = (
    <Menu>
      <Menu.Item key="1" icon={'Balance: '}>
        {isValidAddress(address) ? <Balance address={address} provider={localProvider} price={price} /> :''}
      </Menu.Item>
      <Menu.Item key="2">
        <a
          key="logoutbutton"
          size="medium"
          onClick={logoutOfWeb3Modal}
          style={{ textAlign: "center" }}
        >
          Logout
        </a>
      </Menu.Item>
    </Menu>
  );

  const modalButtons = [];
  if (web3Modal) {
    if (web3Modal.cachedProvider) {
      modalButtons.push(

        <div>
          {isValidAddress(address) ?
            <Space wrap>
              <Dropdown.Button overlay={menu} icon={<DownOutlined/>} size={'large'}>
                  {isOwner ? <Badge count={"admin"} style={{ marginRight: 5 }}  /> : <Badge count={"user"} style={{ backgroundColor: '#52c41a', marginRight: 5 }} />}
                  <Address address={address} ensProvider={mainnetProvider} blockExplorer={blockExplorer} />
              </Dropdown.Button>
            </Space>
           : ""}
        </div>
              
      );
    } else {
      modalButtons.push(
        <Button
          key="loginbutton"
          style={{ verticalAlign: "top", marginLeft: 8, marginTop: 4 }}
          size="medium"
          /* type={minimized ? "default" : "primary"}     too many people just defaulting to MM and having a bad time */
          onClick={loadWeb3Modal}
        >
          Please connect your Wallet
        </Button>,
      );
    }
  }

  return (
    <div>
      {modalButtons}
    </div>
  );
}
