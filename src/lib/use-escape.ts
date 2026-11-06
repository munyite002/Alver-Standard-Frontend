import { useEffect, useRef } from "react";

// Hand-built pop-ups can stack (Queue's confirm box sits on its detail view), so only the newest answers Esc.
const stack: symbol[] = [];

export function useEscape(onEscape: () => void, active = true) {
    const handler = useRef(onEscape);
    useEffect(() => {
        handler.current = onEscape;
    });

    useEffect(() => {
        if (!active) return;
        const id = Symbol();
        stack.push(id);
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !e.defaultPrevented && stack[stack.length - 1] === id) handler.current();
        };
        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("keydown", onKeyDown);
            stack.splice(stack.indexOf(id), 1);
        };
    }, [active]);
}
