import apiClient from './client';
import { Invoice } from '../../types/invoice';

export const getInvoiceForJobApi = async (jobId: number): Promise<Invoice> => {
  const response = await apiClient.get<Invoice>(`/api/invoices/job/${jobId}`);
  return response.data;
};

export const generateInvoiceApi = async (jobId: number): Promise<Invoice> => {
  const response = await apiClient.post<Invoice>(`/api/invoices/job/${jobId}/generate`);
  return response.data;
};

export const getInvoiceByIdApi = async (invoiceId: number): Promise<Invoice> => {
  const response = await apiClient.get<Invoice>(`/api/invoices/${invoiceId}`);
  return response.data;
};

export const getMyInvoicesApi = async (): Promise<Invoice[]> => {
  const response = await apiClient.get<Invoice[]>(`/api/invoices/my-invoices`);
  return response.data;
};

export const getAdminInvoicesApi = async (): Promise<Invoice[]> => {
  const response = await apiClient.get<Invoice[]>(`/api/invoices/admin`);
  return response.data;
};
