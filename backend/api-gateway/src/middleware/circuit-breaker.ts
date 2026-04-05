import CircuitBreaker from 'opossum';

export interface CircuitBreakerEntry<TInput, TOutput> {
  breaker: CircuitBreaker<[TInput], TOutput>;
  lastKnownGood: TOutput | null;
}

/**
 * Creates a downstream circuit breaker with last-known-good response caching.
 */
export function createServiceCircuitBreaker<TInput, TOutput>(
  action: (input: TInput) => Promise<TOutput>,
): CircuitBreakerEntry<TInput, TOutput> {
  const entry: CircuitBreakerEntry<TInput, TOutput> = {
    breaker: new CircuitBreaker<[TInput], TOutput>(
      async (input: TInput) => {
        const result = await action(input);
        entry.lastKnownGood = result;
        return result;
      },
      {
        errorThresholdPercentage: 50,
        resetTimeout: 30_000,
        rollingCountTimeout: 30_000,
        rollingCountBuckets: 5,
        timeout: 10_000,
        volumeThreshold: 5,
      },
    ),
    lastKnownGood: null,
  };

  return entry;
}
