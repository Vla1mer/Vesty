import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../api/attachments", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api/attachments")>();
  return {
    ...actual,
    uploadAttachment: vi.fn(async () => ({ id: 1, fileName: "a", contentType: "image/png", sizeInBytes: 1 })),
    deleteAttachment: vi.fn(async () => {}),
  };
});

import { act, renderHook } from "@testing-library/react";
import { useAttachmentUploads } from "./useAttachmentUploads";
import { MAX_ATTACHMENT_SIZE, MAX_ATTACHMENTS_PER_MESSAGE } from "../api/attachments";

function file(name: string, type = "text/plain", size = 10) {
  const blob = new File(["x"], name, { type });
  Object.defineProperty(blob, "size", { value: size });
  return blob;
}

describe("useAttachmentUploads", () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => "blob:preview");
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("accepts files on an insecure origin, where crypto.randomUUID is missing", () => {
    const randomUUID = vi.spyOn(crypto, "randomUUID").mockImplementation(() => {
      throw new TypeError("crypto.randomUUID is not a function");
    });

    const { result } = renderHook(() => useAttachmentUploads(1));

    act(() => result.current.add([file("photo.png", "image/png")]));

    expect(randomUUID).not.toHaveBeenCalled();
    expect(result.current.uploads).toHaveLength(1);
    expect(result.current.uploads[0].fileName).toBe("photo.png");
  });

  it("gives every file its own id", () => {
    const { result } = renderHook(() => useAttachmentUploads(1));

    act(() => result.current.add([file("a.txt"), file("b.txt")]));
    act(() => result.current.add([file("c.txt")]));

    const ids = result.current.uploads.map((u) => u.localId);
    expect(new Set(ids).size).toBe(3);
  });

  it("previews images and nothing else", () => {
    const { result } = renderHook(() => useAttachmentUploads(1));

    act(() =>
      result.current.add([file("photo.png", "image/png"), file("notes.txt")])
    );

    expect(result.current.uploads[0].previewUrl).toBe("blob:preview");
    expect(result.current.uploads[1].previewUrl).toBeUndefined();
  });

  it("refuses a file over the size limit", () => {
    const { result } = renderHook(() => useAttachmentUploads(1));

    act(() =>
      result.current.add([file("big.bin", "text/plain", MAX_ATTACHMENT_SIZE + 1)])
    );

    expect(result.current.uploads[0].error).toBe("File is larger than 10 MB");
  });

  it("stops at the per-message limit", () => {
    const { result } = renderHook(() => useAttachmentUploads(1));

    act(() =>
      result.current.add(
        Array.from({ length: MAX_ATTACHMENTS_PER_MESSAGE + 3 }, (_, i) =>
          file(`f${i}.txt`)
        )
      )
    );

    expect(result.current.uploads).toHaveLength(MAX_ATTACHMENTS_PER_MESSAGE);
  });

  it("drops a file and releases its preview", () => {
    const { result } = renderHook(() => useAttachmentUploads(1));

    act(() => result.current.add([file("photo.png", "image/png")]));
    const { localId } = result.current.uploads[0];
    act(() => result.current.remove(localId));

    expect(result.current.uploads).toHaveLength(0);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview");
  });
});
