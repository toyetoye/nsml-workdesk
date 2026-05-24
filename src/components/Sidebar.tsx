"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronRight } from "lucide-react";
import { matchNavigationHref, sidebarNavigation, type NavigationNode } from "@/components/navigation";

type SidebarState = Record<string, boolean>;

export function Sidebar() {
  return (
    <SidebarTree
      items={sidebarNavigation}
      ariaLabel="Primary navigation"
      rootLabel="NSML WorkDesk"
      subtitle="Operations overview"
    />
  );
}

export function SidebarTree({
  items,
  ariaLabel,
  rootLabel,
  subtitle,
}: {
  items: NavigationNode[];
  ariaLabel: string;
  rootLabel: string;
  subtitle: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSearch = searchParams.toString();
  const [manualOpen, setManualOpen] = useState<SidebarState>({});

  const activeMap = useMemo(() => buildActiveMap(items, pathname, currentSearch), [items, pathname, currentSearch]);

  function isOpen(key: string) {
    if (activeMap.has(key)) {
      return true;
    }

    return manualOpen[key] ?? false;
  }

  function toggle(key: string) {
    setManualOpen((current) => ({
      ...current,
      [key]: !(current[key] ?? false),
    }));
  }

  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-72 border-r border-slate-900 bg-[var(--nav)] p-5 text-[var(--nav-foreground)] md:block">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-200">{rootLabel}</p>
        <p className="mt-2 text-2xl font-bold">{subtitle}</p>
      </div>

      <nav aria-label={ariaLabel} className="space-y-1.5">
        {items.map((item) => {
          const key = item.href ?? item.label;

          return (
            <SidebarNode
              key={key}
              node={item}
              depth={0}
              currentPath={pathname}
              currentSearch={currentSearch}
              isOpen={isOpen}
              toggleKey={toggle}
            />
          );
        })}
      </nav>

      <div className="absolute bottom-5 left-5 right-5 rounded-md border border-slate-600 bg-[var(--nav-soft)] p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-200">Boundary</p>
        <p className="mt-2 text-sm leading-6 text-slate-200">
          Protected NSML WorkDesk shell. No Outlook connection, email sending, or unsupported automation.
        </p>
      </div>
    </aside>
  );
}

