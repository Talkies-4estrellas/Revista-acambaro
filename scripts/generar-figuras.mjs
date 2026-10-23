// Genera src/lib/figuras-datos.ts: figuras vectoriales decorativas (cintas, sellos, burbujas, flechas, divisores, marcos, formas…).
// Todo está dibujado a mano o calculado aquí (sin material de terceros). Uso: node scripts/generar-figuras.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SALIDA = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src", "lib", "figuras-datos.ts");
const r2 = (n) => Math.round(n * 100) / 100;

/* ----------------------------- auxiliares ----------------------------- */
const pts = (lista) => lista.map(([x, y]) => `${r2(x)},${r2(y)}`).join(" ");
const poligono = (lista, extra = {}) => ["polygon", { points: pts(lista), ...extra }];
const ruta = (d, extra = {}) => ["path", { d, ...extra }];
const circulo = (cx, cy, r, extra = {}) => ["circle", { cx: String(cx), cy: String(cy), r: String(r), ...extra }];
const rect = (x, y, w, h, extra = {}) => ["rect", { x: String(x), y: String(y), width: String(w), height: String(h), ...extra }];

/** Polígono regular de n lados. */
function regular(n, cx, cy, R, giro = -90) {
  return Array.from({ length: n }, (_, i) => {
    const a = ((giro + (360 / n) * i) * Math.PI) / 180;
    return [cx + R * Math.cos(a), cy + R * Math.sin(a)];
  });
}
/** Estrella / estallido de n puntas. */
function estrella(n, cx, cy, R, r, giro = -90) {
  return Array.from({ length: n * 2 }, (_, i) => {
    const a = ((giro + (180 / n) * i) * Math.PI) / 180;
    const rad = i % 2 === 0 ? R : r;
    return [cx + rad * Math.cos(a), cy + rad * Math.sin(a)];
  });
}
/** Círculo festoneado: n abultamientos hacia afuera. */
function festoneado(n, cx, cy, R, bulto) {
  const p = Array.from({ length: n }, (_, i) => {
    const a = (-90 + (360 / n) * i) * (Math.PI / 180);
    return [cx + R * Math.cos(a), cy + R * Math.sin(a)];
  });
  let d = `M${r2(p[0][0])} ${r2(p[0][1])}`;
  for (let i = 1; i <= n; i++) d += `A${bulto} ${bulto} 0 0 1 ${r2(p[i % n][0])} ${r2(p[i % n][1])}`;
  return d + "Z";
}
/** Línea ondulada. */
function onda(ancho, alto, periodos, y0 = alto / 2) {
  const n = periodos * 16;
  let d = "";
  for (let i = 0; i <= n; i++) {
    const x = (ancho * i) / n;
    const y = y0 + (alto / 2 - 1) * Math.sin((i / n) * periodos * 2 * Math.PI);
    d += `${i ? "L" : "M"}${r2(x)} ${r2(y)}`;
  }
  return d;
}

const F = {};
const fig = (id, nombre, categoria, etiquetas, estilo, caja, nodos, extra = {}) => {
  F["fig-" + id] = { nombre, categoria, etiquetas, estilo, nodos, ...(caja[0] === 24 && caja[1] === 24 ? {} : { caja }), ...extra };
};

