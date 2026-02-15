import { useEffect, useRef, useState } from "react";
import { Text } from "@telegram-tools/ui-kit";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Send, Image, Video, Plus, X, Link2 } from "lucide-react";
import type { CreativeMedia, InlineButton } from "@/types/deal";

interface CreativeComposerProps {
  onSubmit: (data: { text: string; media: CreativeMedia[]; inlineButtons: InlineButton[] }) => Promise<void> | void;
  isRevision?: boolean;
  existingFeedback?: string;
  loading?: boolean;
}

export function CreativeComposer({
  onSubmit,
  isRevision = false,
  existingFeedback,
  loading = false,
}: CreativeComposerProps) {
  const [draftText, setDraftText] = useState("");
  const [media, setMedia] = useState<CreativeMedia[]>([]);
  const [buttons, setButtons] = useState<InlineButton[]>([]);
  const [showAddButton, setShowAddButton] = useState(false);
  const [newBtnLabel, setNewBtnLabel] = useState("");
  const [newBtnUrl, setNewBtnUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const latestMediaRef = useRef<CreativeMedia[]>([]);

  const revokeMediaPreviewUrl = (entry: Pick<CreativeMedia, "url">) => {
    if (entry.url.startsWith("blob:")) {
      URL.revokeObjectURL(entry.url);
    }
  };

  useEffect(() => {
    latestMediaRef.current = media;
  }, [media]);

  useEffect(() => {
    return () => {
      latestMediaRef.current.forEach((entry) => revokeMediaPreviewUrl(entry));
    };
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const nextMedia: CreativeMedia[] = [];
    Array.from(files).forEach((file) => {
      const isVideo = file.type.startsWith("video/");
      const url = URL.createObjectURL(file);
      const id = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `m-${Date.now()}-${Math.random()}`;

      nextMedia.push({
        id,
        type: isVideo ? "video" : "image",
        url,
        name: file.name,
        file,
        mimeType: file.type || undefined,
        sizeBytes: file.size,
      });
    });
    if (nextMedia.length > 0) {
      setMedia((previous) => [...previous, ...nextMedia]);
    }

    event.target.value = "";
  };

  const removeMedia = (id: string) => {
    setMedia((previous) => {
      const removed = previous.find((entry) => entry.id === id);
      if (removed) {
        revokeMediaPreviewUrl(removed);
      }
      return previous.filter((entry) => entry.id !== id);
    });
  };

  const addButton = () => {
    if (!newBtnLabel.trim() || !newBtnUrl.trim()) return;

    setButtons((previous) => [...previous, { label: newBtnLabel.trim(), url: newBtnUrl.trim() }]);
    setNewBtnLabel("");
    setNewBtnUrl("");
    setShowAddButton(false);
  };

  const removeButton = (index: number) => {
    setButtons((previous) => previous.filter((_, entryIndex) => entryIndex !== index));
  };

  const handleSubmit = async () => {
    if (!draftText.trim()) return;

    try {
      await onSubmit({ text: draftText, media, inlineButtons: buttons });
      media.forEach((entry) => revokeMediaPreviewUrl(entry));
      setDraftText("");
      setMedia([]);
      setButtons([]);
      setShowAddButton(false);
      setNewBtnLabel("");
      setNewBtnUrl("");
    } catch {
      // Keep draft data in place when submit fails.
    }
  };

  return (
    <div className="space-y-3 bg-secondary/30 rounded-xl border border-border p-4">
      <div className="flex items-center gap-2">
        <Text type="caption1" weight="medium">
          {isRevision ? "Submit Revised Creative" : "Submit Your Creative"}
        </Text>
        {isRevision ? (
          <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium">
            Revision
          </span>
        ) : null}
      </div>

      {existingFeedback ? (
        <div className="bg-secondary/50 border border-warning/30 rounded-lg p-3">
          <Text type="caption2" weight="medium" color="secondary">Previous Feedback:</Text>
          <Text type="caption1" color="secondary">{existingFeedback}</Text>
        </div>
      ) : null}

      {media.length > 0 ? (
        <div className="flex gap-2 flex-wrap">
          {media.map((entry) => (
            <div key={entry.id} className="relative group w-20 h-20 rounded-lg overflow-hidden border border-border bg-card">
              {entry.type === "image" ? (
                <img src={entry.url} alt={entry.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-secondary">
                  <Video className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
              <button
                onClick={() => removeMedia(entry.id)}
                className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                type="button"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="space-y-1">
        <Textarea
          value={draftText}
          onChange={(event) => setDraftText(event.target.value)}
          placeholder="Write your ad post text here…"
          className="min-h-[120px] text-sm"
          disabled={loading}
        />
        <Text type="caption2" color="tertiary">
          Supports telegram markdown with **bold**, *italic*, [links](url), and emojis 🎉
        </Text>
      </div>

      {buttons.length > 0 ? (
        <div className="space-y-1.5">
          <Text type="caption2" weight="medium" color="secondary">Inline Buttons</Text>
          {buttons.map((button, index) => (
            <div key={`${button.label}-${index}`} className="flex items-center gap-2 bg-card rounded-lg border border-border px-3 py-2">
              <Link2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <Text type="caption1" weight="medium">{button.label}</Text>
                <Text type="caption2" color="tertiary" className="truncate block">{button.url}</Text>
              </div>
              <button onClick={() => removeButton(index)} className="text-muted-foreground hover:text-destructive" type="button">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {showAddButton ? (
        <div className="space-y-2 bg-card rounded-lg border border-border p-3">
          <Input
            value={newBtnLabel}
            onChange={(event) => setNewBtnLabel(event.target.value)}
            placeholder="Button label (e.g. Download now)"
            className="text-sm"
            disabled={loading}
          />
          <Input
            value={newBtnUrl}
            onChange={(event) => setNewBtnUrl(event.target.value)}
            placeholder="Button URL (e.g. https://example.com)"
            className="text-sm"
            disabled={loading}
          />
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="flex-1" onClick={() => setShowAddButton(false)} type="button">
              Cancel
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={addButton}
              disabled={!newBtnLabel.trim() || !newBtnUrl.trim()}
              type="button"
            >
              Add Button
            </Button>
          </div>
        </div>
      ) : null}

      <div className="flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
        <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={loading} type="button">
          <Image className="w-4 h-4" />
          Media
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowAddButton(true)}
          disabled={loading || showAddButton}
          type="button"
        >
          <Plus className="w-4 h-4" />
          Button
        </Button>
      </div>

      <Button
        className="w-full"
        disabled={!draftText.trim() || loading}
        onClick={() => {
          void handleSubmit();
        }}
      >
        <Send className="w-4 h-4" />
        {loading ? "Submitting..." : "Submit for Review"}
      </Button>
    </div>
  );
}
