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
echo "🔐 Fixing admin password and user data..."
docker exec -i homelearn_db psql -U homelearn_user -d homelearn_db << 'EOF'
-- Fix admin password hash for 'admin123'
UPDATE users 
SET password_hash = '$2a$12$LQv3c1yqBwEHXk.JCJbCpOuF2qwrAikvfCyHGQ3YGpTkqxec10yz.' 
WHERE email = 'admin@homelearn.com';

-- Fix any users with null usernames
UPDATE users 
SET username = COALESCE(username, 'User_' || id)
WHERE username IS NULL;

-- Verify the changes
SELECT id, username, email, is_admin FROM users;
EOF

echo "✅ All fixes applied!"
echo ""
echo "🎉 You can now:"
echo "   - Login as admin: admin@homelearn.com / admin123"
echo "   - Upload any course JSON format"
echo "   - Delete courses you created"
echo "   - Access admin panel"
echo ""
echo "🌐 Open: http://localhost:3000"
