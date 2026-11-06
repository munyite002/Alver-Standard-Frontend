/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";

export type ThemeMode = "light" | "dark";

type ThemeContextValue = {
    mode: ThemeMode;
    /** `from`: the control that was used; the new theme is revealed in a circle from it. */
    toggleMode: (from?: Element | null) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/* Same key the pre-paint script in index.html reads. */
const MODE_KEY = "alver-mode";

function readMode(): ThemeMode {
    try {
        return localStorage.getItem(MODE_KEY) === "light" ? "light" : "dark";
    } catch {
        return "dark";
    }
}

function applyMode(mode: ThemeMode) {
    const root = document.documentElement;
    root.classList.toggle("dark", mode === "dark");
    root.classList.toggle("light", mode === "light");
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", mode === "dark" ? "#0A0B0F" : "#F2F2EF");
}

/** Dark by default; the choice persists. */
export function ThemeProvider({ children }: { children: ReactNode }) {
    const [mode, setMode] = useState<ThemeMode>(readMode);

    useEffect(() => applyMode(mode), [mode]);

    const toggleMode = useCallback(
        (from?: Element | null) => {
            const next: ThemeMode = mode === "dark" ? "light" : "dark";
            try {
                localStorage.setItem(MODE_KEY, next);
            } catch {
                /* the choice just won't persist */
            }

            const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
            if (still || !document.startViewTransition) {
                setMode(next);
                return;
            }

            const box = from?.getBoundingClientRect();
            const x = box ? box.left + box.width / 2 : innerWidth - 80;
            const y = box ? box.top + box.height / 2 : 28;
            const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
            const transition = document.startViewTransition(() => {
                applyMode(next);
                flushSync(() => setMode(next));
            });
            transition.ready
                .then(() =>
                    document.documentElement.animate(
                        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
                        { duration: 560, easing: "cubic-bezier(0.16, 1, 0.3, 1)", pseudoElement: "::view-transition-new(root)" }
                    )
                )
                .catch(() => {});
        },
        [mode]
    );

    return <ThemeContext.Provider value={{ mode, toggleMode }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    const value = useContext(ThemeContext);
    if (!value) throw new Error("useTheme must be used inside ThemeProvider");
    return value;
}
