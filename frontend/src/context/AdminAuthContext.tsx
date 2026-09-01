"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

type AdminAuthContextType = {
  isLoggedIn: boolean;
  login: (username: string, pin: string) => boolean;
  logout: () => void;
};

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const login = (username: string, pin: string) => {
    if (username === "admin" && pin === "1234") {
      setIsLoggedIn(true);
      return true;
    }
    return false;
  };

  const logout = () => setIsLoggedIn(false);

  return (
    <AdminAuthContext.Provider value={{ isLoggedIn, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
};
