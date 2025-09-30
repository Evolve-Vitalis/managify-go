import { Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "./AuthContent";

export default function PublicRoute({ children }) {
  const { token, loading } = useContext(AuthContext);
  
  
  if (loading) {
    return <div>Loading...</div>; 
  }

  return token ? <Navigate to="/dashboard" replace /> : children;
}