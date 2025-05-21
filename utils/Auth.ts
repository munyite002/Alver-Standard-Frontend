export const getAuthHeaders = () => {
    const token = localStorage.getItem("token");

    return `Bearer ${token}`;
};
