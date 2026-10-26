# 🏎️ KIMI — GRIDO1 Racing Systems | Kimi Antonelli

Sitio web oficial interactivo y de alto rendimiento dedicado al piloto de Fórmula 1 **Andrea Kimi Antonelli** (Mercedes-AMG Petronas F1 Team). Diseñado con una estética técnica de carreras (*telemetry-grade*), efectos de profundidad 3D mediante Three.js, transiciones continuas tipo *Sticky Stack*, visualizaciones procedurales de mapas de circuitos y tipografía de precisión.

<img width="1878" height="929" alt="image" src="https://github.com/user-attachments/assets/4126ca0e-dc93-4e85-b822-e91aeed885a6" />


---

## 📋 Índice

1. [Características Principales](#-características-principales)
2. [Stack Tecnológico](#-stack-tecnológico)
3. [Estructura del Proyecto](#-estructura-del-proyecto)
4. [Instalación y Uso](#-instalación-y-uso)
5. [Guía: Cómo Cambiar las Imágenes y Assets](#-guía-cómo-cambiar-las-imágenes-y-assets)
6. [Personalización de Datos y Contenido](#-personalización-de-datos-y-contenido)
7. [Scripts Disponibles](#-scripts-disponibles)

---

## ✨ Características Principales

* **Hero 3D Depth-Mapping**: Renderizado en tiempo real con **Three.js** que combina un mapa de profundidad (*depth-map*) de Kimi Antonelli y un modelo 3D (*GLB*) de su casco con efecto *wireframe* y seguimiento dinámico del cursor.
* **Sticky Stack Scroll System**: Sistema de apilamiento vertical continuo donde cada sección entra de forma fluida cubriendo la anterior con sombreado cinemático sin saltos ni espacios en blanco.
* **Chequered Flag Transition Seam**: Canvas procedural 2D interactivo que simula la disolución de una bandera a cuadros de F1 entre secciones claras y oscuras.
* **Circuito Interactivo "The Season So Far"**: Trazado SVG dinámico con telemetría, curvas de velocidad, sectores, canvas de medios tonos (*halftone*) y selector de Grandes Premios.
* **Línea de Tiempo Deportiva ("From Karts to F1")**: Recorrido interactivo por la carrera del piloto (2012–2026) con fotografías de archivo, hitos por año y estadísticas de victorias/podios.
* **Paddock & Telemetría**: Panel con estadísticas clave del piloto y franja inferior del calendario de carreras con telemetría en vivo de las rondas 11 a 15.
* **Footer con Parallax**: Composición multicapa (*body + helmet*) con seguimiento del ratón y tipografía monumental enmascarada (*mask-image*).
* **Scroll Suave**: Integración con **Lenis** para una inercia de scroll cinematográfica a 60/120 FPS.

---

## 🛠️ Stack Tecnológico

| Tecnología | Rol / Uso |
| :--- | :--- |
| **React 19** | Biblioteca base para arquitectura de componentes modulares. |
| **TypeScript 5.x** | Tipado estático riguroso en toda la aplicación. |
| **Vite 6.x** | Bundler ultra rápido con Hot Module Replacement (HMR). |
| **Three.js 0.185+** | Renderizado WebGL de la escena 3D (mapa de profundidad + casco GLTF/GLB). |
| **Lenis Scroll** | Motor de scroll suave de alto rendimiento. |
| **Vanilla CSS** | Tokens de diseño, CSS Container Queries, variables personalizadas y animaciones sin sobrecarga de frameworks. |
| **HTML5 Canvas 2D** | Gráficos procedurales para la costura de bandera a cuadros y el fondo de semitonos. |

---

## 📂 Estructura del Proyecto

```text
Kimi/
├── public/                     # Assets públicos estáticos (favicons, SVG icons)
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── assets/                 # Assets locales del proyecto
│   ├── components/
│   │   ├── common/
│   │   │   ├── ChequeredSeam.tsx   # Canvas de disolución bandera F1
│   │   │   └── ChequeredSeam.css
│   │   ├── Hero/
│   │   │   ├── Hero.tsx            # Sección principal de bienvenida
│   │   │   ├── HeroScene.ts        # Lógica WebGL Three.js (depth map & 3D helmet)
│   │   │   └── Hero.css
│   │   ├── Season/
│   │   │   ├── Season.tsx          # Mapa interactivo y telemetría de temporada
│   │   │   └── Season.css
│   │   ├── Timeline/
│   │   │   ├── Timeline.tsx        # Trayectoria deportiva 2012-2026
│   │   │   └── Timeline.css
│   │   ├── Paddock/
│   │   │   ├── Paddock.tsx         # Estadísticas y calendario de carreras
│   │   │   └── Paddock.css
│   │   ├── Footer/
│   │   │   ├── Footer.tsx          # Pie de página y parallax del casco
│   │   │   └── Footer.css
│   │   └── StickyStack/
│   │       ├── StickyStack.tsx     # Motor de apilamiento vertical de secciones
│   │       └── StickyStack.css
│   ├── styles/                 # Estilos globales y tokens de diseño
│   │   └── index.css           # Variables CSS, fuentes, resets y utilidades
│   ├── App.tsx                 # Ensamblado principal de la aplicación
│   └── main.tsx                # Punto de entrada de React
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🚀 Instalación y Uso

### Prerrequisitos
* **Node.js**: versión 18 o superior recomendada.
* **Yarn** o **npm**.

### 1. Clonar el repositorio y entrar al proyecto
```bash
cd d:/ProyectosWEB/Kimi/Kimi
```

### 2. Instalar dependencias
Con Yarn:
```bash
yarn install
```
O con npm:
```bash
npm install
```

### 3. Iniciar servidor de desarrollo
```bash
yarn dev
# o con npm:
npm run dev
```
Abre tu navegador en `http://localhost:5173/`.

### 4. Compilar para producción
```bash
yarn build
# o con npm:
npm run build
```
Los archivos optimizados se generarán en la carpeta `dist/`.

---

## 🖼️ Guía: Cómo Cambiar las Imágenes y Assets

Actualmente, las imágenes y modelos 3D se sirven a través de constantes de URL configurables (`ASSET_BASE_URL` / `ASSET_BASE`). Puedes reemplazarlas de **dos maneras**: usando tus propios archivos locales o apuntando a tu propio servidor/CDN.

---

### Opción A: Usar imágenes locales (Recomendada)

1. **Colocar tus imágenes en la carpeta `public/`**:
   Crea una carpeta dentro de `public/`, por ejemplo `public/images/`:
   ```text
   public/
   └── images/
       ├── hero/
       │   ├── person-diffuse.webp
       │   ├── person-depth.webp
       │   ├── helmet3.glb
       │   └── grido1-logo.webp
       ├── paddock/
       │   └── portrait.webp
       ├── timeline/
       │   ├── 2012.webp
       │   ├── 2016.webp
       │   └── ...
       └── footer/
           ├── helmet.webp
           └── body.webp
   ```

2. **Actualizar las rutas en el código**:
   * En `src/components/Hero/HeroScene.ts`:
     ```ts
     // Cambiar:
     export const ASSET_BASE_URL = "/images/";
     ```
   * En `src/components/Timeline/Timeline.tsx`:
     ```ts
     // Cambiar:
     const ASSET_BASE_URL = "/images/timeline/";
     ```
   * En `src/components/Paddock/Paddock.tsx`:
     ```ts
     // Cambiar:
     const ASSET_BASE = "/images/paddock/";
     ```
   * En `src/components/Footer/Footer.tsx`:
     ```ts
     // Cambiar:
     const ASSET_BASE = "/images/footer/";
     ```

---

### Opción B: Mapa completo de imágenes por sección

Si deseas conservar la estructura y sustituir elemento por elemento, esta es la lista completa de assets utilizados:

#### 1. Sección Hero (`src/components/Hero/`)
| Archivo | Tipo | Descripción |
| :--- | :--- | :--- |
| `hero/scene/person-diffuse.webp` | Imagen RGB | Fotografía principal de Kimi Antonelli (frente y busto). |
| `hero/scene/person-depth.webp` | Imagen escala de grises | Mapa de profundidad correspondiente a la imagen difusa para crear el efecto 3D con el ratón. |
| `hero/scene/helmet3.glb` | Modelo 3D GLB | Malla 3D del casco de competición de F1 que rota sobre la cabeza. |
| `hero/scene/noise.webp` | Textura | Ruido para efectos de dispersión en los shaders Three.js. |
| `hero/ui/grido1-logo.webp` | Imagen transparente | Logotipo principal de Grido1 Racing Systems. |
| `hero/ui/mercedes-logo.webp` | Imagen transparente | Logotipo de Mercedes-AMG F1 Team. |
| `hero/ui/flag-italy.webp` | Icono/bandera | Bandera de nacionalidad del piloto. |
| `hero/ui/circuit-spa.webp` | Imagen vectorial/webp | Mapa en miniatura del próximo circuito (Spa-Francorchamps). |
| `hero/ui/play-button.svg` | SVG | Icono del botón para reproducir el trailer. |
| `hero/ui/helmet-mask.png` | Imagen máscara | Máscara de silueta para la pantalla de carga (*loading veil*). |

#### 2. Sección Timeline (`src/components/Timeline/Timeline.tsx`)
Las fotos de la trayectoria histórica se cargan dinámicamente según el año:
| Archivo | Año / Etapa deportiva |
| :--- | :--- |
| `timeline/2012.webp` | Primera victoria en karts (Easykart 60cc). |
| `timeline/2016.webp` | Doblete en WSK Super Master Series. |
| `timeline/2018.webp` | Fichaje por el Mercedes Junior Team. |
| `timeline/2020.webp` | Campeón de Europa FIA Karting CIK-FIA (OK). |
| `timeline/2022.webp` | Campeón de la F4 Italiana y F4 ADAC con PREMA. |
| `timeline/2024.webp` | Salto a Fórmula 2 y debut oficial en FP1 de F1 en Monza. |
| `timeline/2025.webp` | Anuncio como piloto titular de Mercedes-AMG F1 para 2026. |
| `timeline/2026.webp` | Temporada de debut (*Rookie Season*) en Fórmula 1. |

> **Nota:** Puedes añadir o sustituir cualquier año editando el arreglo `TIMELINE_ITEMS` en `src/components/Timeline/Timeline.tsx`.

#### 3. Sección Paddock (`src/components/Paddock/Paddock.tsx`)
| Archivo | Rol |
| :--- | :--- |
| `paddock/portrait.webp` | Retrato de Kimi Antonelli con vestimenta de paddock / descanso. |
| `paddock/icon-flag.svg` | Icono de bandera a cuadros para victorias. |
| `paddock/icon-bars.svg` | Icono de barras de telemetría / puntos. |
| `paddock/icon-trophy.svg` | Icono de trofeo de podios. |
| `paddock/icon-gauge.svg` | Icono de velocímetro / rendimiento. |

#### 4. Sección Footer (`src/components/Footer/Footer.tsx`)
El pie de página utiliza dos capas superpuestas para generar un efecto parallax al mover el puntero:
| Archivo | Rol |
| :--- | :--- |
| `footer/body.webp` | Capa base inferior (torso y hombros con mono de carreras). |
| `footer/helmet.webp` | Capa superior flotante (casco de competición). |
| `footer/logo-mask.png` | Máscara PNG para el texto enmascarado `GRIDO1 RACING SYSTEMS`. |

---

## 🎨 Personalización de Datos y Contenido

### Modificar Colores Principales
Los colores globales se encuentran definidos como variables CSS en `src/styles/index.css`:
```css
:root {
  --background: #f7fafb;        /* Fondo claro del Hero y Paddock */
  --surface-black: #090a0b;     /* Fondo oscuro de Season, Timeline y Footer */
  --accent: #02d2e3;            /* Color cian Petronas / Mercedes F1 */
  --foreground: #090a0b;        /* Color tipográfico principal en fondos claros */
  --foreground-on-dark: #f7fafb;/* Color tipográfico en fondos oscuros */
}
```

### Modificar el Calendario de Carreras
En `src/components/Paddock/Paddock.tsx`, puedes modificar el listado de Grandes Premios de la franja inferior:
```tsx
const CALENDAR_ITEMS: CalendarItem[] = [
  { round: "ROUND 11", name: "AUSTRIAN GP", date: "29 JUN", finish: "P6" },
  { round: "ROUND 12", name: "BRITISH GP", date: "12 JUL", finish: "P4" },
  { round: "ROUND 13", name: "BELGIAN GP", date: "27 JUL", live: true },
  { round: "ROUND 14", name: "HUNGARIAN GP", date: "03 AUG" },
  { round: "ROUND 15", name: "DUTCH GP", date: "31 AUG" },
];
```

### Modificar las Estadísticas de la Temporada
En `src/components/Hero/Hero.tsx` y `src/components/Paddock/Paddock.tsx`:
* **Carreras disputadas:** `12`
* **Podios:** `3`
* **Puntos acumulados:** `118`

---

## ⚙️ Scripts Disponibles

En el directorio del proyecto puedes ejecutar:

* `yarn dev` o `npm run dev`: Inicia el entorno local con recarga en caliente (HMR).
* `yarn build` o `npm run build`: Verifica tipos de TypeScript y compila los bundles minificados en `dist/`.
* `yarn preview` o `npm run preview`: Levanta un servidor local para probar la versión de producción generada en `dist/`.
* `yarn lint` o `npm run lint`: Ejecuta ESLint para analizar la calidad del código.

---

## 🏁 Créditos y Licencia

Diseño y desarrollo inspirado en los sistemas de telemetría de Fórmula 1 y la identidad deportiva de **Kimi Antonelli** y **Mercedes-AMG Petronas Motorsport**.
Uso educativo y de portafolio personal.
