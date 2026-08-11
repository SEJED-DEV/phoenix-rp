import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryBySlug, categories } from "@/lib/rules.data";
import RuleCategoryPage from "@/components/RuleCategoryPage";
import { getSiteBranding } from "@/lib/site-branding";

export function generateStaticParams() {
  return categories.map((cat) => ({ slug: cat.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { siteName } = await getSiteBranding();
  const { slug } = await params;
  const cat = getCategoryBySlug(slug);
  if (!cat) return { title: `Rules — ${siteName}` };
  return {
    title: `${cat.name} — ${siteName}`,
    description: `${cat.name} for ${siteName} — ${cat.rules.length} rules.`,
  };
}

export default async function RuleSlugPage({ params }: Props) {
  const { slug } = await params;
  const cat = getCategoryBySlug(slug);
  if (!cat) notFound();

  return (
    <main className="pt-16 lg:pt-[64px]">
      <RuleCategoryPage cat={cat} />
    </main>
  );
}
