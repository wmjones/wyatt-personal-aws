export interface Visualization {
  id: string;
  name: string;
  type: string;
  data: unknown;
  parameters: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  attributes?: Record<string, unknown>;
}

export interface Health {
  status: 'ok' | 'error';
  timestamp: string;
  version?: string;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}

export interface CreateVisualizationDto {
  name: string;
  type: string;
  data: unknown;
  parameters?: Record<string, unknown>;
}

export interface UpdateVisualizationDto {
  name?: string;
  type?: string;
  data?: unknown;
  parameters?: Record<string, unknown>;
}
