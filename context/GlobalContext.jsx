import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const GlobalContext = createContext();

export const GlobalProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const navigate = useNavigate();

    // Initialize user from localStorage when the component mounts
    useEffect(() => {
        const userData = localStorage.getItem("user");
        if (userData) {
            setUser(JSON.parse(userData));
            setIsLoggedIn(true);
        }
    }, []);

    const logout = () => {
        setUser(null);
        localStorage.removeItem("user");
        setIsLoggedIn(false);
        localStorage.removeItem("token");
        navigate("/login");
    };

    return (
        <GlobalContext.Provider
            value={{ user, setUser, isLoggedIn, setIsLoggedIn, logout }}
        >
            {children}
        </GlobalContext.Provider>
    );
};

export const useGlobalContext = () => useContext(GlobalContext);
