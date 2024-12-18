import { createSlice } from '@reduxjs/toolkit';

interface IndentState {
    globalIndexPopup: boolean;
}

const initialState: IndentState = {
    globalIndexPopup: false,
}

const indentSlice = createSlice({
    name: 'indent',
    initialState,
    reducers: {
        createIndent(state) {
          state.globalIndexPopup = true;
        },
        closeIndent(state) {
          state.globalIndexPopup = false;
        },
      },
});

export const { createIndent, closeIndent } = indentSlice.actions;
export default indentSlice.reducer;