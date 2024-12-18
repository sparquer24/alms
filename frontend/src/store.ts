import { configureStore } from '@reduxjs/toolkit';
import indentReducer from './features/indents/indentSlice';
import userReducer from './features/user/userSlice'

const store = configureStore({
    reducer: {
      indent: indentReducer,
      user: userReducer
    },
});

// Export types for use in the application
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;