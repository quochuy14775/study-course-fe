import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import {useAuthStore} from "../stores/authStore";

interface Props {
    children: React.ReactNode;
    allowedRoles?: string[];
}

const ProtectedRoute: React.FC<Props> = ({ children, allowedRoles }) => {
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const isExpired = !!user && user.exp * 1000 < Date.now();

    // token hết hạn -> clear store để navbar/notification không còn hiển thị dữ liệu cũ
    useEffect(() => {
        if (isExpired) {
            logout();
        }
    }, [isExpired, logout]);

    // chưa login hoặc token đã hết hạn
    if (!user || isExpired) {
        return <Navigate to="/login" replace />;
    }

    // check role
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;