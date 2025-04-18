CREATE TABLE Photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_name TEXT,
    location TEXT,
    thumbnail_path TEXT
);

CREATE TABLE Tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tag_name TEXT UNIQUE
);

CREATE TABLE PhotoTags (
    photo_id INTEGER,
    tag_id INTEGER,
    FOREIGN KEY (photo_id) REFERENCES Photos(id),
    FOREIGN KEY (tag_id) REFERENCES Tags(id)
);