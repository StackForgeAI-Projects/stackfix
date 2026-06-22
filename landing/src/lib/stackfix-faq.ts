/** StackFix FAQ — shared by the landing page UI and FAQPage JSON-LD. */
export const stackfixFaqEntries = [
  {
    question: "What is StackFix and who is it for?",
    answer:
      "StackFix is StackForgeAI's repair management platform for electronics workshops, phone repair shops, and service centers in Rwanda and across Africa. It unifies repair tickets, technician workflows, invoicing, and customer updates in one web and mobile workspace.",
  },
  {
    question: "Does StackFix support Mobile Money and MoMo USSD payments?",
    answer:
      "Yes. StackFix is built for Rwanda's payment reality. Send MoMo USSD (*182#) and Airtel Money payment requests from a repair ticket, track settled payments automatically, and keep invoices aligned with what customers actually paid.",
  },
  {
    question: "How does the 1-month free trial work?",
    answer:
      "Start a free trial from any plan with no payment details required. StackForgeAI provisions your shop workspace, helps you onboard tickets and technicians, and sends login details by email. You can cancel anytime during the trial.",
  },
  {
    question: "Can StackFix manage my technicians and repair tickets?",
    answer:
      "Yes. Create repair tickets in under a minute, assign jobs to technicians, track turnaround time, and see workload per bench. Growth plans support unlimited tickets and up to 10 technician seats; Enterprise covers multi-location teams.",
  },
  {
    question: "Does StackFix include AI diagnostics and customer notifications?",
    answer:
      "Yes. StackFix AI surfaces likely faults from your shop's repair history before a device is opened. Automatic SMS and WhatsApp updates keep customers informed in English, French, or Kinyarwanda, reducing status calls and speeding pickups.",
  },
] as const;

export type StackfixFaqEntry = (typeof stackfixFaqEntries)[number];
