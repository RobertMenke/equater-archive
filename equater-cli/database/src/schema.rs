use diesel::table;

table! {
    users (id) {
        id -> Integer,
        email -> Text,
        auth_token -> Text,
    }
}
