use axum::{
    extract::{Path, State},
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use axum::http::StatusCode;
use sqlx::FromRow;

use crate::db::DbPool;
use crate::models::Activity;

#[derive(Deserialize)]
pub struct CreateActivityInput {
    pub user_id: Uuid,
    pub description: String,
}

#[derive(Serialize, FromRow)]
pub struct ActivityWithUser {
    pub id: Uuid,
    pub user_id: Uuid,
    pub user_name: String,
    pub group_id: Uuid,
    pub description: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Serialize, FromRow)]
pub struct UserActivityCount {
    pub user_id: Uuid,
    pub user_name: String,
    pub activities_count: i64,
}

#[derive(Serialize)]
pub struct GroupActivitiesSummary {
    pub group_id: Uuid,
    pub total_activities: i64,
    pub activities: Vec<ActivityWithUser>,
    pub per_user: Vec<UserActivityCount>,
}

pub fn router() -> Router<DbPool> {
    Router::new()
        .route(
            "/groups/:group_id/activities",
            post(create_activity).get(list_group_activities),
        )
        .route(
            "/groups/:group_id/activities/summary",
            get(group_activities_summary),
        )
}

// POST /groups/:group_id/activities
async fn create_activity(
    State(pool): State<DbPool>,
    Path(group_id): Path<Uuid>,
    Json(payload): Json<CreateActivityInput>,
) -> Result<Json<Activity>, (StatusCode, String)> {
    let activity_id = Uuid::new_v4();

    let activity = sqlx::query_as::<_, Activity>(
        r#"
        INSERT INTO activities (id, user_id, group_id, description, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING id, user_id, group_id, description, created_at
        "#,
    )
    .bind(activity_id)
    .bind(payload.user_id)
    .bind(group_id)
    .bind(&payload.description)
    .fetch_one(&pool)
    .await
    .map_err(internal_error)?;

    Ok(Json(activity))
}

// GET /groups/:group_id/activities
async fn list_group_activities(
    State(pool): State<DbPool>,
    Path(group_id): Path<Uuid>,
) -> Result<Json<Vec<ActivityWithUser>>, (StatusCode, String)> {
    let activities = sqlx::query_as::<_, ActivityWithUser>(
        r#"
        SELECT
            a.id,
            a.user_id,
            u.name as user_name,
            a.group_id,
            a.description,
            a.created_at
        FROM activities a
        JOIN users u ON u.id = a.user_id
        WHERE a.group_id = $1
        ORDER BY a.created_at DESC
        "#,
    )
    .bind(group_id)
    .fetch_all(&pool)
    .await
    .map_err(internal_error)?;

    Ok(Json(activities))
}

// GET /groups/:group_id/activities/summary
async fn group_activities_summary(
    State(pool): State<DbPool>,
    Path(group_id): Path<Uuid>,
) -> Result<Json<GroupActivitiesSummary>, (StatusCode, String)> {
    // total de atividades do grupo
    let (total_activities,): (i64,) = sqlx::query_as(
        r#"
        SELECT COUNT(*)
        FROM activities
        WHERE group_id = $1
        "#,
    )
    .bind(group_id)
    .fetch_one(&pool)
    .await
    .map_err(internal_error)?;

    // lista de atividades com usuário
    let activities = sqlx::query_as::<_, ActivityWithUser>(
        r#"
        SELECT
            a.id,
            a.user_id,
            u.name as user_name,
            a.group_id,
            a.description,
            a.created_at
        FROM activities a
        JOIN users u ON u.id = a.user_id
        WHERE a.group_id = $1
        ORDER BY a.created_at DESC
        "#,
    )
    .bind(group_id)
    .fetch_all(&pool)
    .await
    .map_err(internal_error)?;

    // contagem por usuário (ranking)
    let per_user = sqlx::query_as::<_, UserActivityCount>(
        r#"
        SELECT
            a.user_id,
            u.name as user_name,
            COUNT(*) as activities_count
        FROM activities a
        JOIN users u ON u.id = a.user_id
        WHERE a.group_id = $1
        GROUP BY a.user_id, u.name
        ORDER BY activities_count DESC, user_name ASC
        "#,
    )
    .bind(group_id)
    .fetch_all(&pool)
    .await
    .map_err(internal_error)?;

    let summary = GroupActivitiesSummary {
        group_id,
        total_activities,
        activities,
        per_user,
    };

    Ok(Json(summary))
}

fn internal_error<E: std::fmt::Display>(err: E) -> (StatusCode, String) {
    (StatusCode::INTERNAL_SERVER_ERROR, err.to_string())
}
