const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

async function loadMemoryModule() {
  return import(
    pathToFileURL(path.join(__dirname, "..", "backend", "src", "services", "memory.ts")).href
  );
}

async function loadPrivacyModule() {
  return import(
    pathToFileURL(path.join(__dirname, "..", "backend", "src", "services", "privacy.ts")).href
  );
}

async function loadWorkerModule() {
  return import(
    pathToFileURL(path.join(__dirname, "..", "backend", "src", "workers", "index.ts")).href
  );
}

function createTestDatabase() {
  const tables = {
    users: [],
    privacy_settings: [],
    classes: [],
    sessions: [],
    interactions: [],
    gaps: [],
    gap_events: [],
    retention_jobs: [],
  };
  const idCounters = new Map();

  function nextId(tableName) {
    const nextValue = (idCounters.get(tableName) ?? 0) + 1;
    idCounters.set(tableName, nextValue);
    return nextValue;
  }

  function normalize(sql) {
    return sql.replace(/\s+/g, " ").trim().toLowerCase();
  }

  function nowString() {
    return "2026-05-07 12:00:00";
  }

  function clone(value) {
    if (value === undefined) {
      return undefined;
    }
    return JSON.parse(JSON.stringify(value));
  }

  function ensureUser(id) {
    const existing = tables.users.find((row) => row.id === id);
    if (existing) {
      existing.updated_at = nowString();
      return existing;
    }

    const row = {
      id,
      email: null,
      display_name: null,
      created_at: nowString(),
      updated_at: nowString(),
    };
    tables.users.push(row);
    return row;
  }

  function compareDesc(left, right, keys) {
    for (const key of keys) {
      if (left[key] < right[key]) {
        return 1;
      }
      if (left[key] > right[key]) {
        return -1;
      }
    }
    return 0;
  }

  const db = {
    tables,
    exec() {},
    transaction(fn) {
      return (...args) => fn(...args);
    },
    prepare(sql) {
      const normalized = normalize(sql);

      return {
        run(...args) {
          const value = args.length <= 1 ? args[0] : args;

          if (normalized.startsWith("insert into users")) {
            const userId = Array.isArray(value) ? value[0] : value.userId ?? value.id;
            ensureUser(userId);
            return { changes: 1, lastInsertRowid: 0 };
          }

          if (normalized.startsWith("insert into privacy_settings")) {
            const record = {
              user_id: value.userId,
              screenshot_policy: value.screenshotPolicy,
              local_only_mode: value.localOnlyMode,
              sync_consent: value.syncConsent,
              updated_at: nowString(),
            };
            const existing = tables.privacy_settings.find(
              (row) => row.user_id === value.userId,
            );
            if (existing) {
              Object.assign(existing, record);
            } else {
              tables.privacy_settings.push(record);
            }
            return { changes: 1, lastInsertRowid: 0 };
          }

          if (normalized.startsWith("insert into interactions")) {
            const interaction = Array.isArray(value)
              ? {
                  owner_user_id: value[0],
                  session_id: value[1],
                  class_id: value[2],
                  prompt: value[3],
                  response: value[4],
                  interaction_type: value[5],
                  request_payload: value[6],
                  response_payload: value[7],
                  built_context: value[8],
                  created_at: value[9],
                }
              : {
                  session_id: value.sessionId,
                  class_id: value.classId,
                  owner_user_id: value.ownerUserId,
                  prompt: value.prompt,
                  response: value.response,
                  interaction_type: value.interactionType,
                  request_payload: value.requestPayload,
                  response_payload: value.responsePayload,
                  built_context: value.builtContext,
                  created_at: nowString(),
                };
            const id = nextId("interactions");
            tables.interactions.push({
              id,
              ...interaction,
            });
            return { changes: 1, lastInsertRowid: id };
          }

          if (normalized.startsWith("insert into gaps")) {
            const id = nextId("gaps");
            tables.gaps.push({
              id,
              owner_user_id: value.ownerUserId,
              class_id: value.classId,
              topic: value.topic,
              description: value.description,
              status: "open",
              weight: value.weight,
              evidence_count: 1,
              last_seen_at: nowString(),
              created_at: nowString(),
              updated_at: nowString(),
            });
            return { changes: 1, lastInsertRowid: id };
          }

          if (normalized.startsWith("insert into gap_events")) {
            const id = nextId("gap_events");
            tables.gap_events.push({
              id,
              gap_id: value.gapId,
              interaction_id: value.interactionId,
              session_id: value.sessionId,
              evidence: value.evidence,
              confidence: value.confidence,
              created_at: nowString(),
            });
            return { changes: 1, lastInsertRowid: id };
          }

          if (normalized.startsWith("update sessions set screenshot_preview")) {
            const session = tables.sessions.find(
              (row) =>
                row.id === value.sessionId &&
                row.screenshot_preview == null &&
                row.ended_at == null,
            );
            if (session) {
              session.screenshot_preview = value.screenshotPreview;
              return { changes: 1, lastInsertRowid: 0 };
            }
            return { changes: 0, lastInsertRowid: 0 };
          }

          if (normalized.startsWith("insert into retention_jobs")) {
            const id = nextId("retention_jobs");
            tables.retention_jobs.push({
              id,
              user_id: value.userId ?? null,
              job_type: value.jobType,
              status: "pending",
              run_after: value.runAfter ?? nowString(),
              payload: value.payload ?? null,
              created_at: nowString(),
              updated_at: nowString(),
            });
            return { changes: 1, lastInsertRowid: id };
          }

          if (normalized.includes("update retention_jobs set status = 'running'")) {
            const row = tables.retention_jobs.find((job) => job.id === value);
            if (row) {
              row.status = "running";
              row.updated_at = nowString();
            }
            return { changes: row ? 1 : 0, lastInsertRowid: 0 };
          }

          if (normalized.includes("update retention_jobs set status = 'completed'")) {
            const row = tables.retention_jobs.find((job) => job.id === value);
            if (row) {
              row.status = "completed";
              row.updated_at = nowString();
            }
            return { changes: row ? 1 : 0, lastInsertRowid: 0 };
          }

          if (normalized.includes("update retention_jobs set status = 'failed'")) {
            const row = tables.retention_jobs.find((job) => job.id === value.jobId);
            if (row) {
              row.status = "failed";
              row.payload = JSON.stringify({
                ...(row.payload ? JSON.parse(row.payload) : {}),
                error: value.errorMessage,
              });
              row.updated_at = nowString();
            }
            return { changes: row ? 1 : 0, lastInsertRowid: 0 };
          }

          if (normalized.includes("update retention_jobs set payload = json_set")) {
            const row = tables.retention_jobs.find((job) => job.id === value.jobId);
            if (row) {
              const currentPayload = row.payload ? JSON.parse(row.payload) : {};
              currentPayload.result = JSON.parse(value.resultJson);
              row.payload = JSON.stringify(currentPayload);
              row.updated_at = nowString();
            }
            return { changes: row ? 1 : 0, lastInsertRowid: 0 };
          }

          if (normalized.startsWith("update interactions set request_payload")) {
            const row = tables.interactions.find((interaction) => interaction.id === value.id);
            if (row) {
              row.request_payload = value.requestPayload;
              row.response_payload = value.responsePayload;
              row.built_context = value.builtContext;
            }
            return { changes: row ? 1 : 0, lastInsertRowid: 0 };
          }

          if (normalized.startsWith("delete from gap_events")) {
            const [interactionOwnerId, gapOwnerId, sessionOwnerId] = args;
            const interactionIds = new Set(
              tables.interactions
                .filter((row) => row.owner_user_id === interactionOwnerId)
                .map((row) => row.id),
            );
            const gapIds = new Set(
              tables.gaps
                .filter((row) => row.owner_user_id === gapOwnerId)
                .map((row) => row.id),
            );
            const sessionIds = new Set(
              tables.sessions
                .filter((row) => row.owner_user_id === sessionOwnerId)
                .map((row) => row.id),
            );
            const nextRows = tables.gap_events.filter(
              (row) =>
                !interactionIds.has(row.interaction_id) &&
                !gapIds.has(row.gap_id) &&
                !sessionIds.has(row.session_id),
            );
            const changes = tables.gap_events.length - nextRows.length;
            tables.gap_events.splice(0, tables.gap_events.length, ...nextRows);
            return { changes, lastInsertRowid: 0 };
          }

          if (normalized.startsWith("delete from interactions where owner_user_id =")) {
            const ownerId = Array.isArray(value) ? value[0] : value;
            const nextRows = tables.interactions.filter(
              (row) => row.owner_user_id !== ownerId,
            );
            const changes = tables.interactions.length - nextRows.length;
            tables.interactions.splice(0, tables.interactions.length, ...nextRows);
            return { changes, lastInsertRowid: 0 };
          }

          if (normalized.startsWith("delete from sessions where owner_user_id =")) {
            const ownerId = Array.isArray(value) ? value[0] : value;
            const nextRows = tables.sessions.filter((row) => row.owner_user_id !== ownerId);
            const changes = tables.sessions.length - nextRows.length;
            tables.sessions.splice(0, tables.sessions.length, ...nextRows);
            return { changes, lastInsertRowid: 0 };
          }

          if (normalized.startsWith("delete from gaps where owner_user_id =")) {
            const ownerId = Array.isArray(value) ? value[0] : value;
            const nextRows = tables.gaps.filter((row) => row.owner_user_id !== ownerId);
            const changes = tables.gaps.length - nextRows.length;
            tables.gaps.splice(0, tables.gaps.length, ...nextRows);
            return { changes, lastInsertRowid: 0 };
          }

          if (normalized.startsWith("delete from classes where owner_user_id =")) {
            const ownerId = Array.isArray(value) ? value[0] : value;
            const nextRows = tables.classes.filter((row) => row.owner_user_id !== ownerId);
            const changes = tables.classes.length - nextRows.length;
            tables.classes.splice(0, tables.classes.length, ...nextRows);
            return { changes, lastInsertRowid: 0 };
          }

          if (normalized.startsWith("delete from privacy_settings where user_id =")) {
            const userId = Array.isArray(value) ? value[0] : value;
            const nextRows = tables.privacy_settings.filter((row) => row.user_id !== userId);
            const changes = tables.privacy_settings.length - nextRows.length;
            tables.privacy_settings.splice(0, tables.privacy_settings.length, ...nextRows);
            return { changes, lastInsertRowid: 0 };
          }

          if (normalized.startsWith("delete from users where id =")) {
            const userId = Array.isArray(value) ? value[0] : value;
            const nextRows = tables.users.filter((row) => row.id !== userId);
            const changes = tables.users.length - nextRows.length;
            tables.users.splice(0, tables.users.length, ...nextRows);
            return { changes, lastInsertRowid: 0 };
          }

          if (normalized.startsWith("delete from retention_jobs")) {
            return { changes: 0, lastInsertRowid: 0 };
          }

          throw new Error(`Unsupported run SQL in test DB: ${normalized}`);
        },
        get(...args) {
          const value = args.length <= 1 ? args[0] : args;

          if (normalized.includes("select owner_user_id from sessions where id =")) {
            return clone(
              tables.sessions.find((row) => row.id === value) ?? undefined,
            );
          }

          if (normalized.includes("select owner_user_id from classes where id =")) {
            return clone(
              tables.classes.find((row) => row.id === value) ?? undefined,
            );
          }

          if (normalized.includes("select screenshot_policy, local_only_mode, sync_consent, updated_at from privacy_settings")) {
            return clone(
              tables.privacy_settings.find((row) => row.user_id === value) ?? undefined,
            );
          }

          throw new Error(`Unsupported get SQL in test DB: ${normalized}`);
        },
        all(...args) {
          if (normalized.includes("from retention_jobs where status = 'pending'")) {
            const limit = args[args.length - 1];
            const jobTypes = args.slice(0, -1);
            let rows = tables.retention_jobs.filter(
              (row) => row.status === "pending" && row.run_after <= nowString(),
            );
            if (jobTypes.length > 0) {
              rows = rows.filter((row) => jobTypes.includes(row.job_type));
            }
            rows.sort((left, right) => compareDesc(right, left, ["created_at", "id"]));
            return clone(rows.slice(0, limit));
          }

          if (normalized.includes("from interactions where owner_user_id = ? order by coalesce(session_id, 0), created_at desc, id desc")) {
            const userId = args[0];
            const rows = tables.interactions
              .filter((row) => row.owner_user_id === userId)
              .sort((left, right) => {
                if ((left.session_id ?? 0) !== (right.session_id ?? 0)) {
                  return (left.session_id ?? 0) - (right.session_id ?? 0);
                }
                return compareDesc(left, right, ["created_at", "id"]);
              });
            return clone(rows);
          }

          if (normalized.includes("select distinct user_id from privacy_settings")) {
            const rows = tables.privacy_settings.map((row) => ({
              user_id: row.user_id,
            }));
            return clone(rows);
          }

          if (normalized.includes("from classes where owner_user_id = ? order by updated_at desc, id desc")) {
            const userId = args[0];
            return clone(
              tables.classes
                .filter((row) => row.owner_user_id === userId)
                .sort((left, right) => compareDesc(left, right, ["updated_at", "id"])),
            );
          }

          if (normalized.includes("from sessions where owner_user_id = ? order by started_at desc, id desc")) {
            const userId = args[0];
            return clone(
              tables.sessions
                .filter((row) => row.owner_user_id === userId)
                .sort((left, right) => compareDesc(left, right, ["started_at", "id"])),
            );
          }

          if (normalized.includes("from interactions where owner_user_id = ? order by created_at desc, id desc")) {
            const userId = args[0];
            return clone(
              tables.interactions
                .filter((row) => row.owner_user_id === userId)
                .sort((left, right) => compareDesc(left, right, ["created_at", "id"])),
            );
          }

          if (normalized.includes("from gaps where owner_user_id = ? order by updated_at desc, id desc")) {
            const userId = args[0];
            return clone(
              tables.gaps
                .filter((row) => row.owner_user_id === userId)
                .sort((left, right) => compareDesc(left, right, ["updated_at", "id"])),
            );
          }

          if (normalized.includes("from retention_jobs where user_id = ? order by created_at desc, id desc")) {
            const userId = args[0];
            return clone(
              tables.retention_jobs
                .filter((row) => row.user_id === userId)
                .sort((left, right) => compareDesc(left, right, ["created_at", "id"])),
            );
          }

          throw new Error(`Unsupported all SQL in test DB: ${normalized}`);
        },
      };
    },
  };

  return db;
}

