-- Mini-cursos: estructura y progreso independiente

CREATE TABLE mini_courses (
    id SERIAL PRIMARY KEY,
    level_id INTEGER NOT NULL REFERENCES course_levels(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE mini_course_levels (
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

CREATE TABLE user_mini_course_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mini_course_level_id INTEGER NOT NULL REFERENCES mini_course_levels(id) ON DELETE CASCADE,
    completed_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, mini_course_level_id)
);

CREATE INDEX idx_mini_courses_level_id ON mini_courses(level_id);
CREATE INDEX idx_mini_course_levels_mini_course_id ON mini_course_levels(mini_course_id);
CREATE INDEX idx_user_mini_course_progress_user_id ON user_mini_course_progress(user_id);
