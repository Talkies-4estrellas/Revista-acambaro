# Espacios propuestos para anuncios de Google (revisión visual)

Imágenes generadas con la revista real (edición 15) y los espacios dibujados encima: **rojo discontinuo = lugar del anuncio**. No hay anuncios reales; es solo para decidir.

Cada pantalla se dibujó en cuatro anchos: **PC 1280**, **tablet 768**, **celular 390** y **celular 360** (el teléfono más angosto común). Ninguna se sale de la pantalla ni crea scroll horizontal.

| Archivos | Dónde | Espacios |
|---|---|---|
| `inicio-*` | Inicio | H1 bajo la portada, H2 tras las ediciones, H3 antes de suscribirse |
| `lista-ediciones-*` | Lista de ediciones | E1 bajo el título, E2 dentro de la lista (tras la 6.ª), E3 al final |
| `busqueda-*` | Búsqueda | B1 sobre los resultados, B2 tras el 4.º resultado, B3 al final |
| `lector-pc-bajo-la-hoja`, `lector-tablet-bajo-la-hoja` | Lector en PC y tablet | L1 bajo la hoja, sobre «Siguiente página» |
| `lector-pc-ancho-1600-laterales` | Lector en PC ancho (≥ 1400 px) | L1 + L2/L3 rascacielos laterales |
| `lector-celular-390/360-entre-paginas` | Lector en celular | M1 entre páginas (cada 4) |
| `sin-anuncios-*` | Zonas sin anuncios | Portada, índice y páginas de anunciantes (PC y celular 360) |

## Tamaños por dispositivo
| | Banner | Rectángulo |
|---|---|---|
| PC y tablet | 728 × 90 | 336 × 280 |
| Celular (360 y 390) | 320 × 100 | 300 × 250 |

Los anuncios de Google son adaptables: estos tamaños son una referencia del espacio que se reserva.

## Lo comprobado
- Tablet (768): el lector usa la hoja de PC; solo cabe el banner bajo la hoja (sin laterales).
- Celular: el único elemento fijo del lector es la pastilla del contador (26 px al pie, no captura toques); con M1 centrado en pantalla no lo tapa.
- En celular los rectángulos son de 300 × 250 para que quepan en 360 px.

Para decidir: qué espacios se quedan, cada cuántas páginas va M1 y si se usan los laterales.
