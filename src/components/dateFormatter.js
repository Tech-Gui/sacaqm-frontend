import { format, isToday, isYesterday, parseISO } from 'date-fns';

export const formatLastSeen = (timestamp) => {
  const date = parseISO(timestamp);

  if (isToday(date)) {
    return format(date, "h:mm a");
  } else if (isYesterday(date)) {
    return `Yesterday ${format(date, "h:mm a")}`;
  } else {
    return format(date, "EEEE h:mm a"); // e.g., Tuesday 12:55 pm
  }
};
