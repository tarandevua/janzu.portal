export type EventType = "retreat" | "training" | "community_gathering";
export type EventStatus = "draft" | "published" | "cancelled";

export type CommunityEvent = {
  id: string;
  createdBy: string;
  title: string;
  description: string | null;
  eventType: EventType;
  locationName: string;
  latitude: number | null;
  longitude: number | null;
  startsAt: string;
  endsAt: string;
  capacity: number;
  status: EventStatus;
  createdAt: string;
  updatedAt: string;
  rsvpCount: number;
  hasCurrentUserRsvp: boolean;
  media: EventMedia[];
};

export type EventInput = {
  title: string;
  description?: string | null;
  eventType: EventType;
  locationName: string;
  latitude?: number | null;
  longitude?: number | null;
  startsAt: string;
  endsAt: string;
  capacity: number;
  status: EventStatus;
};

export type EventMedia = {
  id: string;
  eventId: string;
  storageKey: string;
  url: string;
  altText: string | null;
  sortOrder: number;
  createdAt: string;
};

export type EventRsvp = {
  id: string;
  eventId: string;
  userId: string;
  createdAt: string;
};
