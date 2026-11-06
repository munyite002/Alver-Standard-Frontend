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
import Accounts from "@/pages/Accounts";
import Logs from "@/pages/Logs.js";
import { ReportsPage } from "@/pages/Reports";
import Tickets from "@/pages/Tickets.js"
import Users from "@/pages/Users";
import { PaymentQueuePage } from "@/pages/PaymentQueue";
import { SmsDeliveryReportsPage } from "@/pages/SmsDeliveryReports";
// import Configurations from "./pages/Configurations.js";
import Unauthorized from "@/pages/Unauthorized.js";
import NotFound from "@/pages/NotFound.js";
import { ForgotPasswordPage } from "./pages/ForgotPassword.js";
import { ResetPasswordPage } from "./pages/ResetPassword.js";
import RoleRoute from "./components/RoleRoute";
import { ThemeProvider } from "./lib/theme";
import "./App.css";

function App() {
    return (
        <ThemeProvider>
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
                            <Route path="/settings" element={<SettingsPage />} />

                            {/* Admin only routes */}
                            <Route element={<RoleRoute allowedRoles={["admin"]} />}>
                                <Route path="/logs" element={<Logs />} />
                                <Route path="/tickets" element={<Tickets />} />
                                <Route path="/accounts" element={<Accounts />} />
                                <Route path="/users" element={<Users />} />
                                <Route path="/queue" element={<PaymentQueuePage />} />
                                <Route path="/sms-delivery-reports" element={<SmsDeliveryReportsPage />} />
                            </Route>
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
        </ThemeProvider>
    );
}

export default App;
