import type { Metadata } from "next";
import StreamersClient from "@/components/StreamersClient";

export const metadata: Metadata = {
  title: "Streamers",
  description: "Our community streamers — live content from the streets of the city.",
};

export default function StreamersPage() {
  return (
    <main>
      <StreamersClient />
    </main>
  );
}
