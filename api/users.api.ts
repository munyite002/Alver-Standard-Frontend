/* eslint-disable @typescript-eslint/ban-ts-comment */
import axios from "axios";

export async function login(data: { email: string; password: string }) {
    const response = await axios.post(
        //@ts-ignore
        `${import.meta.env.VITE_PUBLIC_STAGING_API}/users/login`,
        data
    );
    return response.data;
}
