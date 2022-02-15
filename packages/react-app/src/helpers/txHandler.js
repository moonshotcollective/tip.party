import axios from "axios";
import { NETWORK } from "../constants";

// fetch list of hashes that the user haven't confirmed

export default function fetchTransaction(chainId, blockNum, address) {
  const alchemyUrl = NETWORK(chainId).rpcUrl;

  //alchemy only can get internal transfers on mainnet
  const isMainnet = chainId === 1 ? true : false;

  var data = JSON.stringify({
    jsonrpc: "2.0",
    id: 0,
    method: "alchemy_getAssetTransfers",
    params: [
      {
        fromBlock: blockNum,
        toBlock: blockNum,
        toAddress: address,
        category: isMainnet ? ["token", "internal"] : ["token"],
      },
    ],
  });

  var config = {
    method: "post",
    url: alchemyUrl,
    headers: {
      "Content-Type": "application/json",
    },
    data: data,
  };

  return axios(config)
    .then(function (response) {
      console.log(JSON.stringify(response.data));
      return response.data.result.transfers;
    })
    .catch(function (error) {
      console.log(error);
    });
}

// loop through the hashes
