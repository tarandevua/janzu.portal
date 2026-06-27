import { describe, expect, it } from "vitest";
import {
  MAX_AVATAR_UPLOAD_BYTES,
  createR2AuthorizationHeader,
  getR2MediaUrl,
  isAllowedR2ImageKey,
  validateAvatarUploadFile,
} from "@/server/services/r2-storage.service";

describe("avatar upload validation", () => {
  it("accepts jpg avatar uploads", () => {
    const file = new File(["avatar"], "profile.jpg", { type: "image/jpeg" });

    expect(validateAvatarUploadFile(file)).toEqual({ ok: true });
  });

  it("rejects non-jpg avatar uploads", () => {
    const file = new File(["avatar"], "profile.png", { type: "image/png" });

    expect(validateAvatarUploadFile(file)).toEqual({ ok: false, code: "avatar-type" });
  });

  it("rejects jpg avatar uploads over the maximum size", () => {
    const file = new File([new Uint8Array(MAX_AVATAR_UPLOAD_BYTES + 1)], "profile.jpg", {
      type: "image/jpeg",
    });

    expect(validateAvatarUploadFile(file)).toEqual({ ok: false, code: "avatar-size" });
  });

  it("creates a Cloudflare R2 compatible AWS4 authorization header", () => {
    expect(
      createR2AuthorizationHeader({
        accessKeyId: "access-key",
        credentialScope: "20260627/auto/s3/aws4_request",
        signedHeaders: "host;x-amz-content-sha256;x-amz-date",
        signature: "signature",
      })
    ).toBe(
      "AWS4-HMAC-SHA256 Credential=access-key/20260627/auto/s3/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=signature"
    );
  });

  it("creates an app media URL instead of a public R2 URL", () => {
    expect(getR2MediaUrl("avatars/user-id/profile image.jpg")).toBe(
      "/api/media/r2/avatars/user-id/profile%20image.jpg"
    );
  });

  it("only allows jpg avatar image keys to be served", () => {
    expect(isAllowedR2ImageKey("avatars/user-id/profile.jpg")).toBe(true);
    expect(isAllowedR2ImageKey("locations/photo.jpg")).toBe(false);
    expect(isAllowedR2ImageKey("avatars/user-id/profile.png")).toBe(false);
    expect(isAllowedR2ImageKey("avatars/../profile.jpg")).toBe(false);
  });
});
