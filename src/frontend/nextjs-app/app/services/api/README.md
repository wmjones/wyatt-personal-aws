# API Client Documentation

## Overview

This API client provides a robust and flexible way to interact with backend services. It includes features like automatic retry logic, request/response interceptors, error handling, request cancellation, and file upload support.

## Features

- **Automatic Authentication**: Integrates with AWS Cognito for JWT token management
- **Request/Response Interceptors**: Modify requests and responses globally
- **Retry Logic**: Automatic retry for transient failures with exponential backoff
- **Request Cancellation**: Cancel in-flight requests using AbortController
- **Type Safety**: Full TypeScript support with proper typing
- **Error Handling**: Comprehensive error handling and classification
- **File Uploads**: Upload files with progress tracking
- **Logging**: Built-in request/response logging for debugging

## Basic Usage

### Simple GET Request

```typescript
import { apiService } from '@/services/api';

// Get all visualizations
const visualizations = await apiService.getVisualizations();

// Get single visualization
const visualization = await apiService.getVisualization('123');
```

### POST Request with Data

```typescript
import { apiService } from '@/services/api';

const newVisualization = await apiService.createVisualization({
  name: 'My Chart',
  type: 'bar',
  data: { /* ... */ }
});
```

### Using the Raw Client

```typescript
import { apiClient } from '@/services/api';

// Custom endpoint
const result = await apiClient.get('/custom/endpoint');

// With options
const data = await apiClient.post('/api/data', payload, {
  timeout: 5000,
  retries: 2,
});
```

## Advanced Usage

### Request Cancellation

```typescript
import { apiClient } from '@/services/api';

const controller = new AbortController();

// Start request
const promise = apiClient.get('/api/data', {
  cancelToken: controller
});

// Cancel request
controller.abort();

try {
  await promise;
} catch (error) {
  if (error.message === 'Request was cancelled') {
    console.log('Request cancelled');
  }
}
```

### React Hook with Cancellation

```typescript
import { useApiRequest } from '@/hooks/useApiRequest';
import { apiService } from '@/services/api';

function MyComponent() {
  const { data, loading, error, execute, cancel } = useApiRequest(
    apiService.getVisualizations
  );

  useEffect(() => {
    execute();

    // Cancel on unmount
    return () => cancel();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return null;

  return <div>{/* Render data */}</div>;
}
```

### File Upload with Progress

```typescript
import { useFileUpload } from '@/services/api';

function UploadComponent() {
  const { upload, progress, uploading, error } = useFileUpload();

  const handleUpload = async (file: File) => {
    try {
      const result = await upload(file);
      console.log('Uploaded:', result.url);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  return (
    <div>
      <input type="file" onChange={(e) => handleUpload(e.target.files[0])} />
      {uploading && <progress value={progress} max={100} />}
      {error && <div>Error: {error.message}</div>}
    </div>
  );
}
```

## Error Handling

The API client provides comprehensive error handling with typed errors:

```typescript
import { handleApiError, isApiError } from '@/services/api';

try {
  const data = await apiService.getVisualization('123');
} catch (error) {
  if (isApiError(error)) {
    if (error.isNotFound()) {
      // Handle 404
    } else if (error.isValidationError()) {
      // Handle validation errors
      const errors = error.getValidationErrors();
    } else if (error.isServerError()) {
      // Handle server errors
    }
  }

  // Or use the helper
  await handleApiError(error, {
    showNotification: true,
    redirectToLogin: true
  });
}
```

## Interceptors

Add custom logic to all requests/responses:

```typescript
import { apiClient } from '@/services/api';

// Add custom header to all requests
apiClient.addRequestInterceptor({
  onRequest: (config) => {
    config.headers['X-App-Version'] = '1.0.0';
    return config;
  }
});

// Log all responses
apiClient.addResponseInterceptor({
  onResponse: (response) => {
    console.log('Response:', response.url, response.status);
    return response;
  },
  onResponseError: (error) => {
    console.error('Response error:', error);
    throw error;
  }
});
```

## Cached Services

Domain-specific services include built-in caching:

```typescript
import { visualizationService } from '@/services/visualizationService';

// Uses cache if available
const data = await visualizationService.getAll();

// Force refresh
const freshData = await visualizationService.getAll(true);

// Clear cache
visualizationService.clearCache();
```

## Configuration

The API client uses environment variables for configuration:

- `NEXT_PUBLIC_API_URL`: Base URL for API requests
- `NEXT_PUBLIC_AWS_REGION`: AWS region for Cognito
- `NEXT_PUBLIC_USER_POOL_ID`: Cognito User Pool ID
- `NEXT_PUBLIC_USER_POOL_CLIENT_ID`: Cognito Client ID

## Best Practices

1. **Use Domain Services**: Prefer `visualizationService` over raw `apiClient` for domain operations
2. **Handle Errors**: Always handle API errors appropriately
3. **Cancel Requests**: Cancel requests when components unmount
4. **Use Hooks**: Use provided hooks for React components
5. **Type Safety**: Leverage TypeScript types for better development experience

## Testing

The API client is fully testable with Jest:

```typescript
// Mock the API client
jest.mock('@/services/api');

// In your test
import { apiService } from '@/services/api';

const mockApiService = apiService as jest.Mocked<typeof apiService>;
mockApiService.getVisualizations.mockResolvedValue([/* mock data */]);
```
