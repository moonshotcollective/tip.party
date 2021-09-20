# Tip.party

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
REACT_APP_SERVER=<THE_SERVER_URL>
REACT_APP_NETWORK=<NETWORK>
REACT_APP_FIRE_API=<FIREBASE API KEY>
REACT_APP_FIRE_DOMAIN=<Firebase App Domain>
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
