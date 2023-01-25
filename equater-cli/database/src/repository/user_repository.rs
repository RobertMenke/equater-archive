use crate::models::user::{LocalUser, UserData};
use crate::schema::users::dsl::*;
use diesel::prelude::*;
use diesel::result::Error;
use diesel::{insert_into, RunQueryDsl};

pub struct UserRepository<'a> {
    connection: &'a SqliteConnection,
}

impl<'a> UserRepository<'a> {
    pub fn new(connection: &'a SqliteConnection) -> Self {
        Self { connection }
    }

    /// There can only ever be 1 user in this application at a time
    pub fn find_user(&self) -> Result<LocalUser, Error> {
        users.first(self.connection)
    }

    pub fn create_user(&self, data: &UserData) -> Result<LocalUser, Error> {
        let num_deleted_rows = self.truncate()?;
        println!("Deleted {} row(s) from user table", num_deleted_rows);
        let result = insert_into(users).values(data).execute(self.connection)?;
        println!("Inserted {} rows into user table", result);

        self.find_user()
    }

    pub fn truncate(&self) -> Result<usize, Error> {
        diesel::delete(users).execute(self.connection)
    }
}

#[cfg(test)]
mod tests {
    use dotenv::dotenv;

    use crate::connection::connect;
    use crate::models::user::UserData;
    use crate::repository::user_repository::UserRepository;

    #[test]
    fn should_create_user() {
        dotenv().ok();
        let connection = connect().get().unwrap();
        let repository = UserRepository {
            connection: &connection,
        };
        let data = UserData {
            email: String::from("foo"),
            auth_token: String::from("bar"),
        };
        repository.create_user(&data).unwrap();
        let user = repository.find_user().unwrap();
        assert_eq!(user.get_email(), "foo");
    }
}
