import {
  format,
  isToday,
  isYesterday,
  parseISO,
  differenceInCalendarDays,
} from "date-fns";

export const formatLastSeen = (timestamp) => {
  const date = parseISO(timestamp);

  if (isToday(date)) {
    return format(date, "h:mm a");
  } else if (isYesterday(date)) {
    return `Yesterday ${format(date, "h:mm a")}`;
  } else if (differenceInCalendarDays(new Date(), date) <= 6) {
    return format(date, "EEEE h:mm a"); // e.g., Tuesday 12:55 pm
  } else {
    return format(date, "dd/MM/yyyy"); // e.g., 28/05/2024
  }
};
