"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "var(--color-bg)", color: "var(--color-text)", fontFamily: "system-ui, sans-serif" }}>
        <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0" style={{ background: "var(--color-bg)" }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[200px]" style={{ background: "color-mix(in srgb, var(--color-crimson) 8%, transparent)" }} />
          </div>

          <div className="relative z-10 text-center max-w-lg">
            {/* 500 */}
            <h1
              style={{
                fontSize: "clamp(5rem, 15vw, 10rem)",
                fontFamily: "system-ui, sans-serif",
                fontWeight: 900,
                letterSpacing: "0.02em",
                lineHeight: 1,
                margin: 0,
                background: "linear-gradient(135deg, var(--color-gold-bright) 0%, var(--color-flame) 35%, var(--color-crimson) 70%, var(--color-crimson-deep) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              500
            </h1>

            {/* Divider */}
            <div
              className="w-16 h-px mx-auto my-6"
              style={{ background: "linear-gradient(90deg, transparent, var(--color-crimson), transparent)" }}
            />

            <p style={{ fontSize: 14, color: "var(--color-text-muted)", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 600 }}>
              Internal Server Error
            </p>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginTop: 8, marginBottom: 40 }}>
              Something broke on our end. Please try again.
            </p>

            <button
              onClick={reset}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "14px 32px",
                background: "linear-gradient(135deg, var(--color-crimson), var(--color-crimson-deep))",
                color: "white",
                border: "1px solid color-mix(in srgb, var(--color-crimson) 30%, transparent)",
                borderRadius: 9999,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              <svg style={{ width: 16, height: 16, opacity: 0.7 }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
              </svg>
              TRY AGAIN
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
