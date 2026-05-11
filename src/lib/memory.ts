import { supabase } from "@/lib/supabase";

function scoreMemory(content: string, query: string) {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((term) => term.length > 3);

  const lowerContent = content.toLowerCase();

  return terms.reduce((score, term) => {
    return lowerContent.includes(term) ? score + 1 : score;
  }, 0);
}

export async function retrieveMemoryContext({
  projectId,
  query,
  limit = 8,
}: {
  projectId: string;
  query: string;
  limit?: number;
}) {
  const { data: memories } = await supabase
    .from("memory_items")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(80);

  const ranked = (memories ?? [])
    .map((memory) => {
      const combined = `${memory.title}\n${memory.content}\n${(memory.tags ?? []).join(" ")}`;

      return {
        ...memory,
        score:
          scoreMemory(combined, query) +
          (memory.project_id === projectId ? 2 : 0),
      };
    })
    .filter((memory) => memory.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  if (ranked.length === 0) {
    return "No relevant organizational memory found.";
  }

  return ranked
    .map(
      (memory, index) => `
Memory ${index + 1}
Source Type: ${memory.source_type}
Title: ${memory.title}
Content:
${memory.content}
`
    )
    .join("\n---\n");
}
