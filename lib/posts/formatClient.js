export function formatPublishedAt(value) {
  if (!value) {
    return "Unknown date";
  }
  const d = new Date(value);
  if (isNaN(d.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}
