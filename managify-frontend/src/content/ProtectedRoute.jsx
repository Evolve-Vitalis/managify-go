import { Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "./AuthContent";

export default function ProtectedRoute({ children }) {
  const { token, loading } = useContext(AuthContext);
  

  console.log("Protected Route Token " + token)
  if (loading) {
    return <div>Loading...</div>; 
  }
  
  return token ? children : <Navigate to="/login" replace />;
}