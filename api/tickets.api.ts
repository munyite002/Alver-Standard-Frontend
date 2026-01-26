/* eslint-disable @typescript-eslint/no-explicit-any */
export const getAllTickets = async (axiosInstance: any, params = '') => {
    const response = await axiosInstance.get(`/tickets?${params}`);
    return response.data;
};

export const getTicketById = async (axiosInstance: any, ticketId: any) => {
    const response = await axiosInstance.get(`/tickets/${ticketId}`);
    return response.data;
};

export const getTicketStats = async (axiosInstance: any) => {
    const response = await axiosInstance.get('/tickets/stats');
    return response.data;
};

export const createTicket = async (axiosInstance: any, ticketData: any) => {
    const response = await axiosInstance.post('/tickets', ticketData);
    return response.data;
};

export const updateTicket = async (axiosInstance: any, ticketId: any, updateData: any) => {
    const response = await axiosInstance.put(`/tickets/${ticketId}`, updateData);
    return response.data;
};

export const updateTicketStatus = async (axiosInstance: any, ticketId: any, statusData: any) => {
    const response = await axiosInstance.patch(`/tickets/${ticketId}/status`, statusData);
    return response.data;
};

export const deleteTicket = async (axiosInstance: any, ticketId: any) => {
    const response = await axiosInstance.delete(`/tickets/${ticketId}`);
    return response.data;
};