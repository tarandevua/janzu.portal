# Sprint 10 - Global Maps

## Goal

Add public clustered maps for practitioners and approved water locations.

## Included

- Leaflet map runtime.
- Leaflet marker clustering.
- Reusable `ClusteredMap` client component.
- Public practitioner map on `/[locale]/practitioners`.
- Public approved location map on `/[locale]/locations`.
- Safe marker popup HTML escaping.
- Coordinate validation and map-center helpers.
- English and Spanish empty-state copy.
- Unit tests for map utilities.

## Data Rules

- Practitioner map shows only public practitioner profiles with valid coordinates.
- Location map shows only approved public locations.
- Marker data passed to the browser is limited to public profile/location fields.

## Deferred

- Mapbox provider option.
- Search and filters on maps.
- Dedicated detail pages for public locations.
- Custom tile hosting.
