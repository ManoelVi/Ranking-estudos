import type { Group, User, GroupActivitiesSummary } from "./types";


const API_BASE_URL = "http://localhost:3000";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed with status ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function createUser(name: string, email: string): Promise<User> {
  const res = await fetch(`${API_BASE_URL}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email }),
  });
  return handleResponse<User>(res);
}

export async function getUserGroups(userId: string): Promise<Group[]> {
  const res = await fetch(`${API_BASE_URL}/users/${userId}/groups`);
  return handleResponse<Group[]>(res);
}

export async function createGroup(
  name: string,
  ownerId: string,
  goalDays: number
): Promise<Group> {
  const res = await fetch(`${API_BASE_URL}/groups`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, owner_id: ownerId, goal_days: goalDays }),
  });
  return handleResponse<Group>(res);
}

export async function joinGroup(
  groupId: string,
  userId: string
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/groups/${groupId}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Join group failed with status ${res.status}`);
  }
}

export async function getGroupMembers(
  groupId: string
): Promise<{ id: string; name: string; email: string }[]> {
  const res = await fetch(`${API_BASE_URL}/groups/${groupId}/members`);
  return handleResponse<{ id: string; name: string; email: string }[]>(res);
}

export async function getGroupActivitiesSummary(
  groupId: string
): Promise<GroupActivitiesSummary> {
  const res = await fetch(
    `${API_BASE_URL}/groups/${groupId}/activities/summary`
  );
  return handleResponse<GroupActivitiesSummary>(res);
}

export async function createActivity(
  groupId: string,
  userId: string,
  description: string
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/groups/${groupId}/activities`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, description }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Create activity failed with status ${res.status}`);
  }
}
