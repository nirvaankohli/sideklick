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
    if (isManagedStudyCreditError(error)) {
      return toManagedCramPlanErrorResult(error);
    }

    const sessionIds = Array.isArray(requestBody?.sessionIds)
      ? requestBody.sessionIds
      : [];
    if (
      sessionIds.length === 0 ||
      !isManagedSessionCompatibilityError(error)
    ) {
      throw error;
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
      throw retryError;
    }
  }
}

module.exports = {
  isManagedSessionCompatibilityError,
  isManagedStudyCreditError,
  performManagedCramPlanWithCompatibility,
  toManagedCramPlanErrorResult,
};
