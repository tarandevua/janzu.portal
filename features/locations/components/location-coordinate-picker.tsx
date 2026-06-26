import { CoordinatePicker } from "@/features/maps/components/coordinate-picker";

type LocationCoordinatePickerProps = {
  defaultLatitude?: number | null;
  defaultLongitude?: number | null;
  markerLabel?: string;
  dictionary: {
    mapPickerTitle: string;
    mapPickerDescription: string;
    selectedCoordinates: string;
    noCoordinatesSelected: string;
    latitude: string;
    longitude: string;
  };
};

export function LocationCoordinatePicker({
  defaultLatitude,
  defaultLongitude,
  markerLabel = "L",
  dictionary,
}: LocationCoordinatePickerProps) {
  return (
    <CoordinatePicker
      defaultLatitude={defaultLatitude}
      defaultLongitude={defaultLongitude}
      markerLabel={markerLabel}
      dictionary={dictionary}
    />
  );
}
