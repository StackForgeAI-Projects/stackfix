import Script from "next/script";

const GA_ID_PATTERN = /^G-[A-Z0-9]+$/i;

/**
 * Google Analytics 4 via gtag.js (Measurement ID `G-xxxxxxxx`).
 * Not Google Tag Manager — this is the standard GA4 snippet Google shows as "Google tag".
 *
 * Prefer `NEXT_PUBLIC_GA_MEASUREMENT_ID` in Vercel; local/template default matches production GA property when unset.
 */
function gaMeasurementId(): string | null {
  const raw = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "G-B6L6MMCVFH";
  const trimmed = raw.trim();
  return GA_ID_PATTERN.test(trimmed) ? trimmed : null;
}

export function GoogleAnalyticsTag() {
  const id = gaMeasurementId();
  if (!id) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics-gtag" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${id}');
        `}
      </Script>
    </>
  );
}
