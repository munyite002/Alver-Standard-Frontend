/* eslint-disable @typescript-eslint/no-explicit-any */
export const getAllTickets = async (axiosInstance: any, params = '') => {
    const response = await axiosInstance.get(`/v1/api/tickets?${params}`);
    return response.data;
};

export const getTicketById = async (axiosInstance: any, ticketId: any) => {
    const response = await axiosInstance.get(`/v1/api/tickets/${ticketId}`);
    return response.data;
};

export const getTicketStats = async (axiosInstance: any) => {
    const response = await axiosInstance.get('/v1/api/tickets/stats');
    return response.data;
};

export const createTicket = async (axiosInstance: any, ticketData: any) => {
    const response = await axiosInstance.post('/v1/api/tickets', ticketData);
    return response.data;
};

export const updateTicket = async (axiosInstance: any, ticketId: any, updateData: any) => {
    const response = await axiosInstance.put(`/v1/api/tickets/${ticketId}`, updateData);
    return response.data;
};

export const updateTicketStatus = async (axiosInstance: any, ticketId: any, statusData: any) => {
    const response = await axiosInstance.patch(`/v1/api/tickets/${ticketId}/status`, statusData);
    return response.data;
};

export const deleteTicket = async (axiosInstance: any, ticketId: any) => {
    const response = await axiosInstance.delete(`/v1/api/tickets/${ticketId}`);
    return response.data;
};