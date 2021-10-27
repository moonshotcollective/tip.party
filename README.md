# Tip.party

## About
Tip Party allows you to easily drop any ERC-20 token to contributors of a DAO. You can become a distributor, and load up a Tip Party room, where contributors can sign into with their Ethereum wallets to receive tokens.

Tip Party works best when rewarding members on community calls! Please check out [our landing page](tip.party) for more info. 

## Getting Started

### Running Tip Party locally:

Prerequisites: [Node](https://nodejs.org/en/download/) plus [Yarn](https://classic.yarnpkg.com/en/docs/install/) and [Git](https://git-scm.com/downloads)

> clone/fork Tip.party:

```bash
git clone https://github.com/moonshotcollective/tip.party.git app
```

> install and start your 👷‍ Hardhat chain:

```bash
cd app
yarn install
yarn chain
```

Add .env in `packages/react-app/.env` with 
```
REACT_APP_PROVIDER=<PROVIDER>
REACT_APP_SERVER=<THE_SERVER_URL>
REACT_APP_NETWORK=<NETWORK>
REACT_APP_FIRE_API=<FIREBASE API KEY>
REACT_APP_FIRE_DOMAIN=<Firebase APP DOMAIN>
REACT_APP_FIRE_ID=<ID>
```

> in a second terminal window, start your 📱 frontend:

```bash
cd app
yarn start
```

📝 Edit and add your frontend address in `packages/hardhat/deploy/01_deploy_tokendistributor_contract.js`, `line 6`

> in a third terminal window, 🛰 deploy your contract:

```bash
cd app
yarn deploy
```

> start backend server

```bash
cd app/packages/backend
node index.js 
```


# 📚 Documentation

Documentation, tutorials, challenges, and many more resources, visit: [docs.scaffoldeth.io](https://docs.scaffoldeth.io)
