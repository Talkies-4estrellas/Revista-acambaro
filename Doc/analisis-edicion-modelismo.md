# Análisis del editor armando una edición de 10 páginas (27-10-2026)

**Qué se hizo.** Se armó la edición `modelismo-ferroviario` (borrador, 10 páginas, «Rieles a escala: el modelismo ferroviario en México») usando el editor **como lo haría una persona nueva**: formulario de «Nueva edición» con el asistente, plantillas, doble clic para escribir, «Reemplazar» para las fotos, índice, «Revisar». Se manejó con Chrome sin interfaz y **ratón y teclado reales** (clics, doble clic, escritura, arrastre, Ctrl+S), no con atajos al código. Las fotos son de la biblioteca de la revista (locomotoras y estación de Acámbaro). El contenido es de demostración: **conviene verificar los datos** antes de publicar (1908 = formación de Ferrocarriles Nacionales de México; escalas HO 1:87 / N 1:160 / O 1:48 / G 1:22.5; trocha estándar 1.435 m) y completar lo «por confirmar» (horario, costo e informes de la estación).

Páginas: 1 Portada · 2 Contenido (índice generado) · 3 Carta del editor · 4 ¿Qué es el modelismo? · 5 Escalas (dos columnas) · 6 Del vapor a la maqueta · 7 La antigua estación de Acámbaro · 8 Tu primera maqueta (taller) · 9 Ideas para seguir · 10 Contraportada.

> Límite de este análisis: lo hizo una automatización, no una persona. Lo que dice sobre dificultad es una **estimación** a partir de cuántas acciones y tropiezos hubo; hace falta probarlo con alguien de verdad.

## Lo que funcionó bien
- **El asistente + las plantillas** dejan 8 páginas con aspecto de revista en un minuto; lo difícil no es diseñar, es llenar.
- **Escribir:** doble clic → Ctrl+A → escribir → Esc funciona y es natural. Reemplazar una foto (clic → «Reemplazar» → buscar → clic) es claro y rápido.
- **«Revisar»** encontró cosas reales (contraste, textos de ejemplo) y «Arreglar» las corrige con un clic.
- Marcas «Texto de ejemplo / Foto de ejemplo»: dejan ver de un vistazo qué falta.
- El recorrido de bienvenida y la ayuda están donde se esperan. El editor **avisa al salir con cambios sin guardar**.
- Recuadro de selección + Supr para quitar filas de la agenda: funciona.
- La edición se ve bien al leerla (escritorio y 390 px sin desbordes).

## Errores del editor encontrados (y corregidos hoy)
1. **Los botones «Animar», «Posición», «Enlace»… de la barra sobre la hoja no llevaban a su panel.** El panel se abría pero nunca se desplazaba a la vista (el `ref` de `Panel` nunca se enganchaba). Corregido en `campos.tsx`; ahora la columna derecha baja sola al panel.
2. **La revisión visual daba falsos «Posible choque de textos»** en todo texto escrito con el editor de la hoja (comparaba el elemento con sus propios párrafos): 15 avisos falsos en 6 páginas. Corregido en `RevisorDiseno.tsx` (solo se miden los bloques más internos). Ahora: 0 avisos de diseño.
3. **«Texto de relleno» marcaba rótulos correctos** («CARTA DEL EDITOR», «PARA VISITAR») y dejaba la lista «antes de publicar» en rojo sin motivo. Corregido en `lib/ejemplos.ts` (un rótulo en mayúsculas sin palabras de relleno ya no cuenta).
4. **Al poner una foto real se quedaba la descripción de la plantilla** («Foto del platillo terminado» sobre una locomotora) y la revisión decía «Imágenes con descripción ✓». Corregido: al reemplazar se quita la descripción de fábrica, y la revisión avisa «Descripción de ejemplo» si sigue puesta.

