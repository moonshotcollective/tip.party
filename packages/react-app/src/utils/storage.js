import { initializeApp } from "firebase/app";
import { collection, onSnapshot, getFirestore, query, where } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";

const app = initializeApp({
  apiKey: process.env.REACT_APP_FIRE_API,
  authDomain: process.env.REACT_APP_FIRE_DOMAIN,
  projectId: process.env.REACT_APP_FIRE_ID,
});

const db = getFirestore(app);
const functions = getFunctions(app);

const getCollection = (room, group) => {
  return collection(db, `rooms`, room, group);
};

const watchCollection = (coll, cb, id = true) => {
  return onSnapshot(coll, docs => {
    const res = [];
    docs.forEach(doc => res.push(id ? doc.id : doc.data()));
    cb && cb(res);
  });
};

export const watchRoom = (room, cb) => {
  return watchCollection(getCollection(room, "signs"), cb);
};

export const watchRoomTx = (room, network, cb) => {
  return watchCollection(query(getCollection(room, "tx"), where("network", "==", network)), cb);
};

export const signIntoRoom = async (room, signature) => {
  const signRoomFunction = httpsCallable(functions, "signRoom");

  return signRoomFunction({ room, signature });
};

export const registerTransactionForRoom = (room, hash, network) => {
  const addRoomTxFunction = httpsCallable(functions, "addRoomTx");

  return addRoomTxFunction({ room, hash, network });
};
