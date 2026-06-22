import iconUrl from "@/assets/stackfix-icon.png";

export function StackFixLogo({ variant = "light" }: { variant?: "light" | "dark" }) {
  const text = variant === "light" ? "text-white" : "text-ink";
  return (
    <div className="flex items-center gap-2.5">
      <img src={iconUrl} alt="StackFix" className="size-8 rounded-lg" />
      <span className={`text-lg font-bold tracking-tight ${text}`}>
        StackFix
      </span>
    </div>
  );
}
