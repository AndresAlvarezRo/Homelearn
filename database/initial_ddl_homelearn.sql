-- ══════════════════════════════════════════════════════════════════
--  HOMELEARN — initial DDL
--  Idempotent: safe to re-run. Lives in the shared centro_hogar /
--  homelearn Postgres DB. The `users` table is owned by Centro-Service
--  (initial_ddl_centro_service.sql), which must run before this file
--  so the FKs to users(id) resolve.
-- ══════════════════════════════════════════════════════════════════

-- ── Courses ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS course_levels (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    level_number INTEGER NOT NULL,
    title VARCHAR(200) NOT NULL,
    topics TEXT[],
    objectives TEXT[],
    tools TEXT[],
    resources TEXT[],
    content TEXT,
    level_order INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_enrollments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(user_id, course_id)
);

CREATE TABLE IF NOT EXISTS user_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    course_level_id INTEGER REFERENCES course_levels(id) ON DELETE CASCADE,
    level_id INTEGER REFERENCES course_levels(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    UNIQUE(user_id, course_level_id)
);

-- ── Friendships (social) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS friendships (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    friend_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, friend_id)
);

-- ── Mini-courses (independent track + progress) ──────────────────
CREATE TABLE IF NOT EXISTS mini_courses (
    id SERIAL PRIMARY KEY,
    level_id INTEGER NOT NULL REFERENCES course_levels(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mini_course_levels (
    id SERIAL PRIMARY KEY,
    mini_course_id INTEGER NOT NULL REFERENCES mini_courses(id) ON DELETE CASCADE,
    level_number INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    topics TEXT[],
    objectives TEXT[],
    tools TEXT[],
    resources TEXT[],
    content JSONB,
    level_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS user_mini_course_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mini_course_level_id INTEGER NOT NULL REFERENCES mini_course_levels(id) ON DELETE CASCADE,
    completed_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, mini_course_level_id)
);

-- ── Indexes ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_course_levels_course_id ON course_levels(course_id);
CREATE INDEX IF NOT EXISTS idx_user_enrollments_user_id ON user_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_mini_courses_level_id ON mini_courses(level_id);
CREATE INDEX IF NOT EXISTS idx_mini_course_levels_mini_course_id ON mini_course_levels(mini_course_id);
CREATE INDEX IF NOT EXISTS idx_user_mini_course_progress_user_id ON user_mini_course_progress(user_id);

-- ── Seed: sample course (only if no courses exist) ───────────────
INSERT INTO courses (title, description, created_by)
SELECT 'Introducción a la Programación', 'Curso básico de programación para principiantes', 1
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE title = 'Introducción a la Programación');

INSERT INTO course_levels (course_id, level_number, title, topics, objectives, tools, resources, level_order)
SELECT c.id, 1, '1 - Fundamentos de Programación',
       ARRAY['Variables y tipos de datos', 'Operadores', 'Estructuras de control'],
       ARRAY['Entender conceptos básicos', 'Escribir programas simples'],
       ARRAY['Visual Studio Code', 'Python'],
       ARRAY['https://python.org', 'https://code.visualstudio.com'], 1
FROM courses c
WHERE c.title = 'Introducción a la Programación'
  AND NOT EXISTS (
    SELECT 1 FROM course_levels cl WHERE cl.course_id = c.id AND cl.level_number = 1
  );

INSERT INTO course_levels (course_id, level_number, title, topics, objectives, tools, resources, level_order)
SELECT c.id, 2, '2 - Estructuras de Datos',
       ARRAY['Listas', 'Diccionarios', 'Tuplas'],
       ARRAY['Manejar colecciones de datos', 'Optimizar el código'],
       ARRAY['Python', 'Jupyter Notebook'],
       ARRAY['https://jupyter.org', 'Documentación de Python'], 2
FROM courses c
WHERE c.title = 'Introducción a la Programación'
  AND NOT EXISTS (
    SELECT 1 FROM course_levels cl WHERE cl.course_id = c.id AND cl.level_number = 2
  );

INSERT INTO user_enrollments (user_id, course_id)
SELECT 1, c.id
FROM courses c
WHERE c.title = 'Introducción a la Programación'
ON CONFLICT (user_id, course_id) DO NOTHING;

-- ── Grants ───────────────────────────────────────────────────────
-- Granted to whatever DB user the backend uses. Use the env-injected
-- DB_USER if running standalone; in the shared compose this is centro_user
-- (post-Fase 1) or homelearn_user (pre-Fase 1). The DO block below makes
-- the grant tolerant of either.
DO $$
DECLARE
  target_user TEXT;
BEGIN
  FOREACH target_user IN ARRAY ARRAY['homelearn_user', 'centro_user']
  LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = target_user) THEN
      EXECUTE format('GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO %I', target_user);
      EXECUTE format('GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO %I', target_user);
    END IF;
  END LOOP;
END $$;
