use chrono::{DateTime, Utc};
use serde::Serialize;
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Serialize, FromRow)]
pub struct User {
    pub id: Uuid,
    pub email: String,
    pub name: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, FromRow)]
pub struct Group {
    pub id: Uuid,
    pub name: String,
    pub owner_id: Uuid,
    pub goal_days: i32,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, FromRow)]
pub struct GroupMembership {
    pub id: Uuid,
    pub user_id: Uuid,
    pub group_id: Uuid,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, FromRow)]
pub struct Activity {
    pub id: Uuid,
    pub user_id: Uuid,
    pub group_id: Uuid,
    pub description: String,
    pub created_at: DateTime<Utc>,
}
