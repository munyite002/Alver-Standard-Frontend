/* eslint-disable @typescript-eslint/ban-ts-comment */
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// @ts-ignore
import { GlobalProvider } from "../context/GlobalContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.js";
import LoginPage from "./pages/login.js";
import RootLayout from "./pages/layout.js";
import { DashboardPage } from "@/pages/Dashboard";
import { SettingsPage } from "@/pages/Settings.js";
import Meters from "@/pages/Meters";
import Logs from "@/pages/Logs.js";
import { ReportsPage } from "@/pages/Reports";
// import Configurations from "./pages/Configurations.js";
import Unauthorized from "@/pages/Unauthorized.js";
import NotFound from "@/pages/NotFound.js";
import { ForgotPasswordPage } from "./pages/ForgotPassword.js";
import { ResetPasswordPage } from "./pages/ResetPassword.js";
import "./App.css";

function App() {
    return (
        <Router>
            <GlobalProvider>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route
                        path="/forgot-password"
                        element={<ForgotPasswordPage />}
                    />
                    <Route
                        path="/reset-password"
                        element={<ResetPasswordPage />}
                    />

                    {/* Protected Routes */}
                    <Route element={<ProtectedRoute />}>
                        <Route element={<RootLayout />}>
                            <Route path="/" element={<DashboardPage />} />
                            <Route
                                path="/dashboard"
                                element={<DashboardPage />}
                            />
                            <Route path="/meters" element={<Meters />} />
                            <Route path="/reports" element={<ReportsPage />} />
                            <Route path="/logs" element={<Logs />} />
                            <Route path="/settings" element={<SettingsPage />} />
                            {/* <Route
                                path="/configurations"
                                element={<Configurations />}
                            /> */}
                        </Route>
                    </Route>

                    {/* Forbidden & Not Found Routes */}
                    <Route path="/403" element={<Unauthorized />} />
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </GlobalProvider>
        </Router>
    );
}

export default App;
