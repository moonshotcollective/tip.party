const ethers = require("ethers");

module.exports = functions.https.onCall(async (data, context) => {
  const { provider, addresses, importedAddresses } = data;

  async function lookupAddress(provider, address) {
    if (address && ethers.utils.isAddress(address)) {
      try {
        // Accuracy of reverse resolution is not enforced.
        // We then manually ensure that the reported ens name resolves to address
        const reportedName = await provider.lookupAddress(address);

        const resolvedAddress = await provider.resolveName(reportedName);

        if (address && ethers.utils.getAddress(address) === ethers.utils.getAddress(resolvedAddress)) {
          return reportedName;
        }
        return utils.getAddress(address);
      } catch (e) {
        return utils.getAddress(address);
      }
    }
  }

  async function removeAddresses(provider, addresses) {
    const temp = [];
    for (const address in addresses) {
      await lookupAddress(provider, address).then(name => {
        const ensSplit = name && name.split(".");
        const validEnsCheck = ensSplit && ensSplit[ensSplit.length - 1] === "eth";
        if (!validEnsCheck) {
          temp.push(address);
        }
      });
    }
    return temp;
  }

  const addToblacklistAddresses = await removeAddresses(provider, addresses);
  const removeImportedAddresses = await removeAddresses(provider, importedAddresses);

  return { addToblacklistAddresses, removeImportedAddresses };
});
