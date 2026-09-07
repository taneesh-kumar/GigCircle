import api from './client';
import type { Payment, PaymentRequest } from '@/types/payment';

export const initiatePaymentApi = async (request: PaymentRequest): Promise<Payment> => {
  const response = await api.post<Payment>('/customer/payments', request);
  return response.data;
};

export const getPaymentStatusApi = async (paymentId: number): Promise<Payment> => {
  const response = await api.get<Payment>(`/customer/payments/${paymentId}/status`);
  return response.data;
};

export const getCustomerPaymentsApi = async (): Promise<Payment[]> => {
  const response = await api.get<Payment[]>('/customer/payments');
  return response.data;
};

export const getPaymentByJobApi = async (jobId: number): Promise<Payment> => {
  const response = await api.get<Payment>(`/customer/payments/job/${jobId}`);
  return response.data;
};

export const getPaymentByIdApi = async (paymentId: number): Promise<Payment> => {
  const response = await api.get<Payment>(`/customer/payments/${paymentId}`);
  return response.data;
};
