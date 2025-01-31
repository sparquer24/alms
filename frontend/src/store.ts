import { configureStore } from '@reduxjs/toolkit';



const store = configureStore({
    reducer: {
      
    },
});

// Export types for use in the application
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;