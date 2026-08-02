import type { Metadata } from "next";
import Departments from "@/components/Departments";

export const metadata: Metadata = {
  title: "Departments — Tunisian Phoenix RP",
  description: "Explore the departments at Tunisian Phoenix RP — Police, EMS, Gangs, Civilian, Mechanic, and Justice.",
};

export default function DepartmentsPage() {
  return (
    <main className="pt-16 lg:pt-[64px]">
      <Departments />
    </main>
  );
}
