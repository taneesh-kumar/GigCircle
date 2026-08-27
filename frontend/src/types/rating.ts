export interface Rating {
  id: number;
  jobId: number;
  customerId: number;
  customerName: string;
  workerId: number;
  workerName: string;
  score: number;
  review?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRatingInput {
  score: number;
  review?: string;
}

export interface WorkerRatingSummary {
  workerId: number;
  averageRating: number;
  totalRatings: number;
}
