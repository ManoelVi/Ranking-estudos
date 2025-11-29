export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  owner_id: string;
  goal_days: number;
  created_at: string;
}

export interface Activity {
  id: string;
  user_id: string;
  user_name?: string;
  group_id: string;
  description: string;
  created_at: string;
}

export interface PerUserRanking {
  user_id: string;
  user_name: string;
  activities_count: number;
}

export interface GroupActivitiesSummary {
  group_id: string;
  total_activities: number;
  activities: Activity[];
  per_user: PerUserRanking[];
}