/* ------------------------- Cintas y etiquetas ------------------------- */
const C1 = "Cintas y etiquetas";
fig("cinta", "Cinta con pliegues", C1, "banner listón título rótulo", "relleno", [120, 40], [
  poligono([[0, 12], [16, 12], [16, 36], [0, 36], [7, 24]], { fillOpacity: "0.6" }),
  poligono([[120, 12], [104, 12], [104, 36], [120, 36], [113, 24]], { fillOpacity: "0.6" }),
  rect(10, 4, 100, 26),
  poligono([[10, 30], [16, 30], [16, 36]], { fillOpacity: "0.45" }),
  poligono([[110, 30], [104, 30], [104, 36]], { fillOpacity: "0.45" }),
]);
fig("cinta-simple", "Cinta con muescas", C1, "banner rótulo título", "relleno", [120, 32], [poligono([[0, 0], [120, 0], [111, 16], [120, 32], [0, 32], [9, 16]])]);
fig("cinta-curva", "Cinta curva", C1, "banner arco título", "relleno", [120, 44], [
  ruta("M2 14Q60 -2 118 14V34Q60 18 2 34Z"),
]);
fig("banderin", "Banderín", C1, "bandera triángulo pestaña", "relleno", [24, 24], [poligono([[3, 2], [21, 2], [21, 22], [12, 16], [3, 22]])]);
fig("marcador", "Marcador", C1, "separador página guardar", "relleno", [24, 24], [poligono([[6, 2], [18, 2], [18, 22], [12, 17], [6, 22]])]);
fig("etiqueta", "Etiqueta con agujero", C1, "precio oferta tag", "relleno", [24, 24], [
  ruta("M3 12 12 3h8a1 1 0 0 1 1 1v8l-9 9zM17.5 6.2a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4z", { fillRule: "evenodd" }),
]);
fig("etiqueta-ovalada", "Etiqueta ovalada", C1, "rótulo nombre placa", "relleno", [60, 30], [
  rect(2, 2, 56, 26, { rx: "13" }),
]);
fig("escudo", "Escudo", C1, "blasón insignia", "relleno", [24, 24], [ruta("M12 2 4 5v6c0 5 3.4 9.3 8 11 4.6-1.7 8-6 8-11V5z")]);
fig("corona", "Corona", C1, "rey reina premio", "relleno", [24, 24], [ruta("M2.5 18 1.5 7l5.5 4 5-7 5 7 5.5-4-1 11z"), rect(2.5, 19.5, 19, 2.5, { rx: "0.6" })]);
fig("medalla", "Medalla con listones", C1, "premio ganador", "relleno", [24, 24], [
  poligono([[7.5, 13], [4.5, 22.5], [10.5, 19.5], [12, 22], [12, 14]], { fillOpacity: "0.65" }),
  poligono([[16.5, 13], [19.5, 22.5], [13.5, 19.5], [12, 22], [12, 14]], { fillOpacity: "0.65" }),
  circulo(12, 9, 7),
]);

/* ------------------------------ Burbujas ------------------------------ */
const C2 = "Burbujas y globos";
fig("burbuja", "Burbuja de diálogo", C2, "globo hablar conversación", "relleno", [40, 32], [ruta("M6 2h28a4 4 0 0 1 4 4v14a4 4 0 0 1-4 4H19l-9 7v-7H6a4 4 0 0 1-4-4V6a4 4 0 0 1 4-4z")]);
fig("burbuja-ovalada", "Burbuja ovalada", C2, "globo cómic hablar", "relleno", [40, 32], [ruta("M20 2C9.5 2 2 7.8 2 14.5c0 4 2.7 7.4 6.8 9.5L7 30l8-4.4c1.6.3 3.2.4 5 .4 10.5 0 18-5.8 18-12.5S30.500 2 20 2z")]);
fig("burbuja-pensamiento", "Burbuja de pensamiento", C2, "nube idea pensar", "relleno", [40, 36], [
  ruta("M9 24a6.500 6.500 0 0 1-.5-13A8.500 8.500 0 0 1 24 7.500a7 7 0 0 1 8 6.500 6 6 0 0 1-1.500 11.500 6 6 0 0 1-5 .5 7 7 0 0 1-8 0 6.500 6.500 0 0 1-8.500-1.500z"),
  circulo(9, 30, 2.6),
  circulo(4, 34, 1.5),
]);
fig("burbuja-grito", "Burbuja de grito", C2, "exclamación explosión cómic", "relleno", [40, 36], [poligono(estrella(12, 20, 18, 19, 12, -90))]);
fig("llamada", "Llamada rectangular", C2, "recuadro nota cita", "relleno", [40, 32], [ruta("M3 2h34a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H14l-6 8v-8H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z")]);

