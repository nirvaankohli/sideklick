type CounterMap = Map<string, number>;
type DurationStat = {
  count: number;
  totalMs: number;
  maxMs: number;
};

const counters: CounterMap = new Map();
const durations = new Map<string, DurationStat>();

function makeMetricKey(namespace: string, name: string): string {
  return `${namespace}:${name}`;
}

export function incrementMetric(
  namespace: string,
  name: string,
  amount = 1,
): number {
  const key = makeMetricKey(namespace, name);
  const nextValue = (counters.get(key) ?? 0) + amount;
  counters.set(key, nextValue);
  return nextValue;
}

export function recordDurationMetric(
  namespace: string,
  name: string,
  durationMs: number,
): DurationStat {
  const key = makeMetricKey(namespace, name);
  const existing = durations.get(key) ?? {
    count: 0,
    totalMs: 0,
    maxMs: 0,
  };
  const nextValue = {
    count: existing.count + 1,
    totalMs: existing.totalMs + durationMs,
    maxMs: Math.max(existing.maxMs, durationMs),
  };
  durations.set(key, nextValue);
  return nextValue;
}

export function getMetricsSnapshot() {
  return {
    counters: Object.fromEntries(counters.entries()),
    durations: Object.fromEntries(
      [...durations.entries()].map(([key, value]) => [
        key,
        {
          ...value,
          averageMs:
            value.count > 0 ? Number((value.totalMs / value.count).toFixed(2)) : 0,
        },
      ]),
    ),
  };
}

export function resetMetrics(): void {
  counters.clear();
  durations.clear();
}
