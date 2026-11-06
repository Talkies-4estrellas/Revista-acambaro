# ACOM-Di · Guía de uso

La guía completa para armar ediciones está en **[`GUIA-EDICIONES.md`](../GUIA-EDICIONES.md)** (en la raíz del proyecto, porque el panel
de administración la menciona). Resumen:

1. Enciende el servidor: `npm run dev` y abre `http://localhost:3000/admin`.
2. **+ Nueva edición** (en blanco o copia de otra) o **Edición resumida** (elige páginas de una edición ya hecha). **Ctrl+K** salta a cualquier sección o edición.
3. En el editor: arrastra elementos a la hoja, usa **▤ Plantillas** para empezar rápido y **✓ Revisar diseño** antes de publicar.
4. Para índice y enlaces que no se desacomoden: ponle un **identificador** a cada página y usa «Lleva a» y `{p:identificador:2}`.
5. Revisa siempre en **celular (360 px)**: pestaña «En el celular» y vista previa móvil.
6. Publica con **Publicación ▾** en la lista (o desde el editor), haz `git push` y Vercel despliega. El número de edición se asigna solo.

Temas que cubre la guía: páginas en blanco (lienzo), plantillas, números de página automáticos, armar una edición resumida, revisor de
diseño, la pantalla del panel (calendario, anunciantes, medios, papelera, ajustes), estructura del JSON, transiciones, newsletter, búsqueda, publicidad y conteo de clics.
