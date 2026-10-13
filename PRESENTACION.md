# ACOM-Di · Revista de Acámbaro — Guion de presentación

Material para enseñar el proyecto a otra persona (socio, patrocinador, jurado, equipo). Pensado para **5 minutos** de demostración y 10 de preguntas.

## En una frase

Una revista digital semanal sobre Acámbaro que se lee como una revista (páginas que se pasan, fotos a sangre, pies de foto) y que **una sola persona arma arrastrando y soltando**, sin escribir código.

## Antes de empezar (2 minutos de preparación)

1. Abre una terminal en la carpeta del proyecto y ejecuta `npm run dev`. El sitio queda en **http://localhost:3000**.
2. Ten abiertas dos pestañas: el sitio público y el panel (`/admin`, solo funciona en tu equipo).
3. Revisa que haya al menos dos ediciones publicadas (hoy: la 01 de ejemplo, la 02 «La era del vapor», la 03 «500 años de Acámbaro» y la 04 «Pan, fiestas y sabores»).
4. Si vas a proyectar, usa pantalla completa (F11) y un navegador sin extensiones visibles.

## Guion de 5 minutos

| Min | Qué mostrar | Qué decir |
|---|---|---|
| 0:00 | **Portada del sitio** (`/`) | «Esta es ACOM-Di: una edición nueva cada semana. Aquí está la última y el archivo de las anteriores.» |
| 0:45 | **Abrir una edición** (`/ediciones/06/1`) y pasar páginas con la rueda, las flechas o arrastrando | «Cada página se pasa con animación y puede entrar por un lado distinto. No hay menús ni barras: se lee como una revista.» |
| 1:30 | **Una página de contenido** (`/ediciones/07/6` o `/ediciones/06/5`) | «Fotos reales con crédito, texto en columnas, fichas y pies de foto. Todo está diseñado a mano, no es una plantilla de blog.» |
| 2:15 | **El celular**: reduce la ventana a ~375 px (o abre el sitio en el teléfono) | «En pantalla pequeña la página se reacomoda en una columna, en el orden que el editor eligió.» |
| 2:45 | **Buscador** (`/buscar?q=acueducto`) | «Busca en todas las ediciones, sin importar acentos, y lleva a la página exacta.» |
| 3:15 | **El panel** (`/admin`): abrir una edición y una página | «Así se arma: arrastras texto, fotos, formas e iconos; hay alineación, guías, capas, animaciones, plantillas y vista previa del celular.» |
| 4:15 | **Programar y numerar**: selector «Publicación» en el editor | «Se programa día y hora, y el número de edición se asigna solo, en orden de publicación.» |
| 4:45 | **Newsletter** (`/suscribirse` y `/admin/newsletter`) | «El lector se suscribe, y desde aquí se prepara el correo de cada edición.» |

## Mensajes clave

- **Calidad editorial sin equipo de diseño.** Una persona puede publicar cada semana.
- **Barata de operar.** Cada edición es un archivo; no hace falta base de datos para empezar y se aloja en Vercel.
- **Hecha para durar.** Contenido en archivos legibles (JSON) que se pueden respaldar y mover.
- **Funciona en cualquier pantalla.** Escritorio, tableta y celular.

## Preguntas frecuentes

**¿Se puede editar desde internet?** Hoy el panel funciona en el equipo de quien publica (por seguridad no es público). Llevarlo a internet con inicio de sesión es la siguiente fase.

**¿Cuánto cuesta mantenerla?** Para empezar, solo el dominio: el alojamiento en Vercel tiene plan gratuito. El envío masivo de correos, cuando se automatice, dependerá del servicio elegido.

**¿De dónde salen las fotos?** Las ediciones de muestra usan fotografías de uso libre de Wikimedia Commons, con crédito de autor y licencia en la propia revista. Para ediciones reales conviene usar fotos propias o con permiso.

**¿Los textos son reales?** Los datos históricos de las ediciones 02, 03 y 04 salen de Wikipedia y de fuentes ferroviarias, pero son **contenido de prueba**: antes de publicar hay que revisarlos.

**¿Se puede imprimir o descargar en PDF?** Todavía no; está en la hoja de ruta.

**¿Quién ve los correos de los suscriptores?** Se guardan en un archivo privado del proyecto (`content/suscriptores.json`); en un hosting de solo lectura se envían a un webhook (ver `GUIA-EDICIONES.md`).

## Cifras para mencionar

- 4 ediciones de muestra (32 páginas) · 18 tipografías · 197 iconos · 22 marcos para fotos · 9 animaciones de entrada · 5 formas de pasar la página.
- Tecnología: Next.js 16, React 19, TypeScript, Tailwind CSS.

## Hoja de ruta

- **Hecho:** lectura con giro de página y modo celular, editor de lienzo, plantillas guardables, animaciones, vista del celular con orden manual, miniaturas, reglas y guías, numeración automática, publicación programada, newsletter, búsqueda y portada del sitio.
- **Sigue:** panel en línea con inicio de sesión (Supabase), envío automático del newsletter, estadísticas de lectura, PDF descargable e imagen para compartir cada edición en redes.

## Páginas de apoyo dentro del sitio

- `/` — portada del sitio (última edición y archivo).
- `/proyecto` — página de presentación del proyecto, para mandar como enlace.
- `/ediciones` — archivo completo.

## Plan B si algo falla en vivo

- Sin internet: todo funciona en local salvo las fuentes de Google (se ven con una tipografía de respaldo) y los créditos externos.
- Si el sitio no abre: ejecuta de nuevo `npm run dev` y espera a ver «Ready» en la terminal.
- Si una animación no arranca: recarga la página (F5).
