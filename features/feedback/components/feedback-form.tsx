"use client";

import Link from "next/link";
import { useState } from "react";
import type { Route } from "next";
import { CheckIcon, LanguagesIcon, StarIcon } from "lucide-react";
import { DeviceMetadataFields } from "@/components/device-metadata-fields";
import type { Locale } from "@/lib/i18n/config";
import { submitFeedbackForm } from "@/features/feedback/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type FeedbackFormProps = {
  locale: Locale;
  token: string;
  status?: string;
  dictionary: {
    title: string;
    description: string;
    email: string;
    rating: string;
    feltInFacilitatorArms: string;
    experienceText: string;
    emotionalImpact: string;
    supportAtEnd: string;
    supportYes: string;
    supportNotEnough: string;
    supportOther: string;
    supportOtherPlaceholder: string;
    anythingElse: string;
    continueWaterProcess: string;
    continueAnotherSession: string;
    continueNoThankYou: string;
    interestedLearningJanzu: string;
    learningName: string;
    learningPhone: string;
    gdprAgreement: string;
    language: string;
    submit: string;
    submitted: string;
    invalid: string;
    alreadySubmitted: string;
  };
  isSubmitted: boolean;
};

export function FeedbackForm({
  locale,
  token,
  status,
  dictionary,
  isSubmitted,
}: FeedbackFormProps) {
  const action = submitFeedbackForm.bind(null, locale, token);
  const [supportAtEnd, setSupportAtEnd] = useState("yes");
  const [interestedLearningJanzu, setInterestedLearningJanzu] = useState(false);
  const [rating, setRating] = useState(5);
  const nextLocale: Locale = locale === "en" ? "es" : "en";
  const message =
    status === "submitted"
      ? dictionary.submitted
      : status === "invalid"
        ? dictionary.invalid
          : isSubmitted
            ? dictionary.alreadySubmitted
            : null;

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <CardTitle>{dictionary.title}</CardTitle>
          <CardDescription>{dictionary.description}</CardDescription>
        </div>
        <Button asChild variant="outline" size="sm" className="w-fit gap-2">
          <Link href={`/${nextLocale}/feedback/${token}` as Route}>
            <LanguagesIcon className="h-4 w-4" />
            {dictionary.language}: {nextLocale.toUpperCase()}
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-4">
          {message ? (
            <Alert variant={status === "invalid" ? "destructive" : "default"}>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          ) : (
          <>
          <div className="grid gap-2">
            <Label htmlFor="participantEmail">{dictionary.email} <span className="text-destructive">*</span></Label>
            <Input
              id="participantEmail"
              name="participantEmail"
              type="email"
              autoComplete="email"
              disabled={isSubmitted}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="feltInFacilitatorArms">{dictionary.feltInFacilitatorArms} <span className="text-destructive">*</span></Label>
            <Textarea id="feltInFacilitatorArms" name="feltInFacilitatorArms" rows={4} disabled={isSubmitted} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="experienceText">{dictionary.experienceText} <span className="text-destructive">*</span></Label>
            <Textarea id="experienceText" name="experienceText" rows={5} disabled={isSubmitted} required />
          </div>

          <fieldset className="grid gap-3">
            <legend className="text-sm font-medium">{dictionary.supportAtEnd} <span className="text-destructive">*</span></legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {[
                ["yes", dictionary.supportYes],
                ["not_enough", dictionary.supportNotEnough],
                ["other", dictionary.supportOther],
              ].map(([value, label]) => (
                <Label
                  key={value}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-md border p-3 text-sm",
                    supportAtEnd === value && "border-primary bg-primary/5"
                  )}
                >
                  <input
                    type="radio"
                    name="supportAtEnd"
                    value={value}
                    checked={supportAtEnd === value}
                    onChange={() => setSupportAtEnd(value)}
                    disabled={isSubmitted}
                    required
                  />
                  {label}
                </Label>
              ))}
            </div>
            {supportAtEnd === "other" ? (
              <Textarea
                name="supportOtherText"
                placeholder={dictionary.supportOtherPlaceholder}
                rows={3}
                disabled={isSubmitted}
                required
              />
            ) : null}
          </fieldset>

          <div className="grid gap-2">
            <Label htmlFor="anythingElse">{dictionary.anythingElse}</Label>
            <Textarea id="anythingElse" name="anythingElse" rows={4} disabled={isSubmitted} />
          </div>

          <fieldset className="grid gap-3">
            <legend className="text-sm font-medium">{dictionary.continueWaterProcess} <span className="text-destructive">*</span></legend>
            <div className="grid gap-2">
              <Label className="flex cursor-pointer items-center gap-2 rounded-md border p-3 text-sm">
                <input
                  type="radio"
                  name="continueWaterProcess"
                  value="another_session"
                  disabled={isSubmitted}
                  required
                />
                {dictionary.continueAnotherSession}
              </Label>
              <Label className="flex cursor-pointer items-center gap-2 rounded-md border p-3 text-sm">
                <input
                  type="radio"
                  name="continueWaterProcess"
                  value="no_thank_you"
                  disabled={isSubmitted}
                  required
                />
                {dictionary.continueNoThankYou}
              </Label>
              <Label className="flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm">
                <Checkbox
                  name="interestedLearningJanzu"
                  checked={interestedLearningJanzu}
                  onCheckedChange={(checked) => setInterestedLearningJanzu(checked === true)}
                  disabled={isSubmitted}
                />
                <span>{dictionary.interestedLearningJanzu}</span>
              </Label>
            </div>
            {interestedLearningJanzu ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="learningName">{dictionary.learningName}</Label>
                  <Input id="learningName" name="learningName" disabled={isSubmitted} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="learningPhone">{dictionary.learningPhone}</Label>
                  <Input id="learningPhone" name="learningPhone" type="tel" disabled={isSubmitted} required />
                </div>
              </div>
            ) : null}
          </fieldset>

          <div className="grid gap-2">
            <Label htmlFor="rating">{dictionary.rating}</Label>
            <input id="rating" name="rating" type="hidden" value={rating} readOnly />
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <Button
                  key={value}
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={isSubmitted}
                  onClick={() => setRating(value)}
                  aria-label={`${dictionary.rating} ${value}`}
                >
                  <StarIcon
                    className={cn(
                      "h-6 w-6",
                      value <= rating ? "fill-primary text-primary" : "text-muted-foreground"
                    )}
                  />
                </Button>
              ))}
            </div>
          </div>

          <Label className="flex items-start gap-3 rounded-md border p-3 text-sm leading-6">
            <Checkbox name="gdprAgreed" disabled={isSubmitted} required />
            <span>{dictionary.gdprAgreement}</span>
          </Label>

          <input type="hidden" name="emotionalImpact" value="" readOnly />
          <DeviceMetadataFields />

          <Button type="submit" className="w-fit" disabled={isSubmitted}>
            <CheckIcon className="h-4 w-4" />
            {dictionary.submit}
          </Button>
          </>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
