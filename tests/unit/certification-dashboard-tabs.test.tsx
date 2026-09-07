import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CertificationDashboardTabs } from "@/features/certification/components/certification-dashboard-tabs";

describe("certification dashboard tabs", () => {
  it("shows each certification section under its tab", () => {
    const { rerender } = render(
      <CertificationDashboardTabs
        defaultTab="assessments"
        sections={[
          { id: "progress", label: "My progress", content: <p>Progress content</p> },
          { id: "assessments", label: "Assessment workflow", content: <p>Assessment content</p> },
          { id: "certificates", label: "Certificates", content: <p>Certificate content</p> },
        ]}
      />
    );

    expect(screen.getByText("Assessment content")).toBeTruthy();
    expect(screen.queryByText("Progress content")).toBeNull();

    fireEvent.mouseDown(screen.getByRole("tab", { name: "My progress" }));
    fireEvent.click(screen.getByRole("tab", { name: "My progress" }));

    expect(screen.getByText("Progress content")).toBeTruthy();
    expect(screen.queryByText("Assessment content")).toBeNull();

    rerender(
      <CertificationDashboardTabs
        defaultTab="certificates"
        sections={[
          { id: "progress", label: "My progress", content: <p>Progress content</p> },
          { id: "assessments", label: "Assessment workflow", content: <p>Assessment content</p> },
          { id: "certificates", label: "Certificates", content: <p>Certificate content</p> },
        ]}
      />
    );

    expect(screen.getByText("Certificate content")).toBeTruthy();
  });
});
