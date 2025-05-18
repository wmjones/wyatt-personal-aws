import { useState, useCallback, useRef } from 'react';
import { apiClient, RequestOptions } from './client';

export interface UploadOptions extends Omit<RequestOptions, 'body'> {
  onProgress?: (progress: number) => void;
  metadata?: Record<string, unknown>;
}

export interface UploadResult {
  url: string;
  id: string;
  metadata?: Record<string, unknown>;
}

export class UploadService {
  private baseUrl: string;

  constructor(baseUrl = '/api/uploads') {
    this.baseUrl = baseUrl;
  }

  async uploadFile(
    file: File,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const { onProgress, metadata, ...requestOptions } = options;

    // Create form data
    const formData = new FormData();
    formData.append('file', file);

    // Add metadata if provided
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }

    // Create XMLHttpRequest for progress tracking
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Handle progress
      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            onProgress(progress);
          }
        });
      }

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const result = JSON.parse(xhr.responseText);
            resolve(result);
          } catch {
            reject(new Error('Failed to parse response'));
          }
        } else {
          reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      // Handle abort
      xhr.addEventListener('abort', () => {
        reject(new Error('Upload cancelled'));
      });

      // Set up the request
      xhr.open('POST', `${apiClient['baseUrl']}${this.baseUrl}`);

      // Set authorization header if available
      const headers = requestOptions.headers as Record<string, string>;
      const authToken = headers?.['Authorization'];
      if (authToken) {
        xhr.setRequestHeader('Authorization', authToken);
      }

      // Send the request
      xhr.send(formData);

      // Store xhr for cancellation
      if (requestOptions.cancelToken) {
        requestOptions.cancelToken.signal.addEventListener('abort', () => {
          xhr.abort();
        });
      }
    });
  }

  async uploadMultiple(
    files: File[],
    options: UploadOptions = {}
  ): Promise<UploadResult[]> {
    const { onProgress, ...uploadOptions } = options;

    const results: UploadResult[] = [];
    let totalProgress = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileProgress = (progress: number) => {
        // Calculate total progress
        const fileWeight = 100 / files.length;
        totalProgress = (i * fileWeight) + (progress * fileWeight / 100);
        onProgress?.(totalProgress);
      };

      const result = await this.uploadFile(file, {
        ...uploadOptions,
        onProgress: fileProgress,
      });

      results.push(result);
    }

    return results;
  }

  async deleteUpload(id: string): Promise<void> {
    return apiClient.delete(`${this.baseUrl}/${id}`);
  }

  async getUploadUrl(id: string): Promise<string> {
    const result = await apiClient.get<{ url: string }>(`${this.baseUrl}/${id}/url`);
    return result.url;
  }
}

// Export singleton instance
export const uploadService = new UploadService();

// Hook for file uploads
export function useFileUpload(options: UploadOptions = {}) {
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const upload = useCallback(async (file: File) => {
    try {
      setUploading(true);
      setError(null);
      setProgress(0);

      abortControllerRef.current = new AbortController();

      const result = await uploadService.uploadFile(file, {
        ...options,
        onProgress: setProgress,
        cancelToken: abortControllerRef.current,
      });

      return result;
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setUploading(false);
      abortControllerRef.current = null;
    }
  }, [options]);

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  return {
    upload,
    cancel,
    progress,
    uploading,
    error,
  };
}
