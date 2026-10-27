import type { Elemento, ElementoTexto, Pagina } from "./esquema";
import type { PlantillaBase } from "./plantillas-base";

/**
 * Plantillas de secciones habituales en una revista local: carta del editor, entrevista, agenda, receta, directorio, lugar,
 * foto a página completa y dos columnas. Hoja de 800 × 1100, pensadas para apilarse bien en el celular. Se copian a la edición
 * con identificadores nuevos (ver `paginaDesdePlantilla`), así que se pueden modificar libremente.
 */

const texto = (x: number, y: number, w: number, h: number, t: string, o: Partial<ElementoTexto> = {}): Elemento => ({ tipo: "texto", x, y, w, h, texto: t, ...o });
const imagen = (x: number, y: number, w: number, h: number, o: Record<string, unknown> = {}): Elemento =>
  ({ tipo: "imagen", x, y, w, h, tono: "ocre", alt: "Foto", ajuste: "cubrir", ...o }) as Elemento;
const forma = (x: number, y: number, w: number, h: number, o: Record<string, unknown> = {}): Elemento =>
  ({ tipo: "forma", x, y, w, h, color: "tinta", ...o }) as Elemento;
const icono = (nombre: string, x: number, y: number, w: number, o: Record<string, unknown> = {}): Elemento =>
  ({ tipo: "icono", icono: nombre, x, y, w, h: w, ...o }) as Elemento;

const lienzo = (titulo: string, elementos: Elemento[], fondo = "papel"): Pagina => ({
  plantilla: "lienzo",
  transicion: "izquierda",
  titulo,
  fondo,
  alto: 1100,
  movil: "apilar",
  elementos,
});

const ETIQUETA = { fuente: "sans", tam: 14, peso: 700, mayusculas: true, espaciado: 0.18, color: "terracota" } as const;
const CUERPO = { fuente: "serif", tam: 20, interlineado: 1.6 } as const;

