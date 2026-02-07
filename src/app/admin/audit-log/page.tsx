import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollText, User, Calendar, Settings, Users, Briefcase, CreditCard } from "@/lib/icons";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getAuditLogs() {
  const logs = await prisma.adminAuditLog.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return logs;
}

const getActionIcon = (action: string) => {
  if (action.includes("settings")) return Settings;
  if (action.includes("user")) return User;
  if (action.includes("event")) return Calendar;
  if (action.includes("community")) return Users;
  if (action.includes("service")) return Briefcase;
  if (action.includes("subscription") || action.includes("plan")) return CreditCard;
  return ScrollText;
};

const getActionColor = (action: string) => {
  if (action.includes("create") || action.includes("add")) return "bg-green-100 text-green-700";
  if (action.includes("update") || action.includes("edit")) return "bg-blue-100 text-blue-700";
  if (action.includes("delete") || action.includes("remove")) return "bg-red-100 text-red-700";
  if (action.includes("cancel")) return "bg-orange-100 text-orange-700";
  if (action.includes("activate") || action.includes("enable")) return "bg-emerald-100 text-emerald-700";
  if (action.includes("deactivate") || action.includes("disable")) return "bg-slate-100 text-slate-700";
  return "bg-purple-100 text-purple-700";
};

export default async function AdminAuditLogPage() {
  const logs = await getAuditLogs();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold text-slate-900">Audit Log</h1>
        <p className="text-slate-600 mt-1">Track all administrative actions performed on the platform</p>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-primary" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length > 0 ? (
            <div className="space-y-4">
              {logs.map((log) => {
                const Icon = getActionIcon(log.action);
                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-4 p-4 rounded-lg border bg-white hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex-shrink-0">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${getActionColor(log.action)}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-slate-900">
                          {log.user.firstName} {log.user.lastName}
                        </span>
                        <Badge className={getActionColor(log.action)}>
                          {log.action}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">
                        Target: <span className="font-medium">{log.target}</span>
                      </p>
                      {log.details && (
                        <pre className="text-xs text-slate-500 mt-2 p-2 bg-slate-100 rounded overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-sm text-slate-500" suppressHydrationWarning>
                        {formatDateTime(log.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <ScrollText className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p>No audit logs recorded yet.</p>
              <p className="text-sm mt-1">Actions will appear here as admins make changes.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
