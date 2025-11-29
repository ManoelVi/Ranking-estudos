import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { useUser } from "../context/UserContext";
import {
  getGroupMembers,
  getGroupActivitiesSummary,
  createActivity,
} from "../api/client";
import type { GroupActivitiesSummary } from "../api/types";

const containerStyle: React.CSSProperties = {
  maxWidth: "900px",
  margin: "0 auto",
  padding: "0 1rem 2rem",
};

const sectionStyle: React.CSSProperties = {
  marginBottom: "2rem",
  padding: "1rem",
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
  background: "#fafafa",
};

const inputStyle: React.CSSProperties = {
  padding: "0.5rem",
  borderRadius: "4px",
  border: "1px solid #d1d5db",
  width: "100%",
  marginBottom: "0.5rem",
};

const buttonStyle: React.CSSProperties = {
  padding: "0.45rem 0.9rem",
  borderRadius: "4px",
  border: "none",
  background: "#111827",
  color: "#fff",
  cursor: "pointer",
  fontSize: "0.9rem",
};

const errorStyle: React.CSSProperties = {
  color: "#b91c1c",
  fontSize: "0.85rem",
  marginTop: "0.4rem",
};

interface Member {
  id: string;
  name: string;
  email: string;
}

export const GroupDetailPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const { user } = useUser();
  const navigate = useNavigate();

  const [members, setMembers] = useState<Member[]>([]);
  const [summary, setSummary] = useState<GroupActivitiesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newActivityDescription, setNewActivityDescription] = useState("");
  const [savingActivity, setSavingActivity] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
    if (!groupId) return;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [membersRes, summaryRes] = await Promise.all([
          getGroupMembers(groupId),
          getGroupActivitiesSummary(groupId),
        ]);
        setMembers(membersRes);
        setSummary(summaryRes);
      } catch (err: any) {
        setError(err.message || "Erro ao carregar dados do grupo.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [groupId, user, navigate]);

  const refreshSummary = async () => {
    if (!groupId) return;
    try {
      const summaryRes = await getGroupActivitiesSummary(groupId);
      setSummary(summaryRes);
    } catch (err: any) {
      setError(err.message || "Erro ao atualizar atividades.");
    }
  };

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !groupId) return;

    setActivityError(null);

    if (!newActivityDescription.trim()) {
      setActivityError("Descreva a atividade realizada.");
      return;
    }

    try {
      setSavingActivity(true);
      await createActivity(groupId, user.id, newActivityDescription.trim());
      setNewActivityDescription("");
      await refreshSummary();
    } catch (err: any) {
      setActivityError(err.message || "Erro ao registrar atividade.");
    } finally {
      setSavingActivity(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <Navbar />
      <div style={containerStyle}>
        <button
          onClick={() => navigate("/groups")}
          style={{
            marginBottom: "1rem",
            background: "transparent",
            border: "none",
            color: "#2563eb",
            cursor: "pointer",
            padding: 0,
          }}
        >
          ← Voltar para grupos
        </button>

        <h1 style={{ marginBottom: "0.5rem" }}>Detalhes do grupo</h1>
        <p style={{ marginBottom: "1rem", fontSize: "0.9rem", color: "#555" }}>
          Veja o ranking de atividades, os membros e registre novas atividades
          de estudo.
        </p>

        {loading && <p>Carregando...</p>}
        {error && <p style={errorStyle}>{error}</p>}

        {!loading && !error && (
          <>
            <section style={sectionStyle}>
              <h2 style={{ marginBottom: "0.5rem" }}>Resumo e ranking</h2>
              {summary ? (
                <>
                  <p
                    style={{
                      fontSize: "0.9rem",
                      color: "#374151",
                      marginBottom: "0.75rem",
                    }}
                  >
                    Total de atividades registradas:{" "}
                    <strong>{summary.total_activities}</strong>
                  </p>

                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: "0.9rem",
                    }}
                  >
                    <thead>
                      <tr>
                        <th
                          style={{
                            textAlign: "left",
                            borderBottom: "1px solid #d1d5db",
                            padding: "0.4rem",
                          }}
                        >
                          Posição
                        </th>
                        <th
                          style={{
                            textAlign: "left",
                            borderBottom: "1px solid #d1d5db",
                            padding: "0.4rem",
                          }}
                        >
                          Pessoa
                        </th>
                        <th
                          style={{
                            textAlign: "left",
                            borderBottom: "1px solid #d1d5db",
                            padding: "0.4rem",
                          }}
                        >
                          Atividades
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.per_user
                        .slice()
                        .sort(
                          (a, b) => b.activities_count - a.activities_count
                        )
                        .map((row, index) => (
                          <tr key={row.user_id}>
                            <td
                              style={{
                                padding: "0.4rem",
                                borderBottom: "1px solid #e5e7eb",
                              }}
                            >
                              {index + 1}
                            </td>
                            <td
                              style={{
                                padding: "0.4rem",
                                borderBottom: "1px solid #e5e7eb",
                              }}
                            >
                              {row.user_name}
                              {row.user_id === user.id && " (você)"}
                            </td>
                            <td
                              style={{
                                padding: "0.4rem",
                                borderBottom: "1px solid #e5e7eb",
                              }}
                            >
                              {row.activities_count}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </>
              ) : (
                <p style={{ fontSize: "0.9rem", color: "#6b7280" }}>
                  Nenhuma atividade encontrada ainda.
                </p>
              )}
            </section>

            <section style={sectionStyle}>
              <h2 style={{ marginBottom: "0.5rem" }}>Registrar atividade</h2>
              <form onSubmit={handleCreateActivity}>
                <label style={{ fontSize: "0.85rem" }}>
                  O que você estudou?
                  <textarea
                    style={{ ...inputStyle, minHeight: "80px" }}
                    value={newActivityDescription}
                    onChange={(e) => setNewActivityDescription(e.target.value)}
                    placeholder="Ex.: 30 minutos de Python, capítulo 3 do livro..."
                  />
                </label>
                <button
                  style={buttonStyle}
                  type="submit"
                  disabled={savingActivity}
                >
                  {savingActivity ? "Salvando..." : "Registrar atividade"}
                </button>
                {activityError && (
                  <div style={errorStyle}>{activityError}</div>
                )}
              </form>
            </section>

            <section style={sectionStyle}>
              <h2 style={{ marginBottom: "0.5rem" }}>Membros do grupo</h2>
              {members.length === 0 ? (
                <p style={{ fontSize: "0.9rem", color: "#6b7280" }}>
                  Nenhum membro encontrado.
                </p>
              ) : (
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    fontSize: "0.9rem",
                  }}
                >
                  {members.map((m) => (
                    <li
                      key={m.id}
                      style={{
                        padding: "0.4rem 0",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      <div style={{ fontWeight: 500 }}>{m.name}</div>
                      <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                        {m.email}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section style={sectionStyle}>
              <h2 style={{ marginBottom: "0.5rem" }}>Atividades recentes</h2>
              {summary && summary.activities.length > 0 ? (
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    fontSize: "0.9rem",
                  }}
                >
                  {summary.activities
                    .slice()
                    .sort(
                      (a, b) =>
                        new Date(b.created_at).getTime() -
                        new Date(a.created_at).getTime()
                    )
                    .map((a) => (
                      <li
                        key={a.id}
                        style={{
                          padding: "0.4rem 0",
                          borderBottom: "1px solid #e5e7eb",
                        }}
                      >
                        <div style={{ marginBottom: "0.2rem" }}>
                          <strong>{a.user_name || a.user_id}</strong> registrou:
                        </div>
                        <div style={{ color: "#374151" }}>
                          {a.description}
                        </div>
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "#9ca3af",
                            marginTop: "0.1rem",
                          }}
                        >
                          {new Date(a.created_at).toLocaleString()}
                        </div>
                      </li>
                    ))}
                </ul>
              ) : (
                <p style={{ fontSize: "0.9rem", color: "#6b7280" }}>
                  Ainda não há atividades registradas.
                </p>
              )}
            </section>
          </>
        )}
      </div>
    </>
  );
};
