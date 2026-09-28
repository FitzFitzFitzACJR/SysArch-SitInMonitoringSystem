/** Date/time display in the lab's timezone (Settings.timezone), never the server's. */
export function dateTimeFormatter(timeZone: string) {
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone });
}

export function dateFormatter(timeZone: string) {
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeZone });
}
