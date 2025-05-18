import { ApiClient, ApiError } from '../client';

// Mock fetch
global.fetch = jest.fn();

describe('ApiClient', () => {
  let apiClient: ApiClient;

  beforeEach(() => {
    apiClient = new ApiClient('https://api.example.com');
    jest.clearAllMocks();
  });

  describe('request', () => {
    it('should make a successful GET request', async () => {
      const mockResponse = { data: 'test' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const result = await apiClient.get('/test');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new TypeError('Failed to fetch'));

      await expect(apiClient.get('/test')).rejects.toThrow(TypeError);
    });

    it('should handle API errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: async () => 'Not Found',
      });

      await expect(apiClient.get('/test')).rejects.toThrow(ApiError);
    });

    it('should retry on retryable errors', async () => {
      const mockError = new Error('Network error');

      // First two attempts fail, third succeeds
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(mockError)
        .mockRejectedValueOnce(mockError)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: 'success' }),
          headers: new Headers({ 'content-type': 'application/json' }),
        });

      const result = await apiClient.get('/test', { retries: 3 });

      expect(global.fetch).toHaveBeenCalledTimes(3);
      expect(result).toEqual({ data: 'success' });
    });

    it('should respect timeout', async () => {
      jest.useFakeTimers();

      // Mock fetch that never resolves
      (global.fetch as jest.Mock).mockImplementationOnce(
        () => new Promise(() => {})
      );

      const promise = apiClient.get('/test', { timeout: 1000 });

      jest.advanceTimersByTime(1001);

      await expect(promise).rejects.toThrow('Request timeout');

      jest.useRealTimers();
    });

    it('should support request cancellation', async () => {
      const abortController = new AbortController();

      (global.fetch as jest.Mock).mockImplementationOnce(() => {
        return Promise.reject(new DOMException('Aborted', 'AbortError'));
      });

      // Cancel immediately
      abortController.abort();

      await expect(
        apiClient.get('/test', { cancelToken: abortController })
      ).rejects.toThrow('Request was cancelled');
    });
  });

  describe('HTTP methods', () => {
    it('should make POST request with data', async () => {
      const mockData = { name: 'test' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, ...mockData }),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      const result = await apiClient.post('/test', mockData);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(mockData),
        })
      );
      expect(result).toEqual({ id: 1, ...mockData });
    });

    it('should make PUT request', async () => {
      const mockData = { name: 'updated' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      await apiClient.put('/test/1', mockData);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/test/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(mockData),
        })
      );
    });

    it('should make DELETE request', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: async () => '',
      });

      await apiClient.delete('/test/1');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/test/1',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('interceptors', () => {
    it('should run request interceptors', async () => {
      const requestInterceptor = jest.fn((config) => ({
        ...config,
        headers: { ...config.headers, 'X-Custom': 'test' },
      }));

      apiClient.addRequestInterceptor({ onRequest: requestInterceptor });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
        headers: new Headers({ 'content-type': 'application/json' }),
      });

      await apiClient.get('/test');

      expect(requestInterceptor).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Custom': 'test',
          }),
        })
      );
    });

    it('should run response interceptors', async () => {
      const responseInterceptor = jest.fn((response) => response);

      apiClient.addResponseInterceptor({ onResponse: responseInterceptor });

      const mockResponse = {
        ok: true,
        json: async () => ({ data: 'test' }),
        headers: new Headers({ 'content-type': 'application/json' }),
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      await apiClient.get('/test');

      expect(responseInterceptor).toHaveBeenCalledWith(mockResponse);
    });
  });
});
