import { NextRequest, NextResponse } from "next/server";
import { ensureSessionRoles } from "@/lib/auth";
import { getApplyConfig } from "@/lib/apply.config";
import { createApplication, hasPendingApplication } from "@/lib/applications.db";
import { APPLICATION_DEPARTMENTS, STAFF_APPLICATIONS } from "@/lib/applications.data";
import { notifyNewApplication } from "@/lib/application-notify";

export async function POST(req: NextRequest, { params }: { params: Promise<{ dept: string }> }) {
  const session = await ensureSessionRoles();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { dept } = await params;
  const config = getApplyConfig(dept);
  if (!config) {
    return NextResponse.json({ error: "Invalid department" }, { status: 400 });
  }

  if (await hasPendingApplication(dept, session.userId)) {
    return NextResponse.json({ error: "You already have a pending application for this" }, { status: 409 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const fieldSource = dept.startsWith("staff_")
    ? STAFF_APPLICATIONS.find((s) => s.slug === dept.replace("staff_", ""))
    : APPLICATION_DEPARTMENTS.find((d) => d.slug === dept);

  if (fieldSource && fieldSource.fields) {
    for (const field of fieldSource.fields) {
      if (field.required && (!body[field.name] || String(body[field.name]).trim() === "")) {
        return NextResponse.json({ error: `Missing required field: ${field.label}` }, { status: 400 });
      }
    }
  }

  const id = createApplication(dept, session.userId, session.username, body);
  await notifyNewApplication(
    { dept, id, userId: session.userId, username: session.username },
    req.nextUrl.origin,
  );
  return NextResponse.json({ success: true, id }, { status: 201 });
}
