import { Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "./AuthContent";

export default function PublicRoute({ children }) {
  const { token, loading } = useContext(AuthContext);
  
  if (loading) return <div>Loading...</div>; 

  if (token) return <Navigate to="/dashboard" replace />; 

  return children; 
}
