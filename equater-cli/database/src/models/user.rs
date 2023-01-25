use crate::schema::users;
use diesel::Queryable;
use serde::Deserialize;

#[derive(Queryable)]
pub struct LocalUser {
    pub id: i32,
    pub email: String,
    pub auth_token: String,
}

#[derive(Deserialize, Insertable)]
#[table_name = "users"]
pub struct UserData {
    pub email: String,
    pub auth_token: String,
}

impl LocalUser {
    pub fn get_id(&self) -> i32 {
        self.id
    }

    pub fn get_email(&self) -> &str {
        self.email.as_str()
    }

    pub fn get_auth_token(&self) -> &str {
        self.auth_token.as_str()
    }
}
