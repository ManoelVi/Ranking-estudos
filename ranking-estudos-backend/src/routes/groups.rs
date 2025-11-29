use axum::{
    extract::{Path, State},
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use sqlx::FromRow;
use axum::http::StatusCode;

use crate::db::DbPool;
use crate::models::Group;

#[derive(Serialize, FromRow)]
pub struct UserGroup {
    pub id: Uuid,
    pub name: String,
    pub owner_id: Uuid,
    pub goal_days: i32,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Serialize, FromRow)]
pub struct GroupMember {
    pub user_id: Uuid,
    pub name: String,
    pub email: String,
    pub joined_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Deserialize)]
pub struct CreateGroupInput {
    pub name: String,
    pub owner_id: Uuid,
    pub goal_days: i32,
}

#[derive(Deserialize)]
pub struct JoinGroupInput {
    pub user_id: Uuid,
}

pub fn router() -> Router<DbPool> {
    Router::new()
        .route("/groups", post(create_group))
        .route("/groups/:group_id/join", post(join_group))
        .route("/users/:user_id/groups", get(list_user_groups))
        .route("/groups/:group_id/members", get(list_group_members))
}

// POST /groups
async fn create_group(
    State(pool): State<DbPool>,
    Json(payload): Json<CreateGroupInput>,
) -> Result<Json<Group>, (StatusCode, String)> {
    let group_id = Uuid::new_v4();
    let membership_id = Uuid::new_v4();

    let mut tx = pool.begin().await.map_err(internal_error)?;

    let group = sqlx::query_as::<_, Group>(
        r#"
        INSERT INTO groups (id, name, owner_id, goal_days, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING id, name, owner_id, goal_days, created_at
        "#,
    )
    .bind(group_id)
    .bind(&payload.name)
    .bind(payload.owner_id)
    .bind(payload.goal_days)
    .fetch_one(&mut *tx)
    .await
    .map_err(internal_error)?;

    sqlx::query(
        r#"
        INSERT INTO group_memberships (id, user_id, group_id, created_at)
        VALUES ($1, $2, $3, NOW())
        "#,
    )
    .bind(membership_id)
    .bind(payload.owner_id)
    .bind(group_id)
    .execute(&mut *tx)
    .await
    .map_err(internal_error)?;

    tx.commit().await.map_err(internal_error)?;

    Ok(Json(group))
}

// POST /groups/:group_id/join
async fn join_group(
    State(pool): State<DbPool>,
    Path(group_id): Path<Uuid>,
    Json(payload): Json<JoinGroupInput>,
) -> Result<StatusCode, (StatusCode, String)> {
    let membership_id = Uuid::new_v4();

    let result = sqlx::query(
        r#"
        INSERT INTO group_memberships (id, user_id, group_id, created_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (user_id, group_id) DO NOTHING
        "#,
    )
    .bind(membership_id)
    .bind(payload.user_id)
    .bind(group_id)
    .execute(&pool)
    .await;

    match result {
        Ok(_) => Ok(StatusCode::NO_CONTENT),
        Err(err) => Err(internal_error(err)),
    }
}

// GET /users/:user_id/groups
async fn list_user_groups(
    State(pool): State<DbPool>,
    Path(user_id): Path<Uuid>,
) -> Result<Json<Vec<UserGroup>>, (StatusCode, String)> {
    let groups = sqlx::query_as::<_, UserGroup>(
        r#"
        SELECT
            g.id,
            g.name,
            g.owner_id,
            g.goal_days,
            g.created_at
        FROM groups g
        JOIN group_memberships gm ON gm.group_id = g.id
        WHERE gm.user_id = $1
        ORDER BY g.created_at DESC
        "#,
    )
    .bind(user_id)
    .fetch_all(&pool)
    .await
    .map_err(internal_error)?;

    Ok(Json(groups))
}

// GET /groups/:group_id/members
async fn list_group_members(
    State(pool): State<DbPool>,
    Path(group_id): Path<Uuid>,
) -> Result<Json<Vec<GroupMember>>, (StatusCode, String)> {
    let members = sqlx::query_as::<_, GroupMember>(
        r#"
        SELECT
            u.id as user_id,
            u.name,
            u.email,
            gm.created_at as joined_at
        FROM group_memberships gm
        JOIN users u ON u.id = gm.user_id
        WHERE gm.group_id = $1
        ORDER BY gm.created_at ASC
        "#,
    )
    .bind(group_id)
    .fetch_all(&pool)
    .await
    .map_err(internal_error)?;

    Ok(Json(members))
}

fn internal_error<E: std::fmt::Display>(err: E) -> (StatusCode, String) {
    (StatusCode::INTERNAL_SERVER_ERROR, err.to_string())
}
