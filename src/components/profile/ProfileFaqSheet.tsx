import { Text } from "@telegram-tools/ui-kit";
import { CircleHelp } from "lucide-react";
import { AppSheet } from "@/components/common/AppSheet";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PROFILE_FAQ_ITEMS } from "@/shared/profile/faq-content";

interface ProfileFaqSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileFaqSheet({ open, onOpenChange }: ProfileFaqSheetProps) {
  return (
    <AppSheet
      open={open}
      onOpenChange={onOpenChange}
      title="FAQ & Documentation"
      icon={<CircleHelp className="w-5 h-5" />}
      fullHeight
    >
      <div className="space-y-4 pb-6">
        <Text type="caption1" color="secondary">
          Learn how briefs, listings, deals, and Telegram account setup work in the marketplace.
        </Text>

        {PROFILE_FAQ_ITEMS.length === 0 ? (
          <div className="rounded-lg bg-secondary p-3">
            <Text type="caption2" color="secondary">FAQ is being updated.</Text>
          </div>
        ) : (
          <Accordion type="single" collapsible className="rounded-xl border border-border bg-card px-3">
            {PROFILE_FAQ_ITEMS.map((item) => (
              <AccordionItem key={item.id} value={item.id} className="border-border">
                <AccordionTrigger className="text-left text-sm font-medium leading-5 hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-6 text-muted-foreground whitespace-pre-line">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </AppSheet>
  );
}
