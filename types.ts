
export interface EditSession {
  id: string;
  originalImage: string;
  currentImage: string;
  history: EditStep[];
}

export interface EditStep {
  id: string;
  prompt: string;
  imageUrl: string;
  timestamp: number;
}

export interface ApiResponse {
  imageUrl?: string;
  error?: string;
  message?: string;
}
