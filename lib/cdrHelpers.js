export function formatDuration(totalSeconds) {
  if (totalSeconds === null || totalSeconds === undefined || isNaN(totalSeconds)) return "-";
  const numSeconds = parseInt(totalSeconds, 10);
  const minutes = Math.floor(numSeconds / 60);
  const seconds = numSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function getStatusTheme(status) {
  const normStatus = (status || "").toLowerCase();
  switch (normStatus) {
    case "answered":
      return { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" };
    case "missed":
    case "no answer":
      return { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" };
    case "failed":
    case "busy":
    case "cancel":
      return { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", dot: "bg-rose-500" };
    default:
      return { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200", dot: "bg-slate-400" };
  }
}

export function formatReadableDate(dateString) {
  if (!dateString) return "-";
  const numDate = Number(dateString);
  let dateObj;
  
  if (!isNaN(numDate) && dateString.length > 8) {
    dateObj = new Date(dateString.length === 10 ? numDate * 1000 : numDate);
  } else {
    if (typeof dateString === 'string' && dateString.includes('-')) {
        return dateString;
    }
    dateObj = new Date(dateString);
  }

  if (isNaN(dateObj.getTime())) return dateString;

  return dateObj.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });
}
