"use client";

import Link from "next/link";
import Image from "next/image";
import { BookOpen, IndianRupee, TrendingUp, Twitter, Facebook, Instagram, Linkedin, Youtube, Github, Globe } from "@/lib/icons";
import useSWR from "swr";

const footerLinks = {
  platform: [
    { href: "/how-it-works", label: "How It Works" },
    { href: "/events", label: "Events" },
    { href: "/services", label: "Services" },
    { href: "/communities", label: "Communities" },
    { href: "/pricing", label: "Pricing" },
  ],
  company: [
    { href: "/about", label: "About Us" },
    { href: "/careers", label: "Careers" },
    { href: "/contact", label: "Contact" },
    { href: "/blog", label: "Blog" },
  ],
  legal: [
    { href: "/terms", label: "Terms of Service" },
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/refund", label: "Refund Policy" },
  ],
};

const fetcher = (url: string) => fetch(url).then(res => res.json());

const socialIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  twitter: Twitter,
  facebook: Facebook,
  instagram: Instagram,
  linkedin: Linkedin,
  youtube: Youtube,
  github: Github,
  website: Globe,
};

interface SocialLink {
  id: string;
  platform: string;
  url: string;
  isActive: boolean;
}

export function Footer() {
  const { data: siteSettings } = useSWR("/api/admin/settings", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
    suspense: false,
  });

  const logoSrc = siteSettings?.footerLogo || siteSettings?.logoLight || "/logos/logo-light.png";
  const siteName = siteSettings?.siteName || "Next Leap Pro";
  const slogan = siteSettings?.slogan || "Learn, Earn, and Grow";
  const socialLinks: SocialLink[] = Array.isArray(siteSettings?.socialLinks) 
    ? siteSettings.socialLinks.filter((link: SocialLink) => link.isActive && link.url) 
    : [];

  return (
    <footer className="border-t bg-slate-900" role="contentinfo" aria-label="Site footer" suppressHydrationWarning>
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2" suppressHydrationWarning>
            <Link href="/" className="inline-block mb-4" suppressHydrationWarning>
              <Image
                src={logoSrc}
                alt={`${siteName} - ${slogan} platform logo`}
                width={200}
                height={56}
                className="h-14 w-auto object-contain"
              />
            </Link>
            <p className="text-slate-400 text-sm mb-6 max-w-sm">
              The platform for students and professionals to learn new skills, 
              monetize their talents, and grow their careers.
            </p>
            <div className="flex gap-6 mb-6">
              <div className="flex items-center gap-2 text-sm">
                <BookOpen className="h-4 w-4 text-blue-400" />
                <span className="text-slate-400">Learn</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <IndianRupee className="h-4 w-4 text-green-400" />
                <span className="text-slate-400">Earn</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-purple-400" />
                <span className="text-slate-400">Grow</span>
              </div>
            </div>

            {socialLinks.length > 0 && (
              <div className="flex gap-3" suppressHydrationWarning>
                {socialLinks.map((link) => {
                  const Icon = socialIcons[link.platform] || Globe;
                  return (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-10 w-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                      data-testid={`social-link-${link.platform}`}
                      aria-label={`Follow ${siteName} on ${link.platform}`}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <h4 className="font-heading font-semibold mb-4 text-white">Platform</h4>
            <ul className="space-y-3">
              {footerLinks.platform.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold mb-4 text-white">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold mb-4 text-white">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-400" suppressHydrationWarning>
            © {new Date().getFullYear()} {siteName}. All rights reserved.
          </p>
          <a
            href="https://uixpertslabs.com/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visit UIXPERTS LABS"
            className="group inline-flex items-center gap-3 rounded-2xl border border-slate-700/70 bg-slate-800/90 px-4 py-3 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.9)] transition-all duration-300 hover:border-cyan-400/80 hover:bg-slate-700/95 hover:shadow-[0_14px_40px_-24px_rgba(34,211,238,0.35)]"
            data-testid="link-uixperts-footer"
          >
            <div className="flex flex-col leading-tight">
              <span className="text-[11px] uppercase tracking-[0.35em] text-cyan-300">Powered by</span>
              <span className="text-sm font-semibold text-white">UIXPERTS LABS™</span>
            </div>
            <Image
              src="/logos/uixperts-labs-logo.png"
              alt="UIXPERTS LABS logo"
              width={96}
              height={28}
              className="h-7 w-auto rounded-md border border-slate-700/60 bg-slate-950/80 p-1 shadow-sm transition-all duration-300 group-hover:scale-[1.02]"
            />
          </a>
          <p className="text-sm text-slate-400">
            Made with ❤️ in India
          </p>
        </div>
      </div>
    </footer>
  );
}
