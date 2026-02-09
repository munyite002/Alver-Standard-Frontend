import { Navigate, Outlet, useOutletContext } from "react-router-dom";

const ProtectedRoute = () => {
    const context = useOutletContext();
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user")
        ? JSON.parse(localStorage.getItem("user") as string)
        : null;

    if (!token) {
        return <Navigate to="/login" />;
    }

    if (user?.role !== "admin" && user?.role !== "manager") {
        return <Navigate to="/403" />;
    }

    return <Outlet context={context} />;
};

export default ProtectedRoute;
