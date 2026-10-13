/** Generador del correo del newsletter (sin dependencias de servidor: lo usa el panel en el navegador). */

export type DatosCorreo = {
  numero: string;
  tema: string;
  /** Ej. "Octubre 2026". */
  periodo: string;
  intro: string;
  /** Dirección pública del sitio, sin "/" final (ej. https://revista.com). */
  baseUrl: string;
  edicionId: string;
  /** Imagen de cabecera (ruta "/media/…" o dirección completa); opcional. */
  imagen?: string;
  /** Páginas que se listan en el correo. */
  paginas: { n: number; titulo: string }[];
  /** Texto que cada servicio reemplaza por el enlace personal de baja. */
  enlaceBaja: string;
};

export const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const absoluta = (base: string, ruta: string) => (/^https?:\/\//.test(ruta) ? ruta : `${base}${ruta.startsWith("/") ? "" : "/"}${ruta}`);

export function asuntoSugerido(d: Pick<DatosCorreo, "numero" | "tema">) {
  return `Acámbaro N.º ${d.numero}: ${d.tema.trim()}`;
}

/** HTML del correo: tablas y estilos en línea, que es lo que soportan los clientes de correo. */
export function htmlCorreo(d: DatosCorreo): string {
  const base = d.baseUrl.replace(/\/+$/, "");
  const leer = `${base}/ediciones/${encodeURIComponent(d.edicionId)}/1`;
  const filas = d.paginas
    .map(
      (p) => `<tr><td style="padding:10px 0;border-top:1px solid #d9cfba;font-family:Georgia,'Times New Roman',serif;font-size:18px;">
<a href="${esc(`${base}/ediciones/${encodeURIComponent(d.edicionId)}/${p.n}`)}" style="color:#1c1814;text-decoration:none;"><span style="color:#b5472f;font-family:Arial,sans-serif;font-size:12px;font-weight:bold;">${String(p.n).padStart(2, "0")}</span>&nbsp;&nbsp;${esc(p.titulo)}</a></td></tr>`,
    )
    .join("\n");
  const intro = d.intro
    .trim()
    .split(/\n{2,}/)
    .filter(Boolean)
    .map((t) => `<p style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:1.6;color:#1c1814;">${esc(t).replace(/\n/g, "<br>")}</p>`)
    .join("\n");

  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(asuntoSugerido(d))}</title></head>
<body style="margin:0;padding:0;background:#efe8d8;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#efe8d8;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#fbf8f1;border:1px solid #1c1814;">
<tr><td style="padding:22px 28px 14px;text-align:center;border-bottom:4px double #1c1814;">
<div style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#b5472f;font-weight:bold;">Edición N.º ${esc(d.numero)} · ${esc(d.periodo)}</div>
<a href="${esc(base)}/" style="text-decoration:none;"><img src="${esc(base)}/brand/logo.png" alt="ACOM-Di, Revista de Acámbaro" width="300" style="display:inline-block;width:300px;max-width:100%;height:auto;border:0;margin-top:10px;font-family:Georgia,'Times New Roman',serif;font-size:32px;font-weight:bold;color:#1c1814;"></a>
</td></tr>${
    d.imagen
      ? `
<tr><td><a href="${esc(leer)}"><img src="${esc(absoluta(base, d.imagen))}" alt="${esc(d.tema)}" width="600" style="display:block;width:100%;height:auto;border:0;"></a></td></tr>`
      : ""
  }
<tr><td style="padding:26px 28px 6px;">
<h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:1.2;font-style:italic;color:#1c1814;">${esc(d.tema)}</h1>
${intro}
</td></tr>
<tr><td align="center" style="padding:6px 28px 24px;">
<a href="${esc(leer)}" style="display:inline-block;background:#1c1814;color:#fbf8f1;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;text-decoration:none;padding:14px 28px;">Leer la edición</a>
</td></tr>${
    d.paginas.length
      ? `
<tr><td style="padding:0 28px 22px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding-bottom:6px;font-family:Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:bold;color:#6b6155;">En este número</td></tr>
${filas}
</table></td></tr>`
      : ""
  }
<tr><td style="padding:18px 28px;border-top:4px double #1c1814;text-align:center;font-family:Arial,sans-serif;font-size:12px;line-height:1.6;color:#6b6155;">
Recibes este correo porque te suscribiste a la revista Acámbaro.<br>
<a href="${esc(d.enlaceBaja)}" style="color:#6b6155;">Darme de baja</a>
</td></tr>
</table>
</td></tr></table>
</body></html>
`;
}
