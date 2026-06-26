import type { Locale } from "@/lib/i18n/config";
import { submitLocation } from "@/features/locations/actions";
import { LocationCoordinatePicker } from "@/features/locations/components/location-coordinate-picker";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type LocationFormProps = {
  locale: Locale;
  status?: string;
  variant?: "card" | "plain";
  dictionary: {
    formTitle: string;
    formDescription: string;
    name: string;
    type: string;
    pool: string;
    spa: string;
    naturalWater: string;
    description: string;
    latitude: string;
    longitude: string;
    mapPickerTitle: string;
    mapPickerDescription: string;
    selectedCoordinates: string;
    noCoordinatesSelected: string;
    accessInfo: string;
    photoUrl: string;
    submit: string;
    created: string;
    invalid: string;
  };
};

export function LocationForm({ locale, status, variant = "card", dictionary }: LocationFormProps) {
  const action = submitLocation.bind(null, locale);
  const message =
    status === "created" ? dictionary.created : status === "invalid" ? dictionary.invalid : null;

  const form = (
    <form action={action} className="grid gap-4">
          {message ? (
            <Alert variant={status === "invalid" ? "destructive" : "default"}>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-2">
            <Label htmlFor="name">{dictionary.name}</Label>
            <Input id="name" name="name" required />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="locationType">{dictionary.type}</Label>
            <Select name="locationType" required defaultValue="pool">
              <SelectTrigger id="locationType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pool">{dictionary.pool}</SelectItem>
                <SelectItem value="spa">{dictionary.spa}</SelectItem>
                <SelectItem value="natural_water">{dictionary.naturalWater}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <LocationCoordinatePicker dictionary={dictionary} />

          <div className="grid gap-2">
            <Label htmlFor="description">{dictionary.description}</Label>
            <Textarea id="description" name="description" rows={4} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="accessInfo">{dictionary.accessInfo}</Label>
            <Textarea id="accessInfo" name="accessInfo" rows={3} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="photoUrl">{dictionary.photoUrl}</Label>
            <Input id="photoUrl" name="photoUrl" type="url" />
          </div>

          <Button type="submit" className="w-fit">
            {dictionary.submit}
          </Button>
    </form>
  );

  if (variant === "plain") {
    return form;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{dictionary.formTitle}</CardTitle>
        <CardDescription>{dictionary.formDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        {form}
      </CardContent>
    </Card>
  );
}
