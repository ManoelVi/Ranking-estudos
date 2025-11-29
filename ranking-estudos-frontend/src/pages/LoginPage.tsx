import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUser } from "../api/client";
import { useUser } from "../context/UserContext";

const pageContainerStyle: React.CSSProperties = {
  maxWidth: "420px",
  margin: "2rem auto",
  padding: "1.5rem",
  borderRadius: "8px",
  border: "1px solid #ddd",
  background: "#fff",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.5rem",
  marginBottom: "0.75rem",
  borderRadius: "4px",
  border: "1px solid #ccc",
};

const buttonStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.6rem",
  borderRadius: "4px",
  border: "none",
  background: "#111827",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 500,
};

const errorStyle: React.CSSProperties = {
  color: "#b91c1c",
  marginTop: "0.5rem",
  fontSize: "0.85rem",
};

export const LoginPage: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user, setUser } = useUser();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      navigate("/groups");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name || !email) {
      setError("Preencha nome e e-mail.");
      return;
    }

    try {
      setLoading(true);
      const created = await createUser(name, email);
      setUser(created);
      navigate("/groups");
    } catch (err: any) {
      setError(err.message || "Erro ao criar usuário.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageContainerStyle}>
      <h1 style={{ marginBottom: "0.75rem" }}>Entrar no Ranking de Estudos</h1>
      <p style={{ marginBottom: "1.25rem", fontSize: "0.9rem", color: "#555" }}>
        Crie seu usuário para participar dos grupos e registrar atividades.
      </p>

      <form onSubmit={handleSubmit}>
        <label style={{ fontSize: "0.85rem", display: "block" }}>Nome</label>
        <input
          style={inputStyle}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Seu nome"
        />

        <label style={{ fontSize: "0.85rem", display: "block" }}>
          E-mail
        </label>
        <input
          style={inputStyle}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          type="email"
        />

        <button style={buttonStyle} type="submit" disabled={loading}>
          {loading ? "Criando usuário..." : "Começar"}
        </button>

        {error && <div style={errorStyle}>{error}</div>}
      </form>
    </div>
  );
};
