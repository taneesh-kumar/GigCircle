import { ServiceCategory } from './service-request';

export type PaymentMethod = 'UPI' | 'CARD' | 'CASH';

export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'REFUNDED';

export interface PaymentSummary {
  jobId: number;
  serviceCategory: ServiceCategory;
  serviceDescription: string;
  workerName?: string;
  serviceAmount: number;
  platformFee: number;
  feePercentage: number;
  totalAmount: number;
  currency: string;
  isAlreadyPaid: boolean;
  existingPaymentStatus?: PaymentStatus;
  existingTransactionReference?: string;
}

export interface CreatePaymentRequest {
  jobId: number;
  paymentMethod: PaymentMethod;
  upiId?: string;
  cardNumber?: string;
  cardExpiry?: string;
  cardCvv?: string;
}

export interface PaymentResponse {
  id: number;
  jobId: number;
  serviceCategory: ServiceCategory;
  serviceDescription: string;
  customerId: number;
  customerName: string;
  workerId?: number;
  workerName?: string;
  serviceAmount: number;
  platformFee: number;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  paymentMethodDetails?: string;
  status: PaymentStatus;
  transactionReference: string;
  paidAt?: string;
  failureReason?: string;
  refundAmount?: number;
  refundedAt?: string;
  createdAt: string;
}

export interface AdminPaymentSummary {
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  refundedTransactions: number;
  totalSimulatedVolume: number;
  totalSimulatedPlatformFees: number;
}
