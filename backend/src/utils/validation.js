function formatZodError(result) {
  const firstIssue = result.error.issues[0];

  if (!firstIssue) {
    return "Invalid request";
  }

  const field = firstIssue.path.join(".");

  return field ? `${field}: ${firstIssue.message}` : firstIssue.message;
}

module.exports = {
  formatZodError,
};
