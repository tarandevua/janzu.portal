export type ClientLifecycleStatus = "prospect" | "active" | "inactive";

export type Client = {
  id: string;
  practitionerId: string;
  name: string;
  email: string | null;
  phone: string | null;
  country: string | null;
  city: string | null;
  notes: string | null;
  lifecycleStatus: ClientLifecycleStatus;
  nextFollowUp: ClientNextFollowUp | null;
  createdAt: string;
  updatedAt: string;
};

export type ClientInput = {
  name: string;
  email?: string | null;
  phone?: string | null;
  country?: string | null;
  city?: string | null;
  notes?: string | null;
  lifecycleStatus?: ClientLifecycleStatus;
};

export type ClientsPage = {
  items: Client[];
  totalCount: number;
};

export type ClientNextFollowUp = {
  recordId: string;
  followUpOn: string;
};

export type ClientFollowUpFilter = "all" | "overdue" | "today" | "upcoming" | "none";

export type ClientOutreachChannel =
  | "phone"
  | "email"
  | "whatsapp"
  | "message"
  | "in_person"
  | "other";

export type ClientOutreachResponse =
  | "interested"
  | "needs_time"
  | "declined"
  | "no_response"
  | "booked"
  | "other";

export type ClientOutreachRecord = {
  id: string;
  clientId: string;
  practitionerId: string;
  contactedOn: string;
  channel: ClientOutreachChannel;
  channelOther: string | null;
  sessionOffered: boolean;
  response: ClientOutreachResponse;
  responseOther: string | null;
  notes: string | null;
  followUpOn: string | null;
  followUpStatus: "open" | "completed" | null;
  followUpCompletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ClientOutreachInput = {
  contactedOn: string;
  channel: ClientOutreachChannel;
  channelOther?: string | null;
  sessionOffered: boolean;
  response: ClientOutreachResponse;
  responseOther?: string | null;
  notes?: string | null;
  followUpOn?: string | null;
};

export type ClientOutreachPage = {
  items: ClientOutreachRecord[];
  totalCount: number;
};
