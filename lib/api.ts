import type {
  WorkoutDayDto,
  ExerciseSummaryDto,
  PreviousWorkoutDto,
  AnalyticsPointDto,
  WorkoutExerciseDto,
} from "@/lib/types";
import type { SetInput } from "@/lib/validation";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ? JSON.stringify(body.error) : `Request failed: ${res.status}`);
  }
  return res.json();
}

export const jsonFetcher = <T,>(url: string) => request<T>(url);

export function fetchWorkoutDay(date: string) {
  return request<WorkoutDayDto>(`/api/workout?date=${date}`);
}

export function searchExercises(q: string) {
  return request<ExerciseSummaryDto[]>(`/api/exercises?q=${encodeURIComponent(q)}`);
}

export function fetchPreviousWorkout(name: string, beforeDate: string, excludeId?: string) {
  const params = new URLSearchParams({ name, beforeDate });
  if (excludeId) params.set("excludeId", excludeId);
  return request<PreviousWorkoutDto | null>(`/api/exercises/previous?${params.toString()}`);
}

export function createWorkoutExercise(input: { date: string; exerciseName: string; sets: SetInput[] }) {
  return request<WorkoutExerciseDto>("/api/workout-exercises", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateWorkoutExercise(
  id: string,
  input: { exerciseName?: string; sets: SetInput[] }
) {
  return request<WorkoutExerciseDto>(`/api/workout-exercises/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteWorkoutExercise(id: string) {
  return request<{ ok: true }>(`/api/workout-exercises/${id}`, { method: "DELETE" });
}

export function fetchContributions(from: string, to: string) {
  return request<string[]>(`/api/contributions?from=${from}&to=${to}`);
}

export function fetchAnalyticsExercises() {
  return request<ExerciseSummaryDto[]>("/api/analytics/exercises");
}

export function fetchAnalyticsData(exerciseId: string) {
  return request<AnalyticsPointDto[]>(`/api/analytics/data?exerciseId=${exerciseId}`);
}
