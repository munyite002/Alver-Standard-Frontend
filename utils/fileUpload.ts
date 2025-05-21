/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";

export async function fileToBase64(file: any) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result;
            if (result) {
                if (typeof result === "string") {
                    resolve(result.split(",")[1]); // Extract only the Base64 string
                } else {
                    reject(new Error("FileReader result is not a string"));
                }
            } else {
                reject(new Error("FileReader result is null"));
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file); // Converts file to Base64 string
    });
}

export async function saveImage(imgStr: any) {
    const url = "https://bucket.ndai.africa/single_image.php";

    try {
        const formData = new FormData();
        formData.append("image", "data:image/jpeg;base64," + imgStr);
        const response = await axios.post(url, formData, {
            headers: { "Content-Type": "multipart/form-data", Accept: "*/*" }
        });
        if (response.status === 200) {
            const jsonResponse = await response.data;
            return jsonResponse.url; // Assuming url is a property in the response
        } else {
            console.error(
                "Failed to upload image:",
                response.status,
                response.statusText
            );
            return "";
        }
    } catch (error) {
        console.error("Error during image upload:", error);
        return "";
    }
}
