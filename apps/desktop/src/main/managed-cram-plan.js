function isManagedSessionCompatibilityError(error) {
  const message =
    error instanceof Error ? error.message : String(error || "");
  return (
    (
      Number(error?.status) === 404 &&
      /session resource not found/i.test(message)
    ) ||
    (
      Number(error?.status) === 403 &&
      (
        /forbidden session resource access/i.test(message) ||
        /session does not belong to the requested class/i.test(message)
      )
    )
  );
}

function isManagedStudyCreditError(error) {
  const message =
    error instanceof Error ? error.message : String(error || "");
  return (
    Number(error?.status) === 402 &&
    /study credits/i.test(message)
  );
}

function toManagedCramPlanErrorResult(error) {
  return {
    __managedCramPlanError: true,
    status:
      typeof error?.status === "number" ? error.status : null,
    message:
      error instanceof Error ? error.message : String(error || "Cram plan failed."),
  };
}

function isManagedCramPlanValidationError(error) {
  const message =
    error instanceof Error ? error.message : String(error || "");
  return (
    Number(error?.status) === 400 &&
    /invalid cram plan payload or model output/i.test(message)
  );
}

function adjustCramPlanRequestBodyForCompatibility(requestBody) {
  if (!requestBody || typeof requestBody !== "object") {
    return { body: requestBody, adjusted: false };
  }
  const body = { ...requestBody };
  let adjusted = false;

  if ("teacherAssessmentProfile" in body) {
    delete body.teacherAssessmentProfile;
    adjusted = true;
  }

  return { body, adjusted };
}

async function performManagedCramPlanWithCompatibility({
  requestBody,
  callManagedBackend,
}) {
  try {
    return await callManagedBackend("/api/cram-plan", {
      method: "POST",
      body: requestBody,
    });
  } catch (error) {
    let activeError = error;

    if (isManagedStudyCreditError(activeError)) {
      return toManagedCramPlanErrorResult(activeError);
    }

    // Check if it's a validation error and we can adjust the body
    if (isManagedCramPlanValidationError(activeError)) {
      const { body: adjustedBody, adjusted } = adjustCramPlanRequestBodyForCompatibility(requestBody);
      if (adjusted) {
        try {
          return await callManagedBackend("/api/cram-plan", {
            method: "POST",
            body: adjustedBody,
          });
        } catch (retryValError) {
          activeError = retryValError;
          if (isManagedStudyCreditError(activeError)) {
            return toManagedCramPlanErrorResult(activeError);
          }
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

    try {
      return await callManagedBackend("/api/cram-plan", {
        method: "POST",
        body: {
          ...requestBody,
          sessionIds: [],
        },
      });
    } catch (retryError) {
      if (isManagedStudyCreditError(retryError)) {
        return toManagedCramPlanErrorResult(retryError);
      }

      // If the session-free retry fails with a validation error, retry with adjusted body
      if (isManagedCramPlanValidationError(retryError)) {
        const { body: adjustedBody, adjusted } = adjustCramPlanRequestBodyForCompatibility({
          ...requestBody,
          sessionIds: [],
        });
        if (adjusted) {
          try {
            return await callManagedBackend("/api/cram-plan", {
              method: "POST",
              body: adjustedBody,
            });
          } catch (sessionValError) {
            if (isManagedStudyCreditError(sessionValError)) {
              return toManagedCramPlanErrorResult(sessionValError);
            }
            throw sessionValError;
          }
        }
      }
      throw retryError;
    }
  }
}

module.exports = {
  isManagedSessionCompatibilityError,
  isManagedStudyCreditError,
  isManagedCramPlanValidationError,
  adjustCramPlanRequestBodyForCompatibility,
  performManagedCramPlanWithCompatibility,
  toManagedCramPlanErrorResult,
};
