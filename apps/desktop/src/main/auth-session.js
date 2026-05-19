function getManagedBackendErrorStatus(error) {
  if (!error || typeof error !== "object" || !("status" in error)) {
    return null;
  }

  const status = Number(error.status);
  return Number.isInteger(status) ? status : null;
}

function isManagedBackendAuthFailure(error) {
  const status = getManagedBackendErrorStatus(error);
  return status === 401 || status === 403;
}

function resolveStoredAuthAfterSessionRefreshFailure(storedAuth, error) {
  return isManagedBackendAuthFailure(error) ? null : storedAuth;
}

module.exports = {
  getManagedBackendErrorStatus,
  isManagedBackendAuthFailure,
  resolveStoredAuthAfterSessionRefreshFailure,
};
