/**
 * Genera src/lib/iconos-datos.ts a partir de Lucide (ISC) y Simple Icons (CC0).
 * Uso: node scripts/generar-iconos.mjs
 * Para añadir un icono: agrégalo a la tabla de abajo (nombre de Lucide en PascalCase) y vuelve a ejecutar.
 */
import fs from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { icons } = require("lucide");
const si = require("simple-icons");

// [nombre en Lucide, nombre en español, palabras para buscar]
const CATEGORIAS = {
  "Lugares y viajes": [
    ["MapPin", "Ubicación", "lugar mapa pin dirección sitio"],
    ["Map", "Mapa", "plano ruta"],
    ["Compass", "Brújula", "orientación norte explorar"],
    ["Navigation", "Navegación", "gps flecha dirección"],
    ["Route", "Ruta", "camino recorrido trayecto"],
    ["Signpost", "Señalamiento", "letrero poste dirección"],
    ["Landmark", "Monumento", "edificio museo histórico banco"],
    ["Church", "Iglesia", "templo religión convento"],
    ["Castle", "Castillo", "fortaleza"],
    ["Building2", "Edificio", "ciudad oficina"],
    ["Store", "Tienda", "comercio mercado negocio local"],
    ["House", "Casa", "hogar vivienda inicio"],
    ["Hotel", "Hotel", "hospedaje alojamiento cama"],
    ["Tent", "Campamento", "acampar casa de campaña"],
    ["Train", "Tren", "ferrocarril estación riel"],
    ["Bus", "Autobús", "camión transporte"],
    ["Car", "Auto", "coche carro vehículo"],
    ["Bike", "Bicicleta", "ciclismo"],
    ["Plane", "Avión", "vuelo viaje"],
    ["Ship", "Barco", "navío embarcación"],
    ["Footprints", "Huellas", "pasos caminata sendero"],
    ["Luggage", "Equipaje", "maleta viaje"],
    ["Ticket", "Boleto", "entrada acceso"],
    ["Flag", "Bandera", "meta"],
    ["Globe", "Mundo", "planeta tierra global web"],
  ],
  "Comida y bebida": [
    ["Utensils", "Cubiertos", "comida restaurante cocina tenedor cuchillo"],
    ["UtensilsCrossed", "Cubiertos cruzados", "restaurante comer"],
    ["ChefHat", "Gorro de chef", "cocinero cocina gastronomía"],
    ["CookingPot", "Olla", "cocina guiso caldo"],
    ["Coffee", "Café", "taza bebida caliente"],
    ["Wine", "Vino", "copa bebida uva"],
    ["Beer", "Cerveza", "tarro bebida"],
    ["Martini", "Cóctel", "copa trago bebida"],
    ["Milk", "Leche", "lácteo"],
    ["Croissant", "Pan", "panadería bolillo cuerno"],
    ["Cake", "Pastel", "postre cumpleaños"],
    ["Cookie", "Galleta", "dulce postre"],
    ["Candy", "Dulce", "caramelo golosina"],
    ["IceCreamCone", "Helado", "nieve postre"],
    ["Sandwich", "Sándwich", "torta emparedado"],
    ["Pizza", "Pizza", "comida"],
    ["Soup", "Sopa", "caldo plato"],
    ["Salad", "Ensalada", "verdura plato"],
    ["Beef", "Carne", "res carnitas"],
    ["Fish", "Pescado", "pez mariscos"],
    ["Egg", "Huevo", "desayuno"],
    ["Wheat", "Trigo", "cereal harina espiga"],
    ["Apple", "Manzana", "fruta"],
    ["Cherry", "Cereza", "fruta"],
    ["Grape", "Uva", "fruta vino"],
    ["Banana", "Plátano", "fruta"],
    ["Citrus", "Cítrico", "limón naranja fruta"],
    ["Carrot", "Zanahoria", "verdura"],
    ["Popcorn", "Palomitas", "cine botana"],
  ],
  Naturaleza: [
    ["TreePine", "Pino", "árbol bosque"],
    ["TreeDeciduous", "Árbol", "bosque planta"],
    ["Leaf", "Hoja", "planta naturaleza ecología"],
    ["Flower", "Flor", "jardín"],
    ["Flower2", "Flor de pétalos", "jardín"],
    ["Sprout", "Brote", "planta semilla crecer"],
    ["Mountain", "Montaña", "cerro paisaje"],
    ["MountainSnow", "Montaña nevada", "volcán cumbre"],
    ["Waves", "Olas", "agua mar río lago presa"],
    ["Droplets", "Gotas", "agua lluvia"],
    ["Sun", "Sol", "día clima verano"],
    ["Sunrise", "Amanecer", "mañana sol"],
    ["Sunset", "Atardecer", "tarde sol"],
    ["Moon", "Luna", "noche"],
    ["Cloud", "Nube", "clima cielo"],
    ["CloudRain", "Lluvia", "clima tormenta"],
    ["Snowflake", "Nieve", "frío invierno"],
    ["Wind", "Viento", "aire clima"],
    ["Rainbow", "Arcoíris", "cielo color"],
    ["Flame", "Fuego", "llama hoguera lumbre"],
    ["Bird", "Ave", "pájaro garza"],
    ["Bug", "Insecto", "bicho"],
    ["Rabbit", "Conejo", "animal"],
    ["Squirrel", "Ardilla", "animal"],
    ["Dog", "Perro", "mascota animal"],
    ["Cat", "Gato", "mascota animal"],
    ["Turtle", "Tortuga", "animal"],
    ["PawPrint", "Huella de animal", "mascota pata"],
    ["Shell", "Concha", "mar caracol"],
    ["Feather", "Pluma", "ave escribir"],
    ["Umbrella", "Sombrilla", "paraguas lluvia"],
  ],
  "Cultura y arte": [
    ["Palette", "Paleta", "pintura arte color artesanía"],
    ["Brush", "Pincel", "pintura arte"],
    ["Pencil", "Lápiz", "escribir dibujar editar"],
    ["PenTool", "Pluma de diseño", "dibujo vector"],
    ["Hammer", "Martillo", "artesanía oficio taller"],
    ["Scissors", "Tijeras", "cortar costura"],
    ["Gem", "Gema", "joya diamante"],
    ["Crown", "Corona", "rey reina"],
    ["Music", "Música", "nota canción"],
    ["Guitar", "Guitarra", "música instrumento"],
    ["Piano", "Piano", "música instrumento"],
    ["Mic", "Micrófono", "voz entrevista podcast"],
    ["Headphones", "Audífonos", "escuchar audio música"],
    ["Drama", "Teatro", "máscaras actuación"],
    ["Film", "Película", "cine video"],
    ["Clapperboard", "Claqueta", "cine video"],
    ["Camera", "Cámara", "foto fotografía"],
    ["Image", "Imagen", "foto"],
    ["Images", "Imágenes", "fotos galería"],
    ["BookOpen", "Libro abierto", "lectura historia"],
    ["Book", "Libro", "lectura"],
    ["Library", "Biblioteca", "libros"],
    ["Newspaper", "Periódico", "noticias revista prensa"],
    ["Scroll", "Pergamino", "documento historia antiguo"],
    ["GraduationCap", "Birrete", "educación escuela"],
    ["Award", "Premio", "reconocimiento listón"],
    ["Trophy", "Trofeo", "copa campeón"],
    ["Medal", "Medalla", "premio deporte"],
    ["Sparkles", "Destellos", "brillo novedad magia"],
    ["Wand", "Varita", "magia"],
    ["Glasses", "Lentes", "gafas leer"],
    ["Lightbulb", "Idea", "foco ocurrencia"],
    ["Puzzle", "Rompecabezas", "juego"],
  ],
  "Personas y social": [
    ["User", "Persona", "perfil usuario"],
    ["Users", "Personas", "grupo gente comunidad"],
    ["Baby", "Bebé", "niño"],
    ["Smile", "Sonrisa", "feliz cara"],
    ["Heart", "Corazón", "amor favorito me gusta"],
    ["ThumbsUp", "Me gusta", "aprobar pulgar"],
    ["Handshake", "Apretón de manos", "acuerdo alianza"],
    ["Star", "Estrella", "favorito calificación"],
    ["Gift", "Regalo", "obsequio"],
    ["PartyPopper", "Fiesta", "celebración confeti"],
    ["MessageCircle", "Mensaje", "chat comentario"],
    ["MessageSquare", "Mensaje cuadrado", "chat comentario"],
    ["Quote", "Comillas", "cita frase"],
    ["Share2", "Compartir", "enviar redes"],
    ["Bookmark", "Marcador", "guardar favorito"],
    ["Bell", "Campana", "aviso notificación"],
  ],
  Comunicación: [
    ["Mail", "Correo", "email carta sobre"],
    ["Phone", "Teléfono", "llamar contacto"],
    ["Smartphone", "Celular", "móvil"],
    ["AtSign", "Arroba", "email usuario"],
    ["Link", "Enlace", "vínculo url"],
    ["ExternalLink", "Enlace externo", "abrir salir"],
    ["Send", "Enviar", "mensaje avión de papel"],
    ["Megaphone", "Megáfono", "anuncio aviso"],
    ["Rss", "RSS", "suscripción feed"],
    ["Wifi", "Wifi", "internet señal"],
    ["QrCode", "Código QR", "escanear"],
    ["Search", "Buscar", "lupa"],
    ["Info", "Información", "ayuda dato"],
  ],
  "Flechas y signos": [
    ["ArrowRight", "Flecha derecha", "siguiente"],
    ["ArrowLeft", "Flecha izquierda", "anterior volver"],
    ["ArrowUp", "Flecha arriba", "subir"],
    ["ArrowDown", "Flecha abajo", "bajar"],
    ["ChevronRight", "Ángulo derecha", "siguiente"],
    ["ChevronLeft", "Ángulo izquierda", "anterior"],
    ["ChevronUp", "Ángulo arriba", "subir"],
    ["ChevronDown", "Ángulo abajo", "bajar"],
    ["ChevronsRight", "Doble ángulo derecha", "avanzar"],
    ["CornerDownRight", "Esquina abajo derecha", "responder"],
    ["Check", "Palomita", "listo correcto"],
    ["CircleCheck", "Palomita en círculo", "listo correcto"],
    ["X", "Cruz", "cerrar quitar"],
    ["Plus", "Más", "agregar"],
    ["Minus", "Menos", "quitar"],
    ["Play", "Reproducir", "video"],
    ["CirclePlay", "Reproducir en círculo", "video"],
    ["Pause", "Pausa", "detener"],
    ["Download", "Descargar", "bajar archivo"],
    ["Upload", "Subir archivo", "cargar"],
    ["Calendar", "Calendario", "fecha evento agenda"],
    ["CalendarDays", "Calendario con días", "fecha evento agenda"],
    ["Clock", "Reloj", "hora horario tiempo"],
    ["Hourglass", "Reloj de arena", "tiempo espera"],
    ["Timer", "Cronómetro", "tiempo"],
    ["Eye", "Ojo", "ver mirar"],
    ["Tag", "Etiqueta", "precio categoría"],
    ["Percent", "Porcentaje", "descuento"],
    ["DollarSign", "Dinero", "precio costo"],
    ["ShoppingBag", "Bolsa de compras", "tienda"],
    ["ShoppingCart", "Carrito", "tienda compras"],
    ["Zap", "Rayo", "energía rápido"],
    ["Target", "Objetivo", "meta diana"],
    ["Pin", "Chincheta", "fijar"],
    ["Asterisk", "Asterisco", "nota"],
    ["Hash", "Numeral", "etiqueta hashtag"],
    ["Circle", "Círculo", "forma"],
    ["Square", "Cuadrado", "forma"],
    ["Triangle", "Triángulo", "forma"],
    ["Hexagon", "Hexágono", "forma"],
  ],
};

