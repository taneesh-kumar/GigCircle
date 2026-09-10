export type PaymentMethod = 'DEMO_UPI' | 'DEMO_CARD' | 'DEMO_NETBANKING' | 'UPI' | 'CARD' | 'NETBANKING' | 'CASH';

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'INITIATED' | 'CANCELLED' | 'PAID' | 'REFUNDED';

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
  status?: PaymentStatus;
  refundAmount?: number;
  serviceCategory?: any;
  transactionId: string;
  transactionReference?: string;
  paymentMethodDetails?: string;
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

export type PaymentResponse = Payment;

export interface AdminPaymentSummary {
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  refundedTransactions: number;
  totalVolume: number;
  platformFees: number;
  totalSimulatedVolume?: number;
  totalSimulatedPlatformFees?: number;
}

