import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "@/lib/icons";

export function CTASection() {
  return (
    <section className="py-24 bg-gradient-primary text-white">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-5xl font-heading font-bold mb-6">
          Ready to take the next leap?
        </h2>
        <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
          Join thousands of students and professionals who are already learning,
          earning, and growing with Next Leap Pro.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/auth/register">
            <Button
              size="lg"
              className="rounded-full px-8 text-lg h-12 bg-white text-primary hover:bg-white/90"
              data-testid="button-cta-signup"
            >
              Start Your Journey <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href="/pricing">
            <Button
              size="lg"
              variant="outline"
              className="rounded-full px-8 text-lg h-12 border-white text-white hover:bg-white/10"
              data-testid="button-cta-pricing"
            >
              View Plans
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