function buildContext() {
  return {
    classProfile: null,
    activeGaps: [],
    recentInteractions: [],
    studentMemory: {
      recurringTopics: [],
      preferredHelpModes: [],
      knownStrengths: [],
      memorySummary: "Learner summary",
    },
    recentSessions: [],
    contextGuidance: {
      requestPriority: ["focus on confusion"],
      screenshotUsefulness: "Useful when diagrams are involved.",
      backgroundUsefulness: "Useful with extra page context.",
    },
    sessionGoal: null,
    summary: "Built context summary",
  };
}

test("persistAssistMemory redacts screenshot blobs before storage and queues compaction work", async () => {
  const db = createTestDatabase();
  const { persistAssistMemory } = await loadMemoryModule();

  db.tables.users.push({
    id: "user-1",
    email: null,
    display_name: null,
    created_at: "2026-05-07 12:00:00",
    updated_at: "2026-05-07 12:00:00",
  });
  db.tables.classes.push({
    id: 1,
    owner_user_id: "user-1",
    class_name: "Biology",
    subject: "Science",
    created_at: "2026-05-07 12:00:00",
    updated_at: "2026-05-07 12:00:00",
  });
  db.tables.sessions.push({
    id: 10,
    owner_user_id: "user-1",
    class_id: 1,
    started_at: "2026-05-07 12:00:00",
    ended_at: null,
    title: "Review",
    notes: "Notes",
    summary: null,
    key_topics: "[]",
    carry_forward: null,
    request_count: 0,
    screenshot_preview: null,
  });

  const interactionId = persistAssistMemory(
    {
      classId: 1,
      sessionId: 10,
      actionType: "explain",
      selectedText: "Cell respiration",
      surroundingText: "A longer block of context.",
      pageTitle: "Study Page",
      pageUrl: "https://example.com/biology",
      userNote: "Why is oxygen needed?",
      screenshotDataUrl: "data:image/png;base64,very-secret-image",
    },
    {
      answer: "Because oxygen accepts electrons.",
      nextStep: "Review the electron transport chain.",
      context: buildContext(),
      gapCandidates: [],
    },
    buildContext(),
    { db },
  );

  assert.equal(interactionId, 1);
  const interactionRow = db.tables.interactions[0];
  assert.match(interactionRow.request_payload, /\[redacted image payload\]/);
  assert.doesNotMatch(
    interactionRow.request_payload,
    /data:image\/png;base64,very-secret-image/,
  );
  assert.equal(
    db.tables.sessions[0].screenshot_preview,
    "data:image/png;base64,very-secret-image",
  );

  const queuedJob = db.tables.retention_jobs[0];
  assert.equal(queuedJob.job_type, "summary_compaction");
  assert.equal(queuedJob.status, "pending");
  assert.match(queuedJob.payload, /"interactionId":1/);
});

