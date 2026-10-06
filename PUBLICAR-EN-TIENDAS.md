# Cómo publicar Indómito X en Google Play y en la App Store

> Guía práctica para este proyecto (Expo / React Native). Actualizada al **6 de octubre de 2026**.
> Nombre en las tiendas: **"Indómito X: Deportes extremos"** (29 de los 30 caracteres permitidos).
> Las reglas de las tiendas cambian más o menos cada año: antes de publicar, revisa los enlaces oficiales del final.

---

## 1. La idea general

- Escribimos **un solo código** (Expo) y de ahí salen **dos apps**: un `.aab` para Android y un `.ipa` para iOS.
- Las compilamos en la nube con **EAS Build** (el servicio de Expo), así que **no necesitas una Mac** para iOS.
- Las enviamos a las tiendas con **EAS Submit** o subiéndolas a mano.
- **Mientras desarrollamos en local no hace falta ninguna cuenta de tienda.** Las cuentas solo se necesitan cuando vayamos a publicar.

```
código (Expo) ──► EAS Build ──► .aab ──► Google Play Console ──► revisión ──► Play Store
                            └─► .ipa ──► App Store Connect ───► revisión ──► App Store
```

---

## 2. Costos y cuentas

| | Google Play | Apple App Store |
|---|---|---|
| **Costo** | **USD 25**, un solo pago | **USD 99 al año** (si no se renueva, la app desaparece de la tienda) |
| **Cuenta personal** | Se puede, pero **las cuentas personales nuevas deben hacer una prueba cerrada con al menos 12 testers durante 14 días seguidos** antes de poder publicar | Se puede, y en la tienda aparece tu nombre como vendedor |
| **Cuenta de organización** | Necesita el **número D-U-N-S** (gratis, de Dun & Bradstreet) y **no tiene** la regla de los 12 testers | Necesita el **número D-U-N-S**, ser una persona jurídica y tener un sitio web con dominio propio |
| **Verificación de identidad** | Sí (documento y, en organizaciones, datos de la empresa) | Sí |

**Recomendación:** publica con una **cuenta de organización** a nombre de la empresa. Igual vas a necesitar la empresa para inscribir la plataforma en el **RNT** (Ley 2068) y para recibir pagos. Además te ahorras la regla de los 12 testers y en las tiendas aparece la marca, no tu nombre personal.

Otros costos y servicios que aparecen al publicar:
- **EAS (Expo)**: el plan gratuito tiene un número limitado de compilaciones al mes, suficiente para empezar.
- **Firebase** (gratis): se necesita para las notificaciones push en Android (FCM).
- **Dominio web** (alrededor de USD 10–15 al año): hace falta para la política de privacidad, la cuenta de organización de Apple y los enlaces que abren la app.

---

## 3. Requisitos técnicos vigentes

| Tienda | Requisito | Quién se encarga |
|---|---|---|
| Google Play | Desde el **31 de agosto de 2026**, las apps nuevas y las actualizaciones deben apuntar a **Android 16 (API 36)**. Se podía pedir prórroga hasta el 1 de noviembre de 2026. Cada año sube un nivel, más o menos en agosto. | Expo, siempre que usemos una versión reciente del SDK |
| App Store | Desde el **28 de abril de 2026**, las apps deben compilarse con **Xcode 26 y el SDK de iOS 26**. | EAS Build, que usa la versión de Xcode que corresponde |
| Ambas | La app se firma con certificados y llaves. | EAS los genera y guarda (Play App Signing en Android) |

---

## 4. Lista de requisitos de Google Play

**Ficha de la tienda**
- [ ] Nombre (máximo 30 caracteres), descripción corta (máximo 80) y descripción larga (máximo 4000), en **español, inglés y francés**.
- [ ] Ícono de 512×512 PNG y gráfico destacado de 1024×500.
- [ ] Entre 2 y 8 capturas de teléfono (y de tableta, si se ofrece en tabletas).
- [ ] Categoría: *Viajes y guías locales*. Correo de contacto.

