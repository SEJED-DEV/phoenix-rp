import type { Metadata } from "next";
import { getSiteBranding } from "@/lib/site-branding";

export async function generateMetadata(): Promise<Metadata> {
  const { siteName } = await getSiteBranding();
  return {
    title: `Staff Guide — ${siteName}`,
    description: "How things work on the Phoenix RP staff panel: tickets, applications, members, shop, and more.",
  };
}

/* ─── Small building blocks ─────────────────────────────────────────── */

function Section({
  id,
  num,
  title,
  intro,
  children,
}: {
  id: string;
  num: string;
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 mb-16">
      <div className="flex items-baseline gap-3 mb-1">
        <span className="text-[10px] font-bold tracking-[0.2em] text-crimson uppercase">{num}</span>
        <h2 className="font-display text-2xl tracking-[0.12em] uppercase text-white">{title}</h2>
      </div>
      {intro && <p className="text-sm text-text-muted leading-relaxed mb-6">{intro}</p>}
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function Sub({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[15px] font-bold text-text mb-2">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-text-dim leading-relaxed">{children}</p>;
}

function Inline({ children }: { children: React.ReactNode }) {
  return (
    <code className="px-1.5 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.08] text-[12px] text-gold font-mono">
      {children}
    </code>
  );
}

function Callout({
  tone,
  title,
  children,
}: {
  tone: "info" | "warn" | "tip";
  title: string;
  children: React.ReactNode;
}) {
  const styles = {
    info: { border: "border-sky-500/25", bg: "bg-sky-500/[0.05]", label: "text-sky-400", dot: "bg-sky-400" },
    warn: { border: "border-amber-500/25", bg: "bg-amber-500/[0.05]", label: "text-amber-400", dot: "bg-amber-400" },
    tip: { border: "border-emerald-500/25", bg: "bg-emerald-500/[0.05]", label: "text-emerald-400", dot: "bg-emerald-400" },
  }[tone];
  return (
    <div className={`rounded-xl border ${styles.border} ${styles.bg} px-4 py-3`}>
      <p className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider mb-1 ${styles.label}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
        {title}
      </p>
      <div className="text-[13px] text-text-dim leading-relaxed space-y-2">{children}</div>
    </div>
  );
}

function DocTable({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-white/[0.08] bg-white/[0.02]">
            {head.map((h) => (
              <th key={h} className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.15em] text-text-muted whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.04]">
          {rows.map((r, i) => (
            <tr key={i} className="hover:bg-white/[0.02] transition-colors">
              {r.map((c, j) => (
                <td key={j} className="px-4 py-2.5 text-[13px] text-text-dim align-top">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Steps({ items }: { items: React.ReactNode[] }) {
  return (
    <ol className="space-y-3">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3">
          <span className="w-6 h-6 rounded-full bg-crimson/15 border border-crimson/30 text-crimson text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
            {i + 1}
          </span>
          <div className="text-[13px] text-text-dim leading-relaxed pt-0.5">{item}</div>
        </li>
      ))}
    </ol>
  );
}

/* ─── Sidebar navigation ────────────────────────────────────────────── */

const NAV = [
  { id: "access", label: "Access & Roles" },
  { id: "dashboard", label: "The Dashboard" },
  { id: "tickets", label: "Tickets" },
  { id: "applications", label: "Applications" },
  { id: "config", label: "Config & Questions" },
  { id: "streamers", label: "Streamers" },
  { id: "shop", label: "Shop" },
  { id: "logs", label: "Activity Logs" },
  { id: "members", label: "Members & Punishments" },
  { id: "roles", label: "Role Manager" },
  { id: "notifications", label: "Discord Notifications" },
  { id: "best-practices", label: "Best Practices" },
  { id: "faq", label: "FAQ" },
];

/* ─── Page ──────────────────────────────────────────────────────────── */

export default function StaffDocsPage() {
  return (
    <main className="pt-16 lg:pt-[64px] min-h-screen bg-bg">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2 py-0.5 rounded-full border border-crimson/30 bg-crimson/10 text-crimson text-[10px] font-bold uppercase tracking-wider">
              Staff Only
            </span>
            <span className="px-2 py-0.5 rounded-full border border-white/[0.08] bg-white/[0.03] text-text-muted text-[10px] font-semibold uppercase tracking-wider">
              v1.0
            </span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl tracking-[0.1em] uppercase mb-3">
            <span className="fire-text">Staff</span> <span className="text-white">Guide</span>
          </h1>
          <p className="text-sm text-text-muted leading-relaxed max-w-2xl">
            Everything you need to know about how the Phoenix RP website works for the staff team — from handling
            tickets and reviewing applications to issuing punishments. Read it top to bottom once, then keep it as a
            reference.
          </p>
        </div>

        <div className="lg:flex lg:gap-10">
          {/* Sidebar */}
          <aside className="hidden lg:block w-56 shrink-0">
            <nav className="sticky top-24 space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted mb-3 px-3">On this page</p>
              {NAV.map((n) => (
                <a
                  key={n.id}
                  href={`#${n.id}`}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] text-text-muted hover:text-white hover:bg-white/[0.04] transition-colors"
                >
                  <span className="w-1 h-1 rounded-full bg-current opacity-50" />
                  {n.label}
                </a>
              ))}
            </nav>
          </aside>

          {/* Mobile section jump */}
          <div className="lg:hidden flex gap-2 overflow-x-auto pb-4 mb-6 -mx-4 px-4">
            {NAV.map((n) => (
              <a
                key={n.id}
                href={`#${n.id}`}
                className="shrink-0 px-3 py-1.5 rounded-full border border-white/[0.08] text-[12px] text-text-muted hover:text-white hover:border-white/[0.15] transition-colors"
              >
                {n.label}
              </a>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* ── 1. Access & Roles ─────────────────────────── */}
            <Section
              id="access"
              num="01"
              title="Access & Roles"
              intro="The staff panel is restricted to the Phoenix RP staff team. Here is how access works and which roles can do what."
            >
              <P>
                The website is connected to the Phoenix RP Discord server. Your Discord account is your identity on the
                site, and your <strong className="text-text">Discord roles</strong> decide what you can access. Roles are
                re-read live from Discord on every request, so if a role changes in Discord it takes effect immediately —
                no need to log out or clear anything.
              </P>

              <Sub title="Access tiers">
                <DocTable
                  head={["Tier", "Roles", "What it unlocks"]}
                  rows={[
                    [
                      <strong key="a" className="text-white">Staff</strong>,
                      "Staff Team",
                      <>Access to the <Inline>/staff-panel</Inline>, dashboard, tickets, and member management.</>,
                    ],
                    [
                      <strong key="b" className="text-white">Management</strong>,
                      "Creator · Founder · Co-Founder · Server Supervisor · Server Manager · Discord Manager · Admin Supervisor",
                      <>Everything Staff can do, plus reviewing <a className="text-gold hover:underline" href="#applications">applications</a>.</>,
                    ],
                    [
                      <strong key="c" className="text-white">Owner</strong>,
                      "Creator · Founder",
                      "Highest tier. Can review applications and is the final escalation point.",
                    ],
                    [
                      <strong key="d" className="text-white">Config access</strong>,
                      "Management & Owner only",
                      <>Control who can edit application questions, who can review applications, and who can approve or deny them via the <a className="text-gold hover:underline" href="#config">Config</a> page. Granted editors (individual members or whole roles) can edit questions for a specific application even if they are Staff-tier.</>,
                    ],
                    [
                      <strong key="e" className="text-white">Application reviewer</strong>,
                      "Any Staff Team member granted access in Config",
                      <>Can <em>view</em> the applications of a department a Manager has granted them. Reviewers can read submissions but <strong className="text-text">cannot approve or deny</strong> unless they are also granted as an <em>application approver</em>.</>,
                    ],
                    [
                      <strong key="f" className="text-white">Application approver</strong>,
                      "Any Staff Team member granted in Config",
                      <>Granted per application from the <strong className="text-text">Application Approvers</strong> section on that application&apos;s card. Approvers can <em>approve or deny</em> submissions for that application, for anything they can view.</>,
                    ],
                    [
                      <strong key="g" className="text-white">Role Manager</strong>,
                      "Any Staff Team member (scope-limited by Discord role position)",
                      <>Grant or remove <em>lower</em> roles from the <a className="text-gold hover:underline" href="#roles">Role Manager</a> page. You can only touch roles positioned below your own highest Discord role, so senior staff can always override junior changes.</>,
                    ],
                  ]}
                />
              </Sub>

              <Callout tone="info" title="One rule of thumb">
                <p>
                  If you hold the <strong className="text-text">Staff Team</strong> role you can use the panel. Management
                  and Owner tiers can approve or deny applications by default. If a Manager grants you access as an{" "}
                  <em>application reviewer</em>, you can read a department&apos;s applications but can only decide if you are
                  also granted as an <em>application approver</em>. If a
                  page says “Access denied”, it usually means you are a Staff member trying to review applications without
                  a grant — ask a Manager.
                </p>
              </Callout>

              <Sub title="High-rank ticket access">
                <P>
                  Certain ticket types (Ban Appeal, Complaint, Refund, High Rank, Partnership, Donation) can only be
                  opened by high-ranking members. Bug Report tickets are Developer-only. Those restricted types are also
                  only visible to high-ranking members — general Staff Team members only see General Support tickets.
                </P>
              </Sub>
            </Section>

            {/* ── 2. Dashboard ─────────────────────────────── */}
            <Section
              id="dashboard"
              num="02"
              title="The Dashboard"
              intro="Your landing page after signing in — a live snapshot of the community and recent staff activity."
            >
              <DocTable
                head={["Widget", "What it shows"]}
                rows={[
                  ["Total Members", "The Discord server's member count."],
                  ["Pending Applications", "Applications waiting for a management review."],
                  ["Open Tickets", "Tickets that have not been closed yet."],
                  ["Recent Activity", "The last 15 staff actions, logged automatically (punishments, application decisions)."],
                ]}
              />
              <Callout tone="tip" title="Why this matters">
                <p>
                  Check the dashboard when you start a shift. If open tickets are high or applications are pending, those
                  are the first places to look.
                </p>
              </Callout>
            </Section>

            {/* ── 3. Tickets ───────────────────────────────── */}
            <Section
              id="tickets"
              num="03"
              title="Tickets"
              intro="Tickets are the main support tool. Members open them on the website and the conversation happens in a thread on the site. You are the person who helps them."
            >
              <P>
                When a member opens a ticket, a notification is posted to the Discord tickets channel with an{" "}
                <Inline>@here</Inline> ping, and the ticket appears in the tickets list. Anyone with the Staff Team role
                can view and reply to General Support tickets; restricted ticket types are only visible to high-ranking
                members.
              </P>

              <Sub title="Ticket types">
                <DocTable
                  head={["Type", "Who can open it"]}
                  rows={[
                    ["General Support", "Anyone."],
                    ["Ban Appeal", "High-rank members only."],
                    ["Complaint", "High-rank members only."],
                    ["Bug Report", "Developers only."],
                    ["Refund", "High-rank members only."],
                    ["High Rank", "High-rank members only."],
                    ["Partnership", "High-rank members only."],
                    ["Donation", "High-rank members only."],
                  ]}
                />
                <P>
                  <strong className="text-text">High-rank</strong> means Creator, Founder, Co-Founder, Server Supervisor,
                  Server Manager, Discord Manager, Admin Supervisor, or Developer.
                </P>
              </Sub>

              <Sub title="Statuses">
                <DocTable
                  head={["Status", "Meaning", "Suggested use"]}
                  rows={[
                    [<strong key="o" className="text-emerald-400">Open</strong>, "Waiting for attention.", "Set when you start working a fresh ticket."],
                    [<strong key="i" className="text-amber-400">In Progress</strong>, "A staff member is handling it.", "Auto-applied when you assign the ticket to yourself or post the first reply."],
                    [<strong key="c" className="text-text-muted">Closed</strong>, "Resolved or no longer active.", "Set once the issue is fully resolved or abandoned."],
                  ]}
                />
              </Sub>

              <Sub title="Priorities">
                <DocTable
                  head={["Priority", "Meaning"]}
                  rows={[
                    [<strong key="l" className="text-slate-400">Low</strong>, "General / non-urgent."],
                    [<strong key="m" className="text-blue-400">Medium</strong>, "Default for new tickets. Normal handling time."],
                    [<strong key="h" className="text-orange-400">High</strong>, "Needs faster attention."],
                    [<strong key="u" className="text-red-400">Urgent</strong>, "Immediate attention required."],
                  ]}
                />
              </Sub>

              <Sub title="How to handle a ticket">
                <Steps
                  items={[
                    <>
                      Open the ticket from the <strong className="text-text">Tickets</strong> page. Read the description
                      and existing messages carefully before replying.
                    </>,
                    <>
                      <strong className="text-text">Assign</strong> the ticket to yourself so the team knows who owns it.
                      This automatically moves it to <em>In Progress</em>.
                    </>,
                    <>
                      Reply to the member in the thread. You can use the <em>internal note</em> toggle to write a note
                      that <strong className="text-text">only staff can see</strong> — the member will never see it.
                    </>,
                    <>
                      Use the <strong className="text-text">Remind</strong> button to nudge the member if they have gone
                      quiet. It sends them a direct message; if their DMs are closed it is posted to the ticket-reminders
                      channel instead.
                    </>,
                    <>
                      Once resolved, set the status to <strong className="text-text">Closed</strong>. If you were assigned,
                      unassign yourself or leave it — the thread stays readable either way.
                    </>,
                  ]}
                />
              </Sub>

              <Sub title="Creating a ticket">
                <P>
                  Press <strong className="text-text">New Ticket</strong> on the tickets page, pick a type, enter a
                  subject and description, then press Submit. A confirmation prompt will appear showing the selected type
                  and subject — review it carefully before confirming, since changing the type later may cause you to
                  lose access to the ticket.
                </P>
              </Sub>

              <Sub title="Staff controls (top of the thread)">
                <DocTable
                  head={["Control", "What it does"]}
                  rows={[
                    ["Status dropdown", "Switch between Open / In Progress / Closed."],
                    ["Priority dropdown", "Raise or lower the priority level."],
                    ["Type dropdown", "Change the ticket type. A confirmation prompt warns you that you may lose access if the new type is restricted to roles you don't hold."],
                    ["Assign / Unassign", "Claim the ticket or release it back to the pool."],
                    ["Remind", "DM the member a reminder; falls back to the #ticket-reminders channel if DMs are closed."],
                  ]}
                />
              </Sub>

              <Callout tone="warn" title="Internal notes are visible to all staff">
                <p>
                  Anything written as an internal note can be seen by every staff member, so keep it professional and
                  factual. Members never see internal notes, but they <em>do</em> see everything else in the thread.
                </p>
              </Callout>

              <Callout tone="warn" title="Changing ticket type may cause loss of access">
                <p>
                  If you change a ticket&apos;s type to one restricted to higher-ranking roles, you may lose access to
                  that ticket. A confirmation prompt will warn you before the change goes through. If you accidentally
                  change the type and lose access, ask a Manager or Owner to change it back.
                </p>
              </Callout>

              <Callout tone="tip" title="Closed tickets">
                <p>
                  You can still read a closed ticket later. Only members are blocked from replying to closed tickets — you
                  can reopen one at any time by switching its status back to <em>Open</em>.
                </p>
              </Callout>
            </Section>

            {/* ── 4. Applications ──────────────────────────── */}
            <Section
              id="applications"
              num="04"
              title="Applications"
              intro="Applications are how members apply for whitelists, departments, families, and staff. Reviewing them requires Management tier access."
            >
              <P>
                Applications arrive through the apply pages on the site and land in the applications area of the staff
                panel. When a new application is submitted, a notification is posted to the Discord applications channel.
                Management and Owner tiers can review every application; Staff-tier members can only see a department&apos;s
                applications if a Manager has granted them access (see below).
              </P>

              <Sub title="Who can see applications">
                <DocTable
                  head={["Access", "What you can do"]}
                  rows={[
                    [
                      <strong key="m" className="text-white">Management &amp; Owner</strong>,
                      <>See and review all applications — approve, deny, and add review notes.</>,
                    ],
                    [
                      <strong key="v" className="text-white">Application reviewer</strong>,
                      <>Staff members a Manager granted in <a className="text-gold hover:underline" href="#config">Config</a>. They can open a department&apos;s queue and read individual applications, but the review buttons are hidden — they cannot approve or deny.</>,
                    ],
                  ]}
                />
                <P>
                  A reviewer only sees the departments they were granted. The applications summary only shows those
                  departments, so their panel never exposes the rest.
                </P>
              </Sub>

              <Sub title="What people can apply for">
                <DocTable
                  head={["Application", "Purpose"]}
                  rows={[
                    ["Whitelist", "Standard whitelist application."],
                    ["Police", "Law-enforcement department."],
                    ["EMS", "Emergency Medical Services."],
                    ["Mechanic", "Mechanic department."],
                    ["Family", "Family applications."],
                    ["DOJ", "Department of Justice."],
                    ["Staff Team", "Applications to join the staff team."],
                    ["Ban Appeal", "Requests to lift a ban."],
                  ]}
                />
              </Sub>

              <Sub title="The review process">
                <Steps
                  items={[
                    <>
                      From the dashboard, open <strong className="text-text">Applications</strong>. You will see a summary
                      of each department with pending counts.
                    </>,
                    <>
                      Click a department to open its queue. Use the <em>All / Pending / Approved / Denied</em> filters to
                      focus on what needs your attention.
                    </>,
                    <>
                      Select an application and read the answers carefully. Cross-check anything that matters (age, name,
                      activity) against what you can verify.
                    </>,
                    <>
                      Add a <strong className="text-text">review note</strong> if useful, then press{" "}
                      <strong className="text-text">Approve</strong> or <strong className="text-text">Deny</strong>. This
                      is final — the applicant is notified by DM and a Discord post, so double-check before you decide.
                    </>,
                  ]}
                />
              </Sub>

              <Sub title="What happens after you decide">
                <P>
                  Approving or denying an application records it, logs the action to the activity feed, posts an{" "}
                  <Inline>@here</Inline> announcement to the applications channel, and sends the applicant a direct
                  message with your review note. The applicant cannot see your internal reasoning.
                </P>
              </Sub>

              <Callout tone="warn" title="Decisions are logged">
                <p>
                  Every approval and denial is logged with your name and review note. Be consistent and follow the
                  department's requirements — if you are unsure about a borderline application, ask a senior manager
                  before deciding.
                </p>
              </Callout>
            </Section>

            {/* ── 5. Config & Questions ───────────────────── */}
            <Section
              id="config"
              num="05"
              title="Config & Questions"
              intro="The Config page controls who can edit each application's questions, and lets you build the exact forms applicants see."
            >
              <P>
                The Config page lives at <Inline>/staff-panel/config</Inline> and is restricted to{" "}
                <strong className="text-text">Management &amp; Owner</strong> — though users granted question-editor access
                can also open it (they see only their own departments). It is a hub: a card for every on-site application
                (Whitelist, Family, Staff Team, Ban Appeal), plus the FAQ and Shop editors. Open a department card to manage
                that application&apos;s question editors, reviewers, and approvers, or jump straight into the question editor.
              </P>
              <P>
                Each application&apos;s page lives at <Inline>/staff-panel/config/&lt;department&gt;</Inline> (for example{" "}
                <Inline>/staff-panel/config/family</Inline>) and holds every grant section for that one application.
              </P>

              <Sub title="Granting editors">
                <P>
                  Editors can be an <strong className="text-text">individual Discord member</strong> (search by username) or
                  a <strong className="text-text">whole Discord role</strong> (picked from a dropdown). Granting a role means
                  every member holding that role can edit that application&apos;s questions. Revoking a grant removes the access
                  immediately.
                </P>
              </Sub>

              <Sub title="Granting application reviewers">
                <P>
                  Each department&apos;s page in Config also has an{" "}
                  <strong className="text-text">Application Reviewers</strong> section.
                  Granting a member or role there lets them <em>view</em> that application&apos;s submissions — the queue and
                  individual applications appear in their Applications page, but only for departments you grant them.
                </P>
                <Callout tone="warn" title="Viewers see everything for that department">
                  <p>
                    Reviewers can read the full submission and every applicant&apos;s Discord profile. Only grant people you
                    trust, and remember: reviewers can never approve or deny — decisions stay with Management &amp; Owner.
                    Reviewer grants are logged in the activity feed, just like editor grants.
                  </p>
                </Callout>
              </Sub>

              <Sub title="Granting application approvers">
                <P>
                  Each department&apos;s page in Config has an <strong className="text-text">Application Approvers</strong>{" "}
                  section, right below the reviewers. Members or roles granted here can{" "}
                  <strong className="text-text">approve and deny</strong>{" "}
                  applications — but only for <em>that specific application</em>, not the whole panel.
                </P>
                <Steps
                  items={[
                    <>
                      Pick a <strong className="text-text">Role</strong> or <strong className="text-text">Member</strong> just
                      like an editor or reviewer grant. Granting a role lets every holder of that role make decisions for that
                      application.
                    </>,
                    <>
                      Approvers still need viewing access to see a department&apos;s queue. Grant the same role as an{" "}
                      <strong className="text-text">Application Reviewer</strong> on the same application.
                    </>,
                    <>
                      Approve / Deny buttons appear on pending applications they can view. Management &amp; Owner can always
                      decide regardless of these grants.
                    </>,
                  ]}
                />
                <Callout tone="warn" title="Approvers make real decisions">
                  <p>
                    Approving a Whitelist application grants the applicant the interview role, and every decision notifies the
                    applicant. Approver grants are logged in the activity feed, so keep the list to people you trust.
                  </p>
                </Callout>
              </Sub>

              <Sub title="The question editor">
                <P>
                  Opening <strong className="text-text">Edit questions</strong> for an application loads its current form.
                  You can:
                </P>
                <DocTable
                  head={["Action", "How"]}
                  rows={[
                    ["Add a question", "Press “+ Add question”, then fill in the label and options."],
                    ["Remove a question", "Press the × button on a question card."],
                    ["Reorder", "Use the up / down arrows to change the order applicants see."],
                    ["Edit label & placeholder", "Edit the text directly in the card."],
                    ["Change the type", "Switch between Text, Textarea, Number, and Select (dropdown)."],
                    ["Make it required / optional", "Toggle the Required checkbox."],
                    ["Set dropdown options", "For Select questions, type one option per line."],
                    ["Reset to defaults", "Load the original question set back (then press Save)."],
                  ]}
                />
              </Sub>

              <Sub title="The question “name”">
                <P>
                  Every question has a <strong className="text-text">name</strong> (the key shown in monospace at the top of
                  each card). It is the stable identifier that ties answers to past submissions. You can change the visible
                  <em> label</em> any time, but renaming the <em>name</em> detaches that field from old answers — old
                  applications will still show their stored text under the old key.
                </P>
              </Sub>

              <Callout tone="info" title="Where changes take effect">
                <p>
                  Saved questions are live immediately: the public apply forms, the server-side required-field validation,
                  and the labels shown in application review all read from the same database table.
                </p>
              </Callout>
            </Section>

            {/* ── 6. Streamers ──────────────────────────────── */}
            <Section
              id="streamers"
              num="06"
              title="Streamers"
              intro="The streamers page showcases the community's content creators on a public roster. Authorized editors manage the list from the staff panel."
            >
              <P>
                The public streamers page at <Inline>/streamers</Inline> displays a roster of community streamers with
                their platform, live status, viewer count, and social links. Live streamers appear at the top with a glow
                indicator; offline streamers are listed below in a dimmer style. Platform filter pills let visitors narrow
                the list by Twitch, YouTube, Kick, or TikTok.
              </P>

              <Sub title="Who can manage streamers">
                <P>
                  Only the <strong className="text-text">site owner</strong> or staff members granted{" "}
                  <strong className="text-text">streamer editor</strong> access can open the streamers config at{" "}
                  <Inline>/staff-panel/config/streamers</Inline>. Access is configured by the site owner.
                </P>
              </Sub>

              <Sub title="Adding a streamer">
                <Steps
                  items={[
                    <>
                      Paste a streamer&apos;s channel URL (Twitch, YouTube, Kick, or TikTok) into the URL input. The
                      platform, username, and channel URL are detected automatically.
                    </>,
                    <>
                      For <strong className="text-text">Kick</strong> channels, the display name, avatar, and social
                      links (Twitter, Instagram, YouTube, TikTok, Discord, Facebook) are fetched from the Kick API
                      automatically. For other platforms, fill in the display name and avatar manually.
                    </>,
                    <>
                      Social links can be edited manually — add, remove, or change URLs for any supported platform.
                    </>,
                    <>
                      Press <strong className="text-text">Save</strong> to persist the list. Order can be rearranged with
                      the up / down arrows.
                    </>,
                  ]}
                />
              </Sub>

              <Sub title="Supported platforms">
                <DocTable
                  head={["Platform", "What is auto-filled"]}
                  rows={[
                    ["Kick", "Username, display name, avatar, channel URL, and social links (Twitter, Instagram, YouTube, TikTok, Discord, Facebook)."],
                    ["Twitch", "Username and channel URL. Display name and avatar must be entered manually."],
                    ["YouTube", "Channel URL and username (from channel ID). Display name and avatar must be entered manually."],
                    ["TikTok", "Username and channel URL. Display name and avatar must be entered manually."],
                  ]}
                />
                <Callout tone="info" title="Social links are fetched live from Kick">
                  <p>
                    When a Kick URL is pasted, the editor fetches social links directly from the Kick API via the
                    browser. This may occasionally fail if Kick blocks the request — you can always add or correct
                    social links manually.
                  </p>
                </Callout>
              </Sub>

              <Sub title="Live status">
                <P>
                  The public page checks live status for all platforms. Kick and Twitch use their APIs directly; YouTube
                  uses oEmbed. Live streamers are shown at the top with a colored glow and viewer count. This is
                  determined at page load — there is no background refresh.
                </P>
              </Sub>
            </Section>

            {/* ── 7. Shop ──────────────────────────────────── */}
            <Section
              id="shop"
              num="07"
              title="Shop"
              intro="The shop is what players see on the public /shop page. Management & Owner control everything about it from a single editor."
            >
              <P>
                The shop editor lives at <Inline>/staff-panel/config/shop</Inline> and is restricted to{" "}
                <strong className="text-text">Management &amp; Owner</strong>. It has two parts: the{" "}
                <strong className="text-text">item list</strong> and the <strong className="text-text">settings</strong>{" "}
                (currency label, notice, global prices, and the Discord forum source).
              </P>

              <Sub title="Items">
                <P>
                  Each item has a <strong className="text-text">photo</strong>, a <strong className="text-text">name</strong>,
                  a short <strong className="text-text">description</strong>, and one or more{" "}
                  <strong className="text-text">prices</strong>. Reorder items with the up / down arrows, toggle{" "}
                  <em>Visible</em> to hide an item without deleting it, and remove it with the × button.
                </P>
                <DocTable
                  head={["Price field", "What it is"]}
                  rows={[
                    [
                      "Value",
                      "The amount itself, e.g. 5000.",
                    ],
                    [
                      "Label",
                      "An optional name for that price option, e.g. “Car” or “VIP”. Shown in front of the value.",
                    ],
                    [
                      "Currency",
                      "Never set per price — the currency label from settings is appended after the value automatically, e.g. “Car · 5000 Credits”.",
                    ],
                  ]}
                />
              </Sub>

              <Sub title="Global prices">
                <P>
                  Prices defined under <strong className="text-text">Global prices</strong> apply to{" "}
                  <em>every item that has no prices of its own</em>. An item with its own prices always shows those
                  instead. Use this when most items share the same price structure.
                </P>
              </Sub>

              <Sub title="The notice">
                <P>
                  The notice appears at the top of the public shop page when enabled. Links work: paste a bare URL (or
                  use <Inline>[text](https://...)</Inline>) and it becomes clickable.
                </P>
              </Sub>

              <Sub title="Pulling items from Discord">
                <Steps
                  items={[
                    <>
                      Copy the forum channel ID from Discord and paste it into{" "}
                      <strong className="text-text">Discord forum channel ID</strong>.
                    </>,
                    <>
                      Press <strong className="text-text">Pull items from Discord forum</strong>. Every forum post
                      (photo + title) that isn't already in the shop is added automatically; photos are downloaded and
                      stored with the item.
                    </>,
                    <>
                      Posts without a usable image are skipped and reported so you can add them manually.
                    </>,
                  ]}
                />
                <Callout tone="info" title="Imports never duplicate">
                  <p>Already-imported posts are recognised by their forum thread and skipped on later imports.</p>
                </Callout>
              </Sub>

              <Sub title="Photos">
                <P>
                  Click the photo box on an item to upload a new image, or remove it to fall back to the default logo.
                  Photos are served by the shop image API and cropped to the card ratio on the shop page.
                </P>
              </Sub>

              <Callout tone="warn" title="Saving overwrites">
                <p>
                  Press <strong className="text-text">Save changes</strong> to apply everything — items, prices, global
                  prices, notice and settings all save together. Deleting an item is permanent once saved, so
                  double-check before saving.
                </p>
              </Callout>
            </Section>

            {/* ── 8. Activity Logs ─────────────────────────── */}
            <Section
              id="logs"
              num="08"
              title="Activity Logs"
              intro="Every staff action is recorded — punishments, application decisions, ticket actions, config changes, and question edits."
            >
              <P>
                The Logs page at <Inline>/staff-panel/logs</Inline> shows every recorded staff action in reverse
                chronological order. Each log entry captures the acting staff member, the action type, the target member,
                an optional reason, and a timestamp.
              </P>

              <Sub title="Searching and filtering">
                <DocTable
                  head={["Tool", "What it does"]}
                  rows={[
                    ["Search box", "Finds logs by actor name, target name, reason text, or the raw metadata JSON (press Enter)."],
                    ["Action dropdown", "Filters to one action type, with a live count for each type."],
                    ["Pagination", "50 entries per page; Previous / Next to browse."],
                    ["Expandable rows", "Click any log to open its full metadata JSON, IDs, and exact timestamp."],
                  ]}
                />
              </Sub>

              <Sub title="What gets logged">
                <DocTable
                  head={["Category", "Actions"]}
                  rows={[
                    ["Members", "Kicked, banned, unbanned, role changes, punishments issued/removed."],
                    ["Applications", "Approvals and denials."],
                    ["Tickets", "Assignments and closures."],
                    ["Content", "Announcements created/deleted, staff notes added/deleted."],
                    ["Config", "Editor grants/revokes, viewer grants/revokes, approver grants/revokes, question updates (full before/after diff), and shop updates (items, prices, global prices, notice)."],
                    ["Session", "Staff logins."],
                  ]}
                />
              </Sub>

              <Callout tone="warn" title="Logs are permanent">
                <p>
                  Log entries are written automatically and are not editable from the panel. If you need a log reviewed or
                  removed, contact a Developer.
                </p>
              </Callout>
            </Section>

            {/* ── 9. Members & Punishments ─────────────────── */}
            <Section
              id="members"
              num="09"
              title="Members & Punishments"
              intro="The member management page lets you search the server, inspect a member's roles and existing punishments, and issue punishments."
            >
              <Sub title="Searching for a member">
                <P>
                  Open <strong className="text-text">Members</strong> and type at least two characters of the member's
                  username. Select the correct member — double-check the username and avatar before acting, since
                  punishments are recorded against the account you select.
                </P>
              </Sub>

              <Sub title="The punishment ladder">
                <P>
                  Punishments are handled with Discord roles. There is a fixed ladder — you can only apply a punishment
                  that is <em>stronger</em> than anything the member already holds. This prevents skipping steps and keeps
                  the escalation fair.
                </P>
                <DocTable
                  head={["Step", "Role", "Severity"]}
                  rows={[
                    ["1", "Warn 1", "First warning."],
                    ["2", "Warn 2", "Second warning."],
                    ["3", "Warn 3", "Final warning."],
                    ["4", "Staff Warn 2", "Reserved for staff misconduct."],
                    ["5", "Staff Warn 3", "Reserved for staff misconduct."],
                    ["6", "Banned", "Removed from the community."],
                    ["7", "Blacklisted", "Permanently banned / excluded."],
                  ]}
                />
              </Sub>

              <Sub title="Issuing a punishment">
                <Steps
                  items={[
                    <>Find the member and confirm their identity.</>,
                    <>Choose the correct punishment role. Higher-severity options are disabled if the ladder rules don't allow them.</>,
                    <>Enter a clear reason. This reason is stored in the activity log and posted to Discord, so make it accurate and professional.</>,
                    <>Confirm. The role is applied to the member, the action is logged, and a "Punishment Issued" message is posted to the punishments channel.</>,
                  ]}
                />
              </Sub>

              <Callout tone="warn" title="Punishments are public and permanent">
                <p>
                  Punishment actions are broadcast to the staff punishments channel with the member, the role, the acting
                  staff member, and the reason. There is currently no “undo” button in the panel — if you make a mistake,
                  contact a senior member immediately.
                </p>
              </Callout>
            </Section>

            {/* ── 10. Role Manager ──────────────────────────── */}
            <Section
              id="roles"
              num="10"
              title="Role Manager"
              intro="Grant and remove member roles without leaving the panel. Every change is logged and posted to Discord."
            >
              <Sub title="Who can use it">
                <P>
                  Any <strong className="text-text">Staff Team</strong> member can open the Role Manager. You can only
                  manage roles that sit <em>below your own highest Discord role</em> — the panel hides anything at or
                  above your position. This keeps the hierarchy safe: a Support member can hand out low roles, but only
                  a Manager can touch higher ones, and a Manager can always undo a junior change.
                </P>
              </Sub>

              <Sub title="What you can't touch">
                <DocTable
                  head={["Role", "Why it's locked"]}
                  rows={[
                    [<strong key="a" className="text-white">@everyone</strong>, "It's not a real managed role — everyone has it automatically."],
                    [<strong key="b" className="text-white">Bot / integration roles</strong>, "Managed by Discord, not by staff. Trying to move them would error."],
                    [<strong key="c" className="text-white">Roles at or above your highest role</strong>, "Hierarchy protection — you can only manage downward."],
                  ]}
                />
              </Sub>

              <Sub title="Granting a role">
                <Steps
                  items={[
                    <>Search for the member and select them from the list.</>,
                    <>Under <strong className="text-text">Grant Role</strong>, pick a role from the grid. Roles the member already holds are greyed out.</>,
                    <>Enter an optional reason — it is saved to the activity log and posted to Discord.</>,
                    <>Click <strong className="text-text">Grant Role</strong>. The change applies immediately.</>,
                  ]}
                />
              </Sub>

              <Sub title="Removing a role">
                <Steps
                  items={[
                    <>Select the member, then find the <strong className="text-text">Remove Role</strong> section.</>,
                    <>Pick the role to take away. Only roles below your position are listed.</>,
                    <>Click <strong className="text-text">Remove Role</strong> and confirm. The role is removed instantly.</>,
                  ]}
                />
              </Sub>

              <Callout tone="warn" title="Think before you click">
                <p>
                  Role changes are immediate, logged against your account, and broadcast to the role log channel with
                  the target, the role, your name, and your reason. There is no automatic “undo” — if you remove the
                  wrong role, re-add it and note the correction.
                </p>
              </Callout>
            </Section>

            {/* ── 11. Discord Notifications ────────────────── */}
            <Section
              id="notifications"
              num="11"
              title="Discord Notifications"
              intro="The site posts to a few Discord channels so the team is never blind to what is happening."
            >
              <DocTable
                head={["Event", "Where it posts", "What it looks like"]}
                rows={[
                  ["New ticket opened", "Tickets channel", "@here ping with the member, subject, type, and a link to the ticket."],
                  ["Application submitted", "Applications channel", "@here ping with the applicant and a link to review it."],
                  ["Application approved / denied", "Applications channel + DM to applicant", "@here announcement plus a personal DM to the applicant with your review note."],
                  ["Punishment issued", "Punishments channel", "Member, punishment role, acting staff member, and reason."],
                  ["Ticket reminder (DMs closed)", "Ticket-reminders channel", "Fallback for the Remind button when a member's DMs are closed."],
                ]}
              />
              <Callout tone="info" title="Keep the channels clean">
                <p>
                  You do not need to reply to these notifications in Discord — the conversation happens in the website
                  thread. The posts exist so everyone knows something happened.
                </p>
              </Callout>
            </Section>

            {/* ── 12. Best Practices ───────────────────────── */}
            <Section
              id="best-practices"
              num="12"
              title="Best Practices"
              intro="A short code of conduct for working on the panel. Following this keeps the team consistent and the community happy."
            >
              <Steps
                items={[
                  <><strong className="text-text">Respond in good time.</strong> Try to answer tickets within a day. If you cannot handle a ticket, assign it to a colleague or leave it in the pool.</>,
                  <><strong className="text-text">One owner per ticket.</strong> Assign tickets you are actively working so two staff members don't answer at once. Unassign when you're done or stepping away.</>,
                  <><strong className="text-text">Stay professional.</strong> Members see your replies. Write clearly, avoid slang and emotion, and never argue in a ticket.</>,
                  <><strong className="text-text">Keep internal notes internal.</strong> Use the internal-note toggle for anything sensitive; never paste internal notes into public Discord or public messages.</>,
                  <><strong className="text-text">Use priorities honestly.</strong> Don't inflate priorities. Urgent is for things that genuinely need immediate attention.</>,
                  <><strong className="text-text">Escalate, don't improvise.</strong> If a ticket or application is out of your depth or beyond your permissions, hand it to a Manager or Owner.</>,
                  <><strong className="text-text">Punish fairly.</strong> Follow the ladder, write accurate reasons, and never punish out of frustration.</>,
                ]}
              />
            </Section>

            {/* ── 13. FAQ ──────────────────────────────────── */}
            <Section id="faq" num="13" title="FAQ">
              <div className="space-y-4">
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] px-4 py-3">
                  <p className="text-sm font-bold text-text mb-1">I can log in but the staff panel says I don't have access.</p>
                  <p className="text-[13px] text-text-dim leading-relaxed">
                    The panel requires the <strong className="text-text">Staff Team</strong> role in Discord. If you have
                    the role and it still fails, re-login (log out and sign in again) so the site re-reads your roles.
                  </p>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] px-4 py-3">
                  <p className="text-sm font-bold text-text mb-1">Why can't I see the applications page?</p>
                  <p className="text-[13px] text-text-dim leading-relaxed">
                    Applications require <strong className="text-text">Management</strong> tier access. Staff-tier members
                    see the panel but not the review area. Ask a Manager if you should have access.
                  </p>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] px-4 py-3">
                  <p className="text-sm font-bold text-text mb-1">I was granted editor access but can't manage grants.</p>
                  <p className="text-[13px] text-text-dim leading-relaxed">
                    Grant management is <strong className="text-text">Management &amp; Owner</strong> only. As a granted
                    question editor you can still open <Inline>/staff-panel/config</Inline> (you&apos;ll see just your own
                    department), then open your department and use <Inline>Edit questions</Inline> — or go straight to{" "}
                    <Inline>/staff-panel/config/questions/&lt;department&gt;</Inline>.
                  </p>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] px-4 py-3">
                  <p className="text-sm font-bold text-text mb-1">Can a member see my internal notes?</p>
                  <p className="text-[13px] text-text-dim leading-relaxed">
                    No. Internal notes are only visible to staff. Members see the description and all normal messages in
                    their ticket.
                  </p>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] px-4 py-3">
                  <p className="text-sm font-bold text-text mb-1">I closed a ticket by mistake. Can I reopen it?</p>
                  <p className="text-[13px] text-text-dim leading-relaxed">
                    Yes. Open the ticket and switch its status back to <strong className="text-text">Open</strong> or{" "}
                    <strong className="text-text">In Progress</strong>.
                  </p>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] px-4 py-3">
                  <p className="text-sm font-bold text-text mb-1">The Remind button posted to the channel instead of a DM.</p>
                  <p className="text-[13px] text-text-dim leading-relaxed">
                    That is expected. The member has their DMs closed, so the reminder falls back to the ticket-reminders
                    channel where the member is mentioned.
                  </p>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] px-4 py-3">
                  <p className="text-sm font-bold text-text mb-1">I made a mistake with a punishment.</p>
                  <p className="text-[13px] text-text-dim leading-relaxed">
                    Contact a <strong className="text-text">Manager or Owner</strong> right away. Punishments cannot be
                    undone from the panel, but a senior member can fix it on Discord.
                  </p>
                </div>
              </div>
            </Section>

            {/* Footer */}
            <div className="border-t border-white/[0.06] pt-6 mt-8 flex items-center justify-between">
              <p className="text-[11px] text-text-muted">Phoenix RP Staff Guide · Internal document</p>
              <a href="#access" className="text-[11px] text-crimson hover:underline font-semibold uppercase tracking-wider">
                Back to top ↑
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
