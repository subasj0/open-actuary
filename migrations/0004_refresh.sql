CREATE TABLE oauth_refresh(hash TEXT PRIMARY KEY,user_id TEXT NOT NULL,client_id TEXT NOT NULL,resource TEXT NOT NULL,expires INTEGER NOT NULL);
