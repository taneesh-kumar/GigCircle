export type PaymentMethod = 'PHONEPE';

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'INITIATED' | 'CANCELLED';

export interface Payment {
  id: number;
  jobId: number;
  serviceRequestId: number;
  customerId: number;
  customerName: string;
  workerId: number;
  workerName: string;
  earningId: number;
  amount: number;
  platformFee: number;
  workerEarning: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  transactionId: string;
  merchantOrderId?: string;
  phonepeTransactionId?: string;
  paymentInstrument?: string;
  redirectUrl?: string;
  createdAt: string;
  paidAt?: string;
}

export interface PaymentRequest {
  jobId: number;
}
