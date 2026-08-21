import type { Route } from "next";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type PractitionerProfileRequiredAlertProps = {
  href: string;
  title: string;
  description: string;
  actionLabel: string;
};

export function PractitionerProfileRequiredAlert({
  href,
  title,
  description,
  actionLabel,
}: PractitionerProfileRequiredAlertProps) {
  return (
    <Alert>
      <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span>
          <strong>{title}</strong> {description}
        </span>
        <Button asChild size="sm">
          <Link href={href as Route}>{actionLabel}</Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
