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

module.exports = functions.https.onCall(async (data, context) => {
  const { provider, addresses } = data;

  // recover address from signature
  const recovered = ethers.utils.verifyMessage(room, signature).toLowerCase();

  // validate address
  if (!ethers.utils.isAddress(recovered)) {
    throw new functions.https.HttpsError("Invalid signer", "Please sign room with your wallet");
  }

  return { validAddresses };
});
