"use client"

import * as React from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

type PublicProfileCheckboxProps = {
  label: string
  defaultChecked: boolean
}

export function PublicProfileCheckbox({
  label,
  defaultChecked,
}: PublicProfileCheckboxProps) {
  const [checked, setChecked] = React.useState(defaultChecked)

  return (
    <div className="flex items-center gap-3 rounded-md border p-3">
      <Checkbox
        id="isPublicToggle"
        checked={checked}
        onCheckedChange={(value) => {
          setChecked(value === true)
        }}
      />
      <input type="hidden" name="isPublic" value={checked ? "true" : "false"} />
      <Label htmlFor="isPublicToggle">{label}</Label>
    </div>
  )
}
