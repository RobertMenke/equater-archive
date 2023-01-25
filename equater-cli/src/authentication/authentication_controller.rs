use super::authentication_api::{RemoteAuthentication, SignInRequest, SignInStrategy};
use crate::user::SignInResponse;
use database::{
    models::user::{LocalUser, UserData},
    repository::user_repository::UserRepository,
};
use diesel::result::Error;

/// T: RemoteAuthentication so we can swap in a fake at test time
pub struct AuthenticationController<'a, T: RemoteAuthentication> {
    remote_repository: T,
    local_repository: &'a UserRepository<'a>,
}

impl<'a, T: RemoteAuthentication> AuthenticationController<'a, T> {
    pub fn new(local_repository: &'a UserRepository<'a>, remote_repository: T) -> Self {
        Self {
            remote_repository,
            local_repository,
        }
    }

    /// Order of operations:
    ///     1. Check the local cache for an auth token associated with the email
    ///     2. If there is an auth token, check with the server to see if it's valid
    ///     3. If the auth token is valid, return the local user
    ///     4. If the auth token is invalid, attempt to sign in
    ///     5. If sign in is successful, cache the local user
    pub async fn sign_in(&self, strategy: SignInStrategy) -> Result<LocalUser, String> {
        let request = SignInRequest::new(strategy);
        println!("Checking cached user");
        let local_user = self.find_local_user_by_email(&request).await;

        if (self.verify_local_user(local_user).await).is_ok() {
            println!("Cached user verified");
        } else {
            println!("Cached user not found -- signing in via server");
        }

        let response = self
            .remote_repository
            .sign_in(&request)
            .await
            .map_err(|e| e.to_string())?;

        self.cache_user(&response).await.map_err(|e| e.to_string())
    }

    pub async fn find_and_verify_local_user(&self) -> Result<LocalUser, String> {
        let local_user = self
            .local_repository
            .find_user()
            .map_err(|err| err.to_string());

        self.verify_local_user(local_user).await
    }

    async fn cache_user(&self, response: &SignInResponse) -> Result<LocalUser, Error> {
        let data = self.map_user_data(response);

        self.local_repository.create_user(&data)
    }

    /// Find the local user but only consider it a match if the supplied email matches
    async fn find_local_user_by_email(&self, request: &SignInRequest) -> Result<LocalUser, String> {
        let local_user = self
            .local_repository
            .find_user()
            .map_err(|err| err.to_string());

        local_user.and_then(|user| {
            let email_matches = user.get_email() == request.email;

            if email_matches {
                Ok(user)
            } else {
                Err(String::from(
                    "Could not find a cached user with a matching email",
                ))
            }
        })
    }

    async fn verify_local_user(
        &self,
        local_user: Result<LocalUser, String>,
    ) -> Result<LocalUser, String> {
        if let Ok(user) = local_user {
            println!(
                "Found local user with email {} -- verifying auth token",
                user.email
            );
            let remote_user = self
                .remote_repository
                .get_user(user.auth_token.as_str())
                .await;

            if remote_user.is_ok() {
                println!("Cached user verified");
                return Ok(user);
            }
        }

        Err(String::from("Invalid local user"))
    }

    fn map_user_data(&self, response: &SignInResponse) -> UserData {
        UserData {
            email: response.user.email.clone(),
            auth_token: response.auth_token.clone(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::AuthenticationController;
    use crate::authentication::authentication_api::SignInStrategy;
    use crate::authentication::authentication_api_fake::AuthenticationApiFake;
    use database::{connection::connect, repository::user_repository::UserRepository};
    use diesel::SqliteConnection;
    use fake::{
        faker::internet::en::{Password, SafeEmail},
        Fake,
    };
    use k9::assert_greater_than;
    use serial_test::serial;
    use std::ops::Range;

    fn make_controller<'a>(
        local_repository: &'a UserRepository,
        should_error: bool,
    ) -> AuthenticationController<'a, AuthenticationApiFake> {
        let remote_repository = AuthenticationApiFake { should_error };

        AuthenticationController {
            remote_repository,
            local_repository,
        }
    }

    fn make_local_repository(connection: &SqliteConnection) -> UserRepository {
        UserRepository::new(connection)
    }

    #[tokio::test]
    #[serial]
    async fn it_should_respond_successfully() {
        dotenv::from_filename(".test.env").ok();
        let connection = connect().get().unwrap();
        let local_repository = make_local_repository(&connection);
        let controller = make_controller(&local_repository, false);
        let email = SafeEmail().fake();
        let password = Password(Range { start: 12, end: 30 }).fake();
        let strategy = SignInStrategy::StoredValues { email, password };
        let response = controller.sign_in(strategy).await.unwrap();
        let email = response.email;
        assert_greater_than!(email.len(), 0);
    }

    /// TODO: This test is not done yet
    #[tokio::test]
    #[serial]
    async fn it_should_store_a_cached_copy_of_the_user_on_success() {
        dotenv::from_filename(".test.env").ok();
        let connection = connect().get().unwrap();
        let local_repository = make_local_repository(&connection);
        let controller = make_controller(&local_repository, false);
        let email = SafeEmail().fake();
        let password = Password(Range { start: 12, end: 30 }).fake();
        let strategy = SignInStrategy::StoredValues { email, password };
        let _ = controller.sign_in(strategy).await.unwrap();
        let local_user = UserRepository::new(&connection).find_user();
        assert!(local_user.is_ok(), "Local user not found");
    }

    #[tokio::test]
    #[serial]
    async fn it_should_overwrite_the_users_credentials_when_updating_the_cached_data() {
        dotenv::from_filename(".test.env").ok();
        let connection = connect().get().unwrap();
        let local_repository = make_local_repository(&connection);
        let email: String = SafeEmail().fake();
        let password = Password(Range { start: 12, end: 30 }).fake();
        let controller = make_controller(&local_repository, false);
        let strategy = SignInStrategy::StoredValues {
            email: email.clone(),
            password,
        };
        // First sign-in attempt (will cache a local user)
        let _ = controller.sign_in(strategy.clone()).await.unwrap();
        let existing_user = local_repository.find_user().unwrap();
        assert!(
            local_repository.truncate().is_ok(),
            "Failed to truncate user table"
        );
        // First sign-in attempt (should overwrite the cache)
        let _ = controller.sign_in(strategy.clone()).await.unwrap();
        let local_user = local_repository.find_user();
        assert!(local_user.is_ok(), "Local user not found");
        assert_ne!(local_user.unwrap().auth_token, existing_user.auth_token);
    }

    #[tokio::test]
    #[serial]
    async fn it_should_respond_to_the_user_with_an_error_when_the_server_responds_with_an_error() {
        dotenv::from_filename(".test.env").ok();
        let connection = connect().get().unwrap();
        let local_repository = make_local_repository(&connection);
        let controller = make_controller(&local_repository, true);
        let email = SafeEmail().fake();
        let password = Password(Range { start: 12, end: 30 }).fake();
        let strategy = SignInStrategy::StoredValues { email, password };
        let foo = "bar";
        assert_eq!(foo, "bar");
        let _baz = "baz";

        let response = controller.sign_in(strategy).await;
        assert!(
            response.is_err(),
            "Controller did not respond with an error"
        );
    }
}
