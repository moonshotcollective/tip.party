const functions = require("firebase-functions");
const admin = require("firebase-admin");

module.exports = functions.https.onCall((data, context) => {
  const { room, hash, network } = data;

  // write the hash and network
  admin
    .firestore()
    .doc(`rooms/${room}/tx/${hash}`)
    .set({ hash, network, createdAt: admin.firestore.FieldValue.serverTimestamp() });

  return { signedIn: true };
});
