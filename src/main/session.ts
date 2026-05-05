function appendStoppedSessionToFolders(
  classFolders: unknown[],
  session: Record<string, any>,
  persistedSession: Record<string, any>,
) {
  if (!Array.isArray(classFolders)) {
    return [];
  }

  return classFolders.map((folder) => {
    if (
      folder?.type !== "class" ||
      (folder.dbClassId !== session.classId &&
        String(folder.name || "").trim() !==
          String(session.className || "").trim())
    ) {
      return folder;
    }

    const existingChildren = Array.isArray(folder.children)
      ? folder.children
      : [];
    const sessionEntry = {
      id: `session-${persistedSession.id}`,
      type: "session",
      name: session.sessionName || persistedSession.title || "Session",
      classId: session.classId,
      dbSessionId: persistedSession.id,
      startedAt: persistedSession.startedAt,
      endedAt: persistedSession.endedAt,
      notes: persistedSession.notes,
      summary: persistedSession.summary,
      carryForward: persistedSession.carryForward,
      requestCount: persistedSession.requestCount,
      screenshotPreview: persistedSession.screenshotPreview,
      keyTopics: persistedSession.keyTopics,
    };
    const dedupedChildren = existingChildren.filter(
      (child) =>
        child?.type !== "session" || child.dbSessionId !== persistedSession.id,
    );

    return {
      ...folder,
      children: [sessionEntry, ...dedupedChildren],
    };
  });
}

function buildBackendClassPayloadFromSession(session: Record<string, any>) {
  const noteParts = [
    session?.description ? `Description: ${session.description}` : null,
    session?.additionalNotes
      ? `Additional notes: ${session.additionalNotes}`
      : null,
  ].filter(Boolean);
  const teacherFocusParts = [
    session?.teacherName ? `Teacher: ${session.teacherName}` : null,
    session?.teacherNotes ? `Focus: ${session.teacherNotes}` : null,
  ].filter(Boolean);

  return {
    className: typeof session?.className === "string" ? session.className : "",
    subject: typeof session?.className === "string" ? session.className : "",
    currentUnit: null,
    teacherFocus:
      teacherFocusParts.length > 0 ? teacherFocusParts.join(" | ") : null,
    keyConcepts: [],
    notes: noteParts.length > 0 ? noteParts.join("\n") : null,
  };
}

export function createSessionLifecycle({
  createSession,
  endSession,
  getClassProfileById,
  saveClassProfile,
  getCurrentSessionState,
  setCurrentSessionState,
  clearCurrentSessionState,
  getStoredClassFolders,
  setStoredClassFolders,
  windowsByKey,
  createManagedWindow,
  notifyHomeWindowFoldersChanged,
}: {
  createSession: (
    classId: number,
    title: string,
    notes?: string | null,
  ) => Record<string, any>;
  endSession: (sessionId: number) => Record<string, any> | null;
  getClassProfileById: (id: number) => Record<string, any> | null;
  saveClassProfile: (input: Record<string, any>) => Record<string, any>;
  getCurrentSessionState: () => Record<string, any> | null;
  setCurrentSessionState: (
    currentSession: Record<string, any> | null,
  ) => Record<string, any> | null;
  clearCurrentSessionState: () => void;
  getStoredClassFolders: () => unknown[];
  setStoredClassFolders: (classFolders: unknown) => unknown[];
  windowsByKey: Map<string, Electron.BrowserWindow>;
  createManagedWindow: (
    windowKey: string,
    templateKey: string,
    config?: unknown,
  ) => Electron.BrowserWindow;
  notifyHomeWindowFoldersChanged: (classFolders: unknown[]) => void;
}) {
  function ensureSessionClassId(session: Record<string, any>) {
    const existingClassId =
      typeof session?.classId === "number" && session.classId > 0
        ? session.classId
        : null;

    if (existingClassId && getClassProfileById(existingClassId)) {
      return existingClassId;
    }

    const classPayload = buildBackendClassPayloadFromSession(session);
    if (!classPayload.className.trim()) {
      throw new Error("Cannot start a session without a valid class name.");
    }

    const savedClassProfile = saveClassProfile(classPayload);
    return savedClassProfile.id;
  }

  function startSession(session: Record<string, any>) {
    const resolvedClassId = ensureSessionClassId(session);
    const persistedSession = createSession(
      resolvedClassId,
      session.sessionName || "Study Session",
      session.sessionNotes || null,
    );
    const nextCurrentSession = setCurrentSessionState({
      ...session,
      classId: resolvedClassId,
      sessionId: persistedSession.id,
      sessionStartedAt: persistedSession.startedAt,
    });

    if (!windowsByKey.has("chat")) {
      createManagedWindow("chat", "chat");
    } else {
      const existingChat = windowsByKey.get("chat");
      if (existingChat && !existingChat.isDestroyed()) {
        existingChat.show();
        existingChat.focus();
        existingChat.webContents.send("session:changed", nextCurrentSession);
      }
    }

    return { ok: true, currentSession: nextCurrentSession };
  }

  function stopSession() {
    const currentSession = getCurrentSessionState();
    let persistedSession = null;
    if (currentSession?.sessionId) {
      persistedSession = endSession(Number(currentSession.sessionId));
    }

    const nextClassFolders =
      currentSession && persistedSession
        ? appendStoppedSessionToFolders(
            getStoredClassFolders(),
            currentSession,
            persistedSession,
          )
        : getStoredClassFolders();

    setStoredClassFolders(nextClassFolders);
    clearCurrentSessionState();
    notifyHomeWindowFoldersChanged(nextClassFolders);

    const chatWindow = windowsByKey.get("chat");
    if (chatWindow && !chatWindow.isDestroyed()) {
      chatWindow.close();
    }

    const homeWindow = windowsByKey.get("home");
    if (homeWindow && !homeWindow.isDestroyed()) {
      homeWindow.show();
      homeWindow.focus();
    }

    return { ok: true };
  }

  return {
    getCurrentSession() {
      return getCurrentSessionState();
    },
    startSession,
    stopSession,
  };
}
