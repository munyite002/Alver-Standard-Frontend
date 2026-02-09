import { Navigate, Outlet, useOutletContext } from "react-router-dom";

interface RoleRouteProps {
    allowedRoles: string[];
}

const RoleRoute = ({ allowedRoles }: RoleRouteProps) => {
    const context = useOutletContext();
    const user = localStorage.getItem("user")
        ? JSON.parse(localStorage.getItem("user") as string)
        : null;

    if (!user || !allowedRoles.includes(user.role)) {
        return <Navigate to="/403" />;
    }

    return <Outlet context={context} />;
};

export default RoleRoute;
