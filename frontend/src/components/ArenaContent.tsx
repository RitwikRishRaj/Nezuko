import { memo, useState } from "react";
import { Swords, Users, Target, Clock, Trophy, ChevronRight } from "lucide-react";

const MODES = [
  { id: "1v1", icon: Swords, label: "1 v 1", desc: "Duel a single opponent in real-time", tag: "Popular" },
  { id: "team", icon: Users, label: "Team vs Team", desc: "Squad up and battle rival teams", tag: "2–5 players" },
  { id: "practice", icon: Target, label: "Self Practice", desc: "Sharpen skills at your own pace", tag: "No ranking" },
];

const EVENTS = [
  { id: 1, title: "Spring Sprint 2026", tier: "S-Tier", status: "live" as const, time: "2h 14m left", prize: "$500" },
  { id: 2, title: "Algorithm Blitz", tier: "A-Tier", status: "live" as const, time: "48m left", prize: "$150" },
  { id: 3, title: "Night Owl Clash", tier: "B-Tier", status: "open" as const, time: "Starts in 35m", prize: "$80" },
  { id: 4, title: "Weekend Warrior", tier: "A-Tier", status: "open" as const, time: "Starts in 2h", prize: "$120" },
  { id: 5, title: "Speed Coding #47", tier: "S-Tier", status: "full" as const, time: "—", prize: "$300" },
];

const ModeCard = memo(function ModeCard({ mode }: { mode: (typeof MODES)[number] }) {
  const Icon = mode.icon;
  return (
    <button className="group w-full text-left rounded-lg border border-white/[0.08] bg-white/[0.03] p-4 transition-all hover:border-white/[0.15] hover:bg-white/[0.05]">
      <div className="flex items-start justify-between mb-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white/[0.06]">
          <Icon size={16} className="text-white/60 group-hover:text-white transition-colors" strokeWidth={1.8} />
        </div>
        <span className="text-[10px] font-medium text-white/50 border border-white/[0.08] rounded px-1.5 py-0.5">
          {mode.tag}
        </span>
      </div>
      <h3 className="text-[13px] font-medium text-white/90">
        {mode.label}
      </h3>
      <p className="mt-0.5 text-[12px] text-white/40 leading-relaxed">
        {mode.desc}
      </p>
      <div className="mt-3 flex items-center gap-1 text-[11px] text-white/40 group-hover:text-white/80 transition-colors">
        Enter
        <ChevronRight size={11} />
      </div>
    </button>
  );
});

const StatusBadge = memo(function StatusBadge({ status }: { status: "live" | "open" | "full" }) {
  if (status === "live")
    return (
      <span className="flex items-center gap-1.5 text-[10px] font-medium text-rose-500">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
        Live
      </span>
    );
  if (status === "open")
    return (
      <span className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-500">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Open
      </span>
    );
  return (
    <span className="flex items-center gap-1.5 text-[10px] font-medium text-white/30">
      <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
      Full
    </span>
  );
});

const EventRow = memo(function EventRow({ event }: { event: (typeof EVENTS)[number] }) {
  const isJoinable = event.status !== "full";
  return (
    <div className="flex items-center gap-3 rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.05] transition-all px-4 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/[0.06]">
        <Trophy size={13} className="text-white/60" strokeWidth={1.8} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="truncate text-[13px] font-medium text-white/90">
            {event.title}
          </h4>
          <span className="shrink-0 text-[10px] font-medium text-white/40">
            {event.tier}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-3 text-[11px] text-white/40">
          <span className="flex items-center gap-1">
            <Clock size={10} />
            {event.time}
          </span>
          <span>{event.prize}</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <StatusBadge status={event.status} />
        <button
          disabled={!isJoinable}
          className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
            isJoinable
              ? "bg-white text-black hover:bg-white/80"
              : "bg-white/[0.04] text-white/30 cursor-not-allowed"
          }`}
        >
          {isJoinable ? "Join" : "Closed"}
        </button>
      </div>
    </div>
  );
});

const ArenaContent = memo(function ArenaContent() {
  const [filter, setFilter] = useState<"all" | "live" | "open">("all");

  const filtered =
    filter === "all"
      ? EVENTS
      : EVENTS.filter((e) =>
          filter === "live" ? e.status === "live" : e.status === "open"
        );

  return (
    <div className="space-y-6 w-full max-w-5xl mx-auto">
      <div>
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-white/40">
          Choose Mode
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {MODES.map((mode) => (
            <ModeCard key={mode.id} mode={mode} />
          ))}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
            Events
          </h2>
          <div className="flex gap-px rounded-md border border-white/[0.08] bg-white/[0.03] p-0.5">
            {(["all", "live", "open"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-[4px] px-2.5 py-1 text-[10px] font-medium transition-colors ${
                  filter === f
                    ? "bg-white/10 text-white/90"
                    : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
                }`}
              >
                {f === "all" ? "All" : f === "live" ? "Live" : "Open"}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          {filtered.map((event) => (
            <EventRow key={event.id} event={event} />
          ))}
        </div>
      </div>
    </div>
  );
});

export default ArenaContent;
