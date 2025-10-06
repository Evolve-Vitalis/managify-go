import { useContext, useEffect } from "react";
import { AuthContext } from "../../content/AuthContent";
import { useNavigate } from "react-router-dom";

export default function Logout() {
    const { setToken } = useContext(AuthContext); 
    const navigate = useNavigate();

    useEffect(() => {
   
        localStorage.removeItem("token");
        if (setToken) setToken(null);

      
        navigate("/login", { replace: true });
    }, []);

    return null; 
}