**Formularios del Play Console**
- [ ] **URL de la política de privacidad**, alojada en nuestra web (`/es/legal/privacidad`).
- [ ] **Seguridad de los datos**: declarar ubicación (aproximada y precisa), datos personales, fotos, mensajes del chat, historial de compras y actividad en la app; indicar que los datos viajan cifrados y que el usuario puede pedir que se borren.
- [ ] **Clasificación de contenido** (cuestionario IARC): declarar que **hay contenido generado por los usuarios** (chat y reseñas) con moderación.
- [ ] **Público objetivo**: mayores de 18. No es una app para niños.
- [ ] **Anuncios**: no tiene.
- [ ] **Acceso a la app**: una cuenta de prueba (explorador y anfitrión) para los revisores.
- [ ] **Eliminación de cuenta**: el usuario debe poder borrar su cuenta **desde la app** y desde una **URL web** (ya está en los requerimientos, AUTH-06).
- [ ] **Declaración de ubicación en segundo plano**: un formulario en el que se justifica el uso, más un **video corto** que muestre la función de alertas de cercanía. Google la revisa con lupa: la función debe ser visible y útil, y antes de pedir el permiso la app debe mostrar un **aviso destacado** (ya está en los requerimientos, PROX-02).

**Pagos**
- Vendemos **servicios y productos que se consumen fuera de la app** (aventuras y equipo), así que **no** estamos obligados a usar la facturación de Google Play. Usamos nuestras pasarelas (Mercado Pago y PayPal) y Google no cobra comisión sobre esas ventas.

**Canales de prueba**
- **Prueba interna** (hasta 100 testers, sin revisión): para nosotros.
- **Prueba cerrada**: aquí corren los 12 testers durante 14 días si la cuenta es personal.
- **Producción**: la primera revisión de una app nueva puede tardar varios días.

---

## 5. Lista de requisitos de la App Store

**App Store Connect**
- [ ] Crear la app con su **bundle ID**: `co.indomitox.app` (en Android, el mismo valor como `package`).
- [ ] Nombre (máximo 30), subtítulo (máximo 30), descripción, palabras clave y URL de soporte, en los 3 idiomas.
- [ ] Capturas para iPhone de **6,9"** (1320×2868). Si la app se declara compatible con iPad, también hacen falta capturas de iPad de 13".
- [ ] **Etiquetas de privacidad** (equivalen a la "Seguridad de los datos" de Google).
- [ ] **URL de la política de privacidad**.
- [ ] **Clasificación por edad** (cuestionario).
- [ ] **Notas para el revisor**: la cuenta de prueba y cómo probar las alertas de cercanía.
- [ ] **Cumplimiento de exportación**: solo usamos HTTPS, así que se declara `ITSAppUsesNonExemptEncryption = false`.

**Reglas de revisión que nos afectan directamente**

| Regla de Apple | Qué hace el código |
|---|---|
| **4.8 – Inicio de sesión**: si ofreces Google, debes ofrecer también una opción que proteja la privacidad, normalmente **Iniciar sesión con Apple** | AUTH-03 lo agrega en iOS |
| **5.1.1(v) – Eliminar la cuenta** desde la app | AUTH-06 |
| **1.2 – Contenido generado por usuarios**: filtrar, **reportar**, **bloquear** y publicar un contacto | CHAT-05, REV-05 y moderación en el panel de administrador |
| **3.1.3(e) – Bienes y servicios fuera de la app**: se **deben** pagar con una pasarela externa, no con compras dentro de la app | Usamos Mercado Pago, que es lo correcto |
| **Ubicación "siempre"**: Apple la revisa con detalle | Textos claros de por qué se pide el permiso (en los 3 idiomas); **la app funciona completa sin ese permiso** y solo se apagan las alertas (PROX-02) |
| **Notificaciones push** | Se necesita una llave APNs, que EAS puede generar |

**Pruebas**
- **TestFlight interno** (hasta 100 personas del equipo, sin revisión) y **externo** (hasta 10 000 testers, con una revisión corta).
- La revisión para publicar suele tardar **entre 24 y 48 h**, pero puede ser más si piden cambios.

