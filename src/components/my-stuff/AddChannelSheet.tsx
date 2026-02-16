import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Text } from "@telegram-tools/ui-kit";
import { Button } from "@/components/ui/button";
import { AppSheet } from "@/components/common/AppSheet";
import { SectionLabel } from "@/components/common/SectionLabel";
import { CategoryPills } from "@/components/common/CategoryPills";
import { ChannelCategory } from "@/types/marketplace";
import { getDiscoveryCategories } from "@/shared/api/discovery";
import { verifyAndAddMyChannel } from "@/shared/api/my-stuff";
import { getApiErrorMessage } from "@/shared/api/error";
import { toast } from "@/hooks/use-toast";
import { inAppToasts } from "@/shared/notifications/in-app";

interface AddChannelSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface AddChannelFormData {
  username: string;
  category: ChannelCategory;
}

export function AddChannelSheet({ open, onOpenChange }: AddChannelSheetProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<AddChannelFormData>({
    username: "",
    category: "crypto",
  });

  const categoriesQuery = useQuery({
    queryKey: ["my-channels", "categories"],
    queryFn: getDiscoveryCategories,
  });

  const addChannelMutation = useMutation({
    mutationFn: async (data: AddChannelFormData) => {
      const selectedCategoryId = categoriesQuery.data?.find((entry) => entry.slug === data.category)?.id;
      return verifyAndAddMyChannel({
        channelUsername: data.username.trim(),
        categoryIds: selectedCategoryId ? [selectedCategoryId] : undefined,
      });
    },
    onSuccess: async () => {
      toast(inAppToasts.channelAndListing.channelAdded);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["my-channels"] }),
        queryClient.invalidateQueries({ queryKey: ["my-listings"] }),
      ]);
      onOpenChange(false);
      setForm({ username: "", category: "crypto" });
    },
    onError: (error) => {
      toast(inAppToasts.channelAndListing.addChannelFailed(
        getApiErrorMessage(error, "Please verify channel access and try again."),
      ));
    },
  });

  const isValid =
    form.username.startsWith("@")
    && form.username.length > 2;

  const handleSubmit = () => {
    if (!isValid) return;
    addChannelMutation.mutate(form);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);

    if (!nextOpen && !addChannelMutation.isPending) {
      setForm({ username: "", category: "crypto" });
    }
  };

  return (
    <AppSheet open={open} onOpenChange={handleOpenChange} title="Add Channel">
      <div className="space-y-5">
        {/* Username */}
        <div className="space-y-1.5">
          <SectionLabel>Channel Username</SectionLabel>
          <input
            type="text"
            placeholder="@yourchannel"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            className="w-full h-11 px-3 rounded-xl bg-secondary border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Text type="caption2" color="tertiary">
            Enter your Telegram channel username. The bot will verify ownership.
          </Text>
          <Text type="caption2" color="tertiary">
            Channel description is synced from Telegram automatically.
          </Text>
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <SectionLabel>Category</SectionLabel>
          <CategoryPills
            selected={form.category}
            onSelect={(cat) => cat && setForm({ ...form, category: cat })}
          />
        </div>

        {/* Submit */}
        <div className="pb-4">
          <Button onClick={handleSubmit} disabled={!isValid || addChannelMutation.isPending} className="w-full">
            {addChannelMutation.isPending ? "Adding…" : "Add Channel"}
          </Button>
        </div>
      </div>
    </AppSheet>
  );
}
