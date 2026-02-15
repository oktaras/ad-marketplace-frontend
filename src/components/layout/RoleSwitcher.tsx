import { useRole, UserRole } from "@/contexts/RoleContext";
import { cn } from "@/lib/utils";

const roles: { value: UserRole; label: string; emoji: string }[] = [
  { value: "advertiser", label: "Advertiser", emoji: "📢" },
  { value: "publisher", label: "Publisher", emoji: "📡" },
];

export function RoleSwitcher() {
  const { role, setRole } = useRole();

  return (
    <div className="flex items-center bg-secondary rounded-lg p-1 gap-1" role="tablist">
      {roles.map((r) => (
        <button
          key={r.value}
          role="tab"
          aria-selected={role === r.value}
          onClick={() => setRole(r.value)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap",
            role === r.value
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <span className="text-sm leading-none">{r.emoji}</span>
          <span>{r.label}</span>
        </button>
      ))}
    </div>
  );
}
