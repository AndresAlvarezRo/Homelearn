-- Fix admin password hash for 'admin123'
UPDATE users 
SET password_hash = '$2a$12$LQv3c1yqBwEHXk.JCJbCpOuF2qwrAikvfCyHGQ3YGpTkqxec10yz.' 
WHERE email = 'admin@homelearn.com';

-- Also fix any users with null usernames
UPDATE users 
SET username = COALESCE(username, 'User_' || id)
WHERE username IS NULL;

-- Verify the changes
SELECT id, username, email, is_admin FROM users;
