import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import adminUserReducer from './slices/adminUserSlice';
import adminAuditReducer from './slices/adminAuditSlice';
import adminRoleReducer from './slices/adminRoleSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    adminUsers: adminUserReducer,
    adminAudit: adminAuditReducer,
    adminRoles: adminRoleReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;