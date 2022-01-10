const functions = require("firebase-functions");
const admin = require("firebase-admin");
const ethers = require("ethers");

module.exports = functions.https.onCall((data, context) => {
  const { room, tokenAddress, tokenSymbol, network } = data;

  // recover address from signature
  const recovered = ethers.utils.verifyMessage(room, signature).toLowerCase();

  // validate address
  if (!ethers.utils.isAddress(recovered)) {
    throw new functions.https.HttpsError("Invalid signer", "Please sign room with your wallet");
  }

  // write the resulting address to storage
  admin
    .firestore()
    .doc(`rooms/${room}/tokens/${tokenAddress}`)
    .set({ tokenAddress, network, tokenSymbol, createdAt: admin.firestore.FieldValue.serverTimestamp() });

  return { signedIn: true };
});
