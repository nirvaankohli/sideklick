function isMissingManagedSessionError(error) {
  const message =
    error instanceof Error ? error.message : String(error || "");
  return (
    Number(error?.status) === 404 &&
    /session resource not found/i.test(message)
  );
}

function isManagedAssistValidationError(error) {
  const message =
    error instanceof Error ? error.message : String(error || "");
  return (
    Number(error?.status) === 400 &&
    /invalid assist payload or model output/i.test(message)
  );
}

function toLegacyAssistBody(body) {
  if (!body || typeof body !== "object") {
    return {};
  }

  const allowedKeys = [
    "classId",
    "sessionId",
    "actionType",
    "selectedText",
    "surroundingText",
    "pageTitle",
    "pageUrl",
    "userNote",
    "screenshotDataUrl",
  ];
  const legacyBody = {};
  for (const key of allowedKeys) {
    const value = body[key];
    if (value === undefined || value === null) {
      continue;
    }
    legacyBody[key] = value;
  }
  return legacyBody;
}

function toCompatChatAssistBody(body) {
  const legacyBody = toLegacyAssistBody(body);
  const originalActionType =
    typeof legacyBody.actionType === "string" && legacyBody.actionType.trim()
      ? legacyBody.actionType.trim()
      : "chat";
  const originalUserNote =
    typeof legacyBody.userNote === "string" && legacyBody.userNote.trim()
      ? legacyBody.userNote.trim()
      : "";

  return {
    ...legacyBody,
    actionType: "chat",
    userNote: [
      `Original action type: ${originalActionType}. Respond in a way that honors that intent.`,
      originalUserNote || null,
    ]
      .filter(Boolean)
      .join("\n\n"),
  };
}

async function performManagedAssistWithCompatibility({
  requestBody,
  callManagedBackend,
  callLocalDesktopBackend,
  attemptAssistRequest,
}) {
  let remoteSessionRejected = false;

  try {
    return await attemptAssistRequest(
      "managed-primary",
      () =>
        callManagedBackend("/api/assist", {
          method: "POST",
          body: requestBody,
        }),
      requestBody,
    );
  } catch (primaryError) {
    if (requestBody.sessionId && isMissingManagedSessionError(primaryError)) {
      remoteSessionRejected = true;
      const noSessionBody = { ...requestBody };
      delete noSessionBody.sessionId;
      try {
        return await attemptAssistRequest(
          "managed-without-session",
          () =>
            callManagedBackend("/api/assist", {
              method: "POST",
              body: noSessionBody,
            }),
          noSessionBody,
        );
      } catch (withoutSessionError) {
        if (!isManagedAssistValidationError(withoutSessionError)) {
          throw withoutSessionError;
        }
      }
    } else if (!isManagedAssistValidationError(primaryError)) {
      throw primaryError;
    }
  }

  const legacyBody = toLegacyAssistBody(requestBody);
  if (remoteSessionRejected) {
    delete legacyBody.sessionId;
  }
  try {
    return await attemptAssistRequest(
      "managed-legacy",
      () =>
        callManagedBackend("/api/assist", {
          method: "POST",
          body: legacyBody,
        }),
      legacyBody,
    );
  } catch (legacyError) {
    if (isMissingManagedSessionError(legacyError)) {
      remoteSessionRejected = true;
      delete legacyBody.sessionId;
    } else if (!isManagedAssistValidationError(legacyError)) {
      throw legacyError;
    }
  }

  const compatChatBody = toCompatChatAssistBody(requestBody);
  if (remoteSessionRejected) {
    delete compatChatBody.sessionId;
  }
  try {
    return await attemptAssistRequest(
      "managed-compat-chat",
      () =>
        callManagedBackend("/api/assist", {
          method: "POST",
          body: compatChatBody,
        }),
      compatChatBody,
    );
  } catch (compatError) {
    if (isMissingManagedSessionError(compatError)) {
      remoteSessionRejected = true;
      delete compatChatBody.sessionId;
    } else if (!isManagedAssistValidationError(compatError)) {
      throw compatError;
    }
  }

  return attemptAssistRequest(
    "local-fallback",
    () =>
      callLocalDesktopBackend("/api/assist", {
        method: "POST",
        body: legacyBody,
      }),
    legacyBody,
  );
}

module.exports = {
  isManagedAssistValidationError,
  isMissingManagedSessionError,
  performManagedAssistWithCompatibility,
  toCompatChatAssistBody,
  toLegacyAssistBody,
};
