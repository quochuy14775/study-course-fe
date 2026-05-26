import React from "react";
import { Navigate } from "react-router-dom";
import {useAuthStore} from "../stores/authStore";

interface Props {
    children: React.ReactNode;
    allowedRoles?: string[];
}

const ProtectedRoute: React.FC<Props> = ({ children, allowedRoles }) => {
    const user = useAuthStore((state) => state.user);

    // chưa login
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // check expire
    if (user.exp * 1000 < Date.now()) {
        return <Navigate to="/login" replace />;
    }

    // check role
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;