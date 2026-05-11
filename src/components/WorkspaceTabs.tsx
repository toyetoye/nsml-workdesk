const tabs = ["Brief", "Staff", "Tasks", "Evidence", "Risks", "Memo", "Timeline"];

export function WorkspaceTabs() {
  return (
    <div className="flex gap-2 overflow-x-auto border-b border-[#233450] pb-2">
      {tabs.map((tab, index) => (
        <button
          key={tab}
          className={`shrink-0 rounded-xl px-4 py-2 text-sm font-medium ${
            index === 2
              ? "bg-[#D8A84E] text-[#08111F]"
              : "bg-[#101B2E] text-slate-300 hover:bg-[#142238] hover:text-white"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
