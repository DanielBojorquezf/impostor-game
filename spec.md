# Spec: App "El Impostor"

App móvil/web para jugar "El Impostor" en grupo, donde un jugador no conoce la palabra secreta y debe disimular mientras los demás intentan descubrirlo.

## 1. Stack técnico

- **Frontend:** React + Ionic (componentes nativos en móvil, también funciona en web).
- **Lenguaje:** JavaScript (o TypeScript si se prefiere, recomendado para tipar el modelo de datos).
- **Base de datos local:** SQLite (mediante `@capacitor-community/sqlite` si se compila a app nativa, o `sql.js` / IndexedDB si corre solo en web).
- **Persistencia adicional:** `localStorage` para preferencias del usuario y estado de partida en curso (recuperar si cierra la app).
- **Routing:** React Router (vía `@ionic/react-router`).
- **Estado:** React Context o Zustand para el estado de la partida en curso (jugadores, palabra, impostor, jugador actual).

## 2. Modelo de datos (SQLite)

### Tabla `words`

| Columna       | Tipo          | Notas                                                          |
|---------------|---------------|----------------------------------------------------------------|
| `id`          | INTEGER PK    | Autoincremental.                                               |
| `categoria`   | TEXT NOT NULL | Una de: `famosos`, `objetos`, `comida`, `lugares`, `animales`, `profesiones`, `deportes`, `peliculas`. |
| `palabra`     | TEXT NOT NULL | Palabra secreta que verán los jugadores no-impostores.         |
| `pista`       | TEXT NOT NULL | Pista corta que ve el impostor (una sola palabra o frase muy corta). |
| `played_at`   | INTEGER NULL  | Timestamp UNIX de la última vez que se jugó. NULL si nunca.   |

```sql
CREATE TABLE IF NOT EXISTS words (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  categoria TEXT NOT NULL,
  palabra TEXT NOT NULL,
  pista TEXT NOT NULL,
  played_at INTEGER DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_words_categoria ON words(categoria);
CREATE INDEX IF NOT EXISTS idx_words_played_at ON words(played_at);
```

### Lógica de selección de palabra

```sql
-- Dada una lista de categorías seleccionadas (cat1, cat2, ...):
SELECT id, categoria, palabra, pista
FROM words
WHERE categoria IN (?, ?, ?)
  AND played_at IS NULL
ORDER BY RANDOM()
LIMIT 1;
```

Si la consulta no devuelve filas (ya se jugaron todas las palabras de esas categorías):

```sql
-- Reset: poner played_at = NULL en todas las palabras de las categorías seleccionadas
UPDATE words
SET played_at = NULL
WHERE categoria IN (?, ?, ?);
```

Luego reintentar la primera query.

Cuando se elige una palabra, marcarla:

```sql
UPDATE words SET played_at = strftime('%s', 'now') WHERE id = ?;
```

## 3. Datos semilla (50 filas)

```sql
INSERT INTO words (categoria, palabra, pista) VALUES
  -- famosos (7)
  ('famosos', 'Lionel Messi', 'futbolista'),
  ('famosos', 'Taylor Swift', 'cantante'),
  ('famosos', 'Elon Musk', 'empresario'),
  ('famosos', 'Shakira', 'colombiana'),
  ('famosos', 'Cristiano Ronaldo', 'portugués'),
  ('famosos', 'Bad Bunny', 'reguetón'),
  ('famosos', 'Albert Einstein', 'científico'),

  -- objetos (8)
  ('objetos', 'calculadora', 'número'),
  ('objetos', 'paraguas', 'lluvia'),
  ('objetos', 'reloj', 'tiempo'),
  ('objetos', 'lámpara', 'luz'),
  ('objetos', 'tijeras', 'cortar'),
  ('objetos', 'almohada', 'dormir'),
  ('objetos', 'espejo', 'reflejo'),
  ('objetos', 'mochila', 'cargar'),

  -- comida (8)
  ('comida', 'pizza', 'italiana'),
  ('comida', 'taco', 'mexicano'),
  ('comida', 'sushi', 'japonés'),
  ('comida', 'hamburguesa', 'carne'),
  ('comida', 'chocolate', 'dulce'),
  ('comida', 'aguacate', 'verde'),
  ('comida', 'café', 'caliente'),
  ('comida', 'helado', 'frío'),

  -- lugares (6)
  ('lugares', 'París', 'ciudad'),
  ('lugares', 'playa', 'arena'),
  ('lugares', 'hospital', 'enfermos'),
  ('lugares', 'biblioteca', 'libros'),
  ('lugares', 'aeropuerto', 'viajes'),
  ('lugares', 'Egipto', 'pirámides'),

  -- animales (7)
  ('animales', 'elefante', 'grande'),
  ('animales', 'pingüino', 'frío'),
  ('animales', 'tiburón', 'mar'),
  ('animales', 'jirafa', 'cuello'),
  ('animales', 'mariposa', 'colores'),
  ('animales', 'león', 'melena'),
  ('animales', 'pulpo', 'tentáculos'),

  -- profesiones (5)
  ('profesiones', 'doctor', 'salud'),
  ('profesiones', 'bombero', 'fuego'),
  ('profesiones', 'maestro', 'enseñar'),
  ('profesiones', 'chef', 'cocina'),
  ('profesiones', 'astronauta', 'espacio'),

  -- deportes (5)
  ('deportes', 'fútbol', 'pelota'),
  ('deportes', 'natación', 'agua'),
  ('deportes', 'tenis', 'raqueta'),
  ('deportes', 'boxeo', 'guantes'),
  ('deportes', 'ajedrez', 'estrategia'),

  -- peliculas (4)
  ('peliculas', 'Titanic', 'barco'),
  ('peliculas', 'Avatar', 'azul'),
  ('peliculas', 'Shrek', 'verde'),
  ('peliculas', 'Frozen', 'hielo');
```

