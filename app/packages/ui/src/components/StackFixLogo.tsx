export function StackFixLogo({
  variant = "light",
  iconSrc = "/brand/stackfix-icon.png",
}: {
  variant?: "light" | "dark";
  iconSrc?: string;
}) {
  const text = variant === "light" ? "text-white" : "text-ink";
  return (
    <div className="flex items-center gap-2.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={iconSrc} alt="StackFix" className="size-8 rounded-lg" />
      <span className={`text-lg font-bold tracking-tight ${text}`}>StackFix</span>
    </div>
  );
}
