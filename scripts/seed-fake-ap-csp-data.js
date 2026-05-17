const fs = require("fs");
const path = require("path");
const { app } = require("electron");
const Database = require("better-sqlite3");

const classId = 1;
const sessions = [
  {
    id: 1,
    title: "Logic Gates Foundations",
    notes: "Intro to AND, OR, NOT, and reading truth tables.",
    summary:
      "This session introduced the core logic gates and how truth tables represent their outputs. The student practiced translating simple statements into AND, OR, and NOT gate behavior. The next step is to get faster at reading and building truth tables from gate rules.",
    keyTopics: [
      "logic gates",
      "AND gate",
      "OR gate",
      "NOT gate",
      "truth tables",
    ],
    carryForward:
      "Practice building truth tables quickly from simple gate descriptions.",
    requestCount: 3,
    startedAt: "2026-04-08 15:00:00",
    endedAt: "2026-04-08 15:42:00",
    interactions: [
      {
        prompt:
          "Action: explain\nSelected text: What does an AND gate output?\nUser note: I mix up AND and OR sometimes.",
        response:
          "An AND gate outputs 1 only when both inputs are 1.",
        interactionType: "explain",
        createdAt: "2026-04-08 15:05:00",
      },
      {
        prompt:
          "Action: connect_to_prior_knowledge\nSelected text: Truth tables for basic gates\nUser note: Connect this to what I already know.",
        response:
          "Think of a truth table like a complete checklist of every possible input pair and the output each gate gives.",
        interactionType: "connect_to_prior_knowledge",
        createdAt: "2026-04-08 15:18:00",
      },
      {
        prompt: "Action: review\nSelected text: NOT gate examples",
        response:
          "A NOT gate flips the input, so 1 becomes 0 and 0 becomes 1.",
        interactionType: "review",
        createdAt: "2026-04-08 15:31:00",
      },
    ],
  },
  {
    id: 2,
    title: "Combining Gates and Boolean Expressions",
    notes:
      "Worked on combining multiple gates and matching them to Boolean expressions.",
    summary:
      "This session focused on combining gates into larger circuits and matching them with Boolean expressions. The student connected circuit structure to expressions like A AND B or NOT A OR B. The next step is to simplify circuits by spotting repeated patterns in the expressions.",
    keyTopics: [
      "combined circuits",
      "Boolean expressions",
      "inputs and outputs",
      "truth tables",
      "gate combinations",
    ],
    carryForward:
      "Simplify small circuits by matching each branch to a Boolean expression.",
    requestCount: 3,
    startedAt: "2026-04-09 14:10:00",
    endedAt: "2026-04-09 14:56:00",
    interactions: [
      {
        prompt:
          "Action: explain\nSelected text: How do I read a circuit with two gates?\nUser note: I understand one gate but not combined ones.",
        response:
          "Read the circuit from the inputs forward, write the output of each gate, then use that result as the input to the next gate.",
        interactionType: "explain",
        createdAt: "2026-04-09 14:16:00",
      },
      {
        prompt:
          "Action: quiz_me\nSelected text: Match the circuit to the Boolean expression.",
        response:
          "Start by labeling each intermediate output so the expression builds one step at a time.",
        interactionType: "quiz_me",
        createdAt: "2026-04-09 14:28:00",
      },
      {
        prompt:
          "Action: flag_confusing\nSelected text: Nested OR and AND circuit\nUser note: I lose track of the middle output.",
        response:
          "Treat the middle gate as its own mini-answer first, then plug it into the last gate.",
        interactionType: "flag_confusing",
        createdAt: "2026-04-09 14:44:00",
      },
    ],
  },
  {
    id: 3,
    title: "De Morgan and Circuit Simplification",
    notes: "Reviewed De Morgan's Law and simplifying gate arrangements.",
    summary:
      "This session covered De Morgan's Law and how it changes grouped negations in logic circuits. The student practiced rewriting expressions and recognizing equivalent circuits with fewer steps. The next step is to keep reviewing simplification rules until equivalent forms feel automatic.",
    keyTopics: [
      "De Morgan's Law",
      "circuit simplification",
      "equivalent circuits",
      "negation rules",
      "Boolean algebra",
    ],
    carryForward:
      "Keep practicing equivalent rewrites using De Morgan's Law.",
    requestCount: 3,
    startedAt: "2026-04-10 16:05:00",
    endedAt: "2026-04-10 16:52:00",
    interactions: [
      {
        prompt:
          "Action: explain\nSelected text: What is De Morgan's Law in logic gates?\nUser note: I need the simple version.",
        response:
          "De Morgan's Law says that negating an OR turns it into ANDs of negations, and negating an AND turns it into ORs of negations.",
        interactionType: "explain",
        createdAt: "2026-04-10 16:11:00",
      },
      {
        prompt:
          "Action: connect_to_prior_knowledge\nSelected text: Simplifying a NAND/NOR style expression\nUser note: Connect this to earlier sessions.",
        response:
          "This builds on your truth-table work: if two expressions have the same outputs for every input, the circuits are equivalent even if they look different.",
        interactionType: "connect_to_prior_knowledge",
        createdAt: "2026-04-10 16:27:00",
      },
      {
        prompt: "Action: review\nSelected text: Equivalent circuits practice",
        response:
          "Check whether each rewrite preserves the same outputs for all inputs, then prefer the simpler expression.",
        interactionType: "review",
        createdAt: "2026-04-10 16:41:00",
      },
    ],
  },
];

