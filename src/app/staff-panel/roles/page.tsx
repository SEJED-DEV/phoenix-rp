import type { Metadata } from "next";
import RoleManager from "@/components/RoleManager";

export const metadata: Metadata = {
  title: "Role Manager — Staff Panel",
  description: "Grant and remove member roles.",
};

export default function RoleManagerPage() {
  return (
    <main className="pt-16 lg:pt-[64px] min-h-screen bg-bg">
      <RoleManager />
    </main>
  );
}
