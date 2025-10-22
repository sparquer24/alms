"use client";

import { createContext, useContext, useState, ReactNode } from "react";

// Define the shape of the user object
interface User {
  id: number;
  name: string;
  role: string;
}

// Define the context type
interface UserContextType {
  user: User;
  setUser: (user: User) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Provider component
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User>({ id: 1, name: "Admin", role: "ADMIN" }); // Default user

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

// Hook to use the UserContext
export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUserContext must be used within a UserProvider");
  }
  return context;
};