// Redes sociales y marcas: Simple Icons (rellenos, 24×24).
const MARCAS = [
  ["siFacebook", "facebook", "Facebook", "red social"],
  ["siInstagram", "instagram", "Instagram", "red social foto"],
  ["siYoutube", "youtube", "YouTube", "red social video"],
  ["siWhatsapp", "whatsapp", "WhatsApp", "mensaje chat contacto"],
  ["siX", "x", "X (Twitter)", "red social twitter"],
  ["siTiktok", "tiktok", "TikTok", "red social video"],
  ["siSpotify", "spotify", "Spotify", "música podcast"],
  ["siTelegram", "telegram", "Telegram", "mensaje chat"],
  ["siPinterest", "pinterest", "Pinterest", "red social imágenes"],
  ["siGooglemaps", "google-maps", "Google Maps", "mapa ubicación"],
  ["siTripadvisor", "tripadvisor", "Tripadvisor", "reseñas viaje"],
];

const kebab = (n) =>
  n
    .replace(/([a-z])([A-Z0-9])/g, "$1-$2")
    .replace(/([0-9])([A-Z])/g, "$1-$2")
    .toLowerCase();

const salida = {};
const faltan = [];
for (const [categoria, lista] of Object.entries(CATEGORIAS)) {
  for (const [lucide, nombre, etiquetas] of lista) {
    const nodos = icons[lucide];
    if (!nodos) {
      faltan.push(lucide);
      continue;
    }
    salida[kebab(lucide)] = { nombre, categoria, etiquetas, estilo: "trazo", nodos };
  }
}
for (const [clave, id, nombre, etiquetas] of MARCAS) {
  const m = si[clave];
  if (!m) {
    faltan.push(clave);
    continue;
  }
  salida[id] = { nombre, categoria: "Marcas", etiquetas, estilo: "relleno", nodos: [["path", { d: m.path }]] };
}

