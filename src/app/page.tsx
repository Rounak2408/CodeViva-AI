import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { PreviewDashboard } from "@/components/landing/preview-dashboard";
import { UseCases } from "@/components/landing/use-cases";
import { Testimonials } from "@/components/landing/testimonials";
import { Faq } from "@/components/landing/faq";
import { CtaFooter } from "@/components/landing/cta-footer";

export default async function HomePage() {
  const session = await auth();
  if (session?.user?.id) {
    redirect("/analyzer");
  }

  return (
    <>
      <Hero />
      <Features />
      <HowItWorks />
      <PreviewDashboard />
      <UseCases />
      <Testimonials />
      <Faq />
      <CtaFooter />
    </>
  );
}
