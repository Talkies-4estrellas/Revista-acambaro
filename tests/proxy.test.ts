import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { adminPermitido, esRutaAdmin } from "@/lib/admin-acceso";
import { proxy } from "@/proxy";

const CHROME = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36";
const peticion = (ruta: string, cabeceras: Record<string, string> = {}, host = "localhost:3000") =>
  new NextRequest(new URL(ruta, `http://${host}`), { headers: { host, "user-agent": CHROME, "sec-fetch-dest": "document", ...cabeceras } });

afterEach(() => vi.unstubAllEnvs());

describe("primera visita", () => {
  it("lleva a la presentación y marca la visita por un año", () => {
    const r = proxy(peticion("/"));
    expect(r.status).toBe(307);
    expect(new URL(r.headers.get("location")!).pathname).toBe("/bienvenida");
    const cookie = r.headers.get("set-cookie") ?? "";
    expect(cookie).toContain("acomdi-bienvenida=1");
    expect(cookie).toContain("Max-Age=31536000");
  });

  it("quien ya la vio entra directo", () => {
    expect(proxy(peticion("/", { cookie: "acomdi-bienvenida=1" })).status).toBe(200);
  });

  it("?inicio la salta", () => {
    expect(proxy(peticion("/?inicio")).status).toBe(200);
  });

  it.each(["WhatsApp/2.23", "facebookexternalhit/1.1", "Googlebot/2.1", "Mozilla/5.0 HeadlessChrome/130"])("no redirige a %s", (ua) => {
    expect(proxy(peticion("/", { "user-agent": ua })).status).toBe(200);
  });

  it("no redirige lo que no es abrir una página", () => {
    expect(proxy(peticion("/", { "sec-fetch-dest": "image" })).status).toBe(200);
  });
});

describe("el panel solo existe en este equipo", () => {
  it.each(["/admin", "/admin/ajustes", "/admin/anunciantes", "/api/admin/ediciones", "/api/admin/ajustes"])("%s da 404 desde fuera", (ruta) => {
    expect(proxy(peticion(ruta, {}, "revista-acambaro.vercel.app")).status).toBe(404);
  });

  it("se abre desde localhost", () => {
    expect(proxy(peticion("/admin")).status).toBe(200);
  });

  it("en Vercel nunca se abre, ni con las variables puestas", () => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("ADMIN_ENABLED", "true");
    vi.stubEnv("ADMIN_ALLOW_REMOTE", "true");
    expect(adminPermitido("localhost:3000")).toBe(false);
  });

  it("una compilación de producción tampoco lo abre sola", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(adminPermitido("localhost:3000")).toBe(false);
    vi.stubEnv("ADMIN_ENABLED", "true");
    expect(adminPermitido("localhost:3000")).toBe(true);
  });

  it("reconoce las rutas del panel sin confundir otras parecidas", () => {
    expect(esRutaAdmin("/admin/medios")).toBe(true);
    expect(esRutaAdmin("/api/admin/ajustes")).toBe(true);
    expect(esRutaAdmin("/administrar")).toBe(false);
  });
});
