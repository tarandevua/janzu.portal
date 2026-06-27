"use client"

import * as React from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

type PublicProfileCheckboxProps = {
  label: string
  defaultChecked: boolean
  disabled?: boolean
}

export function PublicProfileCheckbox({
  label,
  defaultChecked,
  disabled = false,
}: PublicProfileCheckboxProps) {
  const [checked, setChecked] = React.useState(disabled ? false : defaultChecked)

  return (
    <div className="flex items-center gap-3 rounded-md border p-3 has-[:disabled]:opacity-60">
      <Checkbox
        id="isPublicToggle"
        checked={checked}
        disabled={disabled}
        onCheckedChange={(value) => {
          if (!disabled) {
            setChecked(value === true)
          }
        }}
      />
      <input type="hidden" name="isPublic" value={!disabled && checked ? "true" : "false"} />
      <Label htmlFor="isPublicToggle">{label}</Label>
    </div>
  )
}