## Tropiezos que quedan (ordenados por lo que más ayudaría)
| # | Qué pasa | Idea para mejorarlo |
|---|---|---|
| A | **El índice usa el nombre de la plantilla**, no el titular («Reportaje con foto grande»…). Hay que abrir cada página → panel ÍNDICE → escribir el título (6 páginas × ~5 acciones) y volver a generar. | Tomar el titular de la página (el texto más grande) al generar, o dejar editar los títulos en la propia ventana del índice. |
| B | Cambiar el fondo de la página a un color oscuro **no adapta los textos** (quedan oscuros sobre oscuro) ni el logo; con varios elementos elegidos **no hay color para todos** y el logo claro se cambia a mano (Elementos → Logo, borrar el viejo, teclear posición y tamaño). | «Página oscura / clara» que cambie textos y logo; color para la selección múltiple; «Cambiar logo» en el propio logo. |
| C | **Los rótulos de acento de las plantillas no pasan el contraste** de la propia revisión (4,2:1 en 12 sitios); «Arreglar» exige 12 clics y los vuelve negros. | Oscurecer un poco el color de acento o «Arreglar todos». |
| D | **Páginas con filas repetidas** (agenda: 5 filas × 5 textos = 25 ediciones). No hay «duplicar fila» ni «agregar fila». | Grupos que se dupliquen, o «agregar otra fila» en la plantilla. |
| E | La hoja **no se ajusta al contenido**: la agenda con 3 filas deja el 40 % en blanco. | Botón «Ajustar el alto de la hoja al contenido». |
| F | La búsqueda de «Subidos» **solo mira el nombre del archivo** («601» o «locomotora» no encuentran nada; «maquinaria» sí). Las fotos ya usadas en otras ediciones **no traen su descripción ni su crédito** al reutilizarlas. | Buscar también por descripción; guardar descripción y crédito por archivo y reutilizarlos. |
| G | En el asistente, «Noticias con cifras» es una **plana de periódico de 30+ elementos**, no una página de cifras; hubo que quitarla. | Renombrarla («Plana de noticias») y ofrecer una página de cifras sencilla. |
| H | **Doble clic en rótulos chicos** (a 45 % de zoom miden ~6 px) a veces no abre el texto; sirvió «clic + Editar». | Zoom automático al hacer doble clic, o zona de toque mayor. |
| I | Los **iconos de redes** de la contraportada parecen botones pero no llevan a ningún lado y nada lo advierte. | Aviso de «icono de red sin enlace» en la revisión. |
| J | Las cajas de texto tienen **alto fijo**: un titular más largo que el de la plantilla queda pegado al elemento de abajo («Tu primera maqueta en una tabla» casi toca la fila de duración/porciones). | Cajas que crezcan con el texto y empujen a las de abajo. |
| K | La confirmación de «Quitar página» dice «se puede deshacer cerrando sin guardar»; con el **autoguardado de 3 s** eso ya no es cierto (sí funciona ↶). | Cambiar el texto del aviso. |
| L | En el celular las fichas de la agenda se apilan con un **bloque verde de fecha muy grande**. | Ajustar el modo «apilar» para plantillas con fichas. |

## ¿Qué tan fácil es para una persona nueva? (estimación)
- **Fácil:** arrancar (asistente, recorrido), escribir, cambiar fotos, revisar y corregir con «Arreglar».
- **Medio:** entender que cada plantilla hay que **adaptarla elemento por elemento** (≈ 4–5 acciones por texto; esta edición llevó unos 45 textos y 8 fotos), y que lo «invisible» (descripción de las fotos, título del índice, enlaces) no se ve en la hoja y se olvida.
- **Difícil:** todo lo que sale del patrón de la plantilla: fondo oscuro, cambiar logo, duplicar filas, ajustar el alto.
- Con el recorrido y un poco de práctica, una persona sin experiencia podría armar una edición parecida en **una o dos tardes**; con las mejoras A, B, D y E bajaría bastante.

## Lo que le falta al editor (resumen)
1. Índice con los titulares reales (A). 2. Tema oscuro/claro de página y color para varios elementos (B). 3. Filas/fichas repetibles y alto de hoja automático (D, E). 4. Metadatos por foto: descripción y crédito reutilizables y búsqueda por ellos (F). 5. «Arreglar todos» y acento accesible (C). 6. Cajas de texto que crezcan (J). 7. Aviso de enlaces vacíos en iconos (I).

*(Las pruebas con ratón real también mostraron que, al cerrar el navegador antes de que pasen los 3 s del autoguardado, el último cambio se pierde; el editor avisa al salir, pero un «Guardado ✓» más visible ayudaría.)*

---

# Segunda pasada: rediseñar la edición «a la altura» de las 10 y 11 usando solo el editor (27-10-2026)

**Pedido.** Volver a editar `modelismo-ferroviario` para que se parezca a las ediciones 10 y 11 (identidad visual propia, portada con foto y avances, pie con número, pies de foto con crédito), bajando las fotos que hicieran falta y usando las herramientas del editor (formas, figuras, repetidos), para descubrir qué le falta.

