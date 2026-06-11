const { isManagedSessionCompatibilityError } = require("./managed-cram-plan.js");

function isManagedQuizValidationError(error) {
  const message =
    error instanceof Error ? error.message : String(error || "");
  return (
    Number(error?.status) === 400 &&
    /invalid quiz payload or model output/i.test(message)
  );
}

function adjustRequestBodyForCompatibility(requestBody) {
  if (!requestBody || typeof requestBody !== "object") {
    return { body: requestBody, adjusted: false };
  }
  const body = { ...requestBody };
  let adjusted = false;

  if ("teacherAssessmentProfile" in body) {
    delete body.teacherAssessmentProfile;
    adjusted = true;
  }

  if (typeof body.questionCount === "number" && body.questionCount > 8) {
    body.questionCount = 8;
    adjusted = true;
  }

  return { body, adjusted };
}

async function performManagedQuizWithCompatibility({
  requestBody,
  callManagedBackend,
  idempotencyKey,
}) {
  try {
    return await callManagedBackend("/api/quiz", {
      method: "POST",
      body: requestBody,
      idempotencyKey,
    });
  } catch (error) {
    let activeError = error;

    // Check if it's a validation error and we can adjust the body
    if (isManagedQuizValidationError(activeError)) {
      const { body: adjustedBody, adjusted } = adjustRequestBodyForCompatibility(requestBody);
      if (adjusted) {
        try {
          return await callManagedBackend("/api/quiz", {
            method: "POST",
            body: adjustedBody,
            idempotencyKey,
          });
        } catch (retryValError) {
          // If it still fails, keep the newer error for subsequent compatibility checks
          activeError = retryValError;
        }
      }
    }

    const sessionIds = Array.isArray(requestBody?.sessionIds)
      ? requestBody.sessionIds
      : [];
    if (
      sessionIds.length === 0 ||
      !isManagedSessionCompatibilityError(activeError)
    ) {
      throw activeError;
    }

    // Retry without sessionIds if session compatibility error is encountered
    try {
      return await callManagedBackend("/api/quiz", {
        method: "POST",
        body: {
          ...requestBody,
          sessionIds: [],
        },
        idempotencyKey,
      });
    } catch (sessionError) {
      // If the session-free retry fails with a validation error, retry once more with adjusted body
      if (isManagedQuizValidationError(sessionError)) {
        const { body: adjustedBody, adjusted } = adjustRequestBodyForCompatibility({
          ...requestBody,
          sessionIds: [],
        });
        if (adjusted) {
          return await callManagedBackend("/api/quiz", {
            method: "POST",
            body: adjustedBody,
            idempotencyKey,
          });
        }
      }
      throw sessionError;
    }
  }
}

module.exports = {
  performManagedQuizWithCompatibility,
  isManagedQuizValidationError,
  adjustRequestBodyForCompatibility,
};