const gapRows = [
  {
    id: 1,
    topic: "Boolean expression simplification",
    description:
      "Needs more practice simplifying combined expressions into cleaner equivalent forms.",
    status: "open",
    weight: 4,
    evidenceCount: 2,
    lastSeenAt: "2026-04-10 16:41:00",
    createdAt: "2026-04-09 14:44:00",
    updatedAt: "2026-04-10 16:41:00",
  },
  {
    id: 2,
    topic: "De Morgan's Law",
    description:
      "Still benefits from reinforcement when converting negated AND and OR expressions.",
    status: "improving",
    weight: 3,
    evidenceCount: 2,
    lastSeenAt: "2026-04-10 16:27:00",
    createdAt: "2026-04-10 16:11:00",
    updatedAt: "2026-04-10 16:27:00",
  },
];

function buildBuiltContext(session) {
  return {
    classProfile: {
      id: classId,
      className: "AP CSP",
      subject: "AP CSP",
      currentUnit: "Logic Gates and Boolean Logic",
      teacherFocus:
        "Use truth tables, Boolean expressions, and gate combinations to reason through circuits.",
      keyConcepts: [
        "logic gates",
        "truth tables",
        "Boolean expressions",
        "De Morgan's Law",
        "circuit simplification",
      ],
      notes: "Fake seeded class for AP CSP logic gates demos.",
    },
    activeGaps: gapRows.map(({ id, ...gap }) => ({ id, classId, ...gap })),
    recentInteractions: [],
    studentMemory: {
      recurringTopics: session.keyTopics.slice(0, 4),
      preferredHelpModes: [
        "explain",
        "review",
        "connect_to_prior_knowledge",
      ],
      knownStrengths: session.keyTopics.slice(0, 3),
      memorySummary: `Seeded AP CSP context focused on ${session.keyTopics
        .slice(0, 3)
        .join(", ")}.`,
    },
    recentSessions: [],
    contextGuidance: {
      requestPriority: [
        "Answer the selected text and explicit action first.",
      ],
      screenshotUsefulness: "No screenshot is available.",
      backgroundUsefulness:
        "Use class profile, prior sessions, and active gaps when they sharpen the answer. Do not let old memory override the current request.",
    },
    sessionGoal: session.title,
    summary: session.summary,
  };
}