**Cómo se hizo.** Todo con ratón y teclado reales sobre el editor (selector de color, panel de Posición, Elementos → Formas, Texto, Subidos/Reemplazar, clic derecho, Archivo → Elementos repetidos, Revisar). **Lo único fuera del editor fue bajar las fotos** (Wikimedia Commons, con permiso del usuario; quedan en `public/media/modelismo/` con su licencia en `CREDITOS.json`; se borraron las que no se usaron). Paleta propia: carbón `#1b262c`, crema `#f6efe0`, cobre `#a8501c` / `#e0a35a`.

**Qué cambió.**
- **Portada** como la de la 10: cabecera con logo claro y «EDICIÓN ESPECIAL · N.º 17», foto a todo el ancho con banda oscura (forma al 62 %), «PASATIEMPO» + título de 78 pt + bajada en cursiva cobre, tres avances (P. 03 / 05 / 08) y franja de vías (SVG de la propia revista) al pie.
- **Interiores:** fondo crema, rótulos en cobre, fotos nuevas (maqueta de exposición, maqueta en construcción) con **pie de foto y crédito**, y **pie de página repetido** («ACOM-Di · Revista de Acámbaro» / «N.º 17 · Octubre 2026 · {n}») con la función de Elementos repetidos.
- **Figura nueva hecha con formas:** en «Escalas», cuatro barras de cobre cuyo largo es proporcional a una locomotora de 8 m en G, O, HO y N (360 → 51 px).
- Índice recoloreado; contraportada con `{creditos}` (reúne los créditos de las fotos); cajas numeradas de «Ideas» en cobre.
- Resultado: **138 elementos** (antes 116; la 10 tiene 348) y **0 por corregir / 0 por revisar** en Revisar (quedan 7 sugerencias: fotos del archivo de la revista sin autor y «texto sobre foto»).

## Error real del editor encontrado y corregido
- **El campo «Tamaño del texto» de la barra no se podía teclear.** Cada tecla se aplicaba al instante y el mínimo (4) lo deformaba: escribir «26» daba 46, 400 o no hacía nada, y no se podía vaciar el campo. Solo servían «−/+» y el panel de la derecha. Corregido (`BarraContextual.tsx`, `CampoTamano`): se escribe el número completo y se aplica con Enter o al salir; Esc lo cancela; ↑ ↓ suben y bajan de uno en uno.

## Lo que le falta al editor para hacer *esto* sin esfuerzo (nuevos, por orden de impacto)
1. **Tema o paleta por edición.** Cada color se tecleó en hexadecimal decenas de veces y las plantillas traen sus verdes fijos (iconos, reglas, cajas). Falta: elegir una paleta (carbón / crema / cobre), que aparezca como «Colores de la edición» en todos los selectores y poder **cambiar un color por otro en toda la página o la edición** (como «Buscar y reemplazar», pero de colores). Esto es lo que más separa esta edición de la 10 y la 11.
2. **Estilos de texto reutilizables** («Rótulo», «Titular», «Pie de foto»). Cada texto nuevo costó ~5 acciones (agregar, escribir, color, tamaño, posición); los 9 avances de la portada y los 8 rótulos de las barras salieron así. Con estilos, o «duplicar con desplazamiento», serían 2.
3. **Las formas nuevas caen encima de todo.** Para que la banda quedara entre la foto y el título hubo que pasarla atrás 4 veces con el menú. Falta «agregar debajo de lo elegido» o arrastrar capas en la lista.
4. **Los SVG decorativos no salen en «Subidos»** (la franja de vías y los motivos de las ediciones 5–14 solo existen como archivos). Hubo que teclear la ruta `/media/05/rieles.svg` en el campo «Archivo». Falta una sección «Decoraciones» o incluir SVG en la galería.
5. **Reemplazar una foto conserva su descripción anterior.** Solo se limpia la de fábrica de la plantilla: la portada se quedó describiendo «La locomotora La Fidelita» sobre una maqueta. Debería pedir (o vaciar) la descripción y el crédito al reemplazar. Lo mismo: un marco nuevo trae la descripción «Imagen», que la revisión luego marca como «poco útil».
6. **Un clic mal puesto destruye texto.** A 45 % de zoom, un doble clic sobre un texto de 14 px cayó en el titular y lo sobrescribió («¿Qué es el modelismo?» pasó a decir «Por la redacción · 3 min de lectura») sin avisar; solo se vio al leer la edición. Falta zoom automático al editar textos pequeños o un aviso «sustituiste un texto de 48 pt».
7. **Cajas de texto de alto fijo** que se pasan del pie: dos páginas dieron «posible choque» con el pie repetido hasta bajar la letra. Falta que la caja crezca o avise («el texto no cabe»).
8. **La revisión no entiende lo hecho con formas:** la banda oscura detrás del título no cuenta como «capa» (sigue diciendo «texto sobre foto sin capa») y pide crédito de autor para una franja decorativa SVG.
9. **El índice generado trae su propio número de página** que choca con el pie repetido (hubo que borrarlo), ocupa solo media hoja y hay que recolorearlo a mano.
10. **El interruptor «sin pie en esta página»** (portada y contraportada) está escondido dentro del panel «Hoja».
11. **«Terminar» de Elementos repetidos** no es fácil de encontrar al guardar y salir (la barra verde del modo está arriba; el recorrido no lo menciona).

