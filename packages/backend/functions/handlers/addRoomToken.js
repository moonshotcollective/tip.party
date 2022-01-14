const functions = require("firebase-functions");
const admin = require("firebase-admin");
const ethers = require("ethers");

module.exports = functions.https.onCall((data, context) => {
  const { room, tokenAddress, tokenSymbol, network } = data;

  admin
    .firestore()
    .doc(`rooms/${room}/tokens/${tokenAddress}`)
    .set({ tokenAddress, network, tokenSymbol, createdAt: admin.firestore.FieldValue.serverTimestamp() });
});
