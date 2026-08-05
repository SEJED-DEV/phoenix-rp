import { NextResponse } from "next/server";
import { getFaqs } from "@/lib/faq.config";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ faqs: getFaqs() });
}
