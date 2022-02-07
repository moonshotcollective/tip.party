const ethers = require("ethers");

async function lookupAddress(provider, address) {
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
}

const useLookupAddress = (provider, address) => {
  lookupAddress(provider, address).then(name => {
    if (name) {
      setEnsName(name);
    }
  });
  return ensName;
};

module.exports = functions.https.onCall(async (data, context) => {
  const { provider, addresses } = data;

  const validAddresses = [];

  for (const address in addresses) {
    const ens = useLookupAddress(provider, address);
    const ensSplit = ens && ens.split(".");
    const validEnsCheck = ensSplit && ensSplit[ensSplit.length - 1] === "eth";
    if (validEnsCheck) {
      validAddresses.push(address);
    }
  }

  return { validAddresses };
});
