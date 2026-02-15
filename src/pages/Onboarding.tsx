import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Text } from "@telegram-tools/ui-kit";
import { useRole, UserRole } from "@/contexts/RoleContext";
import { cn } from "@/lib/utils";
import { Megaphone, Radio } from "lucide-react";

const roleOptions: { value: UserRole; title: string; description: string; icon: typeof Megaphone }[] = [
  {
    value: "advertiser",
    title: "I'm an Advertiser",
    description: "Find channels, create briefs, and run ad campaigns in Telegram.",
    icon: Megaphone,
  },
  {
    value: "publisher",
    title: "I'm a Channel Owner",
    description: "Monetize your Telegram channel by publishing sponsored content.",
    icon: Radio,
  },
];

export default function Onboarding() {
  const [selected, setSelected] = useState<UserRole | null>(null);
  const { setRole, completeOnboarding } = useRole();
  const navigate = useNavigate();

  const handleContinue = () => {
    if (!selected) return;
    setRole(selected);
    completeOnboarding();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="text-5xl mb-4">🚀</div>
          <Text type="largeTitle" weight="bold">TG Ads Market</Text>
          <Text type="body" color="secondary" align="center">
            The marketplace for Telegram channel advertising. Choose how you'd like to start.
          </Text>
        </div>

        {/* Role cards */}
        <div className="w-full flex flex-col gap-3">
          {roleOptions.map((opt) => {
            const isSelected = selected === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setSelected(opt.value)}
                className={cn(
                  "w-full text-left rounded-xl border-2 p-4 transition-all",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-card hover:border-muted-foreground/30"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "rounded-lg p-2 mt-0.5",
                    isSelected ? "bg-primary/10" : "bg-secondary"
                  )}>
                    <opt.icon className={cn("h-5 w-5", isSelected ? "text-primary" : "text-muted-foreground")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Text type="subheadline1" weight="medium">{opt.title}</Text>
                    <Text type="footnote" color="secondary">{opt.description}</Text>
                  </div>
                  <div className={cn(
                    "w-5 h-5 rounded-full border-2 mt-1 flex items-center justify-center flex-shrink-0",
                    isSelected ? "border-primary" : "border-muted-foreground/40"
                  )}>
                    {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Note */}
        <Text type="caption1" color="tertiary" align="center">
          You can switch roles anytime from the Home screen or Profile.
        </Text>

        {/* CTA */}
        <div className="w-full">
          <Button
            text="Continue"
            onClick={handleContinue}
            disabled={!selected}
            type="primary"
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
