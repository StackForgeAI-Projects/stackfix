"use client";

import Image from "next/image";
import { useStackfixLang } from "@/lib/stackfix-i18n";
import {
  stackfixTestimonialAvatars,
  type StackfixTestimonialAvatarKey,
} from "@/lib/testimonial-avatars";

export function Testimonials() {
  const { t } = useStackfixLang();

  return (
    <section className="py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-14 max-w-2xl">
          <p className="text-brand mb-3 text-xs tracking-[0.2em] uppercase">
            {`// ${t.testimonials.tag.toLowerCase()}`}
          </p>
          <h2 className="text-4xl font-bold tracking-tight md:text-5xl">{t.testimonials.title}</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {t.testimonials.items.map((item) => {
            const avatar = stackfixTestimonialAvatars[item.avatar as StackfixTestimonialAvatarKey];
            return (
              <figure
                key={item.name}
                className="bg-surface border-border flex flex-col rounded-2xl border p-7"
              >
                <blockquote className="flex-1 text-base leading-relaxed">
                  &ldquo;{item.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <Image
                    src={avatar.src}
                    alt={avatar.alt}
                    width={40}
                    height={40}
                    className="border-brand/30 h-10 w-10 shrink-0 rounded-full border object-cover"
                  />
                  <div>
                    <div className="text-sm font-semibold">{item.name}</div>
                    <div className="text-muted-foreground text-xs">{item.role}</div>
                  </div>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </div>
    </section>
  );
}