/* ---------------------------- Estrellas y sellos ---------------------------- */
const C3 = "Estrellas y sellos";
fig("estrella", "Estrella", C3, "favorito destacado calificación", "relleno", [24, 24], [poligono(estrella(5, 12, 12.8, 10.6, 4.4))]);
fig("estrella-6", "Estrella de seis puntas", C3, "david destacado", "relleno", [24, 24], [poligono(estrella(6, 12, 12, 11, 6.200))]);
fig("destello", "Destello de cuatro puntas", C3, "brillo chispa magia", "relleno", [24, 24], [ruta("M12 1c1 6.500 4.500 10 11 11-6.500 1-10 4.500-11 11-1-6.500-4.500-10-11-11 6.500-1 10-4.500 11-11z")]);
fig("estallido-12", "Estallido de 12 puntas", C3, "oferta sello promoción nuevo", "relleno", [24, 24], [poligono(estrella(12, 12, 12, 11.500, 8.600))]);
fig("estallido-20", "Estallido de 20 puntas", C3, "oferta sello promoción descuento", "relleno", [24, 24], [poligono(estrella(20, 12, 12, 11.500, 9.800))]);
fig("sello-ondulado", "Sello ondulado", C3, "certificado garantía insignia", "relleno", [24, 24], [ruta(festoneado(12, 12, 12, 8.500, 3.100))]);
fig("sello-dentado", "Sello dentado", C3, "certificado insignia engrane", "relleno", [24, 24], [poligono(estrella(16, 12, 12, 11.500, 10))]);
fig("sello-doble", "Sello con aro", C3, "certificado calidad", "relleno", [24, 24], [
  ruta(festoneado(14, 12, 12, 8.700, 3), { fillOpacity: "0.35" }),
  circulo(12, 12, 8.300),
  circulo(12, 12, 6.200, { fill: "none", stroke: "#fff", strokeWidth: "0.8", strokeOpacity: "0.8" }),
]);

/* ------------------------------- Formas ------------------------------- */
const C4 = "Formas";
fig("triangulo", "Triángulo", C4, "pirámide advertencia", "relleno", [24, 24], [poligono([[12, 3], [22.500, 21], [1.500, 21]])]);
fig("rombo", "Rombo", C4, "diamante", "relleno", [24, 24], [poligono([[12, 1.500], [22.500, 12], [12, 22.500], [1.500, 12]])]);
fig("pentagono", "Pentágono", C4, "polígono", "relleno", [24, 24], [poligono(regular(5, 12, 12.800, 11))]);
fig("hexagono", "Hexágono", C4, "panal polígono", "relleno", [24, 24], [poligono(regular(6, 12, 12, 11, 0))]);
fig("octagono", "Octágono", C4, "alto señal polígono", "relleno", [24, 24], [poligono(regular(8, 12, 12, 11, 22.500))]);
fig("trapecio", "Trapecio", C4, "base", "relleno", [24, 24], [poligono([[6, 5], [18, 5], [23, 19], [1, 19]])]);
fig("paralelogramo", "Paralelogramo", C4, "inclinado", "relleno", [24, 24], [poligono([[7, 5], [23, 5], [17, 19], [1, 19]])]);
fig("semicirculo", "Semicírculo", C4, "medio círculo arco", "relleno", [24, 24], [ruta("M1.500 18a10.500 10.500 0 0 1 21 0z")]);
fig("anillo", "Anillo", C4, "aro círculo", "relleno", [24, 24], [ruta("M12 1.500a10.500 10.500 0 1 0 0 21 10.500 10.500 0 0 0 0-21zm0 4.500a6 6 0 1 1 0 12 6 6 0 0 1 0-12z", { fillRule: "evenodd" })]);
fig("cruz", "Cruz gruesa", C4, "más suma salud", "relleno", [24, 24], [poligono([[9, 2], [15, 2], [15, 9], [22, 9], [22, 15], [15, 15], [15, 22], [9, 22], [9, 15], [2, 15], [2, 9], [9, 9]])]);
fig("corazon", "Corazón", C4, "amor favorito", "relleno", [24, 24], [ruta("M12 21.500S3.500 16 3.500 9.800A4.800 4.800 0 0 1 12 6.800a4.800 4.800 0 0 1 8.500 3C20.500 16 12 21.500 12 21.500z")]);
fig("gota", "Gota", C4, "agua líquido", "relleno", [24, 24], [ruta("M12 2C12 2 5 9.500 5 15a7 7 0 0 0 14 0C19 9.500 12 2 12 2z")]);
fig("rayo", "Rayo", C4, "energía electricidad", "relleno", [24, 24], [poligono([[13.500, 1.500], [4, 14], [11, 14], [9.500, 22.500], [20, 9.500], [13, 9.500]])]);
fig("luna", "Luna creciente", C4, "noche", "relleno", [24, 24], [ruta("M20.500 14.500A9 9 0 1 1 9.500 3.500a7.500 7.500 0 0 0 11 11z")]);
fig("nube", "Nube", C4, "clima cielo", "relleno", [24, 24], [ruta("M7 19a5 5 0 0 1-.6-9.960A6.500 6.500 0 0 1 19 9.500 4.800 4.800 0 0 1 18.500 19z")]);

