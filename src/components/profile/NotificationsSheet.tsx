import { useState } from "react";
import { Text, Toggle } from "@telegram-tools/ui-kit";
import { AppSheet } from "@/components/common/AppSheet";
import { Bell } from "lucide-react";

interface NotificationsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationsSheet({ open, onOpenChange }: NotificationsSheetProps) {
  const [dealUpdates, setDealUpdates] = useState(true);
  const [messages, setMessages] = useState(true);
  const [briefMatches, setBriefMatches] = useState(false);
  const [paymentAlerts, setPaymentAlerts] = useState(true);

  return (
    <AppSheet open={open} onOpenChange={onOpenChange} title="Notifications" icon={<Bell className="w-5 h-5" />}>

        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
            <div className="flex-1 min-w-0">
              <Text type="body" weight="medium">Deal Updates</Text>
              <Text type="caption2" color="secondary">New offers, approvals, status changes</Text>
            </div>
            <Toggle isEnabled={dealUpdates} onChange={setDealUpdates} />
          </div>

          <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
            <div className="flex-1 min-w-0">
              <Text type="body" weight="medium">Messages</Text>
              <Text type="caption2" color="secondary">Bot reminders & chat</Text>
            </div>
            <Toggle isEnabled={messages} onChange={setMessages} />
          </div>

          <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
            <div className="flex-1 min-w-0">
              <Text type="body" weight="medium">Brief Matches</Text>
              <Text type="caption2" color="secondary">New channels matching your briefs</Text>
            </div>
            <Toggle isEnabled={briefMatches} onChange={setBriefMatches} />
          </div>

          <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
            <div className="flex-1 min-w-0">
              <Text type="body" weight="medium">Payment Alerts</Text>
              <Text type="caption2" color="secondary">Escrow deposits, releases, refunds</Text>
            </div>
            <Toggle isEnabled={paymentAlerts} onChange={setPaymentAlerts} />
          </div>
        </div>
    </AppSheet>
  );
}
