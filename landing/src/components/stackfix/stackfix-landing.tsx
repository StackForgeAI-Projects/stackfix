"use client";

import { StackfixLangProvider } from "@/lib/stackfix-i18n";
import { Nav } from "./nav";
import { Hero } from "./hero";
import { Marquee } from "./marquee";
import { Features } from "./features";
import { ProductShowcase } from "./product-showcase";
import { HowItWorks } from "./how-it-works";
import { Promises } from "./promises";
import { Pricing } from "./pricing";
import { Testimonials } from "./testimonials";
import { Faq } from "./faq";
import { Contact } from "./contact";
import { Footer } from "./footer";

export function StackfixLanding() {
  return (
    <StackfixLangProvider>
      <div className="stackfix-page min-h-screen overflow-x-clip">
        <Nav />
        <main id="main">
          <Hero />
          <Marquee />
          <Features />
          <ProductShowcase />
          <HowItWorks />
          <Promises />
          <Pricing />
          <Testimonials />
          <Faq />
          <Contact />
        </main>
        <Footer />
      </div>
    </StackfixLangProvider>
  );
}
