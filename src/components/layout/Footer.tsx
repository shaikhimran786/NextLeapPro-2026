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
            className="group flex items-center gap-3 px-5 py-2.5 rounded-xl bg-gradient-to-r from-slate-800/80 to-slate-700/60 hover:from-slate-700/90 hover:to-slate-600/70 border border-slate-600/50 hover:border-cyan-500/40 shadow-lg hover:shadow-cyan-500/20 transition-all duration-300"
            data-testid="link-uixperts-footer"
          >
            <span className="text-sm font-medium text-slate-400 group-hover:text-slate-200 transition-colors">Powered by</span>
            <Image
              src="/logos/uixperts-labs-logo.png"
              alt="UIXPERTS LABS - Technology solutions company"
              width={120}
              height={32}
              className="h-8 w-auto drop-shadow-[0_0_8px_rgba(56,189,248,0.3)] group-hover:drop-shadow-[0_0_12px_rgba(56,189,248,0.5)] transition-all duration-300"
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
