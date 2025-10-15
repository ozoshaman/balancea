// src/hooks/useAuth.js
import { useSelector, useDispatch } from 'react-redux';
import { registerUser, loginUser, logout, clearError } from '../store/slices/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, token, isAuthenticated, isLoading, error } = useSelector(
    (state) => state.auth
  );

  const register = async (userData) => {
    return dispatch(registerUser(userData)).unwrap();
  };

  const login = async (credentials) => {
    return dispatch(loginUser(credentials)).unwrap();
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  const clearAuthError = () => {
    dispatch(clearError());
  };

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    register,
    login,
    logout: handleLogout,
    clearError: clearAuthError,
  };
};