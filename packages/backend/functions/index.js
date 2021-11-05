// const functions = require("firebase-functions");
const handlers = require("./handlers");
const admin = require("firebase-admin");

admin.initializeApp();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

exports.signRoom = handlers.signRoom;
exports.addRoomTx = handlers.addRoomTx;
exports.addAddress = handlers.addAddress;
