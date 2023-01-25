use serde::Deserialize;

use crate::user::User;
use fake::{Dummy, Fake};

#[derive(Debug, Deserialize, Dummy)]
pub struct FetchUsersResponse {
    pub friends: Vec<User>,
    pub users: Vec<User>,
}

impl FetchUsersResponse {
    /// Performs a move operation so that the response can be sent over as a single list.
    pub fn move_to_single_list(&mut self) -> Vec<User> {
        let mut users: Vec<User> = vec![];
        users.append(&mut self.users);
        users.append(&mut self.friends);

        users
    }
}