test("privacy worker compaction keeps recent interactions and strips older payload blobs", async () => {
  const db = createTestDatabase();
  const { updateUserPrivacySettings, getPrivacyWorkerHandlers } = await loadPrivacyModule();
  const { enqueueRetentionJob, processPendingRetentionJobs } = await loadWorkerModule();

  db.tables.users.push({
    id: "user-2",
    email: null,
    display_name: null,
    created_at: "2026-05-07 12:00:00",
    updated_at: "2026-05-07 12:00:00",
  });
  db.tables.classes.push({
    id: 1,
    owner_user_id: "user-2",
    class_name: "History",
    subject: "Social Studies",
    created_at: "2026-05-07 12:00:00",
    updated_at: "2026-05-07 12:00:00",
  });
  db.tables.sessions.push({
    id: 1,
    owner_user_id: "user-2",
    class_id: 1,
    started_at: "2026-05-07 12:00:00",
    ended_at: null,
    title: "Unit Review",
    notes: null,
    summary: null,
    key_topics: "[]",
    carry_forward: null,
    request_count: 0,
    screenshot_preview: null,
  });
  updateUserPrivacySettings("user-2", { localOnlyMode: true }, db);

  for (let index = 0; index < 12; index += 1) {
    db.tables.interactions.push({
      id: index + 1,
      owner_user_id: "user-2",
      session_id: 1,
      class_id: 1,
      prompt: `Prompt ${index}`,
      response: `Answer ${index}`,
      interaction_type: "chat",
      request_payload: JSON.stringify({ chunk: `payload-${index}` }),
      response_payload: JSON.stringify({ response: `blob-${index}` }),
      built_context: JSON.stringify({ summary: `context-${index}` }),
      created_at: `2026-05-${String(index + 1).padStart(2, "0")} 10:00:00`,
    });
  }

  enqueueRetentionJob({
    db,
    userId: "user-2",
    jobType: "summary_compaction",
    payload: { sessionId: 1 },
  });

  const result = processPendingRetentionJobs({
    db,
    handlers: getPrivacyWorkerHandlers(),
  });
  assert.deepEqual(result, { processed: 1, failed: 0 });

  const compactedCount = db.tables.interactions.filter((interaction) =>
    interaction.request_payload.includes('"compacted":true'),
  ).length;
  assert.equal(compactedCount, 6);
  assert.doesNotMatch(
    db.tables.interactions[db.tables.interactions.length - 1].request_payload,
    /"compacted":true/,
  );
});

