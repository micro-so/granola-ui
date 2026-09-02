export function Skeleton({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`skeleton block rounded-md ${className}`} />;
}

export function ProfilePageSkeleton() {
  return (
    <div role="status" aria-label="Loading profile">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-full" />
        <Skeleton className="h-7 w-52" />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Skeleton className="h-4 w-44" />
        <Skeleton className="h-5 w-5 rounded-full" />
      </div>
      <div className="mt-2 flex items-center gap-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="mt-8 flex gap-2">
        {["w-[72px]", "w-[82px]", "w-[72px]", "w-[72px]"].map((width, index) => (
          <Skeleton key={index} className={`h-8 rounded-full ${width}`} />
        ))}
      </div>
      <FeedRowsSkeleton />
    </div>
  );
}

export function FeedRowsSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <section role="status" aria-label="Loading content" className="mt-6">
      <Skeleton className="mb-3 h-3 w-20" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="flex items-center gap-3 py-1">
            <Skeleton className="h-7 w-7 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1">
              <Skeleton className={`h-3.5 ${index % 2 === 0 ? "w-2/3" : "w-1/2"}`} />
              <Skeleton className="mt-2 h-2.5 w-1/3" />
            </div>
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>
    </section>
  );
}
