/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */

import axios from "axios";

import { useNavigate } from "react-router-dom";

//@ts-ignore
import { useGlobalContext } from "@/../context/GlobalContext.jsx";

const useAxiosWithAuth = (url: any) => {
    const { logout } = useGlobalContext();

    const navigate = useNavigate();

    const axiosInstance = axios.create({
        baseURL: url
    });

    // Add request interceptor to include token
    axiosInstance.interceptors.request.use(
        (config) => {
            const token = localStorage.getItem("token");
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error) => Promise.reject(error)
    );

    // Add response interceptor to handle token expiration
    axiosInstance.interceptors.response.use(
        (response) => response,
        async (error) => {
            const originalRequest = error.config;
            if (error.response?.status === 401 && !originalRequest._retry) {
                // console.log("Token expired. Refreshing token...");
                originalRequest._retry = true;
                const refreshToken = localStorage.getItem("refreshToken");
                const token = localStorage.getItem("token");

                if (refreshToken) {
                    try {
                        const response = await axios.post(
                            `${
                                import.meta.env.VITE_STAGING_API
                            }/auth/refresh/token`,
                            {
                                refreshToken: refreshToken,
                                token: token
                            }
                        );
                        const res = await response.data;
                        const newAccessToken = res.token;
                        const newRefreshToken = res.refreshToken;
                        localStorage.setItem("accessToken", newAccessToken);
                        localStorage.setItem("refreshToken", newRefreshToken);
                        return axiosInstance(originalRequest);
                    } catch (error) {
                        console.error("Error refreshing token:", error);
                        logout();
                        navigate("/login");
                    }
                } else {
                    // Token is invalid or expired
                    logout();
                    navigate("/login");
                }
            }
            return Promise.reject(error);
        }
    );

    return axiosInstance;
};

export default useAxiosWithAuth;
