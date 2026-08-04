export default function Footer() {
  return (
    <footer id="join" className="relative border-t border-white/[0.04] pb-16 lg:pb-0">
      <div className="fire-line" />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-16 sm:py-20">
        <div className="grid md:grid-cols-3 gap-14 lg:gap-20">
          {/* Brand */}
          <div className="md:text-center">
            <div className="flex items-center justify-center md:justify-center gap-3.5 mb-5">
              <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
              <h3 className="font-display text-xl sm:text-2xl tracking-wider">TUNISIAN PHOENIX RP</h3>
            </div>
            <p className="text-text-muted text-[13px] sm:text-sm leading-relaxed max-w-xs mx-auto md:mx-auto">
              A Tunisian FiveM Roleplay Community — Born from fire, built by the community.
            </p>
          </div>

          {/* Quick Links */}
          <div className="md:text-center">
            <h4 className="font-display text-[10px] sm:text-[11px] tracking-[0.3em] text-text-muted/60 mb-6">NAVIGATE</h4>
            <div className="space-y-3 text-[13px]">
              {[
                ["About", "#about"],
                ["Rules", "/rules"],
                ["Departments", "/departments"],
                ["Gallery", "/gallery"],
                ["Storyline", "/storyline"],
                ["FAQ", "/faq"],
                ["Staff", "/staff"],
                ["Tickets", "/tickets"],
              ].map(([label, href]) => (
                <a key={href} href={href} className="block text-text-dim/70 hover:text-text transition-all duration-300">
                  {label}
                </a>
              ))}
            </div>
          </div>

          {/* Connect */}
          <div className="md:text-center">
            <h4 className="font-display text-[10px] sm:text-[11px] tracking-[0.3em] text-text-muted/60 mb-6">CONNECT</h4>
            <div className="space-y-4">
              <div className="flex justify-center md:justify-center">
                <a
                  href="https://discord.gg/rapZCCQBv"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-fire clip-bevel-sm inline-flex items-center gap-2 text-[10px] sm:text-[11px] tracking-widest"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                    </svg>
                    JOIN DISCORD
                  </span>
                </a>
              </div>
              <div>
                <p className="text-text-muted/50 text-[10px] tracking-[0.15em] uppercase mb-1.5">Server IP</p>
                <code className="bg-white/[0.02] border border-white/[0.05] px-3.5 py-1.5 rounded text-ember text-xs inline-block font-mono">
                  connect phoenixrp.venice-hosting.com
                </code>
              </div>
            </div>
          </div>
        </div>

        <div className="fire-line mt-12 mb-6" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-text-muted text-[11px]">
          <p>&copy; {new Date().getFullYear()} Tunisian Phoenix RP. All rights reserved.</p>
          <p className="text-text-muted/30">Built with fire.</p>
        </div>
      </div>
    </footer>
  );
}
