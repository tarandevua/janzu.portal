import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function CertificationLoading() {
  return (
    <div className="grid gap-4 p-4 md:p-6" aria-busy="true">
      {[0, 1].map((item) => (
        <Card key={item}>
          <CardHeader className="gap-2">
            <Skeleton className="h-6 w-52 max-w-full" />
            <Skeleton className="h-4 w-96 max-w-full" />
          </CardHeader>
          <CardContent className="grid gap-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-48 max-w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
