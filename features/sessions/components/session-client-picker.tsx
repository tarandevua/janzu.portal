"use client";

import { useState } from "react";
import type { Client } from "@/server/models/client.model";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SessionClientPickerProps = {
  clients: Client[];
  dictionary: {
    client: string;
    noClient: string;
    newClientName: string;
    newClientNamePlaceholder: string;
  };
};

export function SessionClientPicker({ clients, dictionary }: SessionClientPickerProps) {
  const [clientId, setClientId] = useState("none");
  const shouldShowNewClientInput = clientId === "none";

  return (
    <>
      <div className="grid gap-2">
        <Label htmlFor="clientId">{dictionary.client}</Label>
        <Select name="clientId" value={clientId} onValueChange={setClientId}>
          <SelectTrigger id="clientId">
            <SelectValue placeholder={dictionary.noClient} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{dictionary.noClient}</SelectItem>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {shouldShowNewClientInput ? (
        <div className="grid gap-2">
          <Label htmlFor="newClientName">{dictionary.newClientName}</Label>
          <Input
            id="newClientName"
            name="newClientName"
            placeholder={dictionary.newClientNamePlaceholder}
          />
        </div>
      ) : null}
    </>
  );
}
