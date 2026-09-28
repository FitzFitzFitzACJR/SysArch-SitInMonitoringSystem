/** Date/time display in the lab's timezone (Settings.timezone), never the server's. */
export function dateTimeFormatter(timeZone: string) {
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone });
}

export function dateFormatter(timeZone: string) {
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeZone });
}

/** An instant as "YYYY-MM-DDTHH:MM" in `timeZone`, for <input type="datetime-local">. */
export function toLocalInputValue(instant: Date, timeZone: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
      .formatToParts(instant)
      .map((p) => [p.type, p.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}