function seedDatabase(repoRoot) {
  const dbPath = path.join(repoRoot, "sideklick.sqlite");
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = OFF");

  db.transaction(() => {
    db.exec(`
      DELETE FROM gap_events;
      DELETE FROM interactions;
      DELETE FROM gaps;
      DELETE FROM sessions;
      DELETE FROM classes;
      DELETE FROM sqlite_sequence;
    `);

    db.prepare(`
      INSERT INTO classes (
        id, class_name, subject, current_unit, teacher_focus, key_concepts, notes, created_at, updated_at
      ) VALUES (
        @id, @className, @subject, @currentUnit, @teacherFocus, @keyConcepts, @notes, @createdAt, @updatedAt
      )
    `).run({
      id: classId,
      className: "AP CSP",
      subject: "AP CSP",
      currentUnit: "Logic Gates and Boolean Logic",
      teacherFocus:
        "Use truth tables, Boolean expressions, and gate combinations to reason through circuits.",
      keyConcepts: JSON.stringify([
        "logic gates",
        "truth tables",
        "Boolean expressions",
        "De Morgan's Law",
        "circuit simplification",
      ]),
      notes: "Fake seeded class for AP CSP logic gates demos.",
      createdAt: "2026-04-08 14:55:00",
      updatedAt: "2026-04-10 16:52:00",
    });

    const insertSession = db.prepare(`
      INSERT INTO sessions (
        id, class_id, started_at, ended_at, title, notes, summary, key_topics, carry_forward, request_count, screenshot_preview
      ) VALUES (
        @id, @classId, @startedAt, @endedAt, @title, @notes, @summary, @keyTopics, @carryForward, @requestCount, NULL
      )
    `);

    const insertInteraction = db.prepare(`
      INSERT INTO interactions (
        id, session_id, class_id, prompt, response, interaction_type, request_payload, response_payload, built_context, created_at
      ) VALUES (
        @id, @sessionId, @classId, @prompt, @response, @interactionType, @requestPayload, @responsePayload, @builtContext, @createdAt
      )
    `);

    let interactionId = 1;
    for (const session of sessions) {
      insertSession.run({
        id: session.id,
        classId,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        title: session.title,
        notes: session.notes,
        summary: session.summary,
        keyTopics: JSON.stringify(session.keyTopics),
        carryForward: session.carryForward,
        requestCount: session.requestCount,
      });

      for (const interaction of session.interactions) {
        insertInteraction.run({
          id: interactionId,
          sessionId: session.id,
          classId,
          prompt: interaction.prompt,
          response: interaction.response,
          interactionType: interaction.interactionType,
          requestPayload: JSON.stringify({
            classId,
            sessionId: session.id,
            actionType: interaction.interactionType,
            selectedText: interaction.prompt,
            screenshotDataUrl: null,
          }),
          responsePayload: JSON.stringify({
            answer: interaction.response,
            nextStep: session.carryForward,
            gapCandidates: [],
          }),
          builtContext: JSON.stringify(buildBuiltContext(session)),
          createdAt: interaction.createdAt,
        });
        interactionId += 1;
      }
    }

    const insertGap = db.prepare(`
      INSERT INTO gaps (
        id, class_id, topic, description, status, weight, evidence_count, last_seen_at, created_at, updated_at
      ) VALUES (
        @id, @classId, @topic, @description, @status, @weight, @evidenceCount, @lastSeenAt, @createdAt, @updatedAt
      )
    `);

    for (const gap of gapRows) {
      insertGap.run({ ...gap, classId });
    }

    const insertGapEvent = db.prepare(`
      INSERT INTO gap_events (
        id, gap_id, interaction_id, session_id, evidence, confidence, created_at
      ) VALUES (
        @id, @gapId, @interactionId, @sessionId, @evidence, @confidence, @createdAt
      )
    `);

    insertGapEvent.run({
      id: 1,
      gapId: 1,
      interactionId: 6,
      sessionId: 2,
      evidence: "Student lost track of the middle output in a nested circuit.",
      confidence: 0.74,
      createdAt: "2026-04-09 14:44:00",
    });
    insertGapEvent.run({
      id: 2,
      gapId: 1,
      interactionId: 9,
      sessionId: 3,
      evidence:
        "Student needed help checking whether a rewrite stayed equivalent.",
      confidence: 0.72,
      createdAt: "2026-04-10 16:41:00",
    });
    insertGapEvent.run({
      id: 3,
      gapId: 2,
      interactionId: 7,
      sessionId: 3,
      evidence: "Student asked for the simple version of De Morgan's Law.",
      confidence: 0.78,
      createdAt: "2026-04-10 16:11:00",
    });
    insertGapEvent.run({
      id: 4,
      gapId: 2,
      interactionId: 8,
      sessionId: 3,
      evidence:
        "Student wanted to connect De Morgan rewrites to earlier truth-table work.",
      confidence: 0.69,
      createdAt: "2026-04-10 16:27:00",
    });
  })();

  db.pragma("wal_checkpoint(TRUNCATE)");
  db.close();

  return dbPath;
}

function seedPreferences() {
  const prefsPath = path.join(
    process.env.APPDATA || app.getPath("appData"),
    "sideklick",
    "preferences.json",
  );
  const sessionChildren = sessions
    .slice()
    .reverse()
    .map((session) => ({
      id: `session-${session.id}`,
      type: "session",
      name: session.title,
      classId,
      dbSessionId: session.id,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      notes: session.notes,
      summary: session.summary,
      carryForward: session.carryForward,
      requestCount: session.requestCount,
      screenshotPreview: null,
      keyTopics: session.keyTopics,
    }));

  const nextPreferences = {
    themeSource: "light",
    hasLaunchedBefore: true,
    discoverySource: "",
    customerProfile: "",
    currentSession: null,
    classFolders: [
      {
        id: "class-ap-csp",
        type: "class",
        name: "AP CSP",
        subject: "AP CSP",
        teacherName: "Ms. Alvarez",
        description: "AP CSP class seeded with fake logic gates sessions.",
        teacherNotes:
          "Focus on truth tables, Boolean logic, and circuit reasoning.",
        additionalNotes: "Demo data only.",
        dbClassId: classId,
        children: sessionChildren,
      },
    ],
  };

  fs.mkdirSync(path.dirname(prefsPath), { recursive: true });
  fs.writeFileSync(prefsPath, JSON.stringify(nextPreferences, null, 2), "utf8");
  return prefsPath;
}

app.whenReady().then(() => {
  try {
    const repoRoot = process.cwd();
    const dbPath = seedDatabase(repoRoot);
    const prefsPath = seedPreferences();
    console.log(
      JSON.stringify(
        {
          dbPath,
          prefsPath,
          classCount: 1,
          sessionCount: sessions.length,
          interactionCount: sessions.reduce(
            (sum, session) => sum + session.interactions.length,
            0,
          ),
          gapCount: gapRows.length,
        },
        null,
        2,
      ),
    );
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    app.quit();
  }
});
