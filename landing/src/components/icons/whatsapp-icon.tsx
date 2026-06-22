export function WhatsAppIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 3.36L3 21" />
      <path d="M9 10c.5 2.5 2.5 4.5 5 5l1.5-1.5c.3-.3.7-.4 1-.2l2 .9c.4.2.6.6.5 1A4 4 0 0 1 15 18a9 9 0 0 1-9-9 4 4 0 0 1 2.8-3.9c.4-.1.8.1 1 .5l.9 2c.2.3.1.7-.2 1L9 10z" />
    </svg>
  );
}
