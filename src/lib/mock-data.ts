export const projects = [
  {
    id: "inverter-platform",
    name: "Inverter Monitoring Platform",
    status: "Researching",
    decisionQuestion:
      "Should we build an MVP for a multi-brand inverter monitoring platform in Nigeria?",
    agents: ["Chief of Staff", "Technical Architect", "Market Analyst", "Red Team Critic"],
    confidence: "Medium",
  },
  {
    id: "crypto-sim",
    name: "Crypto Simulation Funnel",
    status: "Scoping",
    decisionQuestion:
      "Which strategy survivors should be promoted from simulation to deeper validation?",
    agents: ["Chief of Staff", "Research Analyst", "Financial Analyst"],
    confidence: "Early",
  },
  {
    id: "ev-conversion",
    name: "Jaguar EV Conversion Business Case",
    status: "Idea",
    decisionQuestion:
      "Can a premium classic EV conversion be built locally with acceptable cost and reliability?",
    agents: ["Technical Architect", "Financial Analyst", "Implementation Planner"],
    confidence: "Early",
  },
];

export const agents = [
  {
    name: "Chief of Staff",
    role: "Breaks ideas into projects, workstreams, tasks, and decisions.",
    status: "Core",
  },
  {
    name: "Research Analyst",
    role: "Finds sources, prior work, papers, competitors, and case studies.",
    status: "Core",
  },
  {
    name: "Technical Architect",
    role: "Tests feasibility, architecture, integration routes, and engineering risk.",
    status: "Core",
  },
  {
    name: "Market Analyst",
    role: "Maps customers, competitors, demand, pricing, and adoption barriers.",
    status: "Core",
  },
  {
    name: "Financial Analyst",
    role: "Builds CAPEX, OPEX, revenue assumptions, and unit economics.",
    status: "Core",
  },
  {
    name: "Red Team Critic",
    role: "Challenges assumptions and explains why the idea could fail.",
    status: "Core",
  },
  {
    name: "Executive Writer",
    role: "Turns research into investor memos, board papers, and decision briefs.",
    status: "Core",
  },
  {
    name: "Implementation Planner",
    role: "Converts decisions into milestones, owners, dependencies, and next actions.",
    status: "Core",
  },
];

export const evidence = [
  {
    claim: "Many hybrid inverter ecosystems are fragmented by manufacturer apps.",
    source: "Placeholder: vendor docs / installer interviews",
    reliability: "Medium",
    used: true,
  },
  {
    claim: "An MVP can begin with three high-volume inverter brands before expanding.",
    source: "Internal assumption pending validation",
    reliability: "Low",
    used: false,
  },
  {
    claim: "Evidence must be stored separately from agent opinions.",
    source: "Staff OS design principle",
    reliability: "High",
    used: true,
  },
];

export const projectTasks = [
  {
    id: "task-1",
    projectId: "inverter-platform",
    title: "Map common inverter data access routes",
    agent: "Technical Architect",
    status: "To Investigate",
    confidence: "Medium",
    evidenceCount: 0,
    priority: "High",
  },
  {
    id: "task-2",
    projectId: "inverter-platform",
    title: "Identify top inverter brands used by Nigerian installers",
    agent: "Market Analyst",
    status: "Researching",
    confidence: "Low",
    evidenceCount: 2,
    priority: "High",
  },
  {
    id: "task-3",
    projectId: "inverter-platform",
    title: "Test business model assumptions for installers and households",
    agent: "Financial Analyst",
    status: "Review",
    confidence: "Low",
    evidenceCount: 1,
    priority: "Medium",
  },
  {
    id: "task-4",
    projectId: "inverter-platform",
    title: "Challenge MVP feasibility and failure modes",
    agent: "Red Team Critic",
    status: "Validated",
    confidence: "Medium",
    evidenceCount: 3,
    priority: "High",
  },
  {
    id: "task-5",
    projectId: "crypto-sim",
    title: "Define promotion criteria for strategy survivors",
    agent: "Chief of Staff",
    status: "To Investigate",
    confidence: "Early",
    evidenceCount: 0,
    priority: "High",
  },
  {
    id: "task-6",
    projectId: "ev-conversion",
    title: "Compare drivetrain options for reliability and sourcing",
    agent: "Technical Architect",
    status: "To Investigate",
    confidence: "Early",
    evidenceCount: 0,
    priority: "High",
  },
];
