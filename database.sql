-- Production database schema (PostgreSQL)
-- Password hashes must be generated server-side with Argon2id or bcrypt.

CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(80) NOT NULL,
  middle_name VARCHAR(80),
  last_name VARCHAR(80) NOT NULL,
  age SMALLINT NOT NULL CHECK (age BETWEEN 0 AND 120),
  location TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX children_last_name_idx ON children(last_name, first_name);
CREATE INDEX children_location_idx ON children(location);