/* ------------------------------ Orgánicas ------------------------------ */
const C5 = "Manchas y olas";
fig("mancha-1", "Mancha 1", C5, "blob fondo orgánica", "relleno", [24, 24], [ruta("M12.800 1.800c4.200.3 8.300 2.900 9.200 7s-.9 7.600-3.500 10.700-7 3.700-10.500 2.200-6-4.800-5.600-8.800S6.800 4.600 9.300 2.800c1.100-.8 2.300-1.100 3.500-1z")]);
fig("mancha-2", "Mancha 2", C5, "blob fondo orgánica", "relleno", [24, 24], [ruta("M18.500 4c3.200 2.600 4.300 7 2.800 10.700s-5.400 6.700-9.400 7.200-8.600-1.700-10-5.400.4-7.100 2.500-10C6.500 3.400 9.600 1.600 12.900 1.500c2 0 4.300.8 5.600 2.500z")]);
fig("mancha-3", "Mancha 3", C5, "blob fondo orgánica", "relleno", [24, 24], [ruta("M14.500 2.200c3.500 1 6.900 3 7.900 6.500s-1.300 6.900-3.300 9.900-4.700 5.600-8.100 4.600-5-4.500-6-7.800-1.800-6.700.4-9.300S11 1.200 14.500 2.200z")]);
fig("onda-relleno", "Onda de fondo", C5, "olas borde sección agua", "relleno", [120, 30], [ruta("M0 12C20 2 40 2 60 12S100 22 120 12V30H0z")]);
fig("onda-doble", "Ondas dobles", C5, "mar olas borde sección", "relleno", [120, 34], [
  ruta("M0 14C15 6 30 6 45 14S75 22 90 14s22-8 30 0V34H0z", { fillOpacity: "0.45" }),
  ruta("M0 20C20 12 40 12 60 20S100 28 120 20V34H0z"),
]);
fig("pincelada", "Pincelada", C5, "brocha trazo subrayado", "relleno", [120, 24], [ruta("M3 15C10 6 28 3 48 6s46-3 62 0c7 1.500 9 6 6 10-3 4-14 3-30 5s-38 1-58-1S2 22 3 15z")]);

/* ---------------------------- Flechas decorativas ---------------------------- */
const C6 = "Flechas decorativas";
fig("flecha-bloque", "Flecha de bloque", C6, "derecha siguiente", "relleno", [24, 24], [poligono([[1.500, 8.500], [13, 8.500], [13, 3.500], [22.500, 12], [13, 20.500], [13, 15.500], [1.500, 15.500]])]);
fig("flecha-doble", "Flecha doble", C6, "ambos lados intercambio", "relleno", [24, 24], [poligono([[1, 12], [7, 6], [7, 10], [17, 10], [17, 6], [23, 12], [17, 18], [17, 14], [7, 14], [7, 18]])]);
fig("flecha-curva", "Flecha curva", C6, "giro sigue", "trazo", [24, 24], [ruta("M4 19c0-8 5-12 14-12M14 3l5 4-5 4")]);
fig("flecha-giro", "Flecha de regreso", C6, "volver retorno", "trazo", [24, 24], [ruta("M20 7H9.500a5 5 0 0 0 0 10H14M16 3l4 4-4 4")]);
fig("flecha-circular", "Flecha circular", C6, "recargar repetir", "trazo", [24, 24], [ruta("M20 12a8 8 0 1 1-2.400-5.700M20 3.500v5h-5")]);
fig("flecha-zigzag", "Flecha en zigzag", C6, "camino ruta", "trazo", [24, 24], [ruta("M3 19l5-8 5 5 6-11M14.500 5H20v5.500")]);
fig("play", "Triángulo de reproducción", C6, "video iniciar", "relleno", [24, 24], [poligono([[6, 3.500], [20.500, 12], [6, 20.500]])]);

