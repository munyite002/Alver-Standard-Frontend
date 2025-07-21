/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import axios from "axios";
// import { getAuthHeaders } from "../utils/Auth";

export async function login(data: { email: string; password: string }) {
    const response = await axios.post(
        //@ts-ignore
        `${import.meta.env.VITE_PUBLIC_STAGING_API}/users/login`,
        data
    );
    return response.data;
}

export async function updateUser(axiosInstance: any, data: any) {
    const response = await axiosInstance.patch(
        `${import.meta.env.VITE_PUBLIC_STAGING_API}/users/update/user`,
        data
    );

    return response;
}
export async function updatePassword(axiosInstance: any, data: any) {
    const response = await axiosInstance.patch(
        `${import.meta.env.VITE_PUBLIC_STAGING_API}/users/update/user/password`,
        data
    );

    return response;
}

export async function resendSms(axiosInstance: any, data: any) {
    const response = await axiosInstance.patch(
        `${import.meta.env.VITE_PUBLIC_STAGING_API}/users/resend/token/sms`,
        data
    );

    return response;
}
