/**
 * Request deduplication utility to prevent multiple identical API calls
 */

type RequestKey = string;
type PendingRequest<T> = Promise<T>;

class RequestDeduplicator {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private pendingRequests: Map<RequestKey, PendingRequest<any>> = new Map();

  /**
   * Execute a request with deduplication
   * If an identical request is already in-flight, return the existing promise
   */
  async deduplicate<T>(
    key: RequestKey,
    requestFn: () => Promise<T>
  ): Promise<T> {
    // Check if request is already in-flight
    const existing = this.pendingRequests.get(key);
    if (existing) {
      return existing;
    }

    // Create new request promise
    const promise = requestFn()
      .finally(() => {
        // Clean up after request completes
        this.pendingRequests.delete(key);
      });

    // Store promise for deduplication
    this.pendingRequests.set(key, promise);

    return promise;
  }

  /**
   * Clear all pending requests
   */
  clear(): void {
    this.pendingRequests.clear();
  }

  /**
   * Get number of pending requests
   */
  get size(): number {
    return this.pendingRequests.size;
  }
}

// Export singleton instance
export const requestDeduplicator = new RequestDeduplicator();

/**
 * Create a request key for deduplication
 */
export function createRequestKey(
  endpoint: string,
  params: Record<string, unknown>
): string {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc, key) => {
      if (params[key] !== undefined && params[key] !== null) {
        acc[key] = params[key];
      }
      return acc;
    }, {} as Record<string, unknown>);

  return `${endpoint}:${JSON.stringify(sortedParams)}`;
}
