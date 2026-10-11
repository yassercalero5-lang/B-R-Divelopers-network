# b&r|developers network

Sitio web para explorar y publicar propiedades en Nicaragua, creado con Angular y TypeScript.

## Ejecutar localmente

Requisitos: Node.js y npm.

```bash
npm install
npm start
```

Abre `http://localhost:4200/`. Para compilar la aplicación:

```bash
npm run build
```

## Funciones

- Catálogo, búsqueda por título/ubicación/tipo, filtros por tipo y precio.
- Ficha de inmueble con galería de hasta ocho fotos.
- Reducción de imágenes a un máximo de 1400 × 1400 píxeles para propiedades.
- Registro e inicio de sesión con correo y contraseña mediante Firebase Authentication.
- Publicación, edición y eliminación de anuncios propios en Cloud Firestore.
- Carga de fotos y avatares a Cloud Storage for Firebase.
- Sincronización en tiempo real del catálogo entre dispositivos.
- Migración al iniciar sesión de publicaciones del `localStorage` de ese navegador que pertenecen al mismo correo.
- Contacto por correo mediante `mailto:`.

## Tecnologías y organización

- Angular 22, TypeScript, plantillas Angular y CSS adaptable.
- Signals (`signal`, `computed`) para estado y filtros reactivos.
- `src/app/app.ts`, `app.html` y `app.css`: lógica, plantilla y estilos del componente principal.
- `src/app/data/sample-properties.ts`: anuncios de muestra.
- `src/app/models/`: tipos de propiedad y usuario autenticado.
- `src/app/integrations/firebase/`: inicialización de Firebase, autenticación, Firestore y Storage.
- `firestore.rules` y `storage.rules`: reglas de acceso por propietario.
- `firebase.json` y `.firebaserc`: recursos Firebase y proyecto configurados para la CLI.
- `.github/workflows/deploy-pages.yml`: compilación y despliegue automatizado a GitHub Pages.

## Preparar Firebase

La aplicación está preparada para el proyecto `byr-developer-network`. Para activar los servicios en Firebase:

1. En Firebase Console, habilita **Authentication → Email/Password**.
2. En **Authentication → Settings → Authorized domains**, agrega `yassercalero5-lang.github.io` y `localhost`.
3. Confirma que existe la base predeterminada de Cloud Firestore.
4. Para sincronizar las fotos, configura el bucket de Cloud Storage. La carga de archivos de Cloud Storage requiere el plan Blaze de pago por uso; no lo actives sin revisar la facturación del proyecto.
5. Desde una terminal autenticada con acceso al proyecto, instala/usa Firebase CLI y despliega las reglas:

   ```bash
   npx firebase-tools login
   npx firebase-tools deploy --only firestore:rules,storage
   ```

Las reglas permiten leer anuncios públicos, pero solo un usuario autenticado puede crear, actualizar o borrar los suyos. El código de la página no puede publicar estas reglas por sí solo; el comando necesita que el propietario inicie sesión en Firebase CLI.

Las claves de configuración de Firebase para una aplicación web identifican el proyecto; la protección de datos se realiza con Authentication y reglas. No pongas credenciales de administrador en el navegador.

### Datos previos

Las cuentas locales antiguas no se convierten en cuentas Firebase. Cada persona debe crear una cuenta Firebase con correo y contraseña. Al iniciar sesión con el mismo correo que usó en este navegador, la aplicación intenta migrar sus anuncios y fotos locales a Firestore y Storage. Los datos locales de otros dispositivos no son accesibles desde este navegador.

## Publicar el sitio

El workflow de GitHub Actions ejecuta `npm ci`, compila con la ruta base del repositorio y publica `dist/prueba/browser` a GitHub Pages cuando hay un push a `main`.

Sitio: <https://yassercalero5-lang.github.io/B-R-Divelopers-network/>

Para subir cambios desde VS Code: guarda los archivos, crea un commit y haz push a `main`. Luego revisa **Actions** en GitHub.

Guía de exposición actualizada: [`docs/guia_exposicion_firebase.docx`](docs/guia_exposicion_firebase.docx).
