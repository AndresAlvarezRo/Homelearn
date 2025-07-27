-- Initialize homelearn database schema

-- Drop existing tables if they exist (for clean restart)
DROP TABLE IF EXISTS friendships CASCADE;
DROP TABLE IF EXISTS user_progress CASCADE;
DROP TABLE IF EXISTS user_enrollments CASCADE;
DROP TABLE IF EXISTS course_levels CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create sequence for user codes
CREATE SEQUENCE IF NOT EXISTS user_code_seq START 1;

-- Users table with all required columns
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    user_code VARCHAR(20) UNIQUE NOT NULL,
    profile_pic VARCHAR(255),
    biography TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_course_levels_course_id ON course_levels(course_id);
CREATE INDEX idx_user_enrollments_user_id ON user_enrollments(user_id);
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_friendships_user_id ON friendships(user_id);

-- Insert default admin user (password: admin123) - CORRECT HASH
INSERT INTO users (username, email, password_hash, is_admin, user_code, biography) 
VALUES ('admin', 'admin@homelearn.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3L6jLb4tye', TRUE, 'ADMIN001', 'System Administrator');

-- Insert sample course
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
