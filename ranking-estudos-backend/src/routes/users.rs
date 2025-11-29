use axum::{
    extract::State,
    routing::{get, post},
    Json, Router,
};
use serde::Deserialize;
use uuid::Uuid;

use crate::db::DbPool;
use crate::models::User;
use axum::http::StatusCode;

#[derive(Deserialize)]
pub struct CreateUserInput {
    pub email: String,
    pub name: String,
}

pub fn router() -> Router<DbPool> {
    Router::new()
        .route("/users", post(create_user).get(list_users))
}

// POST /users
async fn create_user(
    State(pool): State<DbPool>,
    Json(payload): Json<CreateUserInput>,
) -> Result<Json<User>, (StatusCode, String)> {
    let user_id = Uuid::new_v4();

    let user = sqlx::query_as::<_, User>(
        r#"
        INSERT INTO users (id, email, name, created_at)
        VALUES ($1, $2, $3, NOW())
        RETURNING id, email, name, created_at
        "#,
    )
    .bind(user_id)
    .bind(payload.email)
    .bind(payload.name)
    .fetch_one(&pool)
    .await
    .map_err(internal_error)?;

    Ok(Json(user))
}

// GET /users
async fn list_users(
    State(pool): State<DbPool>,
) -> Result<Json<Vec<User>>, (StatusCode, String)> {
    let users = sqlx::query_as::<_, User>(
        r#"
        SELECT id, email, name, created_at
        FROM users
        ORDER BY created_at DESC
        "#,
    )
    .fetch_all(&pool)
    .await
    .map_err(internal_error)?;

    Ok(Json(users))
}

fn internal_error<E: std::fmt::Display>(err: E) -> (StatusCode, String) {
    (StatusCode::INTERNAL_SERVER_ERROR, err.to_string())
}
