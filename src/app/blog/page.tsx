import { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { generateMeta } from "@/lib/metadata";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, ArrowRight } from "@/lib/icons";

export const metadata: Metadata = generateMeta({
  title: "Blog",
  description: "Insights, tips, and stories to help you learn, earn, and grow in your career.",
  path: "/blog",
});

const blogPosts = [
  {
    id: 1,
    title: "10 In-Demand Skills to Learn in 2025",
    excerpt: "Stay ahead of the curve with these high-demand skills that employers are looking for in the new year.",
    category: "Career Growth",
    author: "Priya Sharma",
    date: "Nov 25, 2024",
    readTime: "5 min read",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=400&fit=crop",
  },
  {
    id: 2,
    title: "How to Build a Profitable Freelance Business in India",
    excerpt: "A comprehensive guide to starting and scaling your freelance career while working from home.",
    category: "Earning",
    author: "Rahul Verma",
    date: "Nov 20, 2024",
    readTime: "8 min read",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=400&fit=crop",
  },
  {
    id: 3,
    title: "The Power of Community in Your Learning Journey",
    excerpt: "Why joining a community of like-minded learners can accelerate your skill development.",
    category: "Learning",
    author: "Ananya Patel",
    date: "Nov 15, 2024",
    readTime: "4 min read",
    image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&h=400&fit=crop",
  },
  {
    id: 4,
    title: "From Student to Mentor: My Journey with Next Leap Pro",
    excerpt: "How I went from being a learner to teaching others and building a sustainable income.",
    category: "Success Story",
    author: "Vikram Singh",
    date: "Nov 10, 2024",
    readTime: "6 min read",
    image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&h=400&fit=crop",
  },
  {
    id: 5,
    title: "Networking Tips for Introverts",
    excerpt: "Practical strategies for building meaningful professional connections without feeling overwhelmed.",
    category: "Career Growth",
    author: "Meera Krishnan",
    date: "Nov 5, 2024",
    readTime: "5 min read",
    image: "https://images.unsplash.com/photo-1515169067868-5387ec356754?w=800&h=400&fit=crop",
  },
  {
    id: 6,
    title: "The Complete Guide to Hosting Your First Workshop",
    excerpt: "Everything you need to know to plan, promote, and deliver a successful online workshop.",
    category: "Creator Tips",
    author: "Amit Desai",
    date: "Oct 30, 2024",
    readTime: "10 min read",
    image: "https://images.unsplash.com/photo-1540317580384-e5d43616b9aa?w=800&h=400&fit=crop",
  },
];

const categories = ["All", "Career Growth", "Learning", "Earning", "Success Story", "Creator Tips"];

export default function BlogPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-grow">
        <section className="bg-gradient-to-br from-primary/10 via-blue-50 to-green-50 py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-slate-900 mb-6">
              Blog & Insights
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Tips, guides, and success stories to help you on your journey to learn, earn, and grow.
            </p>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap gap-2 justify-center mb-12">
              {categories.map((category) => (
                <Badge
                  key={category}
                  variant={category === "All" ? "default" : "secondary"}
                  className="px-4 py-2 cursor-pointer hover:bg-primary hover:text-white transition-colors"
                >
                  {category}
                </Badge>
              ))}
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogPosts.map((post) => (
                <Card key={post.id} className="border-none shadow-sm hover:shadow-lg transition-shadow overflow-hidden group">
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <CardContent className="p-6">
                    <Badge variant="secondary" className="mb-3">{post.category}</Badge>
                    <h3 className="font-heading font-semibold text-lg text-slate-900 mb-2 group-hover:text-primary transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-slate-600 text-sm mb-4 line-clamp-2">{post.excerpt}</p>
                    <div className="flex items-center justify-between text-sm text-slate-500">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {post.author}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {post.readTime}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <span className="inline-flex items-center text-primary font-medium text-sm group-hover:gap-2 transition-all">
                        Read More <ArrowRight className="h-4 w-4 ml-1" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-gradient-primary text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-heading font-bold mb-4">
              Subscribe to Our Newsletter
            </h2>
            <p className="text-white/90 mb-8 max-w-2xl mx-auto">
              Get the latest insights, tips, and exclusive content delivered straight to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-full text-slate-900 focus:outline-none focus:ring-2 focus:ring-white"
                data-testid="input-newsletter-email"
              />
              <button className="px-6 py-3 bg-white text-primary font-medium rounded-full hover:bg-white/90 transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
