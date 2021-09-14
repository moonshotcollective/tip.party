const isValidAddress = (address = "") => {
  return address.length === 42 && address !== "0x0000000000000000000000000000000000000000";
};

export default {
  isValidAddress,
};
