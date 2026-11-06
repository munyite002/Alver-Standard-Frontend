import { Link } from "react-router-dom";

export default function NotFound() {
    return (
        <main className="relative isolate flex min-h-dvh items-center justify-center overflow-hidden bg-background p-6">
            <div className="auth-ambient" aria-hidden />
            <div className="relative max-w-md text-center">
                <p className="av-display av-num av-rise text-[clamp(72px,14vw,128px)] leading-none font-bold tracking-[-0.05em] text-foreground">
                    404<span className="text-signal">.</span>
                </p>
                <h1 className="av-display av-rise mt-4 text-2xl font-semibold tracking-[-0.02em] text-foreground" style={{ animationDelay: "80ms" }}>
                    Page not found
                </h1>
                <p className="av-rise mt-3 leading-relaxed text-text-secondary" style={{ animationDelay: "140ms" }}>
                    The page you're looking for doesn't exist or has moved.
                </p>
                <div className="av-rise mt-8 flex justify-center" style={{ animationDelay: "200ms" }}>
                    <Link
                        to="/dashboard"
                        className="auth-cta auth-focus inline-flex h-12 items-center justify-center rounded-lg px-6 text-[15px] font-semibold"
                        onClick={() =>
                            localStorage.setItem("activeTab", "Dashboard")
                        }
                    >
                        Return Home
                    </Link>
                </div>
            </div>
        </main>
    );
}
