import { createContext, useContext } from "react";

export const AuthContext = createContext<any>(null);

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthContext.Provider");
  }
  return context;
};
