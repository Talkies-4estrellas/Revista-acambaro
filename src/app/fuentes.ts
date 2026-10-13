import {
  Abril_Fatface,
  Bebas_Neue,
  Caveat,
  Cormorant_Garamond,
  DM_Serif_Display,
  IBM_Plex_Mono,
  Libre_Baskerville,
  Lora,
  Merriweather,
  Montserrat,
  Oswald,
  Pacifico,
  Poppins,
  Raleway,
  Roboto_Slab,
} from "next/font/google";

/**
 * Tipografías extra para el lienzo. Cada una expone una variable CSS `--fuente-<id>` (los ids coinciden con
 * `FUENTES` en lib/esquema.ts). Se autoalojan y el navegador solo descarga las que una página realmente usa.
 * Las tres originales (display, serif, sans) se cargan en el layout raíz.
 *
 * Nota: next/font exige opciones literales (sin `...spread`), por eso se repiten en cada llamada.
 */
const lora = Lora({ subsets: ["latin"], display: "swap", preload: false, variable: "--fuente-lora", style: ["normal", "italic"] });
const merriweather = Merriweather({ subsets: ["latin"], display: "swap", preload: false, variable: "--fuente-merriweather", style: ["normal", "italic"] });
const baskerville = Libre_Baskerville({ subsets: ["latin"], display: "swap", preload: false, variable: "--fuente-baskerville", style: ["normal", "italic"] });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], display: "swap", preload: false, variable: "--fuente-cormorant", style: ["normal", "italic"] });
const dmserif = DM_Serif_Display({ subsets: ["latin"], display: "swap", preload: false, variable: "--fuente-dmserif", weight: "400", style: ["normal", "italic"] });
const abril = Abril_Fatface({ subsets: ["latin"], display: "swap", preload: false, variable: "--fuente-abril", weight: "400" });
const bebas = Bebas_Neue({ subsets: ["latin"], display: "swap", preload: false, variable: "--fuente-bebas", weight: "400" });
const oswald = Oswald({ subsets: ["latin"], display: "swap", preload: false, variable: "--fuente-oswald" });
const montserrat = Montserrat({ subsets: ["latin"], display: "swap", preload: false, variable: "--fuente-montserrat", style: ["normal", "italic"] });
const poppins = Poppins({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--fuente-poppins",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});
const raleway = Raleway({ subsets: ["latin"], display: "swap", preload: false, variable: "--fuente-raleway", style: ["normal", "italic"] });
const robotoslab = Roboto_Slab({ subsets: ["latin"], display: "swap", preload: false, variable: "--fuente-robotoslab" });
const caveat = Caveat({ subsets: ["latin"], display: "swap", preload: false, variable: "--fuente-caveat" });
const pacifico = Pacifico({ subsets: ["latin"], display: "swap", preload: false, variable: "--fuente-pacifico", weight: "400" });
const plexmono = IBM_Plex_Mono({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--fuente-plexmono",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const clasesFuentes = [
  lora,
  merriweather,
  baskerville,
  cormorant,
  dmserif,
  abril,
  bebas,
  oswald,
  montserrat,
  poppins,
  raleway,
  robotoslab,
  caveat,
  pacifico,
  plexmono,
]
  .map((f) => f.variable)
  .join(" ");
