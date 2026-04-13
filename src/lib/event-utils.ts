export type EventStatus = "upcoming" | "live" | "finished";

export function getEventStatus(event: { startDate: Date | string; endDate: Date | string }): EventStatus {
  const now = new Date();
  const start = new Date(event.startDate);
  const end = new Date(event.endDate);

  if (now > end) {
    return "finished";
  }
  if (now >= start && now <= end) {
    return "live";
  }
  return "upcoming";
}

export function isEventExpired(event: { endDate: Date | string }): boolean {
  return new Date() > new Date(event.endDate);
}
