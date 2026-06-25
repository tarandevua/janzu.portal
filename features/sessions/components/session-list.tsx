import type { Client } from "@/server/models/client.model";
import type { Session } from "@/server/models/session.model";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type SessionListProps = {
  sessions: Session[];
  clients: Client[];
  dictionary: {
    listTitle: string;
    listDescription: string;
    empty: string;
    date: string;
    client: string;
    duration: string;
    location: string;
    validation: string;
    pending: string;
    validated: string;
  };
};

export function SessionList({ sessions, clients, dictionary }: SessionListProps) {
  const clientNames = new Map(clients.map((client) => [client.id, client.name]));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{dictionary.listTitle}</CardTitle>
        <CardDescription>{dictionary.listDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">{dictionary.empty}</p>
        ) : (
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{dictionary.date}</TableHead>
                  <TableHead>{dictionary.client}</TableHead>
                  <TableHead>{dictionary.duration}</TableHead>
                  <TableHead>{dictionary.location}</TableHead>
                  <TableHead>{dictionary.validation}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium">{session.sessionDate}</TableCell>
                    <TableCell>{session.clientId ? clientNames.get(session.clientId) ?? "" : ""}</TableCell>
                    <TableCell>{session.durationMinutes}</TableCell>
                    <TableCell>{session.location ?? ""}</TableCell>
                    <TableCell>
                      <Badge variant={session.isValidated ? "default" : "secondary"}>
                        {session.isValidated ? dictionary.validated : dictionary.pending}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
