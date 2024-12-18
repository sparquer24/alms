import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface User {
    role: string,
    username: string
}
const initialState: User = {
    role: '',
    username: ''
}

const userSlice =  createSlice({
    name: 'user',
    initialState,
    reducers:{
        setUser(state, action: PayloadAction<User>){
            state.role = action.payload.role;
            state.username = action.payload.username;
        }
    }
});

export const { setUser } = userSlice.actions;
export default userSlice.reducer;