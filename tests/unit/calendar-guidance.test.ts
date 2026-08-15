import { readFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { describe, expect, it } from "vitest";

const ARTICLE_PATH = path.join("content", "knowledge-base");

async function readArticle(locale: "en" | "es") {
  const raw = await readFile(
    path.join(process.cwd(), ARTICLE_PATH, locale, "sessions", "calendar-and-booking.mdx"),
    "utf8"
  );

  return matter(raw);
}

describe("TASK-102 calendar guidance", () => {
  it.each(["en", "es"] as const)("publishes the %s article for calendar users", async (locale) => {
    const article = await readArticle(locale);

    expect(article.data.status).toBe("published");
    expect(article.data.roles).toEqual(["facilitator", "practitioner"]);
    expect(article.data.order).toBe(20);
  });

  it("documents the complete English workflow and its privacy boundary", async () => {
    const { content } = await readArticle("en");

    expect(content).toMatch(/Quick Add/);
    expect(content).toMatch(/Month[\s\S]*Week[\s\S]*Day/);
    expect(content).toMatch(/recurring slots/i);
    expect(content).toMatch(/Available[\s\S]*Booked[\s\S]*Cancelled/);
    expect(content).toMatch(/accept[\s\S]*decline/i);
    expect(content).toMatch(/future occurrences.*still available/i);
    expect(content).toMatch(/Visitors see only future[\s\S]*Available/);
    expect(content).toMatch(/time zone of the device/i);
    expect(content).toMatch(/Desktop and mobile tips/);
  });

  it("documents the complete Spanish workflow and its privacy boundary", async () => {
    const { content } = await readArticle("es");

    expect(content).toMatch(/Agregar rapido/);
    expect(content).toMatch(/Mes[\s\S]*Semana[\s\S]*Dia/);
    expect(content).toMatch(/horarios recurrentes/i);
    expect(content).toMatch(/Disponible[\s\S]*Reservado[\s\S]*Cancelado/);
    expect(content).toMatch(/Aceptar[\s\S]*Rechazar/);
    expect(content).toMatch(/ocurrencias futuras.*siguen disponibles/i);
    expect(content).toMatch(/visitantes solo ven horarios futuros[\s\S]*Disponibles/);
    expect(content).toMatch(/zona horaria del dispositivo/i);
    expect(content).toMatch(/escritorio y movil/i);
  });

  it("uses the localized article route from the contextual calendar panel", async () => {
    const source = await readFile(
      path.join(
        process.cwd(),
        "features",
        "sessions",
        "components",
        "session-availability-manager.tsx"
      ),
      "utf8"
    );

    expect(source).toContain(
      "`/${locale}/dashboard/knowledge-base/sessions/calendar-and-booking`"
    );
    expect(source).toContain('aria-labelledby="calendar-guidance-title"');
    expect(source).toContain("xl:grid-cols-[minmax(0,1fr)_18rem]");
  });
});
