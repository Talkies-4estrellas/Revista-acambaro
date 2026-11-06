import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Reglas recomendadas de Next. Los catálogos generados por scripts/ no se revisan.
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Reglas del compilador de React: marcan patrones que funcionan en el editor y el lector. Quedan como avisos para ir
    // corrigiéndolos con calma, sin reescribir código estable solo por ellas.
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/globals": "warn",
      "react-hooks/purity": "warn",
    },
  },
  globalIgnores([".next/**", ".next-build/**", "next-env.d.ts", "src/lib/iconos-datos.ts", "src/lib/figuras-datos.ts", "L-ARecurso 8/**"]),
]);
