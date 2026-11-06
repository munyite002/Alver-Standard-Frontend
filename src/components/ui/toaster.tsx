import type { ComponentProps } from "react";
import { Toaster as Sonner } from "sonner";
import { useTheme } from "@/lib/theme";

/** Sonner, in the current theme. */
export function Toaster(props: ComponentProps<typeof Sonner>) {
    const { mode } = useTheme();
    return <Sonner theme={mode} {...props} />;
}
