import { format, parse, formatISO, parseISO } from "date-fns";

export const formatDate = (date: string | Date): string => {
  if (typeof date === "string") {
    const parsedDate = parseISO(date);
    return format(parsedDate, "MMM dd, yyyy");
  }
  return format(date, "MMM dd, yyyy");
};

export const formatDateForInput = (date: string | Date): string => {
  if (typeof date === "string") {
    // Check if it's already in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    const parsedDate = parseISO(date);
    return format(parsedDate, "yyyy-MM-dd");
  }
  return format(date, "yyyy-MM-dd");
};

export const getCurrentDateString = (): string => {
  return format(new Date(), "yyyy-MM-dd");
};
