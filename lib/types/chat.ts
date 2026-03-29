export interface Message {
  id: string;
  content: string;
  createdAt: string | Date;
  user: {
    id: string;
    username: string;
  };
}

export interface ChatError {
  message: string;
  code?: string;
}