const categorias = [...Object.keys(CATEGORIAS), "Marcas"];
const cuerpo = `/**
 * GENERADO por scripts/generar-iconos.mjs: no editar a mano.
 * Iconos de línea: Lucide (licencia ISC, https://lucide.dev). Marcas: Simple Icons (CC0, https://simpleicons.org).
 * Las marcas pertenecen a sus titulares; úsalas solo para enlazar a sus perfiles.
 */
export type NodoSvg = [etiqueta: string, atributos: Record<string, string>];
export type DatosIcono = {
  nombre: string;
  categoria: string;
  /** Palabras en español para buscar. */
  etiquetas: string;
  /** "trazo": contorno de 24×24 (grosor ajustable); "relleno": silueta rellena. */
  estilo: "trazo" | "relleno";
  nodos: NodoSvg[];
};

export const CATEGORIAS_ICONO = ${JSON.stringify(categorias)} as const;

export const ICONOS: Record<string, DatosIcono> = ${JSON.stringify(salida)};
`;
fs.writeFileSync(new URL("../src/lib/iconos-datos.ts", import.meta.url), cuerpo);
console.log(`Iconos generados: ${Object.keys(salida).length}`);
if (faltan.length) console.log("No existen en la versión instalada (omitidos):", faltan.join(", "));
