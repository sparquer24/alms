import { configureStore, combineReducers } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import adminUserReducer from './slices/adminUserSlice';
import adminAuditReducer from './slices/adminAuditSlice';
import adminRoleReducer from './slices/adminRoleSlice';

const appReducer = combineReducers({
  auth: authReducer,
  ui: uiReducer,
  adminUsers: adminUserReducer,
  adminAudit: adminAuditReducer,
  adminRoles: adminRoleReducer,
});

// Root reducer that resets state on auth/logout to ensure a clean app state on logout
const rootReducer = (state: any, action: any) => {
  if (action?.type === 'auth/logout') {
    state = undefined; // let reducers return their initial state
  }
  return appReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;