export default function appReducer(state, action) {
  switch (action.type) {
    case "SET_HOST":
      const updatedStatus = action.payload;
      return {
        ...state,
        isHost: updatedStatus,
      };

    default:
      return state;
  }
}
