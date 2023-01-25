use cli_table::{print_stdout, Cell, CellStruct, Style, Table};

use crate::user::User;
use std::io::Result;

pub struct FetchUsersUi {
    items: Vec<User>,
}

impl FetchUsersUi {
    pub fn new(users: Vec<User>) -> FetchUsersUi {
        Self { items: users }
    }

    pub fn render(&self) -> Result<()> {
        let data: Vec<Vec<CellStruct>> = self
            .items
            .iter()
            .map(|user| self.user_to_cell(user))
            .collect();

        let table = data
            .table()
            .title(vec![
                "ID".cell().bold(true),
                "Email".cell().bold(true),
                "UUID".cell().bold(true),
                "First Name".cell().bold(true),
                "Last Name".cell().bold(true),
            ])
            .bold(true);

        print_stdout(table)
    }

    fn user_to_cell(&self, user: &User) -> Vec<CellStruct> {
        vec![
            user.id.to_string().cell(),
            user.email.clone().cell(),
            user.uuid.clone().cell(),
            user.first_name.clone().cell(),
            user.last_name.clone().cell(),
        ]
    }
}
