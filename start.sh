#!/bin/bash

echo "🔧 Fixing Homelearn Issues..."

# Stop containers
echo "⏹️ Stopping containers..."
docker-compose down

# Start containers
echo "🚀 Starting containers..."
docker-compose up --build -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Fix admin password and null usernames
echo "🔐 Corrigiendo contraseña del administrador y datos de usuario..."
docker exec -i homelearn_db psql -U homelearn_user -d homelearn_db << 'EOF'
-- Corrige el hash de contraseña del admin para 'admin123'
UPDATE users
SET password_hash = '$2a$12$LQv3c1yqBwEHXk.JCJbCpOuF2qwrAikvfCyHGQ3YGpTkqxec10yz.' 
WHERE email = 'admin@homelearn.com';

-- Corrige usuarios con nombre de usuario nulo
UPDATE users 
SET username = COALESCE(username, 'Usuario_' || id)
WHERE username IS NULL;

-- Verifica los cambios
SELECT id, username, email, is_admin FROM users;
EOF

echo "✅ ¡Todas las correcciones aplicadas!"
echo ""
echo "🎉 Ahora puedes:"
echo "   - Iniciar sesión como admin: admin@homelearn.com / admin123"
echo "   - Subir cualquier curso en formato JSON"
echo "   - Eliminar cursos que hayas creado"
echo "   - Acceder al panel de administración"
echo ""
echo "🌐 Abrir: http://localhost:3000"

