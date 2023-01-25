use diesel::{
    r2d2::{ConnectionManager, Pool},
    SqliteConnection,
};
use std::env;

/// Only documentation I could find is in the source
/// https://github.com/diesel-rs/diesel/blob/master/diesel/src/r2d2.rs
pub fn connect() -> Pool<ConnectionManager<SqliteConnection>> {
    let database_url =
        env::var("EQUATER_LOCAL_DATABASE_URL").expect("EQUATER_LOCAL_DATABASE_URL is not set");
    let manager = ConnectionManager::<SqliteConnection>::new(database_url.clone());

    Pool::builder()
        .test_on_check_out(true)
        .build(manager)
        .unwrap_or_else(|_| panic!("Error connecting to {}", database_url))
}
