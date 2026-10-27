/**
 * Secciones que ofrece el asistente de «Nueva edición» (opcional). Cada una agrega una página a partir de una plantilla ya
 * diseñada; el orden de esta lista es el orden de las páginas. La lista solo lleva datos para poder usarse también en el navegador;
 * quien arma las páginas es `paginasDeSecciones` (lib/admin.ts).
 */
export type SeccionAsistente = {
  id: string;
  titulo: string;
  descripcion: string;
  /** Id de la plantilla (de lib/plantillas-*.ts) con la que se arma la página. */
  plantilla: string;
  /** Viene marcada al abrir el asistente. */
  porDefecto?: boolean;
};

export const SECCIONES_ASISTENTE: SeccionAsistente[] = [
  { id: "portada", titulo: "Portada", descripcion: "Cabecera, foto principal y titular.", plantilla: "base-portada", porDefecto: true },
  { id: "carta", titulo: "Carta del editor", descripcion: "Retrato, saludo y firma.", plantilla: "extra-carta-editor" },
  { id: "reportaje", titulo: "Reportaje con foto grande", descripcion: "Foto a todo el ancho, titular, firma y texto.", plantilla: "base-reportaje", porDefecto: true },
  { id: "entrevista", titulo: "Entrevista", descripcion: "Foto, presentación y preguntas con respuestas.", plantilla: "extra-entrevista" },
  { id: "cifras", titulo: "Noticias con cifras", descripcion: "Datos y números destacados.", plantilla: "noticias-cifras" },
  { id: "noticias", titulo: "Noticias con fotos", descripcion: "Varias notas breves con su foto.", plantilla: "noticias-fotos" },
  { id: "lugar", titulo: "Lugar para visitar", descripcion: "Foto, descripción y datos prácticos.", plantilla: "extra-lugar" },
  { id: "receta", titulo: "Receta", descripcion: "Foto, ingredientes y preparación.", plantilla: "extra-receta" },
  { id: "agenda", titulo: "Agenda de eventos", descripcion: "Fechas con lugar y hora.", plantilla: "extra-agenda" },
  { id: "directorio", titulo: "Directorio de negocios", descripcion: "Cuatro fichas con teléfono y dirección.", plantilla: "extra-directorio" },
  { id: "galeria", titulo: "Galería de fotos", descripcion: "Título y cuadrícula de 4 fotos.", plantilla: "base-galeria" },
  { id: "fotocompleta", titulo: "Foto a página completa", descripcion: "Foto de borde a borde con pie.", plantilla: "extra-foto-completa" },
  { id: "columnas", titulo: "Texto en dos columnas", descripcion: "Artículo largo en dos columnas.", plantilla: "extra-dos-columnas" },
  { id: "cita", titulo: "Cita destacada", descripcion: "Una frase grande en página de color.", plantilla: "base-cita" },
  { id: "comic", titulo: "Cómic", descripcion: "Página completa para tiras o viñetas.", plantilla: "comic-pagina-completa" },
  { id: "anuncio", titulo: "Anuncio de página completa", descripcion: "Espacio para un anunciante.", plantilla: "anuncio-pagina" },
  { id: "contraportada", titulo: "Contraportada con redes", descripcion: "Fondo oscuro, marca y enlaces a redes.", plantilla: "base-contraportada", porDefecto: true },
];

export const MAX_PAGINAS_ASISTENTE = 40;
