declare module 'opossum' {
  interface CircuitBreakerOptions {
    errorThresholdPercentage?: number;
    resetTimeout?: number;
    rollingCountTimeout?: number;
    rollingCountBuckets?: number;
    timeout?: number;
    volumeThreshold?: number;
  }

  export default class CircuitBreaker<TArgs extends unknown[], TResult> {
    constructor(action: (...args: TArgs) => Promise<TResult> | TResult, options?: CircuitBreakerOptions);
    fire(...args: TArgs): Promise<TResult>;
  }
}