**Nota:** La pista debe ser lo suficientemente vaga para que el impostor pueda participar sin delatarse pero específica para que tenga algo a qué agarrarse. Evitar pistas que sean la palabra misma en otro idioma o sinónimo directo.

## 4. Estructura de pantallas

```
/                           → Home (inicio nueva partida / continuar)
/setup/jugadores            → Agregar jugadores
/setup/categorias           → Elegir categorías
/partida/reparto            → Reparto de palabras (carta por jugador)
/partida/primero            → Pantalla "El primero en empezar es: X"
/partida/fin                → Cerrar / Mostrar impostor
```

## 5. Flujo de la app

### 5.1 Pantalla Home (`/`)

- Título grande: "El Impostor".
- Botón principal: **"Nueva partida"** → navega a `/setup/jugadores`.
- Si hay partida en curso en localStorage, mostrar botón secundario **"Continuar partida"**.

### 5.2 Setup jugadores (`/setup/jugadores`)

- Input de texto + botón "Agregar" para añadir nombres.
- Lista visual de jugadores ya agregados, con opción de eliminar cada uno.
- Validación: mínimo 3 jugadores antes de continuar.
- Botón "Siguiente" (deshabilitado hasta tener ≥ 3 jugadores) → `/setup/categorias`.

### 5.3 Setup categorías (`/setup/categorias`)

- Lista de categorías disponibles (consultada con `SELECT DISTINCT categoria FROM words`) con checkbox/toggle.
- Validación: mínimo 1 categoría seleccionada.
- Botón "Empezar" → ejecuta lógica de inicio de partida y navega a `/partida/reparto`.

### 5.4 Inicio de partida (lógica, no pantalla)

Al pulsar "Empezar":

1. Seleccionar palabra:
   ```sql
   SELECT id, categoria, palabra, pista FROM words
   WHERE categoria IN (...) AND played_at IS NULL
   ORDER BY RANDOM() LIMIT 1;
   ```
2. Si no hay resultado, hacer reset de `played_at` en esas categorías y reintentar.
3. Marcar la palabra elegida: `UPDATE words SET played_at = strftime('%s','now') WHERE id = ?`.
4. Elegir índice aleatorio de impostor: `Math.floor(Math.random() * jugadores.length)`.
5. Guardar en estado/localStorage:
   ```json
   {
     "jugadores": ["Juan", "Ana", "Pedro"],
     "ordenReparto": [0, 1, 2],
     "indiceActual": 0,
     "impostorIndex": 1,
     "palabra": "calculadora",
     "pista": "número",
     "categoria": "objetos"
   }
   ```

### 5.5 Reparto (`/partida/reparto`)

Pantalla central de la app. Muestra una **carta** correspondiente al jugador en turno.

**Estado oculto (default):**
- Carta grande con color de fondo único por jugador (paleta de 8–10 colores; asignar por índice módulo paleta).
- Nombre del jugador grande en el centro de la carta.
- Texto en la carta: **"Mantén presionado para revelar"**.

**Estado presionado (mientras el dedo está sobre la carta):**
- Se reemplaza el contenido de la carta:
  - Si **NO es impostor**: 
    ```
    Palabra secreta:
    calculadora
    ```
  - Si **ES impostor**:
    ```
    Eres el impostor
    Pista: número
    ```
- Al soltar, vuelve al estado oculto.

**Implementación del "mantener presionado":**
- Eventos: `onPointerDown`, `onPointerUp`, `onPointerLeave`, `onPointerCancel`.
- Variable de estado `revelado: boolean`.
- También capturar `onTouchStart` / `onTouchEnd` por compatibilidad iOS.
- Considerar `e.preventDefault()` para evitar selección de texto al mantener presionado.

**Fuera de la carta, debajo:**
- Botón **"Siguiente jugador"** → incrementa `indiceActual`.
- **Excepción:** si `indiceActual === jugadores.length - 1` (último jugador), el botón dice **"Empezar"** y al pulsarlo navega a `/partida/primero`.