export const PLANTILLAS_EXTRA: PlantillaBase[] = [
  {
    id: "extra-carta-editor",
    nombre: "Carta del editor",
    descripcion: "Retrato, saludo, texto y firma.",
    pagina: lienzo("Carta del editor", [
      texto(60, 56, 400, 24, "CARTA DEL EDITOR", ETIQUETA),
      texto(60, 90, 680, 110, "Un saludo para quien nos lee", { fuente: "display", tam: 46, peso: 900, interlineado: 1.05 }),
      forma(60, 222, 120, 4, { color: "terracota" }),
      imagen(60, 262, 220, 220, { tono: "oliva", alt: "Retrato de quien firma", molde: "circulo" }),
      texto(310, 262, 430, 460, "Querido lector:\n\nEscribe aquí unas líneas para abrir la edición: de qué trata este número, qué te emocionó al armarlo y a quién quieres agradecer.\n\nCierra con una invitación sencilla a seguir leyendo.", { ...CUERPO, tam: 21 }),
      texto(60, 780, 680, 40, "Nombre Apellido", { fuente: "display", tam: 30, cursiva: true, peso: 700 }),
      texto(60, 824, 680, 26, "Director(a) de la revista", { fuente: "sans", tam: 15, color: "tintaSuave" }),
    ]),
  },
  {
    id: "extra-entrevista",
    nombre: "Entrevista",
    descripcion: "Foto, presentación y preguntas con respuestas.",
    pagina: lienzo("Entrevista", [
      imagen(0, 0, 800, 380, { tono: "indigo", alt: "Foto de la persona entrevistada" }),
      texto(60, 410, 400, 24, "ENTREVISTA", ETIQUETA),
      texto(60, 440, 680, 90, "Nombre de la persona entrevistada", { fuente: "display", tam: 42, peso: 900, interlineado: 1.05 }),
      texto(60, 540, 680, 70, "Una línea que presente quién es y por qué conversamos con esta persona.", { fuente: "serif", tam: 20, cursiva: true, color: "tintaSuave", interlineado: 1.4 }),
      forma(60, 630, 680, 2, { color: "tintaSuave", opacidad: 0.4 }),
      texto(60, 660, 680, 50, "¿Aquí va la primera pregunta?", { fuente: "sans", tam: 19, peso: 700 }),
      texto(60, 712, 680, 130, "Escribe aquí la respuesta, tal como la dijo la persona. Mantén el tono natural de la conversación.", { ...CUERPO, tam: 19 }),
      texto(60, 860, 680, 50, "¿Aquí va la segunda pregunta?", { fuente: "sans", tam: 19, peso: 700 }),
      texto(60, 912, 680, 150, "Escribe aquí la segunda respuesta.", { ...CUERPO, tam: 19 }),
    ]),
  },
  {
    id: "extra-agenda",
    nombre: "Agenda de eventos",
    descripcion: "Lista de fechas con lugar y hora.",
    pagina: lienzo("Agenda", [
      texto(60, 50, 400, 24, "AGENDA", ETIQUETA),
      texto(60, 84, 680, 90, "Qué hacer este mes", { fuente: "display", tam: 46, peso: 900, interlineado: 1.05 }),
      ...[0, 1, 2, 3, 4].flatMap((i): Elemento[] => {
        const y = 210 + i * 170;
        return [
          forma(60, y, 120, 130, { color: "terracota", radio: 10 }),
          texto(60, y + 14, 120, 70, "00", { fuente: "display", tam: 56, peso: 900, alinear: "centro", color: "papel" }),
          texto(60, y + 88, 120, 30, "MES", { fuente: "sans", tam: 15, peso: 700, mayusculas: true, espaciado: 0.16, alinear: "centro", color: "papel" }),
          texto(210, y + 6, 530, 44, "Nombre del evento", { fuente: "display", tam: 28, peso: 800, interlineado: 1.1 }),
          texto(210, y + 56, 530, 32, "Lugar del evento · 00:00 h", { fuente: "sans", tam: 16, color: "tintaSuave" }),
          texto(210, y + 92, 530, 36, "Una línea breve que cuente de qué se trata.", { fuente: "serif", tam: 16, cursiva: true, color: "tintaSuave" }),
        ];
      }),
    ]),
  },
  {
    id: "extra-receta",
    nombre: "Receta",
    descripcion: "Foto, ingredientes y preparación en dos columnas.",
    pagina: lienzo("Receta", [
      imagen(0, 0, 800, 430, { tono: "terracota", alt: "Foto del platillo terminado" }),
      texto(60, 462, 400, 24, "SABORES", ETIQUETA),
      texto(60, 494, 680, 90, "Nombre del platillo", { fuente: "display", tam: 46, peso: 900, interlineado: 1.05 }),
      icono("clock", 60, 598, 24, { color: "terracota" }),
      texto(94, 598, 200, 26, "45 minutos", { fuente: "sans", tam: 16, color: "tintaSuave" }),
      icono("users", 300, 598, 24, { color: "terracota" }),
      texto(334, 598, 200, 26, "4 porciones", { fuente: "sans", tam: 16, color: "tintaSuave" }),
      forma(60, 650, 680, 2, { color: "tintaSuave", opacidad: 0.4 }),
      texto(60, 676, 250, 26, "INGREDIENTES", { fuente: "sans", tam: 15, peso: 700, mayusculas: true, espaciado: 0.16 }),
      texto(60, 712, 250, 340, "• Ingrediente uno\n• Ingrediente dos\n• Ingrediente tres\n• Ingrediente cuatro\n• Ingrediente cinco\n• Ingrediente seis", { fuente: "serif", tam: 19, interlineado: 1.7 }),
      texto(350, 676, 390, 26, "PREPARACIÓN", { fuente: "sans", tam: 15, peso: 700, mayusculas: true, espaciado: 0.16 }),
      texto(350, 712, 390, 340, "1. Escribe aquí el primer paso de la preparación.\n\n2. Después, el segundo paso, con tiempos y consejos.\n\n3. Termina con la forma de servir.", { fuente: "serif", tam: 19, interlineado: 1.6 }),
    ]),
  },
  {
    id: "extra-directorio",
    nombre: "Directorio de negocios",
    descripcion: "Cuatro fichas con nombre, teléfono y dirección.",
    pagina: lienzo("Directorio", [
      texto(60, 50, 400, 24, "DIRECTORIO", ETIQUETA),
      texto(60, 84, 680, 90, "Negocios que recomendamos", { fuente: "display", tam: 44, peso: 900, interlineado: 1.05 }),
      ...[0, 1, 2, 3].flatMap((i): Elemento[] => {
        const col = i % 2;
        const fila = Math.floor(i / 2);
        const x = 60 + col * 350;
        const y = 220 + fila * 410;
        return [
          forma(x, y, 330, 380, { color: "papel2", radio: 12 }),
          imagen(x + 20, y + 20, 290, 150, { tono: ["terracota", "indigo", "oliva", "ocre"][i], alt: `Foto del negocio ${i + 1}`, radio: 8 }),
          texto(x + 20, y + 186, 290, 40, "Nombre del negocio", { fuente: "display", tam: 24, peso: 800, interlineado: 1.1 }),
          texto(x + 20, y + 232, 290, 50, "Qué ofrece, en una línea.", { fuente: "serif", tam: 16, color: "tintaSuave", interlineado: 1.4 }),
          icono("phone", x + 20, y + 296, 22, { color: "terracota" }),
          texto(x + 52, y + 294, 258, 26, "000 000 0000", { fuente: "sans", tam: 16 }),
          icono("map-pin", x + 20, y + 332, 22, { color: "terracota" }),
          texto(x + 52, y + 330, 258, 26, "Calle y número, colonia", { fuente: "sans", tam: 15, color: "tintaSuave" }),
        ];
      }),
    ]),
  },
  {
    id: "extra-lugar",
    nombre: "Lugar para visitar",
    descripcion: "Foto, descripción y datos prácticos con iconos.",
    pagina: lienzo("Lugar", [
      imagen(0, 0, 800, 470, { tono: "oliva", alt: "Foto del lugar" }),
      texto(60, 502, 400, 24, "PARA VISITAR", ETIQUETA),
      texto(60, 534, 680, 90, "Nombre del lugar", { fuente: "display", tam: 46, peso: 900, interlineado: 1.05 }),
      texto(60, 640, 680, 170, "Escribe aquí qué hace especial a este lugar: su historia, lo que se ve y lo que se siente al llegar.", CUERPO),
      forma(60, 830, 680, 2, { color: "tintaSuave", opacidad: 0.4 }),
      icono("map-pin", 60, 860, 30, { color: "terracota" }),
      texto(104, 862, 280, 56, "Cómo llegar\nDirección o referencia", { fuente: "sans", tam: 16, interlineado: 1.4 }),
      icono("clock", 420, 860, 30, { color: "terracota" }),
      texto(464, 862, 276, 56, "Horario\nDe 00:00 a 00:00 h", { fuente: "sans", tam: 16, interlineado: 1.4 }),
      icono("ticket", 60, 960, 30, { color: "terracota" }),
      texto(104, 962, 280, 56, "Costo\nEntrada libre o precio", { fuente: "sans", tam: 16, interlineado: 1.4 }),
      icono("phone", 420, 960, 30, { color: "terracota" }),
      texto(464, 962, 276, 56, "Informes\n000 000 0000", { fuente: "sans", tam: 16, interlineado: 1.4 }),
    ]),
  },
  {
    id: "extra-foto-completa",
    nombre: "Foto a página completa",
    descripcion: "Foto de borde a borde con un pie sobre una franja oscura.",
    pagina: lienzo(
      "Foto",
      [
        imagen(0, 0, 800, 1100, { tono: "indigo", alt: "Foto a página completa" }),
        forma(0, 880, 800, 220, { color: "tinta", opacidad: 0.78 }),
        texto(60, 910, 680, 90, "Pie de foto: qué se ve y dónde", { fuente: "display", tam: 34, peso: 800, color: "papel", interlineado: 1.15 }),
        texto(60, 1020, 680, 30, "FOTO: NOMBRE APELLIDO", { fuente: "sans", tam: 14, peso: 700, mayusculas: true, espaciado: 0.18, color: "papel", opacidad: 0.8 }),
      ],
      "tinta",
    ),
  },
  {
    id: "extra-dos-columnas",
    nombre: "Texto en dos columnas",
    descripcion: "Titular y texto largo repartido en dos columnas.",
    pagina: lienzo("Artículo", [
      texto(60, 56, 400, 24, "SECCIÓN", ETIQUETA),
      texto(60, 90, 680, 150, "Título del artículo, claro y directo", { fuente: "display", tam: 48, peso: 900, interlineado: 1.05 }),
      texto(60, 252, 680, 24, "Por Nombre Apellido", { fuente: "sans", tam: 14, color: "tintaSuave" }),
      forma(60, 296, 680, 2, { color: "tintaSuave", opacidad: 0.4 }),
      texto(60, 326, 320, 700, "Escribe aquí la primera columna del artículo. Empieza con lo más importante y deja los detalles para después.\n\nUn párrafo corto ayuda a leer en pantalla.", { ...CUERPO, tam: 18 }),
      texto(420, 326, 320, 700, "Aquí sigue la segunda columna. Continúa la idea de la primera, agrega datos, voces y ejemplos.\n\nCierra con una frase que deje pensando.", { ...CUERPO, tam: 18 }),
    ]),
  },
];
