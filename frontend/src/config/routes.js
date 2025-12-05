// src/config/routes.js
import React, { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
const Login = lazy(() => import('../pages/Auth/Login'));
const Register = lazy(() => import('../pages/Auth/Register'));
const VerifyEmail = lazy(() => import('../pages/Auth/VerifyEmail'));
const ForgotPassword = lazy(() => import('../pages/Auth/ForgotPassword'));
const VerifyResetCode = lazy(() => import('../pages/Auth/VerifyResetCode'));
const ResetPassword = lazy(() => import('../pages/Auth/ResetPassword'));
const Dashboard = lazy(() => import('../pages/Dashboard/Dashboard'));
const TransactionsPage = lazy(() => import('../pages/Transactions/TransactionsPage'));
const ProtectedRoute = lazy(() => import('../components/common/ProtectedRoute'));

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/verify-email',
    element: <VerifyEmail />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPassword />,
  },
  {
    path: '/verify-reset-code',
    element: <VerifyResetCode />,
  },
  {
    path: '/reset-password',
    element: <ResetPassword />,
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/transactions',
    element: (
      <ProtectedRoute>
        <TransactionsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]);