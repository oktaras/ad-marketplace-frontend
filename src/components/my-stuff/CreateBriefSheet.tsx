import { useState } from "react";
import { Text } from "@telegram-tools/ui-kit";
import { Button } from "@/components/ui/button";
import { AppSheet } from "@/components/common/AppSheet";
import { SectionLabel } from "@/components/common/SectionLabel";
import { CategoryPills } from "@/components/common/CategoryPills";
import { BriefPreviewCard } from "@/components/discovery/BriefPreviewCard";
import { ChannelCategory } from "@/types/marketplace";
import { CurrencySelector } from "@/components/common/CurrencySelector";
import { CryptoCurrency, DEFAULT_CURRENCY } from "@/types/currency";

interface CreateBriefSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: CreateBriefFormData) => void;
  isSubmitting?: boolean;
}

export interface CreateBriefFormData {
  title: string;
  category: ChannelCategory;
  budget: number;
  currency: CryptoCurrency;
  targetSubscribers: number;
  format: "post" | "story" | "repost";
  deadline: string;
  description: string;
}

const formats = [
  { value: "post" as const, label: "Post", emoji: "📝" },
  { value: "story" as const, label: "Story", emoji: "📱" },
  { value: "repost" as const, label: "Repost", emoji: "🔄" },
];

export function CreateBriefSheet({ open, onOpenChange, onCreate, isSubmitting = false }: CreateBriefSheetProps) {
  const [form, setForm] = useState<CreateBriefFormData>({
    title: "",
    category: "crypto",
    budget: 0,
    currency: DEFAULT_CURRENCY,
    targetSubscribers: 0,
    format: "post",
    deadline: "",
    description: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.title || form.title.length < 5) newErrors.title = "Title must be at least 5 chars";
    if (!form.budget || form.budget <= 0) newErrors.budget = "Budget must be > 0";
    if (!form.deadline) newErrors.deadline = "Deadline is required";
    if (new Date(form.deadline) <= new Date()) newErrors.deadline = "Deadline must be in the future";
    if (!form.description || form.description.length < 20) newErrors.description = "Description must be at least 20 chars";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onCreate(form);
    setForm({ title: "", category: "crypto", budget: 0, currency: DEFAULT_CURRENCY, targetSubscribers: 0, format: "post", deadline: "", description: "" });
    setErrors({});
  };

  return (
    <AppSheet open={open} onOpenChange={onOpenChange} title="Create Brief" fullHeight>
      <div className="space-y-6">
        {/* Campaign Info Section */}
        <div className="space-y-4">
          <Text type="subheadline2" weight="medium">Campaign Info</Text>

          {/* Title */}
          <div className="space-y-1.5">
            <SectionLabel>Brief Title *</SectionLabel>
            <input
              type="text"
              placeholder="e.g. DeFi Wallet Launch Campaign"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={`w-full h-11 px-3 rounded-xl bg-secondary border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${
                errors.title ? "focus:ring-destructive" : "focus:ring-ring"
              }`}
            />
            {errors.title && <Text type="caption2" className="text-destructive">{errors.title}</Text>}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <SectionLabel>Description *</SectionLabel>
            <textarea
              placeholder="Describe what you're looking for, your product, content requirements..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              className={`w-full px-3 py-2.5 rounded-xl bg-secondary border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 resize-none ${
                errors.description ? "focus:ring-destructive" : "focus:ring-ring"
              }`}
            />
            {errors.description && <Text type="caption2" className="text-destructive">{errors.description}</Text>}
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <SectionLabel>Target Category *</SectionLabel>
            <CategoryPills
              selected={form.category}
              onSelect={(cat) => cat && setForm({ ...form, category: cat })}
            />
          </div>
        </div>

        {/* Requirements Section */}
        <div className="space-y-4">
          <Text type="subheadline2" weight="medium">Requirements</Text>

          {/* Format */}
          <div className="space-y-1.5">
            <SectionLabel>Ad Format *</SectionLabel>
            <div className="flex gap-2">
              {formats.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setForm({ ...form, format: f.value })}
                  aria-pressed={form.format === f.value}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                    form.format === f.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-muted-foreground border-border"
                  }`}
                >
                  <span>{f.emoji}</span> {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Budget & Min Subscribers row */}
          <div className="space-y-2">
            <CurrencySelector value={form.currency} onChange={(c) => setForm({ ...form, currency: c })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <SectionLabel>Budget ({form.currency}) *</SectionLabel>
              <input
                type="number"
                placeholder="5000"
                value={form.budget || ""}
                onChange={(e) => setForm({ ...form, budget: parseInt(e.target.value) || 0 })}
                className={`w-full h-11 px-3 rounded-xl bg-secondary border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${
                  errors.budget ? "focus:ring-destructive" : "focus:ring-ring"
                }`}
              />
              {errors.budget && <Text type="caption2" className="text-destructive">{errors.budget}</Text>}
            </div>
            <div className="space-y-1.5">
              <SectionLabel>Min Subscribers</SectionLabel>
              <input
                type="number"
                placeholder="50000"
                value={form.targetSubscribers || ""}
                onChange={(e) => setForm({ ...form, targetSubscribers: parseInt(e.target.value) || 0 })}
                className="w-full h-11 px-3 rounded-xl bg-secondary border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* Deadline */}
          <div className="space-y-1.5">
            <SectionLabel>Deadline *</SectionLabel>
            <input
              type="date"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              className={`w-full h-11 px-3 rounded-xl bg-secondary border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${
                errors.deadline ? "focus:ring-destructive" : "focus:ring-ring"
              }`}
            />
            {errors.deadline && <Text type="caption2" className="text-destructive">{errors.deadline}</Text>}
          </div>
        </div>

        {/* Preview Section */}
        <div className="space-y-3">
          <Text type="subheadline2" weight="medium">Preview</Text>
          <BriefPreviewCard
            title={form.title}
            category={form.category}
            format={form.format}
            budget={form.budget}
            currency={form.currency}
            description={form.description}
          />
        </div>

        {/* Submit */}
        <Button onClick={handleSubmit} className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Publishing..." : "Publish Brief"}
        </Button>
      </div>
    </AppSheet>
  );
}
