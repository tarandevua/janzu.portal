import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  assign: vi.fn(),
  remove: vi.fn(),
  loading: vi.fn(() => "role-toast"),
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));

vi.mock("@/features/user-management/actions", () => ({
  assignUserRoleInline: mocks.assign,
  removeUserRoleInline: mocks.remove,
}));

vi.mock("sonner", () => ({
  toast: {
    loading: mocks.loading,
    success: mocks.success,
    error: mocks.error,
  },
}));

import { UserRoleEditor } from "@/features/user-management/components/user-role-editor";

const dictionary = {
  assignRole: "Assign role",
  removeRole: "Remove role",
  assigningRole: "Assigning role...",
  removingRole: "Removing role...",
  assigned: "Role assigned.",
  removed: "Role removed.",
  invalid: "Invalid role change.",
  roleUpdateFailed: "Role update failed.",
  roleLabels: {
    admin: "Admin",
    instructor: "Instructor",
    facilitator: "Facilitator",
    practitioner: "Practitioner",
    apprentice: "Trainee",
  },
};

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

describe("AJAX user role editor", () => {
  it("assigns a role with a success toast and refreshes in place", async () => {
    mocks.assign.mockResolvedValue({ ok: true, status: "assigned" });
    render(
      <UserRoleEditor
        locale="en"
        userId="14040000-0000-4000-8000-000000000001"
        userRoles={["apprentice"]}
        actorRoles={["admin"]}
        assignableRoles={["practitioner"]}
        dictionary={dictionary}
      />
    );

    const button = screen.getByRole("button", { name: "Assign role" });
    const form = button.closest("form")!;
    fireEvent.change(screen.getByRole("combobox", { name: "Assign role" }), {
      target: { value: "practitioner" },
    });
    fireEvent.submit(form);

    await waitFor(() => expect(mocks.assign).toHaveBeenCalledOnce());
    const submitted = mocks.assign.mock.calls[0]?.[1] as FormData;
    expect(submitted.get("userId")).toBe("14040000-0000-4000-8000-000000000001");
    expect(submitted.get("role")).toBe("practitioner");
    expect(mocks.success).toHaveBeenCalledWith("Role assigned.", { id: "role-toast" });
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });

  it("removes a role with a success toast and refreshes in place", async () => {
    mocks.remove.mockResolvedValue({ ok: true, status: "removed" });
    render(
      <UserRoleEditor
        locale="en"
        userId="14040000-0000-4000-8000-000000000001"
        userRoles={["practitioner"]}
        actorRoles={["admin"]}
        assignableRoles={["practitioner"]}
        dictionary={dictionary}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Remove role Practitioner" }));

    await waitFor(() => expect(mocks.remove).toHaveBeenCalledOnce());
    const submitted = mocks.remove.mock.calls[0]?.[1] as FormData;
    expect(submitted.get("role")).toBe("practitioner");
    expect(mocks.success).toHaveBeenCalledWith("Role removed.", { id: "role-toast" });
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });

  it("shows an error toast without refreshing when a role update fails", async () => {
    mocks.remove.mockResolvedValue({ ok: false, status: "role-update-failed" });
    render(
      <UserRoleEditor
        locale="en"
        userId="14040000-0000-4000-8000-000000000001"
        userRoles={["practitioner"]}
        actorRoles={["admin"]}
        assignableRoles={[]}
        dictionary={dictionary}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Remove role Practitioner" }));

    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith(
      "Role update failed.",
      { id: "role-toast" }
    ));
    expect(mocks.refresh).not.toHaveBeenCalled();
  });
});
