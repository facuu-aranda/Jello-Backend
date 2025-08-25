# Documentación de la API - Proyecto Jello

## 1. Introducción
Esta es la documentación para la API del backend del proyecto "Jello", una aplicación de gestión de proyectos similar a Trello/Jira con funcionalidades de IA.

**URL Base (Desarrollo):** `http://localhost:5000`

## 2. Autenticación
La API utiliza **JSON Web Tokens (JWT)** para proteger las rutas. Todas las peticiones a rutas protegidas deben incluir un encabezado `Authorization`.

**Formato:** `Authorization: Bearer <tu_jwt_token>`

El token se obtiene al registrarse o iniciar sesión.

## 3. Endpoints de la API

---
### 3.1. Autenticación (`/api/auth`)

#### `POST /register`
- **Descripción:** Registra un nuevo usuario.
- **Autorización:** Pública.
- **Body:** `{ "name": "string", "email": "string", "password": "string", "role": "string ('leader' o 'worker')" }`
- **Respuesta Exitosa (201):** `{ "message": "Usuario registrado con éxito." }`

#### `POST /login`
- **Descripción:** Inicia sesión y devuelve un token JWT.
- **Autorización:** Pública.
- **Body:** `{ "email": "string", "password": "string" }`
- **Respuesta Exitosa (200):** `{ "token": "string", "user": { "id": "string", "name": "string", "role": "string" } }`

#### `POST /forgot-password`
- **Descripción:** Inicia el proceso de recuperación de contraseña.
- **Autorización:** Pública.
- **Body:** `{ "email": "string" }`

#### `POST /reset-password/:token`
- **Descripción:** Establece una nueva contraseña usando un token válido.
- **Autorización:** Pública.
- **Body:** `{ "password": "string" }`

---
### 3.2. Proyectos (`/api/projects`)

*Todas las rutas de proyectos requieren autenticación.*

#### `POST /`
- **Descripción:** Crea un nuevo proyecto.
- **Body:** `{ "name": "string", "description": "string", "techStack": ["string"], "allowWorkerEstimation": "boolean" }`
- **Respuesta Exitosa (201):** Objeto del proyecto creado.

#### `GET /`
- **Descripción:** Obtiene todos los proyectos de los que el usuario es miembro.
- **Respuesta Exitosa (200):** Array de objetos de proyecto.

#### `GET /:projectId`
- **Descripción:** Obtiene los detalles de un proyecto específico.
- **Respuesta Exitosa (200):** Objeto del proyecto con datos de `owner` y `members` populados.

#### `PUT /:projectId`
- **Descripción:** Actualiza los detalles de un proyecto. Solo para el dueño.
- **Body:** `{ "name": "string", "description": "string", ... }`
- **Respuesta Exitosa (200):** Objeto del proyecto actualizado.

#### `POST /:projectId/members`
- **Descripción:** Añade un nuevo miembro a un proyecto. Solo para el dueño.
- **Body:** `{ "email": "string" }`

#### `PUT /:projectId/columns`
- **Descripción:** Actualiza las columnas del tablero Kanban. Solo para el dueño.
- **Body:** `{ "columns": [{ "name": "string", "color": "string" }] }`

#### `GET /:projectId/context`
- **Descripción:** Endpoint especial que agrupa toda la información de un proyecto para la IA.
- **Respuesta Exitosa (200):** Objeto de contexto completo.

---
### 3.3. Tareas (`/api/projects/:projectId/tasks`)

*Todas las rutas de tareas requieren autenticación y ser miembro del proyecto.*

#### `POST /:projectId/tasks`
- **Descripción:** Crea una nueva tarea en un proyecto.
- **Body:** `{ "title": "string", "description": "string" }`

#### `GET /:projectId/tasks`
- **Descripción:** Obtiene todas las tareas de un proyecto. Acepta query params para filtrar.
- **Query Params:** `?status=string`, `?assignee=userId`, `?priority=string`, `?search=string`

#### `PUT /:projectId/tasks/:taskId`
- **Descripción:** Actualiza una tarea.
- **Body:** `{ "title": "string", "status": "string", "assignee": "userId", ... }`

#### `DELETE /:projectId/tasks/:taskId`
- **Descripción:** Elimina una tarea.

---
### 3.4. Sub-tareas, Comentarios, Etiquetas, Subidas

- **Sub-tareas:** `POST`, `PUT`, `DELETE` en `/api/tasks/:taskId/subtasks/:subtaskId?`
- **Comentarios:** `POST` en `/api/tasks/:taskId/comments`
- **Etiquetas:** CRUD en `/api/projects/:projectId/labels` y `/api/labels/:labelId`
- **Subida de Archivos:** `POST /api/upload` (Body: `multipart/form-data` con un campo `file`)

---
### 3.5. Usuario (`/api/user`)

*Todas las rutas de usuario requieren autenticación.*

#### `PUT /profile`
- **Descripción:** Actualiza el perfil del usuario (nombre, avatar).
- **Body:** `{ "name": "string", "avatarUrl": "string" }`

#### `PUT /ai-profile`
- **Descripción:** Actualiza la configuración personal de la IA del usuario.
- **Body:** `{ "aiBotName": "string", "aiBotPrompt": "string" }`


# RENDER URL
- https://jello-backend.onrender.com