-- ============================================================
--  Relational Library Transaction Ledger — MySQL Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS library_ledger;
USE library_ledger;

-- ── Media (books, DVDs, magazines, audiobooks, etc.) ──────
CREATE TABLE IF NOT EXISTS media (
    id            INT          AUTO_INCREMENT PRIMARY KEY,
    title         VARCHAR(200) NOT NULL,
    creator       VARCHAR(150) NOT NULL,           -- author / director / artist
    media_type    ENUM('BOOK','DVD','MAGAZINE','AUDIOBOOK','OTHER') NOT NULL,
    genre         VARCHAR(80),
    release_year  YEAR,
    total_copies  INT          NOT NULL DEFAULT 1,
    available     INT          NOT NULL DEFAULT 1,
    added_on      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_copies CHECK (available >= 0 AND available <= total_copies)
);

-- ── Members ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS members (
    id            INT          AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(150) NOT NULL,
    email         VARCHAR(150) NOT NULL UNIQUE,
    phone         VARCHAR(20),
    joined_on     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active     TINYINT(1)   NOT NULL DEFAULT 1
);

-- ── Transaction Ledger ────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
    id            INT          AUTO_INCREMENT PRIMARY KEY,
    member_id     INT          NOT NULL,
    media_id      INT          NOT NULL,
    borrow_date   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    due_date      DATE         NOT NULL,
    return_date   TIMESTAMP    NULL,
    status        ENUM('BORROWED','RETURNED','OVERDUE') NOT NULL DEFAULT 'BORROWED',
    CONSTRAINT fk_member FOREIGN KEY (member_id) REFERENCES members(id),
    CONSTRAINT fk_media  FOREIGN KEY (media_id)  REFERENCES media(id)
);

-- ── Sample Data ───────────────────────────────────────────
INSERT INTO media (title, creator, media_type, genre, release_year, total_copies, available) VALUES
('The Pragmatic Programmer',  'David Thomas',    'BOOK',      'Technology', 2019, 3, 3),
('Inception',                 'Christopher Nolan','DVD',       'Sci-Fi',     2010, 2, 2),
('National Geographic',       'Various',         'MAGAZINE',  'Science',    2024, 5, 5),
('Atomic Habits',             'James Clear',     'AUDIOBOOK', 'Self-Help',  2018, 2, 2),
('Clean Code',                'Robert C. Martin','BOOK',      'Technology', 2008, 4, 4);

INSERT INTO members (name, email, phone) VALUES
('Alice Johnson', 'alice@example.com', '9876543210'),
('Bob Smith',     'bob@example.com',   '9123456780');