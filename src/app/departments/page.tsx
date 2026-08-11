import type { Metadata } from "next";
import Departments from "@/components/Departments";
import { getSiteBranding } from "@/lib/site-branding";

export async function generateMetadata(): Promise<Metadata> {
  const { siteName } = await getSiteBranding();
  return {
    title: `Departments — ${siteName}`,
    description: `Explore the departments at ${siteName} — Police, EMS, Families, Civilian, Mechanic, and Justice.`,
  };
}

export default function DepartmentsPage() {
  return (
    <main className="pt-16 lg:pt-[64px]">
      <Departments />
    </main>
  );
}