/* -------------------------------- Divisores -------------------------------- */
const C7 = "Divisores";
const DIV = { trazoBase: 1.2, ancho: 300 };
fig("div-onda", "Línea ondulada", C7, "separador olas", "trazo", [120, 12], [ruta(onda(120, 10, 5, 6))], DIV);
fig("div-zigzag", "Línea en zigzag", C7, "separador picos", "trazo", [120, 12], [
  ruta(`M1 10${Array.from({ length: 20 }, (_, i) => `L${r2(1 + 6 * (i + 1))} ${i % 2 === 0 ? 2 : 10}`).join("")}`),
], DIV);
fig("div-puntos", "Línea de puntos", C7, "separador", "relleno", [120, 12], [
  ...Array.from({ length: 13 }, (_, i) => circulo(r2(5 + i * 9.200), 6, 1.700)),
], { ancho: 300 });
fig("div-escalonada", "Greca escalonada", C7, "mexicana prehispánica separador pirámide", "trazo", [128, 14], [
  ruta(`M0 12${"h4v-4h4v-4h4v4h4v4".repeat(8)}`),
], DIV);
fig("div-ornamento", "Ornamento con rombo", C7, "separador adorno centro", "relleno", [120, 14], [
  rect(2, 6.500, 42, 1, { rx: "0.5" }),
  rect(76, 6.500, 42, 1, { rx: "0.5" }),
  poligono([[60, 1], [67, 7], [60, 13], [53, 7]]),
  circulo(48.500, 7, 1.800),
  circulo(71.500, 7, 1.800),
], { ancho: 300 });
fig("div-doble", "Doble línea", C7, "separador filete", "relleno", [120, 8], [rect(0, 1.200, 120, 1.600), rect(0, 5.200, 120, 0.800)], { ancho: 320 });
fig("div-guirnalda", "Guirnalda de banderines", C7, "fiesta papel picado banderas", "relleno", [120, 28], [
  ruta("M0 4Q60 26 120 4", { fill: "none", stroke: "currentColor", strokeWidth: "0.9" }),
  ...Array.from({ length: 9 }, (_, i) => {
    const t = (i + 1) / 10;
    const x = 120 * t;
    const y = (1 - t) ** 2 * 4 + 2 * (1 - t) * t * 26 + t * t * 4;
    return poligono([[x - 5.500, y - 0.500], [x + 5.500, y - 0.500], [x, y + 13]], { fillOpacity: i % 2 ? "0.55" : "1" });
  }),
], { ancho: 300 });
fig("div-papel-picado", "Papel picado", C7, "fiesta México banderas adorno", "relleno", [120, 30], [
  rect(0, 1, 120, 1.600),
  ...Array.from({ length: 6 }, (_, i) => {
    const x = 2 + i * 19.700;
    return ruta(`M${r2(x)} 2.600h16v20l-2.670 4-2.670-4-2.660 4-2.670-4-2.660 4-2.670-4z`, { fillOpacity: i % 2 ? "0.6" : "1" });
  }),
], { ancho: 300 });

/* --------------------------------- Marcos --------------------------------- */
const C8 = "Marcos y bordes";
const MARCO = { ajuste: "estirar", trazoBase: 1.4, ancho: 360 };
fig("marco", "Marco simple", C8, "borde recuadro", "trazo", [100, 70], [rect(1, 1, 98, 68)], MARCO);
fig("marco-redondeado", "Marco redondeado", C8, "borde recuadro", "trazo", [100, 70], [rect(1, 1, 98, 68, { rx: "10" })], MARCO);
fig("marco-doble", "Marco doble", C8, "borde recuadro filete", "trazo", [100, 70], [rect(1, 1, 98, 68), rect(4.500, 4.500, 91, 61)], { ...MARCO, trazoBase: 0.9 });
fig("marco-punteado", "Marco punteado", C8, "borde recuadro cupón", "trazo", [100, 70], [rect(1, 1, 98, 68, { rx: "3", strokeDasharray: "3 2.500" })], MARCO);
fig("marco-esquinas", "Marco de esquinas", C8, "borde recuadro visor", "trazo", [100, 70], [
  ruta("M1 14V1h13M86 1h13v13M99 56v13H86M14 69H1V56"),
], { ...MARCO, trazoBase: 2 });
fig("marco-ornamental", "Marco con esquinas cortadas", C8, "borde recuadro diploma", "trazo", [100, 70], [
  ruta("M9 1h82l8 8v52l-8 8H9L1 61V9z"),
  ruta("M12 5h76l7 7v46l-7 7H12L5 58V12z", { strokeOpacity: "0.6" }),
], { ...MARCO, trazoBase: 0.9 });