## Qué hay que hacer para igualar de verdad a la 10 y la 11
Con lo que ya tiene, el editor llega a una edición **coherente y presentable** (esta). Para igualar su nivel faltan sobre todo: **(1) paleta por edición con reemplazo de colores, (2) estilos de texto, (3) decoraciones y figuras de la revista en «Subidos/Elementos», (4) layout automático de cajas de texto** (que crezcan, que no pisen el pie) y **(5) una página de avance/teaser como plantilla** (las tres columnas «P. 04» de la portada). La animación coreografiada (96–98 animaciones con retrasos pensados en las ediciones 10 y 11) también es trabajo a mano; faltaría «animar toda la página en cascada» de un clic (ya existe «Animar en cascada» para una selección).

*(Alcance honesto: esto lo hizo una automatización de pantalla, no una persona; es una estimación de esfuerzo. La edición 10 tiene el doble de elementos y 19 páginas; no se intentó igualar esa densidad.)*


---

# Tercera pasada: 15 páginas con anuncios (27-10-2026)

**Pedido.** Subir la edición a 15 páginas y ponerle los anuncios. Se agregaron **5 páginas de publicidad** desde Plantillas → Publicidad, intercaladas para que no haya dos seguidas (el editor lo vigila): 4 Anuncio de página completa · 7 Dos medias páginas · 10 Contenido patrocinado · 12 Cupones · 14 «Con el apoyo de» (esta última es de patrocinadores, no de la sección «Publicidad»). Orden final: Portada, Contenido, Carta, **Anuncio**, ¿Qué es?, Escalas, **Anuncio**, Historia, Estación, **Patrocinado**, Taller, **Cupones**, Ideas, **Patrocinadores**, Contraportada.

**Los anunciantes son inventados** (Hobby Rieles, Taller Vía Estrecha, El Pincel Fino, Papelería La Estación, Panadería El Andén, Ferretería Los Durmientes, Café La Locomotora, Imprenta Riel y Tinta) con direcciones y teléfonos de relleno (000 000 0000). Sirven de maqueta: hay que cambiarlos por los reales o quitar las páginas. «Revisar» lo recuerda con «Texto de relleno» en cada una.

**Cómo quedaron.** Anuncio completo con rectángulo cobre, icono de tren y titular a 100 pt; dos medias páginas (carbón con martillo / cobre con pincel); nota patrocinada con foto de locomotora HO (Ottawa Model Railfan, CC BY-SA 4.0) y ficha de contacto; tres cupones (2×1, 20 %, 15 %); y lista de ocho patrocinadores. Las páginas de anuncio van **sin el pie repetido** (interruptor de «Hoja»).

## Qué mostró esta pasada
- **Las plantillas de anuncio traen marcos de imagen vacíos** (lo que da «Imagen sin archivo» si no se llenan). Sin fotos del anunciante hubo que borrarlos y armar el arte con formas, iconos y texto. Falta una opción «anuncio solo de texto/color» y, mejor, que el anunciante suba su arte y quede ligado al anuncio.
- **Los anuncios no heredan la paleta de la edición** (cupones y fichas siguen en verde). Es la misma carencia de «paleta por edición» del análisis anterior.
- **El clic derecho elige lo que está arriba en ese punto**, no lo que parece «el fondo»: al mandar al fondo la forma grande, el primer intento envió el icono que había encima. Ayudaría poder elegir «el de abajo» (Alt+clic) o elegir desde Capas y usar el menú.
- **Cada cupón son 4 textos; tres cupones, 12 ediciones** y es fácil equivocar el orden (se intercambiaron las cifras). Mismo problema de «filas repetibles» (D).
- **Falso positivo corregido:** «Con el apoyo de» salía como «texto de ejemplo» solo por venir de la plantilla; ahora es un título válido (`lib/ejemplos.ts`, `TITULOS_VALIDOS`).
- Revisar: **0 por corregir**; 5 por revisar (todos, textos de relleno de los anuncios de demostración) y 7 sugerencias (créditos de fotos del archivo de la revista y texto sobre la foto de la portada).
