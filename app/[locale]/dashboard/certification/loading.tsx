import { Skeleton } from "@/components/ui/skeleton";

export default function CertificationLoading() {
  return (
    <div className="grid gap-4 p-4 md:p-6" aria-busy="true">
      <Skeleton className="h-36 w-full" />
      <Skeleton className="h-72 w-full" />
    </div>
  );
}
