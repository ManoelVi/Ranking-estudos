use sqlx::{postgres::PgPoolOptions, PgPool};
use std::time::Duration;

pub type DbPool = PgPool;

pub async fn init_pool() -> Result<DbPool, sqlx::Error> {
    let database_url = std::env::var("DATABASE_URL")
        .expect("DATABASE_URL deve estar definida");

    PgPoolOptions::new()
        .max_connections(10)
        .acquire_timeout(Duration::from_secs(5))
        .connect(&database_url)
        .await
}