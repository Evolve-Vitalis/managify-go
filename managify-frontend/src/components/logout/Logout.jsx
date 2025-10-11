import { useContext, useEffect } from "react";
import { AuthContext } from "../../content/AuthContent";

export default function Logout() {
    const { logout } = useContext(AuthContext);

    useEffect(() => {
        logout();
    }, [logout]);

    return null;
}