/* ------------------------------- Naturaleza ------------------------------- */
const C9 = "Naturaleza y clima";
fig("sol", "Sol", C9, "día calor luz", "relleno", [24, 24], [
  circulo(12, 12, 4.600),
  ruta("M12 1.500v3M12 19.500v3M1.500 12h3M19.500 12h3M4.600 4.600l2.100 2.100M17.300 17.300l2.100 2.100M4.600 19.400l2.100-2.100M17.300 6.700l2.100-2.100", { fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" }),
]);
fig("hoja", "Hoja", C9, "planta árbol", "relleno", [24, 24], [ruta("M20.500 3.500C10 3.500 3.500 9 3.500 16.500c0 2 .6 3.500 1.200 4.200.7-5.200 4.200-9.200 9.300-11.300-4.200 3.200-6.400 7.200-6.900 11.300C16.800 20.500 20.500 12.500 20.500 3.500z")]);
fig("flor", "Flor", C9, "pétalos jardín", "relleno", [24, 24], [
  ...regular(5, 12, 12, 5.600).map(([x, y]) => circulo(r2(x), r2(y), 3.800)),
  circulo(12, 12, 2.800, { fillOpacity: "0.35", fill: "#fff" }),
]);
fig("montanas", "Montañas", C9, "paisaje sierra cerros", "relleno", [24, 24], [
  poligono([[0.500, 20.500], [8.500, 6], [14, 14.500], [17, 10.500], [23.500, 20.500]]),
  poligono([[8.500, 6], [10.600, 9.700], [8.500, 8.700], [6.400, 9.700]], { fill: "#fff", fillOpacity: "0.55" }),
]);
fig("pino", "Pino", C9, "bosque árbol", "relleno", [24, 24], [
  poligono([[12, 1.500], [18, 9], [15.500, 9], [20, 15], [13.200, 15], [13.200, 22.500], [10.800, 22.500], [10.800, 15], [4, 15], [8.500, 9], [6, 9]]),
]);
fig("nopal", "Nopal", C9, "cactus desierto México", "relleno", [24, 24], [
  ruta("M12 2.500c-2.200 0-3.500 1.800-3.500 4v11.200c0 2.600 1.600 4.300 3.500 4.300s3.500-1.700 3.500-4.300V6.500c0-2.200-1.300-4-3.500-4z"),
  ruta("M8.500 12.500H6.300a2 2 0 0 1-2-2V8.200a1.700 1.700 0 0 1 3.400 0v1.100h.8z"),
  ruta("M15.500 14h2.200a2 2 0 0 0 2-2V9.700a1.700 1.700 0 0 0-3.400 0v1.100h-.8z"),
]);

/* ---------------------------------- Salida ---------------------------------- */
const orden = ["Cintas y etiquetas", "Burbujas y globos", "Estrellas y sellos", "Formas", "Manchas y olas", "Flechas decorativas", "Divisores", "Marcos y bordes", "Naturaleza y clima"];
const faltan = [...new Set(Object.values(F).map((f) => f.categoria))].filter((c) => !orden.includes(c));
if (faltan.length) throw new Error("categorías sin orden: " + faltan.join(", "));

const texto = `/**
 * GENERADO por scripts/generar-figuras.mjs: no editar a mano.
 * Figuras vectoriales decorativas dibujadas para la revista (sin material de terceros): cintas, burbujas, sellos, formas, flechas, divisores y marcos.
 * Se usan como un icono más (elemento «icono»), con los ids «fig-…».
 */
import type { DatosIcono } from "./iconos-datos";

export type DatosFigura = DatosIcono & {
  /** Tamaño del dibujo (ancho, alto). Sin él, 24×24. */
  caja?: readonly [number, number];
  /** «estirar»: el dibujo se deforma para llenar su caja (marcos). Sin él, conserva su proporción. */
  ajuste?: "estirar";
  /** Grosor de línea por omisión de las figuras de trazo (en unidades del dibujo). */
  trazoBase?: number;
  /** Ancho con el que se coloca en la hoja (por omisión, 140). */
  ancho?: number;
};

export const CATEGORIAS_FIGURA = ${JSON.stringify(orden)} as const;

export const FIGURAS: Record<string, DatosFigura> = ${JSON.stringify(F)};
`;
fs.writeFileSync(SALIDA, texto);
console.log(`${Object.keys(F).length} figuras → ${path.relative(process.cwd(), SALIDA)}`);
