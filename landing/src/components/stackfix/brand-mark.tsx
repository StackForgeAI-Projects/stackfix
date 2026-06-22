import Image from "next/image";
import { siteNavLogoImageClass } from "@/lib/site-nav-styles";
import { cn } from "@/lib/utils";

export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="StackForgeAI"
      width={947}
      height={157}
      className={cn(siteNavLogoImageClass, className)}
      draggable={false}
      priority
    />
  );
}
