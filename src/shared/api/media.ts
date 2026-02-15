import { OpenAPI } from "@/shared/api/generated/core/OpenAPI";
import { request } from "@/shared/api/generated/core/request";

export type PrepareCreativeMediaFileInput = {
  clientId: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
};

export type PreparedCreativeMediaUpload = {
  clientId: string;
  provider: "local" | "vercel_blob";
  mediaType: "IMAGE" | "VIDEO" | "GIF" | "DOCUMENT" | "AUDIO";
  storageKey: string;
  publicUrl: string | null;
  expiresAt: string;
  upload: {
    method: "PUT";
    url: string;
    headers?: Record<string, string>;
  };
};

type PrepareCreativeMediaResponse = {
  files?: PreparedCreativeMediaUpload[];
};

export async function prepareDealCreativeMediaUploads(
  dealId: string,
  files: PrepareCreativeMediaFileInput[],
): Promise<PreparedCreativeMediaUpload[]> {
  const response = await request(OpenAPI, {
    method: "POST",
    url: "/api/deals/{id}/creative/media/prepare",
    path: { id: dealId },
    body: { files },
    mediaType: "application/json",
  }) as PrepareCreativeMediaResponse;

  return Array.isArray(response.files) ? response.files : [];
}

export async function uploadPreparedCreativeMediaFile(
  prepared: PreparedCreativeMediaUpload,
  file: File,
): Promise<{ url: string; provider: string; storageKey: string }> {
  const mergedHeaders: Record<string, string> = {
    ...(prepared.upload.headers || {}),
  };
  if (!mergedHeaders["Content-Type"] && !mergedHeaders["content-type"] && file.type) {
    mergedHeaders["Content-Type"] = file.type;
  }

  const response = await fetch(prepared.upload.url, {
    method: prepared.upload.method || "PUT",
    headers: mergedHeaders,
    body: file,
  });

  if (!response.ok) {
    const reason = await response.text().catch(() => "");
    throw new Error(reason || `Upload failed with status ${response.status}`);
  }

  const textBody = await response.text();
  let uploadedUrl = prepared.publicUrl;
  if (textBody.trim().length > 0) {
    try {
      const parsed = JSON.parse(textBody) as { url?: string; blob?: { url?: string } };
      uploadedUrl = parsed.url || parsed.blob?.url || uploadedUrl;
    } catch {
      // Ignore non-JSON body.
    }
  }

  if (!uploadedUrl) {
    throw new Error("Uploaded file URL is missing");
  }

  return {
    url: uploadedUrl,
    provider: prepared.provider,
    storageKey: prepared.storageKey,
  };
}
