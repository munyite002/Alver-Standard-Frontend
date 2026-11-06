import type { ElementType } from "react";

// Only figures that signal something carry colour. Everything else stays neutral, so red keeps meaning "look at this".
const TONES: Record<string, string> = {
    rose: "text-danger-text",
    red: "text-danger-text",
    amber: "text-warn-text",
    emerald: "text-ok-text",
    green: "text-ok-text",
};

export function StatTile({ label, value, sub, icon: Icon, color, delay = 0 }: {
    label: string;
    value: string | number;
    sub?: string;
    icon: ElementType;
    color?: string;
    delay?: number;
}) {
    // A count of zero is not an alert, whatever the tile usually warns about.
    const tone = String(value) === "0" ? "" : TONES[color ?? ""] ?? "";

    return (
        <div className="av-panel animate-in flex items-start justify-between gap-3 px-5 py-4" style={{ animationDelay: `${delay}ms` }}>
            <div className="min-w-0">
                <p className="av-label text-[10.5px] leading-none text-muted-foreground">{label}</p>
                <p className={`av-display av-num mt-2.5 text-2xl leading-none font-semibold tracking-[-0.02em] ${tone || "text-foreground"}`}>{value}</p>
                {sub && <p className="mt-2 text-xs text-muted-foreground">{sub}</p>}
            </div>
            <Icon className={`h-4 w-4 flex-shrink-0 ${tone || "text-muted-foreground"}`} aria-hidden />
        </div>
    );
}