**Importante:** El botón "Siguiente jugador" / "Empezar" debe estar **siempre visible**, no condicionado a haber revelado la carta (el jugador puede decidir no revelar, aunque no tiene sentido, no lo bloqueamos).

### 5.6 Primero en empezar (`/partida/primero`)

- Texto grande: **"El primero en empezar es:"**.
- Nombre de un jugador aleatorio del array (puede coincidir con el impostor, no se filtra a propósito porque sería un *tell*).
- Selección: `jugadores[Math.floor(Math.random() * jugadores.length)]`.
- Botón **"Continuar"** → `/partida/fin`.

### 5.7 Fin de partida (`/partida/fin`)

- Texto neutro tipo: "Cuando terminen de discutir…".
- Dos botones:
  - **"Mostrar impostor"** → revela el nombre del impostor + la palabra que era + la categoría.
  - **"Cerrar"** → limpia el estado de partida del localStorage y vuelve a `/`.

## 6. Diseño visual

### Paleta de cartas (asignar por índice de jugador)

```js
const CARD_COLORS = [
  '#FF6B6B', // rojo coral
  '#4ECDC4', // turquesa
  '#FFD93D', // amarillo
  '#6BCB77', // verde
  '#A66CFF', // morado
  '#FF9F45', // naranja
  '#4D96FF', // azul
  '#F45B69', // rosa fuerte
  '#2EC4B6', // verde-azulado
  '#E71D36', // rojo intenso
];
// jugadores[i] usa CARD_COLORS[i % CARD_COLORS.length]
```

### Tipografía

- Nombre del jugador en carta: 48–64 px, bold.
- Palabra secreta revelada: 36–48 px, bold.
- Resto: tipografía sans-serif estándar de Ionic.

### Carta

- Ocupa ~70% del ancho de pantalla y ~55% del alto.
- Bordes redondeados (24 px), sombra suave.
- Animación sutil al presionar (escala 0.97).
- `user-select: none` y `-webkit-touch-callout: none` para evitar menús contextuales al mantener presionado en móvil.

## 7. Persistencia con localStorage

### Claves usadas

| Clave                          | Contenido                                                  |
|--------------------------------|------------------------------------------------------------|
| `impostor:partida_actual`      | JSON con el estado de la partida en curso (ver §5.4 paso 5). Borrar al cerrar. |
| `impostor:ultimas_categorias`  | Array de categorías usadas la última vez (para pre-seleccionar). |
| `impostor:ultimos_jugadores`   | Array de nombres de la última partida (para sugerirlos).   |

**Nota sobre el control de palabras jugadas:** se hace en SQLite (`played_at`), no en localStorage, como decidimos. localStorage queda solo para estado de partida en curso y preferencias.

## 8. Componentes React sugeridos

```
src/
  pages/
    Home.jsx
    SetupJugadores.jsx
    SetupCategorias.jsx
    Reparto.jsx
    PrimeroEnEmpezar.jsx
    FinPartida.jsx
  components/
    PlayerCard.jsx           // la carta con hold-to-reveal
    PlayerListItem.jsx
    CategoryToggle.jsx
  db/
    schema.js                // CREATE TABLE statements
    seed.js                  // los 50 INSERT
    wordsRepo.js             // getRandomWord(categorias), markAsPlayed(id), resetPlayed(categorias)
  state/
    GameContext.jsx          // contexto con jugadores, palabra, impostor, etc.
  utils/
    colors.js                // CARD_COLORS y getColorForIndex(i)
    storage.js               // wrappers de localStorage
```

## 9. Casos borde y consideraciones

- **Recargar app a mitad de reparto:** al iniciar, leer `impostor:partida_actual`. Si existe y `indiceActual < jugadores.length`, ofrecer botón "Continuar partida" en Home.
- **Jugador con nombre duplicado:** permitirlo (algunos grupos tienen dos "Juan") pero advertir visualmente, o forzar nombres únicos. **Decisión: permitir duplicados**, son fáciles de distinguir en orden.
- **Mínimo de palabras por categoría:** si el usuario selecciona solo una categoría con muy pocas palabras restantes, no es un problema porque el reset es automático.
- **Inicialización de la DB:** al primer arranque, ejecutar `CREATE TABLE` + `INSERT` semilla. Detectar con `SELECT COUNT(*) FROM words` — si es 0, sembrar.
- **No mostrar la pista al no-impostor:** la pista es exclusivamente del impostor; los demás solo ven la palabra.
- **Categoría visible al final:** sí, en la pantalla de "Mostrar impostor" para cerrar la duda.

## 10. Fuera de alcance (v1)

Para una v2 eventual, no incluir ahora:
- Votación in-app del impostor.
- Modo varios impostores.
- Sincronización entre dispositivos.
- Editor de palabras dentro de la app (por ahora todo viene del seed).
- Multi-idioma.
- Sonidos y vibración háptica al revelar.
- Cuenta regresiva por turno.