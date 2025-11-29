use axum::http::Method;
use axum::Router;
use dotenvy::dotenv;
use sqlx::PgPool;
use std::net::SocketAddr;
use tokio::net::TcpListener;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod routes;
mod db;
mod models;

fn cors_layer() -> CorsLayer {
    CorsLayer::new()
        // em dev, pode liberar tudo:
        .allow_origin(Any)
        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE])
        .allow_headers(Any)
}

#[tokio::main]
async fn main() {
    dotenv().ok();

    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG")
                .unwrap_or_else(|_| "ranking_estudos_backend=debug,tower_http=debug".into()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Inicializa pool de conexão com Postgres
    let pool: PgPool = db::init_pool()
        .await
        .expect("falha ao conectar no banco");

    // Cria router com o pool como estado
    let app: Router = routes::create_router(pool)
        .layer(cors_layer())                // habilita CORS
        .layer(TraceLayer::new_for_http()); // logging das requisições

    let addr = SocketAddr::from(([0, 0, 0, 0], 3000));
    tracing::info!("Servidor rodando em http://{}", addr);

    let listener = TcpListener::bind(addr)
        .await
        .expect("não conseguiu abrir a porta 3000");

    axum::serve(listener, app)
        .await
        .unwrap();
}
