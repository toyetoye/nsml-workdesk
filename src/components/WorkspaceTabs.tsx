const tabs = [
  { label: "Command", href: "#command" },
  { label: "Tasks", href: "#tasks" },
  { label: "Outputs", href: "#outputs" },
  { label: "Evidence", href: "#evidence" },
  { label: "Red Team", href: "#red-team" },
  { label: "Memo", href: "#memo" },
  { label: "Memory", href: "#memory" },
  { label: "Staff", href: "#staff" },
];

export function WorkspaceTabs() {
  return (
    <div className="sticky top-0 z-20 -mx-4 border-y border-[#233450] bg-[#08111F]/95 px-4 py-3 backdrop-blur md:top-0 md:-mx-10 md:px-10">
      <div className="flex gap-2 overflow-x-auto">
        {tabs.map((tab) => (
          <a
            key={tab.href}
            href={tab.href}
            className="shrink-0 rounded-xl bg-[#101B2E] px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-[#D8A84E] hover:text-[#08111F]"
          >
            {tab.label}
          </a>
        ))}
      </div>
    </div>
  );
}
