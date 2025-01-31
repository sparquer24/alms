import React from "react";
import { Navigate } from "react-router-dom";
import jsCookie from "js-cookie";

interface RoleWrapperProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

const RoleWrapper: React.FC<RoleWrapperProps> = ({ allowedRoles, children }) => {
  const user = jsCookie.get("user") ? JSON.parse(jsCookie.get("user") as string) : null;
  const userRole = user ? user["cognito:groups"]?.[0] : null;

  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/notfound" replace />;
  }

  return <>{children}</>;
};

export default RoleWrapper;
