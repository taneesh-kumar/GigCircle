import apiClient from './client';
import type {
  PaymentSummary,
  CreatePaymentRequest,
  PaymentResponse,
  AdminPaymentSummary,
} from '@/types/payment';

export async function getPaymentSummaryApi(jobId: number): Promise<PaymentSummary> {
  const response = await apiClient.get<PaymentSummary>(`/customer/payments/summary/${jobId}`);
  return response.data;
}

export async function processPaymentApi(data: CreatePaymentRequest): Promise<PaymentResponse> {
  const response = await apiClient.post<PaymentResponse>('/customer/payments/process', data);
  return response.data;
}

export async function getCustomerPaymentsApi(): Promise<PaymentResponse[]> {
  const response = await apiClient.get<PaymentResponse[]>('/customer/payments');
  return response.data;
}

export async function getCustomerPaymentDetailApi(id: number): Promise<PaymentResponse> {
  const response = await apiClient.get<PaymentResponse>(`/customer/payments/${id}`);
  return response.data;
}

export async function cancelPaymentApi(id: number): Promise<PaymentResponse> {
  const response = await apiClient.post<PaymentResponse>(`/customer/payments/${id}/cancel`);
  return response.data;
}

export async function refundPaymentApi(id: number): Promise<PaymentResponse> {
  const response = await apiClient.post<PaymentResponse>(`/customer/payments/${id}/refund`);
  return response.data;
}

export async function getAdminPaymentsApi(): Promise<PaymentResponse[]> {
  const response = await apiClient.get<PaymentResponse[]>('/admin/payments');
  return response.data;
}

export async function getAdminPaymentSummaryApi(): Promise<AdminPaymentSummary> {
  const response = await apiClient.get<AdminPaymentSummary>('/admin/payments/summary');
  return response.data;
}
