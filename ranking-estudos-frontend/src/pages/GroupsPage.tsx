import React, { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";
import { getUserGroups, createGroup, joinGroup } from "../api/client";
import type { Group } from "../api/types";
import { useNavigate } from "react-router-dom";
import { Navbar } from "../components/Navbar";

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

export const GroupsPage: React.FC = () => {
  const { user } = useUser();
  const navigate = useNavigate();

  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [groupsError, setGroupsError] = useState<string | null>(null);

  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupGoalDays, setNewGroupGoalDays] = useState("21");
  const [createGroupError, setCreateGroupError] = useState<string | null>(null);
  const [creatingGroup, setCreatingGroup] = useState(false);

  const [joinGroupId, setJoinGroupId] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    const load = async () => {
      try {
        setLoadingGroups(true);
        setGroupsError(null);
        const result = await getUserGroups(user.id);
        setGroups(result);
      } catch (err: any) {
        setGroupsError(err.message || "Erro ao carregar grupos.");
      } finally {
        setLoadingGroups(false);
      }
    };

    load();
  }, [user, navigate]);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setCreateGroupError(null);

    if (!newGroupName) {
      setCreateGroupError("Informe um nome para o grupo.");
      return;
    }

    const parsedGoal = parseInt(newGroupGoalDays, 10);
    if (isNaN(parsedGoal) || parsedGoal <= 0) {
      setCreateGroupError("Meta de dias deve ser um número positivo.");
      return;
    }

    try {
      setCreatingGroup(true);
      const created = await createGroup(newGroupName, user.id, parsedGoal);
      setGroups((prev) => [...prev, created]);
      setNewGroupName("");
      setNewGroupGoalDays("21");
    } catch (err: any) {
      setCreateGroupError(err.message || "Erro ao criar grupo.");
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setJoinError(null);

    if (!joinGroupId) {
      setJoinError("Informe o ID do grupo para entrar.");
      return;
    }

    try {
      setJoining(true);
      await joinGroup(joinGroupId, user.id);
      const updatedGroups = await getUserGroups(user.id);
      setGroups(updatedGroups);
      setJoinGroupId("");
    } catch (err: any) {
      setJoinError(err.message || "Erro ao entrar no grupo.");
    } finally {
      setJoining(false);
    }
  };

  const handleGoToGroup = (groupId: string) => {
    navigate(`/groups/${groupId}`);
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <Navbar />
      <div style={containerStyle}>
        <section style={sectionStyle}>
          <h2 style={{ marginBottom: "0.5rem" }}>Seus grupos</h2>
          {loadingGroups && <p>Carregando grupos...</p>}
          {groupsError && <p style={errorStyle}>{groupsError}</p>}

          {!loadingGroups && !groupsError && groups.length === 0 && (
            <p style={{ fontSize: "0.9rem", color: "#555" }}>
              Você ainda não participa de nenhum grupo. Crie um ou entre em um
              existente abaixo.
            </p>
          )}

          <ul style={{ listStyle: "none", padding: 0, marginTop: "0.75rem" }}>
            {groups.map((group) => (
              <li
                key={group.id}
                style={{
                  padding: "0.6rem 0.4rem",
                  borderBottom: "1px solid #e5e7eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.5rem",
                }}
              >
                <div>
                  <div style={{ fontWeight: 500 }}>{group.name}</div>
                  <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                    Meta: {group.goal_days} dias
                  </div>
                </div>
                <button
                  style={buttonStyle}
                  onClick={() => handleGoToGroup(group.id)}
                >
                  Ver detalhes
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2 style={{ marginBottom: "0.5rem" }}>Criar grupo</h2>
          <form onSubmit={handleCreateGroup}>
            <label style={{ fontSize: "0.85rem" }}>
              Nome do grupo
              <input
                style={inputStyle}
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Ex.: Desafio 21 dias de estudo"
              />
            </label>

            <label style={{ fontSize: "0.85rem" }}>
              Meta de dias do desafio
              <input
                style={inputStyle}
                type="number"
                value={newGroupGoalDays}
                onChange={(e) => setNewGroupGoalDays(e.target.value)}
              />
            </label>

            <button style={buttonStyle} type="submit" disabled={creatingGroup}>
              {creatingGroup ? "Criando..." : "Criar grupo"}
            </button>

            {createGroupError && (
              <div style={errorStyle}>{createGroupError}</div>
            )}
          </form>
        </section>

        <section style={sectionStyle}>
          <h2 style={{ marginBottom: "0.5rem" }}>Entrar em um grupo</h2>
          <form onSubmit={handleJoinGroup}>
            <label style={{ fontSize: "0.85rem" }}>
              ID do grupo
              <input
                style={inputStyle}
                value={joinGroupId}
                onChange={(e) => setJoinGroupId(e.target.value)}
                placeholder="Cole aqui o ID do grupo"
              />
            </label>

            <button style={buttonStyle} type="submit" disabled={joining}>
              {joining ? "Entrando..." : "Entrar"}
            </button>

            {joinError && <div style={errorStyle}>{joinError}</div>}
          </form>
        </section>
      </div>
    </>
  );
};
