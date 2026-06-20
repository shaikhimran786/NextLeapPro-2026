import Link from "next/link";
import { BookOpen, IndianRupee, TrendingUp, ArrowRight } from "@/lib/icons";

const features = [
  {
    icon: <BookOpen className="h-8 w-8 text-blue-600" />,
    title: "Learn",
    description:
      "Master new skills through workshops, webinars, hackathons, and expert-led sessions.",
    color: "bg-blue-50",
    borderColor: "border-blue-100",
    href: "/events",
    linkColor: "text-blue-600",
  },
  {
    icon: <IndianRupee className="h-8 w-8 text-green-600" />,
    title: "Earn",
    description:
      "Monetize your expertise by offering services, mentoring, and consulting through our marketplace.",
    color: "bg-green-50",
    borderColor: "border-green-100",
    href: "/services",
    linkColor: "text-green-600",
  },
  {
    icon: <TrendingUp className="h-8 w-8 text-purple-600" />,
    title: "Grow",
    description:
      "Connect with like-minded professionals, join communities, and accelerate your career.",
    color: "bg-purple-50",
    borderColor: "border-purple-100",
    href: "/communities",
    linkColor: "text-purple-600",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
            Everything you need to succeed
          </h2>
          <p className="text-slate-600 text-lg">
            One platform, three powerful ways to advance your career.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`${feature.color} ${feature.borderColor} flex flex-col border rounded-2xl p-8 transition-transform hover:-translate-y-1`}
              data-testid={`feature-${feature.title.toLowerCase()}`}
            >
              <div className="mb-6">{feature.icon}</div>
              <h3 className="text-2xl font-heading font-bold mb-3">
                {feature.title}
              </h3>
              <p className="text-slate-600">{feature.description}</p>
              <Link
                href={feature.href}
                className={`group mt-6 inline-flex items-center gap-1.5 text-sm font-semibold ${feature.linkColor} focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-current rounded`}
                aria-label={`Learn more about ${feature.title}`}
                data-testid={`feature-link-${feature.title.toLowerCase()}`}
              >
                Learn more
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
