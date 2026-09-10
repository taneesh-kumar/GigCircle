export interface Invoice {
  id: number;
  invoiceNumber: string;
  jobId: number;
  customerId: number;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  workerId: number;
  workerName: string;
  workerEmail?: string;
  workerPhone?: string;
  serviceName: string;
  serviceDescription?: string;
  serviceCharge: number;
  platformFee: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  paymentStatus: string;
  paymentReference?: string;
  issuedAt: string;
  paidAt?: string;
  createdAt: string;
}
