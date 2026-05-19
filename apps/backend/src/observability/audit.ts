type AuditLevel = "info" | "warn" | "error";

type AuditEvent = {
  event: string;
  level?: AuditLevel;
  requestId?: string;
  userId?: string | null;
  route?: string;
  method?: string;
  statusCode?: number;
  durationMs?: number;
  jobId?: number;
  jobType?: string;
  itemCount?: number;
  details?: Record<string, number | string | boolean | null | undefined>;
};

export function writeAuditEvent({
  event,
  level = "info",
  requestId,
  userId,
  route,
  method,
  statusCode,
  durationMs,
  jobId,
  jobType,
  itemCount,
  details,
}: AuditEvent): void {
  const payload = {
    ts: new Date().toISOString(),
    level,
    event,
    requestId: requestId ?? null,
    userId: userId ?? null,
    route: route ?? null,
    method: method ?? null,
    statusCode: statusCode ?? null,
    durationMs: typeof durationMs === "number" ? Math.round(durationMs) : null,
    jobId: jobId ?? null,
    jobType: jobType ?? null,
    itemCount: itemCount ?? null,
    details: details ?? null,
  };

  const sink =
    level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  sink("[audit]", JSON.stringify(payload));
}
