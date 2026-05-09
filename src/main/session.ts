function appendStoppedSessionToFolders(
  classFolders: unknown[],
  session: Record<string, any>,
  persistedSession: Record<string, any>,
) {
  function insertSessionAtPath(nodes: unknown[], path: string[]) {
    if (!Array.isArray(nodes)) {
      return [];
    }

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

    if (path.length === 0) {
      const dedupedChildren = nodes.filter(
        (child) => child?.type !== "session" || child.dbSessionId !== persistedSession.id,
      );
      return [sessionEntry, ...dedupedChildren];
    }

    const [head, ...rest] = path;
    return nodes.map((node) => {
      if (node?.id !== head) {
        return node;
      }

      return {
        ...node,
        children: insertSessionAtPath(
          Array.isArray(node.children) ? node.children : [],
          rest,
        ),
      };
    });
  }

  if (!Array.isArray(classFolders)) {
    return [];
  }

  const explorerPath = Array.isArray(session.explorerPath)
    ? session.explorerPath.filter((segment) => typeof segment === "string")
    : [];
  if (explorerPath.length > 0) {
    return insertSessionAtPath(classFolders, explorerPath);
  }

  const classFolder = classFolders.find(
    (folder) =>
      folder?.type === "class" &&
      (folder.dbClassId === session.classId ||
        String(folder.name || "").trim() === String(session.className || "").trim()),
  );
  const fallbackPath = classFolder?.id ? [classFolder.id] : [];
  return insertSessionAtPath(classFolders, fallbackPath);
}

function buildBackendClassPayloadFromSession(session: Record<string, any>) {
  const noteParts = [
    session?.description ? `Description: ${session.description}` : null,
    session?.additionalNotes
      ? `Additional notes: ${session.additionalNotes}`
      : null,
    session?.hierarchyNotes ? session.hierarchyNotes : null,
  ].filter(Boolean);
  const teacherFocusParts = [
    session?.teacherName ? `Teacher: ${session.teacherName}` : null,
    session?.teacherNotes ? `Focus: ${session.teacherNotes}` : null,
  ].filter(Boolean);

  return {
    className: typeof session?.className === "string" ? session.className : "",
    subject: typeof session?.className === "string" ? session.className : "",
    currentUnit:
      typeof session?.currentUnit === "string" && session.currentUnit.trim()
        ? session.currentUnit.trim()
        : null,
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
    const existingClassProfile = getClassProfileById(resolvedClassId);
    if (existingClassProfile) {
      saveClassProfile({
        ...existingClassProfile,
        ...buildBackendClassPayloadFromSession(session),
        id: resolvedClassId,
      });
    }
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
