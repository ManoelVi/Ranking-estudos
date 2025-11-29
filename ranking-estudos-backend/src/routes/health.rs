use axum::{routing::get, Router, extract::State, Json};
use serde::Serialize;

use crate::db::DbPool;

pub fn router() -> Router<DbPool> {
    Router::new()
        .route("/health", get(healthcheck))
        .route("/db-health", get(db_healthcheck))
}

async fn healthcheck() -> &'static str {
    "ok"
}

#[derive(Serialize)]
struct DbHealthResponse {
    status: String,
}

async fn db_healthcheck(
    State(pool): State<DbPool>,
) -> Result<Json<DbHealthResponse>, (axum::http::StatusCode, String)> {
    // Testa o banco com um SELECT 1
    let result: Result<(i32,), sqlx::Error> = sqlx::query_as("SELECT 1")
        .fetch_one(&pool)
        .await;

    match result {
        Ok((_one,)) => Ok(Json(DbHealthResponse {
            status: "ok".to_string(),
        })),
        Err(err) => Err((
            axum::http::StatusCode::INTERNAL_SERVER_ERROR,
            format!("erro ao consultar o banco: {}", err),
        )),
    }
}
