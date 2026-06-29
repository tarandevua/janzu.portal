import type { Locale } from "@/lib/i18n/config";
import type { Client } from "@/server/models/client.model";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientEditDrawer } from "@/features/clients/components/client-edit-drawer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ClientListProps = {
  clients: Client[];
  locale: Locale;
  status?: string;
  editingClientId?: string;
  dictionary: {
    listTitle: string;
    listDescription: string;
    empty: string;
    name: string;
    email: string;
    phone: string;
    notes: string;
    private: string;
    actions: string;
    edit: string;
    editFormTitle: string;
    editFormDescription: string;
    formTitle: string;
    formDescription: string;
    create: string;
    update: string;
    created: string;
    updated: string;
    invalid: string;
    editInvalid: string;
    cancel: string;
    close: string;
  };
};

export function ClientList({
  clients,
  locale,
  status,
  editingClientId,
  dictionary,
}: ClientListProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{dictionary.listTitle}</CardTitle>
            <CardDescription>{dictionary.listDescription}</CardDescription>
          </div>
          <Badge variant="secondary">{dictionary.private}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {clients.length === 0 ? (
          <p className="text-sm text-muted-foreground">{dictionary.empty}</p>
        ) : (
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{dictionary.name}</TableHead>
                  <TableHead>{dictionary.email}</TableHead>
                  <TableHead>{dictionary.phone}</TableHead>
                  <TableHead>{dictionary.notes}</TableHead>
                  <TableHead className="w-12">
                    <span className="sr-only">{dictionary.actions}</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.email ?? ""}</TableCell>
                    <TableCell>{client.phone ?? ""}</TableCell>
                    <TableCell className="max-w-xs truncate">{client.notes ?? ""}</TableCell>
                    <TableCell className="text-right">
                      <ClientEditDrawer
                        client={client}
                        locale={locale}
                        status={editingClientId === client.id ? status : undefined}
                        shouldOpen={editingClientId === client.id && status === "edit-invalid"}
                        dictionary={dictionary}
                      />
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
