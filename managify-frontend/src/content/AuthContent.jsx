import { createContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";




export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true); 



  const login = (newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };



  function isTokenValid(token) {
    if (!token) return false;
    try {
      const decoded = jwt_decode(token);
      return decoded.exp > Date.now() / 1000;
    } catch (err) {
      return false;
    }
  }

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken && isTokenValid(storedToken)) {
      setToken(storedToken);
    } else {
      localStorage.removeItem("token");
      setToken(null);
    }
    setLoading(false); 
  }, []);

  return (
    <AuthContext.Provider value={{ token, setToken, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}