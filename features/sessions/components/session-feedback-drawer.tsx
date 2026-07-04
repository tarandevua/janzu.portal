"use client";

import { StarIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { Locale } from "@/lib/i18n/config";
import type { SessionFeedback } from "@/server/models/feedback.model";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type SessionFeedbackDrawerProps = {
  locale: Locale;
  feedback: SessionFeedback;
  dictionary: {
    dashboardTitle: string;
    details: string;
    email: string;
    rating: string;
    feltInFacilitatorArms: string;
    experienceText: string;
    emotionalImpact: string;
    supportAtEnd: string;
    supportOtherText: string;
    anythingElse: string;
    continueWaterProcess: string;
    interestedLearningJanzu: string;
    learningName: string;
    learningPhone: string;
    gdprAgreement: string;
    submittedAt: string;
    yes: string;
    no: string;
    supportYes: string;
    supportNotEnough: string;
    supportOther: string;
    continueAnotherSession: string;
    continueNoThankYou: string;
  };
};

function formatDateTime(locale: Locale, value: string | null) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatSupport(
  value: SessionFeedback["supportAtEnd"],
  dictionary: SessionFeedbackDrawerProps["dictionary"]
) {
  if (value === "yes") {
    return dictionary.supportYes;
  }

  if (value === "not_enough") {
    return dictionary.supportNotEnough;
  }

  if (value === "other") {
    return dictionary.supportOther;
  }

  return "";
}

function formatContinueProcess(
  value: SessionFeedback["continueWaterProcess"],
  dictionary: SessionFeedbackDrawerProps["dictionary"]
) {
  if (value === "another_session") {
    return dictionary.continueAnotherSession;
  }

  if (value === "no_thank_you") {
    return dictionary.continueNoThankYou;
  }

  return "";
}

function DetailItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid gap-1 rounded-md border p-3">
      <dt className="text-xs font-medium uppercase text-muted-foreground">{label}</dt>
      <dd className="text-sm leading-6">{value || ""}</dd>
    </div>
  );
}

export function SessionFeedbackDrawer({
  locale,
  feedback,
  dictionary,
}: SessionFeedbackDrawerProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          {dictionary.details}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{dictionary.dashboardTitle}</SheetTitle>
          <SheetDescription>
            {dictionary.submittedAt}: {formatDateTime(locale, feedback.submittedAt)}
          </SheetDescription>
        </SheetHeader>
        <dl className="mt-6 grid gap-3">
          <DetailItem label={dictionary.email} value={feedback.participantEmail} />
          <DetailItem
            label={dictionary.rating}
            value={
              <span className="inline-flex items-center gap-1">
                <StarIcon className="h-4 w-4 fill-current" />
                {feedback.rating}
              </span>
            }
          />
          <DetailItem label={dictionary.feltInFacilitatorArms} value={feedback.feltInFacilitatorArms} />
          <DetailItem label={dictionary.experienceText} value={feedback.experienceText} />
          <DetailItem label={dictionary.emotionalImpact} value={feedback.emotionalImpact} />
          <DetailItem label={dictionary.supportAtEnd} value={formatSupport(feedback.supportAtEnd, dictionary)} />
          <DetailItem label={dictionary.supportOtherText} value={feedback.supportOtherText} />
          <DetailItem label={dictionary.anythingElse} value={feedback.anythingElse} />
          <DetailItem
            label={dictionary.continueWaterProcess}
            value={formatContinueProcess(feedback.continueWaterProcess, dictionary)}
          />
          <DetailItem
            label={dictionary.interestedLearningJanzu}
            value={feedback.interestedLearningJanzu ? dictionary.yes : dictionary.no}
          />
          <DetailItem label={dictionary.learningName} value={feedback.learningName} />
          <DetailItem label={dictionary.learningPhone} value={feedback.learningPhone} />
          <DetailItem label={dictionary.gdprAgreement} value={feedback.gdprAgreed ? dictionary.yes : dictionary.no} />
        </dl>
      </SheetContent>
    </Sheet>
  );
}
