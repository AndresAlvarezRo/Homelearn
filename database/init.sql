-- Initialize homelearn database schema (courses + social).
-- The `users` table and its sequence/index live in Centro-Hogar
-- (migrations/00_users.sql), which is mounted into this Postgres init-dir
-- first, so the FKs below resolve on a fresh volume.

-- Drop existing tables if they exist (for clean restart). Never drop users:
-- it's owned by Centro-Hogar.
DROP TABLE IF EXISTS friendships CASCADE;
DROP TABLE IF EXISTS user_progress CASCADE;
DROP TABLE IF EXISTS user_enrollments CASCADE;
DROP TABLE IF EXISTS course_levels CASCADE;
DROP TABLE IF EXISTS courses CASCADE;

-- Courses table
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Course levels table - FIXED COLUMN NAMES
CREATE TABLE course_levels (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    level_number INTEGER NOT NULL,
    title VARCHAR(200) NOT NULL,  -- Changed from level_title to title
    topics TEXT[],
    objectives TEXT[],
    tools TEXT[],
    resources TEXT[],
    content TEXT,
    level_order INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User course enrollments
CREATE TABLE user_enrollments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(user_id, course_id)
);

-- User progress tracking
CREATE TABLE user_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    course_level_id INTEGER REFERENCES course_levels(id) ON DELETE CASCADE,
    level_id INTEGER REFERENCES course_levels(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    UNIQUE(user_id, course_level_id)
);

-- Friendships table
CREATE TABLE friendships (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    friend_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, friend_id)
);

-- Create indexes (idx_users_email lives in Centro-Hogar's 00_users.sql)
CREATE INDEX idx_course_levels_course_id ON course_levels(course_id);
CREATE INDEX idx_user_enrollments_user_id ON user_enrollments(user_id);
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_friendships_user_id ON friendships(user_id);

-- Insert sample course (admin user is seeded by Centro-Hogar's 00_users.sql)
INSERT INTO courses (title, description, created_by)
VALUES ('Introducción a la Programación', 'Curso básico de programación para principiantes', 1);

-- Insert sample course levels - FIXED COLUMN NAMES
INSERT INTO course_levels (course_id, level_number, title, topics, objectives, tools, resources, level_order) 
VALUES 
(1, 1, '1 - Fundamentos de Programación', 
 ARRAY['Variables y tipos de datos', 'Operadores', 'Estructuras de control'], 
 ARRAY['Entender conceptos básicos', 'Escribir programas simples'], 
 ARRAY['Visual Studio Code', 'Python'], 
 ARRAY['https://python.org', 'https://code.visualstudio.com'], 1),
(1, 2, '2 - Estructuras de Datos', 
 ARRAY['Listas', 'Diccionarios', 'Tuplas'], 
 ARRAY['Manejar colecciones de datos', 'Optimizar el código'], 
 ARRAY['Python', 'Jupyter Notebook'], 
 ARRAY['https://jupyter.org', 'Documentación de Python'], 2);

-- Auto-enroll admin in sample course
INSERT INTO user_enrollments (user_id, course_id) VALUES (1, 1);

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO homelearn_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO homelearn_user;
