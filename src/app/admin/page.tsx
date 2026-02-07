import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, Briefcase, CreditCard, TrendingUp, Activity, Globe, FileText, Settings } from "@/lib/icons";
import { formatINR, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getStats() {
  const [
    userCount,
    eventCount,
    serviceCount,
    communityCount,
    activeSubscriptions,
    recentAuditLogs,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.event.count({ where: { status: "published" } }),
    prisma.service.count(),
    prisma.community.count(),
    prisma.user.count({ where: { subscriptionTier: { not: "free" } } }),
    prisma.adminAuditLog.findMany({
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return {
    userCount,
    eventCount,
    serviceCount,
    communityCount,
    activeSubscriptions,
    recentAuditLogs,
  };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const statCards = [
    {
      title: "Total Users",
      value: stats.userCount,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Published Events",
      value: stats.eventCount,
      icon: Calendar,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Services",
      value: stats.serviceCount,
      icon: Briefcase,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Communities",
      value: stats.communityCount,
      icon: Users,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "Active Subscriptions",
      value: stats.activeSubscriptions,
      icon: CreditCard,
      color: "text-pink-600",
      bgColor: "bg-pink-100",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-heading font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-1">Welcome to the Next Leap Pro admin panel.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index} className="border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
              <p className="text-sm text-slate-500">{stat.title}</p>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentAuditLogs.length > 0 ? (
              <div className="space-y-4">
                {stats.recentAuditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg"
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary text-xs font-bold">
                      {log.user.firstName[0]}
                      {log.user.lastName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">
                        {log.user.firstName} {log.user.lastName}
                      </p>
                      <p className="text-sm text-slate-600">
                        {log.action} on {log.target}
                      </p>
                      <p className="text-xs text-slate-400 mt-1" suppressHydrationWarning>
                        {formatDateTime(log.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-8">No recent activity</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <a
                href="/admin/plans"
                className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors text-center"
                data-testid="link-admin-plans"
              >
                <CreditCard className="h-6 w-6 text-pink-600 mx-auto mb-2" />
                <p className="text-sm font-medium">Plans & Pricing</p>
              </a>
              <a
                href="/admin/subscribers"
                className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors text-center"
                data-testid="link-admin-subscribers"
              >
                <Users className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <p className="text-sm font-medium">Subscribers</p>
              </a>
              <a
                href="/admin/content"
                className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors text-center"
                data-testid="link-admin-content"
              >
                <FileText className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-medium">Content Blocks</p>
              </a>
              <a
                href="/admin/seo"
                className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors text-center"
                data-testid="link-admin-seo"
              >
                <Globe className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <p className="text-sm font-medium">SEO & Settings</p>
              </a>
              <a
                href="/admin/features"
                className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors text-center"
                data-testid="link-admin-features"
              >
                <Activity className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                <p className="text-sm font-medium">Feature Toggles</p>
              </a>
              <a
                href="/admin/settings"
                className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors text-center"
                data-testid="link-admin-settings"
              >
                <TrendingUp className="h-6 w-6 text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-medium">Site Settings</p>
              </a>
              <a
                href="/admin/cta-config"
                className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors text-center"
                data-testid="link-admin-cta-config"
              >
                <Settings className="h-6 w-6 text-teal-600 mx-auto mb-2" />
                <p className="text-sm font-medium">CTA Config</p>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
