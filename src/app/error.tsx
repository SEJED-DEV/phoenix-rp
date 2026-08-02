"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-bg relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-bg" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[200px]" style={{ background: "rgba(232,93,4,0.06)" }} />
      </div>

      <div className="relative z-10 text-center max-w-lg">
        {/* Icon */}
        <div
          className="w-20 h-20 mx-auto mb-8 flex items-center justify-center rounded-full"
          style={{
            background: "rgba(232,93,4,0.1)",
            border: "1px solid rgba(232,93,4,0.2)",
            animation: "fade-up 0.7s cubic-bezier(0.16,1,0.3,1) both",
          }}
        >
          <svg className="w-8 h-8 text-ember" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>

        {/* Divider */}
        <div
          className="w-16 h-px mx-auto mb-6"
          style={{ background: "linear-gradient(90deg, transparent, var(--color-ember), transparent)", animation: "fade-up 0.7s cubic-bezier(0.16,1,0.3,1) 0.1s both" }}
        />

        {/* Title */}
        <h1
          className="font-display tracking-[0.1em] uppercase mb-3"
          style={{ fontSize: 28, color: "var(--color-ember)", animation: "fade-up 0.7s cubic-bezier(0.16,1,0.3,1) 0.15s both" }}
        >
          Something Went Wrong
        </h1>

        {/* Message */}
        <p
          className="text-text-muted mb-10 leading-relaxed"
          style={{ fontSize: 13, animation: "fade-up 0.7s cubic-bezier(0.16,1,0.3,1) 0.2s both" }}
        >
          An unexpected error occurred. Our team has been notified.
        </p>

        {/* Retry */}
        <button
          onClick={reset}
          className="hero-btn-primary inline-flex"
          style={{ animation: "fade-up 0.7s cubic-bezier(0.16,1,0.3,1) 0.25s both" }}
        >
          <span className="hero-btn-inner">
            <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
            </svg>
            <span>TRY AGAIN</span>
          </span>
        </button>
      </div>
    </div>
  );
}