---

## 6. Qué cambia en el código para iOS (lo tendremos en cuenta desde el principio)

| Tema | Android | iOS | Cómo lo resolvemos |
|---|---|---|---|
| Inicio de sesión | Google y correo | Google, correo y **Apple** | `expo-apple-authentication`, que solo se muestra en iOS |
| Permiso de ubicación "siempre" | Desde Android 11, el usuario tiene que ir a **Ajustes** a elegir "Permitir todo el tiempo" | Primero se pide "Al usar la app" y después iOS ofrece cambiarlo a "Siempre" | Una pantalla explicativa propia y un botón "Abrir ajustes" |
| Zonas de GPS vigiladas al mismo tiempo | Unas 100 | **Unas 20** | El servidor manda solo las más cercanas y la app las rota (PROX-06) |
| Permiso de notificaciones | Se pide desde Android 13 | Siempre se pide | Se pide en el momento justo, no al abrir la app |
| Textos de los permisos | En la ficha de la tienda | **Obligatorios dentro de la app**, en cada idioma (`NSLocation…UsageDescription`) | Se configuran en `app.config.ts` con traducciones |
| Ejecución en segundo plano | Permiso `ACCESS_BACKGROUND_LOCATION` | Modo `location` en `UIBackgroundModes` | Lo configura el plugin de `expo-location` |
| Enlaces que abren la app | `assetlinks.json` en la web | `apple-app-site-association` en la web | La web en Next.js sirve los dos archivos |
| Diseño | Material: botón atrás del sistema y gestos | HIG: gesto de deslizar para volver y áreas seguras (la "isla") | Componentes que se adaptan a cada plataforma y `SafeAreaView` |
| Calendario | Google Calendar a través del calendario del dispositivo | Calendario de iCloud | `expo-calendar` funciona en los dos |
| Mapas | Google Maps (necesita una API key) o MapLibre | Apple Maps o MapLibre | Se define en el plan; la idea es usar el mismo componente en las dos plataformas |

> **Importante:** como usamos ubicación en segundo plano, **no se puede probar la app con Expo Go**. Usaremos un **development build**: una versión de desarrollo de nuestra propia app que se instala en el emulador o el teléfono. En el plan quedará cómo hacerlo paso a paso.

---

## 7. Orden sugerido cuando llegue el momento de publicar

1. Crear o tener lista la **empresa**, el **dominio** y el **D-U-N-S**.
2. Abrir las cuentas: **Google Play** (USD 25) y **Apple Developer** (USD 99 al año), las dos como organización.
3. Publicar la **web** con la política de privacidad, los términos, la página de eliminación de cuenta y los archivos de enlaces.
4. Configurar **Firebase (FCM)** y la **llave APNs** en EAS.
5. `eas build --platform all --profile production`
6. Subir las compilaciones a **Prueba interna** (Google) y **TestFlight** (Apple). Probar con usuarios reales.
7. Llenar las fichas, los formularios de datos, la clasificación y la declaración de ubicación en segundo plano (con el video).
8. Enviar a revisión. Si rechazan algo, corregir y volver a enviar; es normal en la primera publicación.

---

## Fuentes

- [Google Play – Requisito de API de destino](https://support.google.com/googleplay/android-developer/answer/11926878?hl=en-419) · [Android Developers – target SDK](https://developer.android.com/google/play/requirements/target-sdk)
- [Google Play – Requisitos de prueba para cuentas personales nuevas](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en-GB) · [Android Authority – regla de los 12 testers](https://androidauthority.com/google-play-app-testing-requirement-3510580)
- [Apple – Requisitos mínimos de SDK](https://developer.apple.com/news/upcoming-requirements/) · [Expo – App Store Connect mínimo SDK 26](https://expo.dev/blog/app-store-connect-minimum-sdk-26)
- [Apple – App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) · [Google Play – Centro de políticas](https://play.google.com/about/developer-content-policy/)
- [Expo – EAS Build](https://docs.expo.dev/build/introduction/) · [Expo – EAS Submit](https://docs.expo.dev/submit/introduction/)
