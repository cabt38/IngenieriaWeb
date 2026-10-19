# Aplicación Web de Restaurante

**Proyecto:** Diseño de una aplicación Web temática con Node.js y SQLite
**Asignatura:** Ingeniería Web
**Autor:** Cristian Andres Barrientos Torres
**Temática asignada:** Restaurante

---

## 1. Descripción funcional

El sitio simula el sistema de un restaurante que permite:

1. **Registro de clientes** (`registro.html`): un usuario se registra en el formulario, el servidor valida los datos, los inserta en la tabla `clientes` y devuelve el **identificador (`id`)** generado por SQLite
2. **Reserva de mesa** (`servicios.html`): con el id obtenido en el registro, el usuario puede completar el formulario para reservar una mesa. El servidor valida los datos y los inserta en la tabla `reservas`, asociando la reserva al cliente mediante la columna `cliente_id`.

No se solicitan de nuevo en el formulario de reserva los datos ya almacenados en el registro (nombre, correo, teléfono); solo se pide el identificador del cliente.

## 2. Tecnologías utilizadas

- HTML5 semántico
- CSS
- JavaScript (Node.js)
- Módulo `http` nativo de Node.js
- Módulo `node:sqlite` (`DatabaseSync`)
- Protocolo HTTP (GET / POST)
- SQL (CREATE TABLE, INSERT parametrizado)

## 3. Árbol de archivos

```
RestauranteWeb/
├── server.js        # Servidor HTTP: rutas, validación, persistencia
├── index.html        # Página principal temática
├── acerca.html        # Propósito, contexto y autor del proyecto
├── registro.html      # Formulario de registro de clientes -> POST /clientes
├── servicios.html      # Presentación de servicios + formulario de reserva -> POST /reservas
├── styles.css        # Hoja de estilos compartida por las 4 páginas
├── restaurante.db      # Base de datos SQLite (se crea al ejecutar el servidor)
└── README.md         # Este documento
```

## 4. Tabla de rutas

| Método | Ruta           | Archivo / Respuesta                            | Código HTTP esperado |
| ------ | -------------- | ---------------------------------------------- | -------------------- |
| GET    | `/`            | `index.html`                                   | 200                  |
| GET    | `/acerca`      | `acerca.html`                                  | 200                  |
| GET    | `/registro`    | `registro.html`                                | 200                  |
| GET    | `/servicios`   | `servicios.html`                               | 200                  |
| GET    | `/styles.css`  | `styles.css` (Content-Type: text/css)          | 200                  |
| POST   | `/clientes`    | Inserta en `clientes`, muestra `id` generado   | 201 / 400 / 500      |
| POST   | `/reservas`    | Inserta en `reservas` asociada al `cliente_id` | 201 / 400 / 500      |
| \*     | cualquier otra | —                                              | 404                  |

## 5. Modelo de datos

Base de datos: **`restaurante.db`**

### Tabla `clientes` (entidad principal — genera el identificador)

| Columna  | Tipo    | Restricciones             | Propósito                       |
| -------- | ------- | ------------------------- | ------------------------------- |
| id       | INTEGER | PRIMARY KEY AUTOINCREMENT | Identificador único del cliente |
| nombre   | TEXT    | NOT NULL                  | Nombre completo del cliente     |
| correo   | TEXT    | NOT NULL                  | Correo electrónico del cliente  |
| telefono | TEXT    | NOT NULL                  | Teléfono de contacto            |

### Tabla `reservas` (operaciones — almacena el identificador y los datos del servicio)

| Columna    | Tipo    | Restricciones             | Propósito                               |
| ---------- | ------- | ------------------------- | --------------------------------------- |
| id         | INTEGER | PRIMARY KEY AUTOINCREMENT | Identificador único de la reserva       |
| cliente_id | INTEGER | NOT NULL                  | Referencia lógica al `id` de `clientes` |
| fecha      | TEXT    | NOT NULL                  | Fecha de la reserva (AAAA-MM-DD)        |
| hora       | TEXT    | NOT NULL                  | Hora de la reserva (HH:MM)              |
| personas   | INTEGER | NOT NULL                  | Número de personas para la mesa         |

## 6. Requisitos previos e instalación

- Tener instalado **Node.js versión 22 o superior** (incluye el módulo
  experimental `node:sqlite`).

### Instrucciones paso a paso

1. Descomprimir o clonar el proyecto en una carpeta local.
2. Abrir una terminal dentro de la carpeta `RestauranteWeb`.
3. Ejecutar el servidor:
   ```bash
   node server.js
   ```
