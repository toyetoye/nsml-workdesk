import { StickyPageHeader } from "@/components/StickyPageHeader";
import { FleetClient } from "./FleetClient";
import {
  listCases,
  listIntakeItems,
  listVesselHealthItems,
} from "@/lib/persistence/repository";
import { vesselWorkspaces } from "@/lib/mock-data";

const VESSELS = [
  {
    slug: "lng-portharcourt-ii",
    name: "LNG Port Harcourt II",
    shortName: "LNG PHC II",
    type: "LNG Carrier",
    assignment: "LNG PORTHARCOURT II",
    href: "/vessels/lng-portharcourt-ii",
  },
  {
    slug: "lpg-alfred-temile",
    name: "LPG Alfred Temile",
    shortName: "LPG AT",
    type: "LPG Tanker",
    assignment: "LPG ALFRED TEMILE",
    href: "/vessels/lpg-alfred-temile",
  },
  {
    slug: "lpg-alfred-temile-10",
    name: "LPG Alfred Temile 10",
    shortName: "LPG AT10",
    type: "LPG Tanker",
    assignment: "LPG ALFRED TEMILE 10",
    href: "/vessels/lpg-alfred-temile-10",
  },
];

export default async function FleetPage() {
  const [allCases, allIntake, phcHealth, atHealth, at10Health] = await Promise.all([
    listCases(),
    listIntakeItems(),
    listVesselHealthItems("lng-portharcourt-ii"),
    listVesselHealthItems("lpg-alfred-temile"),
    listVesselHealthItems("lpg-alfred-temile-10"),
  ]);

  const healthByVessel: Record<string, typeof phcHealth> = {
    "lng-portharcourt-ii": phcHealth,
    "lpg-alfred-temile": atHealth,
    "lpg-alfred-temile-10": at10Health,
  };

  const vesselData = VESSELS.map((v) => {
    const cases = allCases.filter((c) => c.workspace_key === v.slug);
    const intake = allIntake.filter((i) => i.workspace_assignment === v.assignment);
    const health = healthByVessel[v.slug] ?? [];

    const needReply = cases.filter((c) => c.status === "Pending My Reply").length
      + intake.filter((i) => i.status === "pending-my-reply").length;

    const openMatters = cases.filter(
      (c) => !["Resolved", "Closed", "Archived"].includes(c.status),
    ).length + intake.filter((i) => i.status !== "unclassified").length;

    const monitoring = intake.filter((i) => i.status === "monitoring").length;

    const flags = health.filter((h) => h.status === "flag" || h.status === "critical").length;
    const watches = health.filter((h) => h.status === "watch").length;

    // Health score: 100 - (flags * 20) - (watches * 8), min 0
    const healthScore = Math.max(0, 100 - flags * 20 - watches * 8);

    const healthSignal: "critical" | "issue" | "watch" | "good" =
      flags > 1 ? "critical"
      : flags === 1 ? "issue"
      : watches > 0 ? "watch"
      : "good";

    return {
      ...v,
      needReply,
      openMatters,
      monitoring,
      healthScore,
      healthSignal,
      healthFlags: flags,
    };
  });

  const totalNeedReply = vesselData.reduce((s, v) => s + v.needReply, 0);
  const totalFlags = vesselData.reduce((s, v) => s + v.healthFlags, 0);

  return (
    <section className="space-y-0">
      <StickyPageHeader
        eyebrow="NSML WorkDesk"
        title="Fleet"
        description={
          totalNeedReply > 0
            ? `${totalNeedReply} item${totalNeedReply === 1 ? "" : "s"} need your reply across your fleet.`
            : totalFlags > 0
            ? `${totalFlags} health flag${totalFlags === 1 ? "" : "s"} across your fleet — check vessel detail.`
            : "Fleet overview — all three vessels."
        }
        primaryAction={{ href: "/morning", label: "Morning view" }}
      />
      <FleetClient vessels={vesselData} />
    </section>
  );
}
