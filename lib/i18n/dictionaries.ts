import "server-only";
import type { Locale } from "@/lib/i18n/config";

const dictionaries = {
  en: () => import("@/messages/en.json").then((module) => module.default),
  es: () => import("@/messages/es.json").then((module) => module.default)
};

export async function getDictionary(locale: Locale) {
  return dictionaries[locale]();
}
