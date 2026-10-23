// Verifica que el panel de administración no pueda quedar expuesto en el sitio publicado.
//   node scripts/verificar-admin.mjs                      → revisión del código (rápida; corre sola antes de cada `npm run build`)
//   node scripts/verificar-admin.mjs https://mi-sitio.app → además prueba el sitio ya publicado: todo /admin y /api/admin debe dar 404
// Protocolo completo en Doc/protocolo-admin.md.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(RAIZ, "src");
const rel = (p) => path.relative(RAIZ, p).replace(/\\/g, "/");
const leer = (p) => fs.readFileSync(p, "utf8");
const fallos = [];
const avisos = [];
const bien = [];
const mal = (m) => fallos.push(m);

function archivos(dir, filtro) {
  const salida = [];
  if (!fs.existsSync(dir)) return salida;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) salida.push(...archivos(p, filtro));
    else if (filtro(p)) salida.push(p);
  }
  return salida;
}

/* 1. Cada función exportada (GET, POST…) de /api/admin llama a su guardia. */
const GUARDIAS = /\b(verificarPeticion|adminPermitido)\s*\(/;
const rutasAdmin = archivos(path.join(SRC, "app", "api", "admin"), (p) => /route\.tsx?$/.test(p));
if (rutasAdmin.length === 0) mal("No se encontraron rutas en src/app/api/admin (¿se movió el panel?).");
for (const f of rutasAdmin) {
  const texto = leer(f);
  const partes = texto.split(/(?=export\s+(?:async\s+)?function\s+(?:GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b)/).filter((p) => /^export/.test(p));
  if (partes.length === 0) mal(`${rel(f)}: no exporta ningún método (GET/POST/…); revísalo.`);
  for (const parte of partes) {
    const metodo = /function\s+(\w+)/.exec(parte)[1];
    if (!GUARDIAS.test(parte)) mal(`${rel(f)}: el método ${metodo} no llama a verificarPeticion(req) ni a adminPermitido().`);
  }
}
bien.push(`${rutasAdmin.length} archivos de /api/admin con guardia en cada método`);

/* 2. El layout de /admin cierra las páginas. */
const layout = path.join(SRC, "app", "admin", "layout.tsx");
if (!fs.existsSync(layout)) mal("Falta src/app/admin/layout.tsx (el guardia de las páginas del panel).");
else if (!/adminPermitido\(/.test(leer(layout)) || !/notFound\(\)/.test(leer(layout))) mal("src/app/admin/layout.tsx ya no cierra el panel (debe llamar a adminPermitido y a notFound).");
else bien.push("el layout de /admin cierra las páginas con 404");
const paginasFuera = archivos(path.join(SRC, "app"), (p) => /[\\/]page\.tsx$/.test(p) && /[\\/]admin[\\/]/.test(p) && !p.startsWith(path.join(SRC, "app", "admin")));
for (const p of paginasFuera) mal(`${rel(p)}: una página «admin» fuera de src/app/admin no queda protegida por el layout.`);

/* 3. La muralla de entrada (proxy) existe y cubre /admin y /api/admin. */
const proxy = path.join(SRC, "proxy.ts");
if (!fs.existsSync(proxy)) mal("Falta src/proxy.ts (la primera muralla: 404 para /admin y /api/admin fuera de la máquina local).");
else {
  const t = leer(proxy);
  if (!/adminPermitido/.test(t) || !/\/api\/admin/.test(t) || !/\/admin/.test(t)) mal("src/proxy.ts no cubre /admin y /api/admin con adminPermitido.");
  else bien.push("src/proxy.ts cierra /admin y /api/admin");
}

/* 4. La regla de acceso conserva su tope duro en Vercel y no depende de variables. */
const acceso = path.join(SRC, "lib", "admin-acceso.ts");
if (!fs.existsSync(acceso)) mal("Falta src/lib/admin-acceso.ts.");
else {
  const t = leer(acceso);
  if (!/process\.env\.VERCEL\b[\s\S]{0,60}return false/.test(t)) mal("src/lib/admin-acceso.ts perdió el tope duro «si es Vercel, el panel nunca está disponible».");
  else bien.push("el tope duro de Vercel sigue en adminPermitido");
}
const accesoEnAdmin = leer(path.join(SRC, "lib", "admin.ts"));
if (/function\s+adminPermitido/.test(accesoEnAdmin)) mal("src/lib/admin.ts define su propia adminPermitido: debe usar la de admin-acceso.ts (una sola regla).");

/* 5. Ninguna configuración que se sube activa el panel. */
const PELIGRO = /\b(ADMIN_ENABLED|ADMIN_ALLOW_REMOTE)\b["']?\s*[=:]\s*["']?\s*(true|1|yes)/i;
const candidatos = [...fs.readdirSync(RAIZ).filter((f) => /^\.env/.test(f) || f === "vercel.json" || f === "package.json" || f === "next.config.ts").map((f) => path.join(RAIZ, f)), ...archivos(path.join(RAIZ, ".github"), () => true)];
let ignorados = 0;
for (const f of candidatos) {
  let ignorado = false;
  try {
    execFileSync("git", ["check-ignore", "-q", rel(f)], { cwd: RAIZ, stdio: "ignore" });
    ignorado = true;
  } catch {}
  if (ignorado) {
    ignorados++;
    continue; // .env.local y similares no se suben: ahí sí puede vivir ADMIN_ENABLED para pruebas locales
  }
  if (PELIGRO.test(leer(f))) mal(`${rel(f)}: activa ADMIN_ENABLED o ADMIN_ALLOW_REMOTE en un archivo que se sube. Quítalo.`);
}
bien.push(`sin ADMIN_ENABLED / ADMIN_ALLOW_REMOTE en archivos que se suben (${candidatos.length - ignorados} revisados)`);

/* 6. Los datos privados están en .gitignore y no se han subido. */
const PRIVADOS = ["content/suscriptores.json", "content/clics.json", "content/vistas.json", "content/papelera/x.json", "content/papelera-medios/x.png", "content/respaldos/x/x.json", ".env.local"];
let git = true;
try {
  execFileSync("git", ["--version"], { stdio: "ignore" });
} catch {
  git = false;
}
if (!git) avisos.push("git no está disponible: se omite la revisión de .gitignore y de archivos subidos.");
else {
  let esRepo = true;
  try {
    execFileSync("git", ["rev-parse", "--git-dir"], { cwd: RAIZ, stdio: "ignore" });
  } catch {
    esRepo = false;
  }
  if (!esRepo) avisos.push("No es un repositorio git (p. ej. el entorno de compilación): se omite la revisión de datos privados.");
  else {
    for (const p of PRIVADOS) {
      try {
        execFileSync("git", ["check-ignore", "-q", "--no-index", p], { cwd: RAIZ, stdio: "ignore" });
      } catch {
        mal(`.gitignore no cubre ${p}: es un dato privado y se subiría a GitHub.`);
      }
    }
    const subidos = execFileSync("git", ["ls-files", "content", ".env*"], { cwd: RAIZ, encoding: "utf8" })
      .split(/\r?\n/)
      .filter(Boolean)
      .filter((f) => /^content\/(suscriptores|clics|vistas)\.json$|^content\/(papelera|papelera-medios|respaldos)\/|^\.env(\.|$)(?!example)/.test(f));
    for (const f of subidos) mal(`${f} ya está en GitHub (git lo sigue). Sácalo con: git rm --cached "${f}" y confirma el cambio.`);
    if (subidos.length === 0) bien.push("los datos privados (suscriptores, clics, vistas, papelera, respaldos, .env) no están en git");
  }
}

/* 7. Rutas públicas que escriben archivos: solo las conocidas (todas guardan datos privados de lectores, nunca contenido). */
const PUBLICAS_QUE_ESCRIBEN = new Set(["src/app/api/suscribir/route.ts", "src/app/api/baja/route.ts", "src/app/api/clic/route.ts", "src/app/api/vista/route.ts"]);
const publicas = archivos(path.join(SRC, "app", "api"), (p) => /route\.tsx?$/.test(p) && !/[\\/]api[\\/]admin[\\/]/.test(p));
for (const f of publicas) {
  const t = leer(f);
  const importaFs = /from\s+["'](node:)?fs["']/.test(t) || /\b(writeFile|appendFile|rename|rm|unlink)Sync\b/.test(t);
  if (importaFs && !PUBLICAS_QUE_ESCRIBEN.has(rel(f))) mal(`${rel(f)}: ruta pública que toca archivos y no está en la lista conocida (scripts/verificar-admin.mjs). ¿Debería estar en /api/admin?`);
}
bien.push(`${publicas.length} rutas públicas de la API revisadas`);

/* 8. (Opcional) El sitio ya publicado responde 404 a todo el panel. */
const urlBase = process.argv[2];
async function probarSitio(base) {
  const b = base.replace(/\/+$/, "");
  const rutas = new Set(["/admin", "/admin/clics", "/admin/newsletter", "/admin/15", "/api/admin"]);
  for (const f of rutasAdmin) {
    const r = "/" + rel(path.dirname(f)).replace(/^src\/app\//, "").replace(/\[\w+\]/g, "15");
    rutas.add(r);
    rutas.add(r + "?todos=1");
  }
  let n = 0;
  for (const r of rutas) {
    for (const metodo of ["GET", "POST", "PUT", "DELETE"]) {
      if (metodo !== "GET" && !r.startsWith("/api/")) continue;
      try {
        const res = await fetch(b + r, { method: metodo, headers: metodo === "GET" ? {} : { "content-type": "application/json" }, body: metodo === "GET" ? undefined : "{}", redirect: "manual" });
        n++;
        if (res.status !== 404) mal(`${metodo} ${b}${r} respondió ${res.status} (debe ser 404).`);
      } catch (e) {
        mal(`${metodo} ${b}${r}: no se pudo consultar (${e instanceof Error ? e.message : e}).`);
      }
    }
  }
  const inicio = await fetch(b + "/").catch(() => null);
  if (!inicio || inicio.status !== 200) mal(`El sitio ${b}/ no respondió 200 (¿es la dirección correcta?).`);
  else bien.push(`sitio ${b}: ${n} peticiones al panel, todas 404; el inicio responde`);
}

if (urlBase) await probarSitio(urlBase);

/* Resultado */
for (const b of bien) console.log("  ✓", b);
for (const a of avisos) console.log("  ·", a);
if (fallos.length) {
  console.error("\n✗ El panel de administración podría quedar expuesto:\n");
  for (const f of fallos) console.error("  ✗", f);
  console.error("\nCorrige lo anterior (Doc/protocolo-admin.md) antes de publicar.");
  process.exit(1);
}
console.log("\nPanel de administración: protegido ✓" + (urlBase ? "" : " (para probar también el sitio publicado: node scripts/verificar-admin.mjs https://tu-sitio)"));
