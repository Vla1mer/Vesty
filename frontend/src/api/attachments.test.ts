import { describe, expect, it } from "vitest";
import { isImage } from "./attachments";

describe("isImage", () => {
  it.each(["image/jpeg", "image/png", "image/webp", "image/gif", "IMAGE/PNG"])(
    "shows %s as a picture",
    (contentType) => {
      expect(isImage(contentType)).toBe(true);
    }
  );

  it.each(["image/svg+xml", "image/tiff", "text/html", "application/pdf", ""])(
    "keeps %s as a file",
    (contentType) => {
      expect(isImage(contentType)).toBe(false);
    }
  );
});
