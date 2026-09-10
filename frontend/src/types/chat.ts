export interface UserResponse {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: 'CUSTOMER' | 'WORKER' | 'ADMIN';
  createdAt: string;
}

export interface ChatConversationResponse {
  id: number;
  jobId: number;
  customer?: UserResponse;
  worker?: UserResponse;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessageRequest {
  messageText: string;
}

export interface ChatMessageResponse {
  id: number;
  conversationId: number;
  sender: UserResponse;
  messageText: string;
  read: boolean;
  readAt?: string;
  createdAt: string;
}
