import { beforeEach, describe, expect, it, vi } from "vitest";
import { request } from "@/shared/api/generated/core/request";
import {
  prepareDealCreativeMediaUploads,
  uploadPreparedCreativeMediaFile,
  type PreparedCreativeMediaUpload,
} from "./media";

vi.mock("@/shared/api/generated/core/request", () => ({
  request: vi.fn(),
}));

describe("media api", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("maps prepared uploads response", async () => {
    vi.mocked(request).mockResolvedValue({
      files: [
        {
          clientId: "m-1",
          provider: "local",
          mediaType: "IMAGE",
          storageKey: "creative/deal/file.png",
          publicUrl: "http://localhost:3000/media/creative/deal/file.png",
          expiresAt: new Date().toISOString(),
          upload: {
            method: "PUT",
            url: "http://localhost:3000/api/media/local/upload-1?token=abc",
          },
        },
      ],
    });

    const result = await prepareDealCreativeMediaUploads("deal-1", [
      {
        clientId: "m-1",
        name: "file.png",
        mimeType: "image/png",
        sizeBytes: 1200,
      },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0]?.clientId).toBe("m-1");
  });

  it("uploads prepared file and returns uploaded url", async () => {
    const prepared: PreparedCreativeMediaUpload = {
      clientId: "m-1",
      provider: "local",
      mediaType: "IMAGE",
      storageKey: "creative/deal/file.png",
      publicUrl: "http://localhost:3000/media/creative/deal/file.png",
      expiresAt: new Date().toISOString(),
      upload: {
        method: "PUT",
        url: "http://localhost:3000/api/media/local/upload-1?token=abc",
        headers: {
          "Content-Type": "image/png",
        },
      },
    };

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ url: "http://localhost:3000/media/creative/deal/file.png" }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const file = new File(["hello"], "file.png", { type: "image/png" });
    const result = await uploadPreparedCreativeMediaFile(prepared, file);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.url).toBe("http://localhost:3000/media/creative/deal/file.png");
  });
});
