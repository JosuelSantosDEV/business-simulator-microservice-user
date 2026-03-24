export interface ApiError {
  statusCode: number;
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  meta: any | null;
  error: ApiError | null;
  timestamp: string;
}
