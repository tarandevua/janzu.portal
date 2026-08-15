import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("TASK-103 welcome activation flow", () => {
  it("routes generated invitations through the localized server callback", () => {
    const userManagement = source("server/services/user-management.service.ts");
    const callback = source("app/[locale]/auth/callback/route.ts");

    expect(userManagement).toContain("preferred_locale: input.locale");
    expect(userManagement).toContain("linkData.properties?.hashed_token");
    expect(userManagement).toContain("/auth/callback?locale=${input.locale}");
    expect(callback).toContain("supabase.auth.verifyOtp");
    expect(callback).toContain('verificationType === "invite"');
    expect(callback).toContain('verificationType === "magiclink"');
  });

  it("derives the activated member from the verified server session", () => {
    const dashboardLayout = source("app/[locale]/dashboard/layout.tsx");

    expect(dashboardLayout).toContain("supabase.auth.getUser()");
    expect(dashboardLayout).toContain(
      "claimWelcomeEmailForActivatedUser(user.id, activationLocale)"
    );
    expect(dashboardLayout).toContain("after(() => deliverClaimedWelcomeEmail(delivery))");
  });

  it("records normalized provider failures without persisting response bodies", () => {
    const emailService = source("server/services/email.service.ts");
    const deliveryService = source("server/services/welcome-email.service.ts");

    expect(emailService).toContain("email_provider_http_${response.status}");
    expect(emailService).not.toContain("response.text()");
    expect(deliveryService).toContain("recordWelcomeEmailResult");
    expect(deliveryService).not.toContain("recipientEmail:");
  });
});
