import { useSelector } from 'react-redux';
import {
  selectCurrentUser,
  selectIsAuthenticated,
  selectAuthToken,
  selectAuthLoading,
  selectAuthInitialized,
} from '../store/slices/authSlice';

export const useAuth = () => {
  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const token = useSelector(selectAuthToken);
  const isLoading = useSelector(selectAuthLoading);
  const initialized = useSelector(selectAuthInitialized);

  const userRole = user?.role?.toUpperCase() ?? undefined;
  const userName = user?.name ?? user?.username ?? null;
  const userId = user?.id ?? null;

  return {
    user,
    userRole,
    userName,
    userId,
    token,
    isAuthenticated,
    isLoading,
    initialized,
  };
};