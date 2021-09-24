import { useReducer } from "react";
import { ethers } from "ethers";
import { ERC20ABI } from "../constants";

function reducer(state, { type, data }) {
  switch (type) {
    case "loadContract":
      return {
        readContracts: { ...state.readContracts, ...data.readContracts },
        writeContracts: { ...state.writeContracts, ...data.writeContracts },
      };
    default:
      return state;
  }
}

function TokenImport(provider, signer) {
  const [contracts, dispatch] = useReducer(reducer, {
    readContracts: {},
    writeContracts: {},
  });

  const loadContracts = data => {
    dispatch({ type: "loadContract", data });
  };

  const addContract = async tokenAddress => {
    const readUpdate = new ethers.Contract(tokenAddress, ERC20ABI, provider);
    const writeUpdate = new ethers.Contract(tokenAddress, ERC20ABI, signer);

    const symbol = await readUpdate.symbol();

    const data = { readContracts: { [symbol]: readUpdate }, writeContracts: { [symbol]: writeUpdate } };
    loadContracts(data);

    return symbol;
  };

  return [contracts, addContract, loadContracts];
}

export default TokenImport;
