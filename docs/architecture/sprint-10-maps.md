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

- Public practitioner map shows only explicitly opted-in, verified Facilitators and Instructors with public location visibility.
- The authenticated community map uses its own actor-bound projection and includes only community-visible profiles and fields.
- Practitioner map coordinates are 0.1-degree city/region grid-cell centers computed before the response leaves PostgreSQL; stored exact coordinates and location notes are never projected.
- Location map shows only approved public locations.
- Marker data passed to the browser is limited to public profile/location fields.

## Deferred

- Mapbox provider option.
- Search and filters on maps.
- Dedicated detail pages for public locations.
- Custom tile hosting.
