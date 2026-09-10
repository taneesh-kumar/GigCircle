import apiClient from './client';
import type { PaymentResponse, SimulatePaymentRequest } from '../../types/payment';

export const initiatePaymentApi = async (jobId: number): Promise<PaymentResponse> => {
  const response = await apiClient.post<PaymentResponse>(`/demo-payments/jobs/${jobId}/initiate`);
  return response.data;
};

export const simulatePaymentApi = async (jobId: number, data: SimulatePaymentRequest): Promise<PaymentResponse> => {
  const response = await apiClient.post<PaymentResponse>(`/demo-payments/jobs/${jobId}/simulate`, data);
  return response.data;
};

export const getPaymentForJobApi = async (jobId: number): Promise<PaymentResponse> => {
  const response = await apiClient.get<PaymentResponse>(`/demo-payments/jobs/${jobId}`);
  return response.data;
};
