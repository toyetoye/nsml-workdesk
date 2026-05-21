import "server-only";

export async function retrieveMemoryContext({
  projectId: _projectId,
  query: _query,
  limit: _limit = 8,
}: {
  projectId: string;
  query: string;
  limit?: number;
}) {
  return "No relevant organizational memory found.";
}
