import { NextRequest, NextResponse } from "next/server";
import { getQuestionsForDept, isApplicableSlug } from "@/lib/application-questions";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const dept = req.nextUrl.searchParams.get("dept");
  if (!dept || !isApplicableSlug(dept)) {
    return NextResponse.json({ error: "Invalid department" }, { status: 400 });
  }
  return NextResponse.json(getQuestionsForDept(dept));
}
