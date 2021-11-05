const functions = require("firebase-functions");
const admin = require("firebase-admin");

module.exports = functions.https.onCall((data, context) => {
  const { room, address } = data;

  // recover address from signature
  const recovered = address;

  // write the  address to storage
  admin
    .firestore()
    .doc(`rooms/${room}/signs/${recovered}`)
    .set({ user: recovered, signedAt: admin.firestore.FieldValue.serverTimestamp() });

  return { signedIn: true };
});
