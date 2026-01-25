import { logger } from './logger';

export interface PerformanceMetrics {
  startTime: number;
  operations: {
    name: string;
    duration: number;
    metadata?: any;
  }[];
}

export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private operationTimers: Map<string, number> = new Map();

  /**
   * Start tracking a request
   */
  startRequest(requestId: string): void {
    this.metrics.set(requestId, {
      startTime: Date.now(),
      operations: []
    });
  }

  /**
   * Start timing an operation
   */
  startOperation(requestId: string, operationName: string): void {
    const timerKey = `${requestId}:${operationName}`;
    this.operationTimers.set(timerKey, Date.now());
  }

  /**
   * End timing an operation
   */
  endOperation(requestId: string, operationName: string, metadata?: any): number {
    const timerKey = `${requestId}:${operationName}`;
    const startTime = this.operationTimers.get(timerKey);

    if (!startTime) {
      return 0;
    }

    const duration = Date.now() - startTime;
    this.operationTimers.delete(timerKey);

    const metrics = this.metrics.get(requestId);
    if (metrics) {
      metrics.operations.push({
        name: operationName,
        duration,
        metadata
      });
    }

    // Warn about slow operations
    if (duration > 100) {
      logger.log(`  ⚠️  Slow operation: ${operationName} took ${duration}ms`);
    }

    return duration;
  }

  /**
   * Finish tracking a request and return metrics
   */
  endRequest(requestId: string): {
    totalDuration: number;
    operations: { name: string; duration: number; metadata?: any }[];
    breakdown: string;
  } | null {
    const metrics = this.metrics.get(requestId);
    if (!metrics) {
      return null;
    }

    const totalDuration = Date.now() - metrics.startTime;
    this.metrics.delete(requestId);

    // Create a breakdown string
    const breakdown = metrics.operations
      .map(op => `${op.name}=${op.duration}ms`)
      .join(', ');

    return {
      totalDuration,
      operations: metrics.operations,
      breakdown
    };
  }

  /**
   * Helper to time an async function
   */
  async timeAsync<T>(
    requestId: string,
    operationName: string,
    fn: () => Promise<T>,
    metadata?: any
  ): Promise<T> {
    this.startOperation(requestId, operationName);
    try {
      const result = await fn();
      this.endOperation(requestId, operationName, metadata);
      return result;
    } catch (error) {
      this.endOperation(requestId, operationName, { ...metadata, error: true });
      throw error;
    }
  }

  /**
   * Helper to time a sync function
   */
  time<T>(
    requestId: string,
    operationName: string,
    fn: () => T,
    metadata?: any
  ): T {
    this.startOperation(requestId, operationName);
    try {
      const result = fn();
      this.endOperation(requestId, operationName, metadata);
      return result;
    } catch (error) {
      this.endOperation(requestId, operationName, { ...metadata, error: true });
      throw error;
    }
  }

  /**
   * Clean up old metrics (prevent memory leak)
   */
  cleanup(): void {
    const now = Date.now();
    const maxAge = 60000; // 1 minute

    for (const [requestId, metrics] of this.metrics) {
      if (now - metrics.startTime > maxAge) {
        this.metrics.delete(requestId);
      }
    }
  }
}

// Singleton instance
export const perfMonitor = new PerformanceMonitor();

// Clean up old metrics every minute
setInterval(() => {
  perfMonitor.cleanup();
}, 60000);
