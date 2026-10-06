# Indómito X — App

App móvil (Android e iOS) del marketplace de deportes extremos **Indómito X**: Expo SDK 57, Expo Router, Uniwind (Tailwind 4) e i18next (es/en/fr).

| Repositorio | Contenido |
|---|---|
| [Indomito-X-Shared](https://github.com/JuanDavidFuentes/Indomito-X-Shared) | Paquete compartido, requerimientos, plan y diseño |
| [Indomito-X-Back](https://github.com/JuanDavidFuentes/Indomito-X-Back) | API |
| [Indomito-X-Front](https://github.com/JuanDavidFuentes/Indomito-X-Front) | Web (Next.js) |
| **Indomito-X-App** (este) | App móvil |

## Requisitos

- Node 24 y npm 11
- **Android Studio** con el SDK 36 y un emulador, **JDK 17** y las variables `ANDROID_HOME` y `JAVA_HOME`
- Acceso al paquete `@juandavidfuentes/indomitox-shared` en GitHub Packages: token *classic* con `read:packages` en tu `~/.npmrc`:
  ```
  //npm.pkg.github.com/:_authToken=TU_TOKEN
  ```

> La app usa ubicación en segundo plano, así que **no funciona con Expo Go**: se ejecuta como *development build* (`npm run android`).

## Primeros pasos

```bash
npm install
cp .env.example .env
npm run android    # compila el development build y lo abre en el emulador
npm start          # en adelante, solo el servidor de Metro
```

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run check` | Lint y verificación de tipos |
| `npm run android` | Compila e instala la app en el emulador o el teléfono conectado |
| `npm run web` | Vista rápida en el navegador (no reemplaza la prueba en el dispositivo) |

## Publicación

Ver [PUBLICAR-EN-TIENDAS.md](PUBLICAR-EN-TIENDAS.md): cuentas, costos y requisitos de Google Play y la App Store.
