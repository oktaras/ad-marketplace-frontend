import { Loader2 } from "lucide-react";

interface CardLoadingOverlayProps {
  visible: boolean;
}

export function CardLoadingOverlay({ visible }: CardLoadingOverlayProps) {
  if (!visible) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-10 rounded-xl bg-background/70 backdrop-blur-[1px] flex items-center justify-center">
      <Loader2 className="h-5 w-5 animate-spin text-primary" />
    </div>
  );
}
