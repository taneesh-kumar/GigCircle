export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

export interface PaymentResponse {
  id: number;
  jobId: number;
  customerId: number;
  amount: number;
  status: PaymentStatus;
  transactionReference?: string | null;
  failureReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SimulatePaymentRequest {
  shouldSucceed: boolean;
  failureReason?: string;
}
