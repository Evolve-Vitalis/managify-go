import { createContext, useState, useEffect, useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const login = useCallback((newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    navigate('/login', { replace: true });
  }, [navigate]);

  function isTokenValid(token) {
    if (!token) return false;
    try {
      const decoded = jwtDecode(token);
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