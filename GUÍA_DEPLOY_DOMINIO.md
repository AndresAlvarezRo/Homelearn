# Guía para Publicar Homelearn con Dominio

## 1. Comprar un dominio
- Elige un proveedor (ej: Namecheap, GoDaddy, Google Domains).
- Compra el dominio que desees.

## 2. Contratar un servidor
- Puedes usar un VPS o cloud (ej: DigitalOcean, AWS, Hetzner).
- El servidor debe tener Docker y Docker Compose instalados.

## 3. Apuntar el dominio al servidor
- Ve al panel de tu proveedor de dominio.
- Crea un registro A apuntando al IP público de tu servidor.
- Ejemplo: `app.tudominio.com` → `123.123.123.123`

## 4. Subir el proyecto al servidor
- Sube los archivos del proyecto (por SSH, SFTP, Git, etc).
- Ubica el proyecto en una carpeta, por ejemplo `/home/usuario/homelearn`.

## 5. Configurar variables de entorno
- Edita `.env` o los valores en `docker-compose.yml` para usar tu dominio:
  - Ejemplo: `REACT_APP_API_URL=https://app.tudominio.com/api`

## 6. Configurar proxy reverso y HTTPS
- Instala Nginx o Traefik en el servidor.
- Configura para redirigir el tráfico del dominio al contenedor frontend/backend.
- Usa Let's Encrypt para obtener certificado SSL gratis.
- Ejemplo de configuración básica Nginx:

```nginx
server {
    listen 80;
    server_name app.tudominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

- Para HTTPS, agrega configuración de Let's Encrypt o usa Traefik con Docker.

## 7. Desplegar la app
- Ejecuta en el servidor:
  ```bash
  docker-compose up -d
  ```
- Verifica que los servicios estén corriendo:
  ```bash
  docker-compose ps
  ```

## 8. Abrir puertos
- Asegúrate que los puertos 80 (HTTP) y 443 (HTTPS) estén abiertos en el firewall del servidor.

## 9. Probar acceso
- Abre tu navegador y visita `https://app.tudominio.com`
- Verifica que la app carga y puedes iniciar sesión.

## 10. Consejos extra
- Haz backups regulares de la base de datos.
- Mantén actualizado el sistema y los contenedores.
- Usa contraseñas seguras y cambia la clave JWT.

---

¿Dudas? Puedes buscar tutoriales de "deploy Docker app VPS" y "configurar Nginx con dominio y SSL" para más detalles.