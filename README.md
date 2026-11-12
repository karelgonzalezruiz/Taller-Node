# Álbum de Fotos API con Express

Desarrollo de una API REST utilizando Node.js y Express para la gestión de un álbum de fotos.

El proyecto implementa un servidor HTTP con un CRUD completo que expone rutas para listar, consultar, crear, actualizar y eliminar fotos, respondiendo siempre en formato JSON con los códigos de estado HTTP correspondientes. Por ahora, los datos se guardan en un arreglo en memoria que funciona como una "base de datos" temporal.

El servidor cuenta con middlewares para interpretar el cuerpo JSON de las peticiones, registrar en consola cada petición recibida y manejar de forma centralizada los errores, devolviendo un mensaje genérico al cliente cuando algo falla.

## Tecnologías utilizadas

- **Node.js** como entorno de ejecución de JavaScript del lado del servidor.
- **Express 5** para la creación del servidor, la definición de rutas y el uso de middlewares.
- **ES Modules** (`"type": "module"`) para usar `import` en lugar de `require`.
- **`node --watch`** para reiniciar el servidor automáticamente al guardar cambios.
- **curl** para probar las rutas de la API desde la terminal.

## Estructura del proyecto

```text
album-express/
├─ src/
│  └─ server.js        # Servidor Express: middlewares, datos en memoria y rutas
│
├─ package.json        # Dependencias y scripts del proyecto
├─ package-lock.json   # Versiones exactas de las dependencias
└─ .gitignore          # Excluye node_modules del repositorio
```

## Rutas de la API

| Método | Ruta              | Descripción                       | Respuestas posibles |
| ------ | ----------------- | --------------------------------- | ------------------- |
| `GET`  | `/api/fotos`      | Lista todas las fotos             | `200`               |
| `GET`  | `/api/fotos/:id`  | Obtiene una foto por su `id`      | `200`, `400`, `404` |
| `POST` | `/api/fotos`      | Crea una nueva foto               | `201`, `400`        |
| `PATCH`  | `/api/fotos/:id` | Actualiza solo los campos enviados | `200`, `400`, `404` |
| `DELETE` | `/api/fotos/:id` | Elimina una foto                  | `204`, `400`, `404` |
| `GET`  | `/api/error`      | Ruta de prueba que lanza un error | `500`               |

Cada foto tiene la siguiente forma:

```json
{
  "id": 1,
  "titulo": "Atardecer",
  "calificacion": 4.5,
  "descripcion": "Playa de Montanita"
}
```

## Qué hice en el proyecto

### Parte 1: servidor y primera ruta

- **Creación del proyecto:**

  Se inicializó el proyecto con npm, se instaló Express y se configuró `"type": "module"` en `package.json` para trabajar con módulos de ES. Se agregó el script `dev`, que ejecuta el servidor con `node --watch`.

- **Servidor Express:**

  En `src/server.js` se creó la aplicación con `express()` y se puso a escuchar en el puerto definido por la variable de entorno `PORT`, o en el `3000` si no existe.

- **Datos en memoria:**

  Se creó el arreglo `fotos` con dos fotos de ejemplo, que funciona como base de datos temporal mientras no se use una base de datos real.

- **Listado de fotos:**

  La ruta `GET /api/fotos` devuelve el arreglo completo con `res.json()`.

### Parte 2: middlewares

- **Lectura del cuerpo JSON:**

  Se agregó `express.json()`, que convierte el cuerpo de las peticiones en un objeto disponible en `req.body`.

- **Logger propio:**

  Se creó un middleware que imprime en consola la hora, el método y la URL de cada petición, y luego llama a `next()` para que la petición continúe hacia la ruta correspondiente.

### Parte 3: rutas con parámetros y validación

- **Consulta por id:**

  La ruta `GET /api/fotos/:id` lee el `id` desde `req.params`, lo convierte a número y busca la foto con `find()`.

  - Si el `id` no es un número entero, responde `400`.
  - Si la foto no existe, responde `404` con el mensaje `Foto X no encontrada`.

- **Creación de fotos:**

  La ruta `POST /api/fotos` toma `titulo`, `calificacion` y `descripcion` desde `req.body` y valida los datos antes de guardarlos:

  - El `titulo` es obligatorio y no puede estar vacío.
  - La `calificacion` es opcional, pero si se envía debe ser un número entre 0 y 5.
  - Si la validación falla, responde `400` con un mensaje explicativo.

  El `id` de la nueva foto se calcula como el mayor `id` existente más uno, para que nunca se repita. Al crearla, responde `201` con la foto creada.

### Parte 4: manejo de errores

- **Ruta de prueba:**

  La ruta `GET /api/error` lanza un error a propósito para comprobar el manejo de errores. Express 5 captura automáticamente los errores de las funciones `async`, sin necesidad de `try/catch`.

- **Middleware de errores:**

  Se agregó un middleware con cuatro parámetros `(err, req, res, next)`, que es la forma en que Express reconoce un manejador de errores. Este imprime el error completo en la consola del servidor y responde al cliente con `500` y el mensaje `Error interno del servidor`, sin exponer detalles internos.

### Parte 5: CRUD completo en memoria

