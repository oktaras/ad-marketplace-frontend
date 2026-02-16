import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { isLikelyRemoteImageUrl } from "@/shared/lib/channel-avatar";

interface ChannelAvatarProps {
  avatar: string | null | undefined;
  name?: string;
  fallback?: string;
  className?: string;
  imageClassName?: string;
}

export function ChannelAvatar({
  avatar,
  name = "Channel",
  fallback = "📡",
  className,
  imageClassName,
}: ChannelAvatarProps) {
  const normalizedAvatar = useMemo(() => (typeof avatar === "string" ? avatar.trim() : ""), [avatar]);
  const isImage = isLikelyRemoteImageUrl(normalizedAvatar);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [normalizedAvatar]);

  if (isImage && !imageFailed) {
    return (
      <div className={cn("overflow-hidden rounded-full bg-secondary", className)}>
        <img
          src={normalizedAvatar}
          alt={`${name} logo`}
          loading="lazy"
          className={cn("h-full w-full object-cover", imageClassName)}
          onError={() => setImageFailed(true)}
        />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-center rounded-full bg-secondary", className)}>
      {isImage ? fallback : (normalizedAvatar || fallback)}
    </div>
  );
}
