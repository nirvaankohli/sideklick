function appendStoppedSessionToFolders(classFolders, session, persistedSession) {
  if (!Array.isArray(classFolders)) {
    return [];
  }

  return classFolders.map((folder) => {
    if (
      folder?.type !== "class" ||
      (folder.dbClassId !== session.classId &&
        String(folder.name || "").trim() !== String(session.className || "").trim())
    ) {
      return folder;
    }

    const existingChildren = Array.isArray(folder.children) ? folder.children : [];
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
      (child) => child?.type !== "session" || child.dbSessionId !== persistedSession.id,
    );

    return {
      ...folder,
      children: [sessionEntry, ...dedupedChildren],
    };
  });
}

function buildBackendClassPayloadFromSession(session) {
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

function createSessionManager({
  createSession,
  endSession,
  getClassProfileById,
  saveClassProfile,
  readPreferences,
  writePreferences,
  getPreferenceSnapshot,
  windowsByKey,
  createManagedWindow,
  notifyHomeWindowFoldersChanged,
}) {
  function ensureSessionClassId(session) {
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

  function startSession(session) {
    const resolvedClassId = ensureSessionClassId(session);
    const persistedSession = createSession(
      resolvedClassId,
      session.sessionName || "Study Session",
      session.sessionNotes || null,
    );
    const nextPreferences = {
      ...readPreferences(),
      currentSession: {
        ...session,
        classId: resolvedClassId,
        sessionId: persistedSession.id,
        sessionStartedAt: persistedSession.startedAt,
      },
    };
    writePreferences(nextPreferences);

    if (!windowsByKey.has("chat")) {
      createManagedWindow("chat", "chat");
    } else {
      const existingChat = windowsByKey.get("chat");
      if (existingChat && !existingChat.isDestroyed()) {
        existingChat.show();
        existingChat.focus();
        existingChat.webContents.send(
          "session:changed",
          nextPreferences.currentSession,
        );
      }
    }

    return { ok: true, currentSession: nextPreferences.currentSession };
  }

  function stopSession() {
    const currentSession = getPreferenceSnapshot().currentSession;
    let persistedSession = null;
    if (currentSession?.sessionId) {
      persistedSession = endSession(currentSession.sessionId);
    }

    const currentPreferences = readPreferences();
    const nextClassFolders =
      currentSession && persistedSession
        ? appendStoppedSessionToFolders(
            Array.isArray(currentPreferences.classFolders)
              ? currentPreferences.classFolders
              : [],
            currentSession,
            persistedSession,
          )
        : Array.isArray(currentPreferences.classFolders)
          ? currentPreferences.classFolders
          : [];
    const nextPreferences = {
      ...currentPreferences,
      classFolders: nextClassFolders,
      currentSession: null,
    };
    writePreferences(nextPreferences);
    notifyHomeWindowFoldersChanged(nextPreferences.classFolders);

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
    startSession,
    stopSession,
  };
}

module.exports = {
  createSessionManager,
};
