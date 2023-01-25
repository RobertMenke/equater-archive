#[macro_use]
extern crate diesel;
extern crate core;

pub mod connection;
pub mod models;
pub mod repository;
pub mod schema;

#[cfg(test)]
mod tests {
    #[test]
    fn it_works() {
        let result = 2 + 2;
        assert_eq!(result, 4);
    }
}
