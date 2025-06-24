//AuthContext.tsx code
import { createContext, useContext } from "react";

export const AuthContext = createContext<any>(null);

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  console.log(context);
  if (!context) {
    throw new Error(
      "useAuthContext must be used within an AuthContext.Provider"
    );
  }
  return context;
};

// Default export for compatibility
export default AuthContext;
