import axios from 'axios';

export interface Meter {
  id: string;
  meterNumber: string;
  location: string;
  openingDeficit: number;
  createdAt: string;
  updatedAt: string;
}

export const createMeter = async (meterData: Omit<Meter, 'id' | 'createdAt' | 'updatedAt'>) => {
  const response = await axios.post(`${import.meta.env.VITE_PUBLIC_STAGING_API}/meters`, meterData);
  return response.data;
};

export const getAllMeters = async () => {
  const response = await axios.get(`${import.meta.env.VITE_PUBLIC_STAGING_API}/meters`);
  return response.data;
};

export const getMeterById = async (id: string) => {
  const response = await axios.get(`${import.meta.env.VITE_PUBLIC_STAGING_API}/meters/${id}`);
  return response.data;
};

export const updateMeter = async (id: string, meterData: Partial<Meter>) => {
  const response = await axios.put(`${import.meta.env.VITE_PUBLIC_STAGING_API}/meters/${id}`, meterData);
  return response.data;
};

export const deleteMeter = async (id: string) => {
  await axios.delete(`${import.meta.env.VITE_PUBLIC_STAGING_API}/meters/${id}`);
}; 