use axum::Router;

mod health;
mod users;
mod groups;
mod activities;

use crate::db::DbPool;

pub fn create_router(pool: DbPool) -> Router {
    Router::new()
        .merge(health::router())
        .merge(users::router())
        .merge(groups::router())
        .merge(activities::router())
        .with_state(pool)
}