test("privacy workflows export redacted data and delete owned records", async () => {
  const db = createTestDatabase();
  const {
    buildUserDataExport,
    getPrivacyWorkerHandlers,
    queueExportJob,
    queueAccountDeletion,
    updateUserPrivacySettings,
  } = await loadPrivacyModule();
  const { processPendingRetentionJobs } = await loadWorkerModule();

  db.tables.users.push({
    id: "user-3",
    email: null,
    display_name: null,
    created_at: "2026-05-07 12:00:00",
    updated_at: "2026-05-07 12:00:00",
  });
  updateUserPrivacySettings(
    "user-3",
    {
      screenshotPolicy: "manual",
      syncConsent: "granted",
      localOnlyMode: false,
    },
    db,
  );
  db.tables.classes.push({
    id: 1,
    owner_user_id: "user-3",
    class_name: "Chemistry",
    subject: "Science",
    created_at: "2026-05-07 12:00:00",
    updated_at: "2026-05-07 12:00:00",
  });
  db.tables.sessions.push({
    id: 1,
    owner_user_id: "user-3",
    class_id: 1,
    started_at: "2026-05-07 12:00:00",
    ended_at: null,
    title: "Atoms",
    notes: null,
    summary: null,
    key_topics: "[]",
    carry_forward: null,
    request_count: 0,
    screenshot_preview: "[redacted image payload]",
  });
  db.tables.interactions.push({
    id: 1,
    owner_user_id: "user-3",
    session_id: 1,
    class_id: 1,
    prompt: "Prompt",
    response: "Answer",
    interaction_type: "chat",
    request_payload: '{"screenshotDataUrl":"[redacted image payload]"}',
    response_payload: '{"answer":"ok"}',
    built_context: '{"summary":"stored"}',
    created_at: "2026-05-07 12:00:00",
  });

  const exportJobId = queueExportJob("user-3", { db, includeContent: true });
  processPendingRetentionJobs({
    db,
    handlers: getPrivacyWorkerHandlers(),
    jobTypes: ["export_user_data"],
  });

  const exportPayload = buildUserDataExport("user-3", { db });
  assert.equal(exportPayload.privacySettings.screenshotPolicy, "manual");
  assert.equal(exportPayload.interactions.length, 1);
  assert.doesNotMatch(
    JSON.stringify(exportPayload),
    /data:image\/[a-z]+;base64/i,
  );

  const exportJob = db.tables.retention_jobs.find((job) => job.id === exportJobId);
  assert.equal(exportJob.status, "completed");
  assert.match(exportJob.payload, /"exportedAt"/);

  queueAccountDeletion("user-3", db);
  processPendingRetentionJobs({
    db,
    handlers: getPrivacyWorkerHandlers(),
    jobTypes: ["account_deletion"],
  });

  assert.equal(db.tables.users.filter((row) => row.id === "user-3").length, 0);
  assert.equal(db.tables.privacy_settings.filter((row) => row.user_id === "user-3").length, 0);
  assert.equal(db.tables.classes.filter((row) => row.owner_user_id === "user-3").length, 0);
  assert.equal(db.tables.sessions.filter((row) => row.owner_user_id === "user-3").length, 0);
  assert.equal(db.tables.interactions.filter((row) => row.owner_user_id === "user-3").length, 0);
});
