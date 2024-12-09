import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import DashboardPage from "../pages/DashboardPage";

const AppRoutes = () => {
    return (
        <Router>
            <Routes>
                {/* Redirect to /login by default */}
                <Route path="/" element={<Navigate to="/login" replace />} />

                {/* Login route */}
                <Route path="/login" element={<LoginPage />} />

                {/* Dashboard route */}
                <Route path="/dashboard" element={<DashboardPage />} />

                {/* Fallback for unmatched routes */}
                <Route path="*" element={<h1>404 - Page Not Found</h1>} />
            </Routes>
        </Router>
    );
};

export default AppRoutes;
