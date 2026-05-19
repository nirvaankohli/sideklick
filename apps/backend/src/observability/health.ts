import { getMetricsSnapshot } from "./metrics";

export function buildHealthSnapshot(input: {
  protocol: "http" | "https";
  authMode: "jwt";
  dbDriver: "sqlite" | "postgres";
}) {
  return {
    ok: true,
    protocol: input.protocol,
    authMode: input.authMode,
    dbDriver: input.dbDriver,
    metrics: getMetricsSnapshot(),
  };
}
