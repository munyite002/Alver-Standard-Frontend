/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';

export interface Meter {
  id: string;
  meterNumber: string;
  location: string;
  openingDeficit: number;
  tariffId?: string;
  createdAt: string;
  updatedAt: string;
  make: any;
  email: string;
  SGC: any;
  TI: any;
  KRN: any;
  accountId?: string;
}

export const createMeter = async (axiosInstance: any, meterData: Omit<Meter, 'id' | 'createdAt' | 'updatedAt'>) => {
  const response = await axiosInstance.post(`/meters`, meterData);
  return response.data;
};

export const getAllMeters = async (axiosInstance: any, params?: any) => {
  const response = await axiosInstance.get(`/meters`, { params });
  return response.data;
};

export const getMeterById = async (id: string) => {
  const response = await axios.get(`${import.meta.env.VITE_PUBLIC_STAGING_API}/meters/${id}`);
  return response.data;
};

export const updateMeter = async (axiosInstance: any, id: string, meterData: Partial<Meter>) => {
  const response = await axiosInstance.put(`/meters/${id}`, meterData);
  return response.data;
};

export const deleteMeter = async (axiosInstance: any, id: string) => {
  await axiosInstance.delete(`/meters/${id}`);
}; 

export const generateTamperCode = async (axiosInstance: any, data: any) => {
  const response = await axiosInstance.post(`/meters/generate-tamper-code`, data);
  return response.data;
}

export const generateMeterCredit = async (axiosInstance: any, data: any) => {
  const response = await axiosInstance.post(`/meters/generate-credit`, data);
  return response.data;
};