4. Abrir el navegador en `http://localhost:3000`.

## 7. Orden de uso de la aplicación

1. Ir a **Registro** y completar nombre, correo y teléfono.
2. Enviar el formulario: el servidor inserta el cliente en la tabla
   `clientes` y responde con el **identificador generado** (`lastInsertRowid`).
3. Copiar ese identificador.
4. Ir a **Servicios**, pegar el identificador de cliente y completar fecha,
   hora y número de personas.
5. Enviar el formulario: el servidor inserta la reserva en la tabla
   `reservas`, asociada al cliente mediante `cliente_id`.

## 8. Procesamiento de cada POST

- **POST /clientes**: el cuerpo de la petición se lee como texto,
  se interpreta con `URLSearchParams`, y a cada campo de texto se le aplica
  `trim()`. Si falta `nombre`, `correo` o `telefono`, responde **400**. Si
  los datos son válidos, ejecuta el `INSERT` preparado (parametrizado) y
  responde **201** mostrando el `id` generado. Ante un error de base de
  datos responde **500**.
- **POST /reservas**: se interpreta el cuerpo de la misma forma. Se valida
  que `cliente_id` y `personas` sean enteros positivos y que `fecha` y
  `hora` no estén vacíos. Si falta algún dato o no es válido, responde
  **400**. Si todo es correcto, ejecuta el `INSERT` preparado y responde
  **201** con el número de reserva generado. Ante un error de base de datos
  responde **500**.

## 9. Pruebas realizadas y resultados esperados

| Prueba           | Resultado esperado                                                              | Resultado obtenido                      |
| ---------------- | ------------------------------------------------------------------------------- | --------------------------------------- |
| Navegación       | Las 4 rutas GET (`/`, `/acerca`, `/registro`, `/servicios`) responden 200       | 200 en las 4                            |
| CSS              | `GET /styles.css` responde 200 con `Content-Type: text/css`                     | Confirmado                              |
| Registro         | Envío válido a `/clientes` responde 201, crea el cliente y muestra su `id`      | id=1 generado                           |
| Servicio         | Envío válido a `/reservas` con el `cliente_id` anterior responde 201            | reserva id=1 creada                     |
| Coherencia       | La tabla `reservas` contiene el `cliente_id` y no repite nombre/correo/teléfono | Verificado                              |
| Validación       | Un campo vacío en `/clientes` o `/reservas` responde 400 y no crea registro     | 400 confirmado                          |
| Codificación     | Tildes, `@` y espacios se almacenan correctamente (UTF-8)                       | Verificado                              |
| Persistencia     | Los datos permanecen después de reiniciar el servidor                           | `restaurante.db` conserva los registros |
| Ruta inexistente | Una URL no definida responde 404                                                | Confirmado                              |
| Reproducibilidad | El proyecto, copiado a otra carpeta, inicia con `node server.js`                | Sin dependencias externas               |

---

## 10. capturas

Se encuentran anexadas en la carpeta llamada capturas de pantalla

## 11. Documentación OOHDM

La carpeta oohdm documenta la plataforma con la metodología OOHDM con la matriz que traza cada decisión de diseño hasta su ruta, archivo, tabla y evidencia. No cambia el código ni la base de datos.

| Actividad          | Qué modela en la plataforma                                                                             | Diagrama                                                      |
| ------------------ | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Conceptual         | `clientes` (1) — (0..\*) `reservas`                                                                     | [modelo_conceptual.svg](oohdm/modelo_conceptual.drawio.svg)   |
| Navegacional       | Nodos `GET /`, `/acerca`, `/registro`, `/servicios` y respuestas de `POST /clientes` y `POST /reservas` | [modelo_navegacional.svg](oohdm/02_modelo_navegacional.svg)   |
| Interfaz abstracta | Formularios de Registro y Servicios (campos, ID generado, 201 y 400)                                    | [interfaz_abstracta.svg](oohdm/Interfaz_abstracta.drawio.svg) |
| Implementación     | Navegador, `server.js`, HTML/CSS y `restaurante.db`                                                     | [implementacion.svg](oohdm/implementacion.drawio.svg)         |

![Modelo conceptual](oohdm/modelo_conceptual.drawio.svg)
![Modelo navegacional](oohdm/02_modelo_navegacional.svg)
![Interfaz abstracta](oohdm/Interfaz_abstracta.drawio.svg)
![Implementación](oohdm/implementacion.drawio.svg)

---
