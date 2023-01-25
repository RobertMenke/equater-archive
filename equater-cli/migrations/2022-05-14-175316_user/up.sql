-- Your SQL goes here
create table if not exists users (
    id integer primary key autoincrement not null,
    email text not null,
    auth_token text not null
)
