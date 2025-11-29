import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

export const Navbar: React.FC = () => {
  const { user, setUser } = useUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    setUser(null);
    navigate("/");
  };

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0.75rem 1rem",
        borderBottom: "1px solid #ddd",
        marginBottom: "1rem",
      }}
    >
      <Link to="/groups" style={{ textDecoration: "none", color: "#111" }}>
        <span style={{ fontWeight: 600 }}>Ranking de Estudos</span>
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {user && (
          <span style={{ fontSize: "0.9rem", color: "#555" }}>
            Logado como: {user.name}
          </span>
        )}
        {user && (
          <button
            onClick={handleLogout}
            style={{
              padding: "0.3rem 0.7rem",
              borderRadius: "4px",
              border: "1px solid #ccc",
              background: "#f5f5f5",
              cursor: "pointer",
            }}
          >
            Sair
          </button>
        )}
      </div>
    </nav>
  );
};
