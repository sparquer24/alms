import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isInboxOpen: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleInbox(state) {
      state.isInboxOpen = !state.isInboxOpen;
    },
    closeInbox(state) {
      state.isInboxOpen = false;
    },
    openInbox(state) {
      state.isInboxOpen = true;
    },
  },
});

export const { toggleInbox, closeInbox, openInbox } = uiSlice.actions;
export default uiSlice.reducer;