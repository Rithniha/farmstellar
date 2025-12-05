import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getGreeting = (t: (key: string) => string) => {
  const currentHour = new Date().getHours();
  let greeting;

  if (currentHour < 12) {
    greeting = t("greetings.morning");
  } else if (currentHour >= 12 && currentHour <= 17) {
    greeting = t("greetings.afternoon");
  } else {
    greeting = t("greetings.evening");
  }

  return greeting;
};
