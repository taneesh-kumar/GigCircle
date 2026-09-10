import api from './client';
import type { Payment, PaymentRequest } from '@/types/payment';

export const initiatePaymentApi = async (request: PaymentRequest): Promise<Payment> => {
  const response = await api.post<Payment>('/payments/initiate', request);
  return response.data;
};

export const completePaymentApi = async (
  paymentId: number,
  paymentMethod: string,
  upiId?: string
): Promise<Payment> => {
  const response = await api.post<Payment>(`/payments/${paymentId}/complete`, {
    paymentMethod,
    upiId: upiId || undefined,
  });
  return response.data;
};

export const getCustomerPaymentsApi = async (): Promise<Payment[]> => {
  const response = await api.get<Payment[]>('/payments/customer');
  return response.data;
};

export const getPaymentByJobApi = async (jobId: number): Promise<Payment> => {
  const response = await api.get<Payment>(`/payments/job/${jobId}`);
  return response.data;
};

export const getPaymentByIdApi = async (paymentId: number): Promise<Payment> => {
  const response = await api.get<Payment>(`/payments/${paymentId}`);
  return response.data;
};

export const getAdminPaymentsApi = async (): Promise<Payment[]> => {
  const response = await api.get<Payment[]>('/admin/payments');
  return response.data;
};

export const getAdminPaymentSummaryApi = async (): Promise<any> => {
  const response = await api.get('/admin/payments/summary');
  return response.data;
};

export const refundPaymentApi = async (paymentId: number): Promise<Payment> => {
  const response = await api.post<Payment>(`/payments/${paymentId}/refund`);
  return response.data;
};
