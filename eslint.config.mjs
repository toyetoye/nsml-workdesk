import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Parked Staff-OS runtime files kept out of Sprint 000 verification.
    "src/actions/**",
    "src/lib/memory.ts",
    "src/lib/supabase.ts",
    "src/components/ActivityFeed.tsx",
    "src/components/AgentCard.tsx",
    "src/components/AgentOutputs.tsx",
    "src/components/ChiefOfStaffPanel.tsx",
    "src/components/DocumentsPanel.tsx",
    "src/components/EvidencePanel.tsx",
    "src/components/ExecutiveMemoPanel.tsx",
    "src/components/GenerateMemoButton.tsx",
    "src/components/IndexMemoryButton.tsx",
    "src/components/MemoryPanel.tsx",
    "src/components/MissionStatus.tsx",
    "src/components/ProjectCard.tsx",
    "src/components/ProjectCommandCenter.tsx",
    "src/components/ProjectControls.tsx",
    "src/components/ProjectWorkspaceTabs.tsx",
    "src/components/RedTeamPanel.tsx",
    "src/components/RunAgentButton.tsx",
    "src/components/RunAllAgentsButton.tsx",
    "src/components/SummaryPanel.tsx",
    "src/components/TaskBoard.tsx",
    "src/components/TaskList.tsx",
    "src/components/WorkspaceTabs.tsx",
  ]),
]);

export default eslintConfig;
