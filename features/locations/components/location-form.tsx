import type { Locale } from "@/lib/i18n/config";
import type { LocationInput } from "@/server/models/location.model";
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
  action?: (formData: FormData) => void | Promise<void>;
  initialValues?: Partial<LocationInput>;
  submitLabel?: string;
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
    photoUpload: string;
    photoUploadHelp: string;
    submit: string;
    created: string;
    updated: string;
    invalid: string;
    imageType: string;
    imageSize: string;
    imageCount: string;
    imageConfig: string;
    imageAuth: string;
    imageBucket: string;
    imageUpload: string;
  };
};

const statusMessages = {
  created: "created",
  updated: "updated",
  invalid: "invalid",
  "location-image-type": "imageType",
  "location-image-size": "imageSize",
  "location-image-count": "imageCount",
  "location-image-config": "imageConfig",
  "location-image-auth": "imageAuth",
  "location-image-bucket": "imageBucket",
  "location-image-upload": "imageUpload",
} as const;

export function LocationForm({
  locale,
  status,
  variant = "card",
  action,
  initialValues,
  submitLabel,
  dictionary,
}: LocationFormProps) {
  const formAction = action ?? submitLocation.bind(null, locale);
  const messageKey = status ? statusMessages[status as keyof typeof statusMessages] : null;
  const message = messageKey ? dictionary[messageKey] : null;
  const isError = status !== "created";

  const form = (
    <form action={formAction} encType="multipart/form-data" className="grid gap-4">
          {message ? (
            <Alert variant={isError ? "destructive" : "default"}>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-2">
            <Label htmlFor="name">{dictionary.name}</Label>
            <Input id="name" name="name" required defaultValue={initialValues?.name ?? ""} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="locationType">{dictionary.type}</Label>
            <Select name="locationType" required defaultValue={initialValues?.locationType ?? "pool"}>
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

          <LocationCoordinatePicker
            defaultLatitude={initialValues?.latitude}
            defaultLongitude={initialValues?.longitude}
            dictionary={dictionary}
          />

          <div className="grid gap-2">
            <Label htmlFor="description">{dictionary.description}</Label>
            <Textarea
              id="description"
              name="description"
              rows={4}
              defaultValue={initialValues?.description ?? ""}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="accessInfo">{dictionary.accessInfo}</Label>
            <Textarea
              id="accessInfo"
              name="accessInfo"
              rows={3}
              defaultValue={initialValues?.accessInfo ?? ""}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="locationImages">{dictionary.photoUpload}</Label>
            <Input
              id="locationImages"
              name="locationImages"
              type="file"
              accept="image/jpeg,.jpg,.jpeg"
              multiple
            />
            <p className="text-xs text-muted-foreground">{dictionary.photoUploadHelp}</p>
            <Label className="sr-only" htmlFor="photoUrl">
              {dictionary.photoUrl}
            </Label>
          </div>

          <Button type="submit" className="w-fit">
            {submitLabel ?? dictionary.submit}
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
