
# Homelearn - Plataforma de Rutas de Aprendizaje

Aplicación web para crear, gestionar y seguir cursos por niveles. Pensada para uso educativo, autoaprendizaje y administración sencilla desde cualquier dispositivo.


## 🚀 Funcionalidades

- Registro y login de usuarios
- Creación y edición de cursos por niveles
- Seguimiento de progreso por usuario y nivel
- Panel de administración para gestionar usuarios y cursos
- Subida de cursos en formato JSON
- Optimizado para móviles y escritorio


## 📱 Experiencia Móvil

Interfaz responsiva, navegación simple, botones grandes y formularios adaptados para uso táctil.


## 🛠 Tecnologías

- Frontend: React, Tailwind CSS
- Backend: Node.js, Express, PostgreSQL
- Seguridad: JWT, bcrypt, Helmet
- Infraestructura: Docker y Docker Compose


## 🚀 Inicio Rápido

1. Clona el repositorio:
  ```bash
  git clone <url-del-repo>
  cd homelearn
  ```
2. Ejecuta el script de inicio:
  ```bash
  ./start.sh
  ```
3. Accede desde tu navegador:
  - Frontend: http://192.168.0.6:3000
  - Backend: http://192.168.0.6:5000/api


### Ejemplo de curso (JSON)
```json
{
  "title": "Nombre del curso",
  "description": "Descripción opcional",
  "levels": [
    {
      "nivel": "Nivel 1",
      "topics": ["Tema 1", "Tema 2"],
      "objectives": ["Objetivo 1"],
      "tools": ["Herramienta 1"],
      "resources": ["https://ejemplo.com"]
    }
  ]
}
```


## 👥 Roles

- Usuario: se registra, se inscribe en cursos, marca niveles como completados y ve su progreso.
- Administrador: puede crear, editar y eliminar cursos, ver usuarios y logs.

### 1. Environment Setup
\`\`\`bash
cp .env.example .env
# Edit .env with your configuration
\`\`\`

### 2. Database Setup
\`\`\`bash
docker-compose up -d database
# Wait for database to be ready
\`\`\`

### 3. Backend Setup
\`\`\`bash
cd backend
npm install
npm start
\`\`\`

### 4. Frontend Setup
\`\`\`bash
cd frontend
npm install
npm start
\`\`\`


## 📊 Endpoints principales

- POST /api/auth/register — Registro
- POST /api/auth/login — Login
- GET /api/courses — Listar cursos
- POST /api/courses — Crear curso (admin)
- POST /api/courses/upload — Subir curso JSON (admin)
- GET /api/my-courses — Cursos inscritos


## 🗄 Esquema de base de datos

- users: usuarios
- courses: cursos
- course_levels: niveles
- user_enrollments: inscripciones
- user_progress: progreso


## 🔒 Seguridad

- Autenticación JWT
- Contraseñas cifradas
- Rate limiting
- Validación de datos


## 📱 Optimización móvil

Todo funciona bien en celulares y tablets.


## 🐳 Docker

Incluye docker-compose para levantar frontend, backend y base de datos.


## 📝 Logs

Se registran eventos importantes y errores.


## 🔧 Configuración rápida

Variables principales:
```bash
POSTGRES_DB=homelearn
POSTGRES_USER=homelearn_user
POSTGRES_PASSWORD=homelearn_pass
JWT_SECRET=tu_clave_secreta
REACT_APP_API_URL=http://192.168.0.6:5000/api
```


## 🚀 Despliegue

Para desarrollo: `docker-compose -f docker-compose.dev.yml up`
Para producción: `docker-compose up -d`


## 🔍 Problemas comunes

- Verifica puertos 3000, 5000 y 5432 libres
- Espera que la base de datos inicie
- Revisa permisos de carpetas uploads


## 🤝 Contribuir

Haz un fork, crea tu rama, sube cambios y haz PR.


## 📄 Licencia

MIT. Ver archivo LICENSE.


---

**Homelearn** - Aprende, gestiona y comparte rutas educativas 🚀
