use crate::flag_command::FlagCommand;

pub enum Command {
    Login,
    Logout,
    Fetch(FetchCommand),
    Help,
}

pub enum FetchCommand {
    Users(String),        // Search parameter
    Vendors(FlagCommand), // Search parameter
}

impl Command {
    pub fn from(input: &Vec<String>) -> Result<Self, &'static str> {
        let command = match input.get(1) {
            Some(value) => Ok(value),
            None => Err(Command::make_default_error()),
        }?;

        match command.to_lowercase().trim() {
            "login" => Ok(Self::Login),
            "logout" => Ok(Self::Logout),
            "fetch" => Ok(Self::Fetch(FetchCommand::from(input)?)),
            "--help" => Ok(Self::Help),
            "-h" => Ok(Self::Help),
            _ => Err(Command::make_default_error()),
        }
    }

    pub fn make_default_error() -> &'static str {
        "Please enter a valid command"
    }

    pub fn make_help_menu() -> &'static str {
        "todo: help menu"
    }
}

impl FetchCommand {
    pub fn from(input: &Vec<String>) -> Result<Self, &'static str> {
        println!("{:?}", input);
        let command = input.get(2).ok_or_else(Command::make_default_error)?;

        return match command.to_lowercase().trim() {
            "users" => {
                let search_term_error =
                    "Please specify a search term like equater fetch users --search foo";
                let flag_command = FlagCommand::new_from_clone(input.get(3), input.get(4));

                if !flag_command.flag_is("--search") || !flag_command.has_value() {
                    println!("here");
                    return Err(search_term_error);
                }

                let value = flag_command.value_or(search_term_error)?;

                return Ok(Self::Users(value));
            }
            "vendors" => {
                let flag_command = FlagCommand::new_from_clone(input.get(3), input.get(4));

                return Ok(Self::Vendors(flag_command));
            }
            _ => Err(Command::make_default_error()),
        };
    }
}
