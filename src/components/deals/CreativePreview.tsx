import { useState } from "react";
import { CreativeSubmission } from "@/types/deal";
import { Text } from "@telegram-tools/ui-kit";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/common/StatusBadge";
import { MessageSquare, RotateCcw, ThumbsUp, Video, Link2, ExternalLink } from "lucide-react";

interface CreativePreviewProps {
  submission: CreativeSubmission;
  role: "advertiser" | "publisher" | null;
  onApprove?: () => void;
  onRequestRevision?: (feedback: string) => void;
  approvingLoading?: boolean;
  revisionLoading?: boolean;
}

const statusConfig = {
  approved: { label: "✅ Approved", variant: "success" as const },
  revision_requested: { label: "🔄 Revision", variant: "warning" as const },
  pending: { label: "⏳ Pending", variant: "info" as const },
};

function renderMarkdown(text: string) {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(\[(.+?)\]\((.+?)\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[1]) {
      parts.push(<strong key={key++}>{match[2]}</strong>);
    } else if (match[3]) {
      parts.push(<em key={key++}>{match[4]}</em>);
    } else if (match[5]) {
      parts.push(
        <a key={key++} href={match[7]} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
          {match[6]}
        </a>,
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

export function CreativePreview({
  submission,
  role,
  onApprove,
  onRequestRevision,
  approvingLoading = false,
  revisionLoading = false,
}: CreativePreviewProps) {
  const [feedbackText, setFeedbackText] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);

  const canApprove = role === "advertiser" && submission.status === "pending";
  const cfg = statusConfig[submission.status];
  const media = submission.media ?? [];
  const inlineButtons = submission.inlineButtons ?? [];

  return (
    <div className="bg-secondary/30 rounded-xl border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Text type="caption1" color="secondary">Submitted {submission.submittedAt}</Text>
        <StatusBadge label={cfg.label} variant={cfg.variant} dot={false} />
      </div>

      <div className="bg-card rounded-lg p-3 border border-border">
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{renderMarkdown(submission.text)}</pre>
      </div>

      {media.length > 0 ? (
        <div className="flex gap-2 flex-wrap">
          {media.map((entry) => (
            <div key={entry.id} className="w-24 h-24 rounded-lg overflow-hidden border border-border bg-card">
              {entry.type === "image" ? (
                <img src={entry.url} alt={entry.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-secondary gap-1">
                  <Video className="w-6 h-6 text-muted-foreground" />
                  <Text type="caption2" color="secondary" className="text-center px-1 truncate w-full">{entry.name}</Text>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : null}

      {inlineButtons.length > 0 ? (
        <div className="space-y-1.5">
          {inlineButtons.map((button, index) => (
            <a
              key={`${button.label}-${index}`}
              href={button.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg px-3 py-2.5 text-sm font-medium transition-colors border border-primary/20"
            >
              <Link2 className="w-3.5 h-3.5" />
              {button.label}
              <ExternalLink className="w-3 h-3 opacity-50" />
            </a>
          ))}
        </div>
      ) : null}

      {submission.feedback ? (
        <div className="bg-secondary/50 border border-warning/30 rounded-lg p-3 space-y-1">
          <div className="flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-warning" />
            <Text type="caption1" weight="medium">Feedback</Text>
          </div>
          <Text type="caption1" color="secondary">{submission.feedback}</Text>
        </div>
      ) : null}

      {canApprove ? (
        <div className="space-y-2">
          {showFeedback ? (
            <div className="space-y-2">
              <Textarea
                value={feedbackText}
                onChange={(event) => setFeedbackText(event.target.value)}
                placeholder="Describe what changes you need..."
                className="min-h-[80px] text-sm"
                disabled={revisionLoading}
              />
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => setShowFeedback(false)} disabled={revisionLoading}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="flex-1"
                  onClick={() => {
                    onRequestRevision?.(feedbackText);
                    setShowFeedback(false);
                  }}
                  disabled={!feedbackText.trim() || revisionLoading}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {revisionLoading ? "Requesting..." : "Request Revision"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => setShowFeedback(true)}
                disabled={approvingLoading || revisionLoading}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Request Changes
              </Button>
              <Button size="sm" className="flex-1" onClick={onApprove} disabled={approvingLoading || revisionLoading}>
                <ThumbsUp className="w-3.5 h-3.5" />
                {approvingLoading ? "Approving..." : "Approve"}
              </Button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
