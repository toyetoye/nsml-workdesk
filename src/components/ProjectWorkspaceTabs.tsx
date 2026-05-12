"use client";

import { useState } from "react";

const tabs = [
  "Command",
  "Tasks",
  "Outputs",
  "Evidence",
  "Red Team",
  "Memo",
  "Memory",
  "Staff",
];

export function ProjectWorkspaceTabs({
  sections,
}: {
  sections: Record<string, React.ReactNode>;
}) {
  const [activeTab, setActiveTab] = useState("Tasks");

  return (
    <section className="space-y-5">
      <div className="sticky top-0 z-20 -mx-4 border-y border-[#233450] bg-[#08111F]/95 px-4 py-3 backdrop-blur md:-mx-10 md:px-10">
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition ${
                activeTab === tab
                  ? "bg-[#D8A84E] text-[#08111F]"
                  : "bg-[#101B2E] text-slate-300 hover:bg-[#142238]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div>{sections[activeTab]}</div>
    </section>
  );
}
