import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = () => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user")
        ? JSON.parse(localStorage.getItem("user") as string)
        : null;

    if (!token) {
        return <Navigate to="/login" />;
    }

    if (!user?.roles?.includes("admin")) {
        return <Navigate to="/403" />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
