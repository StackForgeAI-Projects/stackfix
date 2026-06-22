import { StackfixLanding } from "@/components/stackfix/stackfix-landing";
import { stackfixStructuredDataGraph } from "@/lib/schema";

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(stackfixStructuredDataGraph()) }}
      />
      <StackfixLanding />
    </>
  );
}
