const functions = require("firebase-functions");
const admin = require("firebase-admin");

module.exports = functions.https.onCall((data, context) => {
  const { room, hash, address } = data;

  // write the hash and network
  admin
    .firestore()
    .doc(`rooms/${room}/tx/${hash}/addresses/${address}`)
    .set({ addedAt: admin.firestore.FieldValue.serverTimestamp() });

  return { signedIn: true };
});