- **Actualización parcial:**

  La ruta `PATCH /api/fotos/:id` busca la foto y modifica únicamente los campos que vienen en `req.body`; los que no se envían conservan su valor. Aplica las mismas validaciones que la creación: el `titulo`, si se envía, no puede estar vacío, y la `calificacion` debe ser un número entre 0 y 5. El `id` no se puede modificar. Responde `200` con la foto actualizada.

- **Eliminación:**

  La ruta `DELETE /api/fotos/:id` obtiene la posición de la foto con `fotos.findIndex(...)`. Si el resultado es `-1`, la foto no existe y responde `404`; de lo contrario, la elimina con `fotos.splice(indice, 1)` y responde `res.status(204).end()`, es decir, un `204` sin cuerpo.

### Parte 6: persistencia de los datos

Se crearon y eliminaron fotos, se reinició el servidor y se volvió a listar:

- **Antes de reiniciar:** la lista tenía la foto creada (`Cerro Santa Ana`), sin la foto eliminada (`Malecon`) y con la calificación modificada.
- **Después de reiniciar:** la lista volvió a ser exactamente las dos fotos iniciales.

**Por qué ocurre:** el arreglo `fotos` es una variable que vive en la memoria RAM del proceso de Node.js. Cada vez que el servidor se detiene, esa memoria se libera, y al iniciarse de nuevo el archivo `server.js` se ejecuta desde el principio, creando otra vez el arreglo con sus dos fotos iniciales. Los cambios nunca se guardaron en un lugar permanente, como un archivo o una base de datos. Esto se resolverá usando PostgreSQL.

### Parte 7: propuesta de organización

Si la API tuviera 30 rutas, tenerlas todas en `server.js` haría el archivo difícil de leer y mantener. La propuesta es separar el código por responsabilidad, agrupando las rutas por recurso con `express.Router()`:

```text
src/
├─ routes/
│  └─ fotos.routes.js        # Solo define las rutas: router.get('/', ...), router.patch('/:id', ...)
│
├─ controllers/
│  └─ fotos.controller.js    # Funciones que reciben req y res y deciden la respuesta
│
├─ services/
│  └─ fotos.service.js       # Lógica del negocio: buscar, crear, actualizar y eliminar fotos
│
├─ data/
│  └─ fotos.data.js          # Datos en memoria (después, la conexión a PostgreSQL)
│
├─ middlewares/
│  ├─ logger.js              # Registro de peticiones
│  ├─ validarId.js           # Validación del :id, reutilizada por GET, PATCH y DELETE
│  └─ manejoErrores.js       # Middleware de errores (500)
│
├─ app.js                    # Crea la app, registra middlewares y monta app.use('/api/fotos', fotosRouter)
└─ server.js                 # Solo inicia el servidor con app.listen()
```

Con esta estructura, agregar un nuevo recurso (por ejemplo, álbumes o usuarios) consiste en crear sus propios archivos de rutas, controlador y servicio, sin tocar los existentes. Además, al cambiar a PostgreSQL solo se modifica la capa de datos y servicios, mientras que las rutas y controladores siguen iguales.

### Verificación del funcionamiento

Con el servidor en ejecución, se probaron las rutas desde PowerShell usando `curl.exe`:

```powershell
# Listar todas las fotos -> 200
curl.exe -s -w " -> %{http_code}\n" http://localhost:3000/api/fotos

# Foto que no existe -> 404
curl.exe -s -w " -> %{http_code}\n" http://localhost:3000/api/fotos/9

# Crear una foto -> 201
curl.exe --% -s -w " -> %{http_code}\n" -X POST -H "Content-Type: application/json" -d "{\"titulo\":\"Cerro Santa Ana\",\"calificacion\":5}" http://localhost:3000/api/fotos

# Crear sin título -> 400
curl.exe --% -s -w " -> %{http_code}\n" -X POST -H "Content-Type: application/json" -d "{}" http://localhost:3000/api/fotos

# Actualizar solo la calificación de la foto 1 -> 200
curl.exe --% -s -w " -> %{http_code}\n" -X PATCH -H "Content-Type: application/json" -d "{\"calificacion\":5}" http://localhost:3000/api/fotos/1

# Eliminar la foto 2 -> 204
curl.exe --% -s -w " -> %{http_code}\n" -X DELETE http://localhost:3000/api/fotos/2

# Error forzado -> 500
curl.exe -s -w " -> %{http_code}\n" http://localhost:3000/api/error
```

> En PowerShell se usa `curl.exe` en lugar de `curl`, y `--%` en las peticiones con cuerpo JSON para que las comillas lleguen intactas.

## Ejecución del proyecto

Con Node.js y npm instalados, abrir una terminal dentro de la carpeta del proyecto.

Instalar las dependencias:

```bash
npm install
```

Iniciar el servidor de desarrollo:

```bash
npm run dev
```

La API queda disponible en:

```text
http://localhost:3000/api/fotos
```

La terminal debe permanecer abierta mientras se utiliza la API.

> La raíz `http://localhost:3000/` responde `Cannot GET /`, ya que no tiene una ruta definida. Las rutas de la API comienzan con `/api`.

> Como los datos se guardan en memoria, al reiniciar el servidor la lista vuelve a las dos fotos iniciales.

## Autor

Proyecto desarrollado como práctica de Node.js y Express.