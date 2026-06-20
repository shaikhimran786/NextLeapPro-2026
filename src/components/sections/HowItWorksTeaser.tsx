import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Sparkles, TrendingUp, Award } from "@/lib/icons";

const steps = [
  {
    icon: Users,
    title: "Join the community",
    text: "Create your profile and find your people.",
    chip: "bg-violet-100 text-violet-600",
  },
  {
    icon: Sparkles,
    title: "Learn new skills",
    text: "Workshops, bootcamps, and expert-led sessions.",
    chip: "bg-blue-100 text-blue-600",
  },
  {
    icon: TrendingUp,
    title: "Explore earning",
    text: "Freelance, mentor, and consult through the marketplace.",
    chip: "bg-emerald-100 text-emerald-600",
  },
  {
    icon: Award,
    title: "Grow & thrive",
    text: "Build visibility, credibility, and your next leap.",
    chip: "bg-amber-100 text-amber-600",
  },
];

export function HowItWorksTeaser() {
  return (
    <section className="bg-white py-16 sm:py-20" aria-labelledby="how-it-works-heading">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            How it works
          </span>
          <h2
            id="how-it-works-heading"
            className="mt-4 font-heading text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl"
          >
            Your journey, step by step
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
            Join the community, learn in-demand skills, explore real earning opportunities, and grow
            with mentors and peers who back you, every step of the way.
          </p>
        </div>

        <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ icon: Icon, title, text, chip }, index) => (
            <li
              key={title}
              className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${chip}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="font-heading text-3xl font-bold text-slate-200">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>
            </li>
          ))}
        </ol>

        <div className="mt-10 text-center">
          <Button
            asChild
            size="lg"
            variant="gradient"
            className="group rounded-full px-8 py-4 text-base font-semibold shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30"
          >
            <Link href="/how-it-works" data-testid="button-how-it-works">
              See how it works
              <ArrowRight className="ml-1 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
