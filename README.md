# ACOM-Di · Revista de Acámbaro

Revista digital en español sobre la historia, la gastronomía, la gente y los paisajes de Acámbaro, Guanajuato. Cada edición se hojea
como una revista: giro de página en computadora y columna continua en el celular.

Hecha con Next.js 16, React 19, TypeScript y Tailwind CSS v4. **No usa base de datos:** las ediciones son archivos JSON en
`content/ediciones/` y las fotos están en `public/media/`.

## Empezar

```bash
npm install
npm run dev
```

- Sitio: <http://localhost:3000>
- Panel de la revista: <http://localhost:3000/admin> (solo existe en tu equipo; ver [`Doc/protocolo-admin.md`](Doc/protocolo-admin.md))

## Comandos

| Comando | Para qué |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compila el sitio (antes corre `verificar-admin`) |
| `npm test` | Pruebas automáticas (corren en una carpeta temporal: no tocan tus datos) |
| `npm run lint` | Revisión de estilo con ESLint |
| `npx tsc --noEmit` | Revisión de tipos |
| `npm run verificar-admin` | Comprueba que el panel no pueda quedar expuesto |

## Dónde está cada cosa

| Ruta | Contenido |
|---|---|
| `content/` | Ediciones y datos |
| `public/brand`, `public/media` | Logos y fotos |
| `src/app` | Páginas y rutas de la API |
| `src/components` | Interfaz (el editor del panel está en `src/components/admin`) |
| `src/lib` | Modelo de datos y lógica |
| `tests/` | Pruebas automáticas |
| `Doc/` | Documentación y sesiones de trabajo |

## Publicar

Al subir los cambios a GitHub, Vercel compila el sitio. El panel no se publica. Las variables de entorno se explican en
[`Doc/credenciales.md`](Doc/credenciales.md) y se cambian en el panel, en **Ajustes**; en Vercel se ponen aparte.

## Documentación

- [`GUIA-EDICIONES.md`](GUIA-EDICIONES.md): cómo armar ediciones y usar el panel.
- [`Doc/indice.md`](Doc/indice.md): índice de archivos.
- [`Doc/documentacion/documento.md`](Doc/documentacion/documento.md): documentación técnica.
- [`Doc/protocolo-admin.md`](Doc/protocolo-admin.md): por qué el panel nunca está en el sitio publicado.
- [`CLAUDE.md`](CLAUDE.md): reglas del proyecto para el asistente.
