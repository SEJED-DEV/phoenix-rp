import { Skeleton, SkeletonCard } from "@/components/Skeleton";

export default function PageSkeleton() {
  return (
    <section className="relative min-h-screen overflow-hidden px-6 sm:px-8 py-20 sm:py-28">
      <div className="max-w-6xl mx-auto">
        <Skeleton className="h-4 w-16 mb-12" />
        <Skeleton className="h-12 sm:h-16 w-72 sm:w-96 mb-4" />
        <Skeleton className="h-5 w-full max-w-xl mb-12" />
        <SkeletonCard className="p-8">
          <div className="space-y-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-11 w-44" />
          </div>
        </SkeletonCard>
      </div>
    </section>
  );
}
