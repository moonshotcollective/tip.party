const functions = require("firebase-functions");
const ethers = require("ethers");

module.exports = functions.https.onCall(async (data, context) => {
  const { mainnetProviderUrl, addresses, importedAddresses } = data;

  const lookupAddress = async (provider, address) => {
    if (address && ethers.utils.isAddress(address)) {
      try {
        // Accuracy of reverse resolution is not enforced.
        // We then manually ensure that the reported ens name resolves to address
        const ens = await provider.lookupAddress(address);
        const ensSplit = ens && ens.split(".");
        const validEnsCheck = ensSplit && ensSplit[ensSplit.length - 1] === "eth";

        if (address && validEnsCheck) {
          console.log(ens);
          return true;
        }
        return false;
      } catch (e) {
        return false;
      }
    }
    return 0;
  };

  async function removeAddresses(providerUrl, addresses) {
    const temp = [];
    if (addresses && addresses.length > 0) {
      for (let index = 0; index < addresses.length; index++) {
        const element = addresses[index];
        const provider = new ethers.providers.StaticJsonRpcProvider(providerUrl, 1);
        let ens = await lookupAddress(provider, element);
        if (!ens) {
          temp.push(element);
        }
      }
    }
    return temp;
  }

  const addToblacklistAddresses = await removeAddresses(mainnetProviderUrl, addresses);
  const removeImportedAddresses = await removeAddresses(mainnetProviderUrl, importedAddresses);

  return { addToblacklistAddresses, removeImportedAddresses };
});
