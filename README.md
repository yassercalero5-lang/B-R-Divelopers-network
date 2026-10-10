# b&r|developers network

Sitio web para explorar y publicar propiedades en Nicaragua. Esta guía describe la aplicación tal como está implementada y cómo ejecutarla localmente.

## Ejecutar el proyecto

Requisitos: Node.js y npm instalados.

```bash
npm install
npm start
```

Abre `http://localhost:4200/`. Angular actualiza la aplicación al guardar los archivos.

Para generar la compilación de producción:

```bash
npm run build
```

## Funciones disponibles

- Catálogo inicial de seis propiedades de ejemplo.
- Búsqueda por título, ubicación o tipo; filtros por tipo y precio máximo.
- Ficha de cada inmueble con galería deslizable, flechas, contador y selección directa de fotos.
- Registro e inicio de sesión locales, perfil editable y gestión de publicaciones propias.
- Hasta ocho fotos por propiedad, máximo 8 MB por archivo. Las imágenes se reducen a un máximo de 1400 × 1400 px, mantienen su proporción y se convierten a JPEG.
- Contacto por correo mediante un enlace `mailto:`.

## Organización del código

```text
src/
  app/
    app.ts                         Estado y acciones de la interfaz
    app.html                       Estructura de la página y diálogos
    app.css                        Estilos de la aplicación
    data/sample-properties.ts      Anuncios de ejemplo
    models/                        Tipos Property y LocalAccount
    integrations/firebase/         Preparación local, todavía no conectada
    app.config.ts                  Proveedores del navegador y rutas
    app.config.server.ts           Configuración de renderizado del servidor
    app.routes.ts                  Rutas del navegador
    app.routes.server.ts           Reglas de prerenderizado
  main.ts                          Inicio de Angular en el navegador
  main.server.ts                   Inicio de Angular en el servidor
  server.ts                        Adaptador HTTP para Angular SSR
  styles.css                       Estilos globales
public/                            Recursos estáticos
```

### Tecnologías y por qué se usan

- **Angular 22** organiza la interfaz como una aplicación web y actualiza las vistas al cambiar el estado.
- **TypeScript** define los datos de propiedades y cuentas y detecta errores de tipos durante la compilación.
- **Signals (`signal` y `computed`)** mantienen estados como filtros, sesión, galería y anuncios; los valores derivados se recalculan cuando cambian sus dependencias.
- **HTML y control de flujo de Angular (`@if`, `@for`)** describen el contenido y muestran diálogos o listas según el estado.
- **CSS** define el diseño adaptable a pantallas móviles y de escritorio.
- **Canvas y `createImageBitmap`** reducen las fotografías seleccionadas y las convierten a JPEG para limitar su tamaño.
- **`localStorage`** conserva cuentas y anuncios creados en el navegador actual.
- **Angular SSR y prerenderizado** permiten generar la página durante la compilación; el flujo de GitHub Pages publica los archivos estáticos.
- **GitHub Actions y GitHub Pages** compilan y publican el sitio cuando se envían cambios a la rama `main`.

## Datos y limitaciones

Las cuentas y publicaciones del prototipo se guardan en `localStorage`; no existe sincronización entre dispositivos ni autenticación en un servidor. Por eso el acceso y la propiedad de anuncios son controles de demostración del lado del cliente, no un sistema seguro para una operación inmobiliaria real. Los favoritos solo duran mientras permanece abierta la sesión de la página.

La carpeta local `src/app/integrations/firebase/` conserva archivos de preparación y está excluida de Git mientras Firebase no se integre. La aplicación no la importa ni guarda datos en Firebase; los servicios están pendientes de implementación. El inicio con Google tampoco está conectado.

## Publicación

El workflow de `.github/workflows/deploy-pages.yml` ejecuta `npm ci`, compila para la ruta del repositorio y publica `dist/prueba/browser` en GitHub Pages. La dirección pública es:

<https://yassercalero5-lang.github.io/B-R-Divelopers-network/>

Para publicar cambios: guarda los archivos, crea un commit y envíalo a `main` (por ejemplo, desde **Control de código fuente** en VS Code). Luego revisa la pestaña **Actions** del repositorio para ver el estado del despliegue.

## Guion breve para la exposición

La guía completa de exposición está en [`docs/guia_exposicion_b_r_developers_network.docx`](docs/guia_exposicion_b_r_developers_network.docx).

1. Explica el objetivo: ayudar a explorar propiedades y facilitar la publicación de anuncios.
2. Presenta `app.html`, `app.css` y `app.ts`: estructura, diseño y lógica de la pantalla.
3. Muestra los tipos de datos y los anuncios de muestra separados en `models/` y `data/`.
4. Demuestra búsqueda, filtros, cuenta local, gestión de anuncios y galería de hasta ocho fotos.
5. Explica que las fotos se redimensionan, y que los datos persisten solo en el navegador.
6. Cierra con la publicación automática en GitHub Pages y las limitaciones pendientes de Firebase.