function SidebarNode({
  node,
  depth,
  currentPath,
  currentSearch,
  isOpen,
  toggleKey,
}: {
  node: NavigationNode;
  depth: number;
  currentPath: string;
  currentSearch: string;
  isOpen: (key: string) => boolean;
  toggleKey: (key: string) => void;
}) {
  const hasChildren = Boolean(node.children?.length || node.sections?.length);
  const nodeKey = node.href ?? node.label;
  const isActive = isNodeActive(node, currentPath, currentSearch);
  const currentLabel = activeChildLabel(node, currentPath, currentSearch);
  const Icon = node.icon;
  const open = isOpen(nodeKey);

  const baseRowClass =
    depth === 0
      ? "rounded-md border border-transparent px-2 py-1.5"
      : "rounded-md border border-transparent px-2 py-1.5";

  if (!hasChildren) {
    return (
      <Link
        href={node.href ?? "#"}
        className={`flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold transition ${
          isActive
            ? "bg-[var(--nav-soft)] text-white"
            : "text-slate-200 hover:bg-[var(--nav-soft)] hover:text-white"
        } ${depth > 0 ? "ml-4" : ""}`.trim()}
      >
        {Icon ? <Icon aria-hidden size={18} /> : <span className="h-4 w-4" />}
        <span className="min-w-0 flex-1 truncate">{node.label}</span>
        {isActive ? <span className="rounded-full border border-teal-300 px-2 py-0.5 text-[10px] uppercase tracking-wide text-teal-100">Active</span> : null}
      </Link>
    );
  }

  const overviewHref = node.href;
  const showOverviewLink = Boolean(overviewHref);

  return (
    <div className={`${depth > 0 ? "ml-2" : ""}`}>
      <div
        className={`flex items-center gap-1 ${baseRowClass} ${
          isActive ? "bg-[var(--nav-soft)]" : ""
        }`.trim()}
      >
        {showOverviewLink ? (
          <Link
            href={overviewHref as string}
            className={`flex min-h-10 min-w-0 flex-1 items-center gap-3 rounded-md px-2 py-2 text-sm font-semibold transition ${
              isActive ? "text-white" : "text-slate-200 hover:text-white"
            }`}
          >
            {Icon ? <Icon aria-hidden size={18} /> : <span className="h-4 w-4" />}
            <span className="min-w-0 flex-1 truncate">{node.label}</span>
            {currentLabel ? (
              <span className="rounded-full border border-slate-500 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-200">
                {currentLabel}
              </span>
            ) : null}
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => toggleKey(nodeKey)}
            className={`flex min-h-10 min-w-0 flex-1 items-center gap-3 rounded-md px-2 py-2 text-left text-sm font-semibold transition ${
              isActive ? "text-white" : "text-slate-200 hover:text-white"
            }`}
            aria-expanded={open}
          >
            {Icon ? <Icon aria-hidden size={18} /> : <span className="h-4 w-4" />}
            <span className="min-w-0 flex-1 truncate">{node.label}</span>
            {currentLabel ? (
              <span className="rounded-full border border-slate-500 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-200">
                {currentLabel}
              </span>
            ) : null}
          </button>
        )}

        <button
          type="button"
          onClick={() => toggleKey(nodeKey)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-600 text-slate-200 transition hover:border-teal-300 hover:text-white"
          aria-label={`${open ? "Collapse" : "Expand"} ${node.label}`}
          aria-expanded={open}
        >
          {open ? <ChevronDown aria-hidden size={16} /> : <ChevronRight aria-hidden size={16} />}
        </button>
      </div>

      {open ? (
        <div className="mt-1 space-y-1 border-l border-slate-700 pl-3">
          {node.children?.map((child) => (
            <SidebarNode
              key={child.href ?? child.label}
              node={child}
              depth={depth + 1}
              currentPath={currentPath}
              currentSearch={currentSearch}
              isOpen={isOpen}
              toggleKey={toggleKey}
            />
          ))}
          {node.sections?.map((section) => {
            const active = matchNavigationHref(currentPath, currentSearch, section.href);

            return (
              <Link
                key={section.key}
                href={section.href}
                className={`flex min-h-10 items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold transition ${
                  active
                    ? "bg-teal-500/15 text-white ring-1 ring-teal-300/40"
                    : "text-slate-200 hover:bg-[var(--nav-soft)] hover:text-white"
                } ${depth > 0 ? "ml-2" : ""}`.trim()}
              >
                <span className="h-2 w-2 rounded-full bg-current/60" />
                <span className="min-w-0 flex-1 truncate">{section.label}</span>
                {active ? (
                  <span className="rounded-full border border-teal-300 px-2 py-0.5 text-[10px] uppercase tracking-wide text-teal-100">
                    Active
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function buildActiveMap(items: NavigationNode[], currentPath: string, currentSearch: string) {
  const active = new Set<string>();

  function visit(node: NavigationNode): boolean {
    const selfActive = isNodeActive(node, currentPath, currentSearch);
    const childActive = (node.children ?? []).some((child) => visit(child));
    const sectionActive = (node.sections ?? []).some((section) => matchNavigationHref(currentPath, currentSearch, section.href));
    const isActive = selfActive || childActive || sectionActive;

    if (isActive) {
      active.add(node.href ?? node.label);
    }

    return isActive;
  }

  items.forEach((item) => visit(item));
  return active;
}

function isNodeActive(node: NavigationNode, currentPath: string, currentSearch: string) {
  if (node.href && matchNavigationHref(currentPath, currentSearch, node.href)) {
    return true;
  }

  return false;
}

function activeChildLabel(node: NavigationNode, currentPath: string, currentSearch: string): string {
  const sections = node.sections ?? [];
  const activeSection = sections.find((section) => matchNavigationHref(currentPath, currentSearch, section.href));

  if (activeSection) {
    return activeSection.label;
  }

  for (const child of node.children ?? []) {
    const childLabel = activeChildLabel(child, currentPath, currentSearch);
    if (childLabel) {
      return `${child.label} / ${childLabel}`;
    }
  }

  if (node.href && matchNavigationHref(currentPath, currentSearch, node.href)) {
    return "Overview";
  }

  return "";
}
