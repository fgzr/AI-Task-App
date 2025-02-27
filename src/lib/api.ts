import { supabase } from "./supabase";
import { Database } from "@/types/supabase";

type Project = Database["public"]["Tables"]["projects"]["Row"];
type Task = Database["public"]["Tables"]["tasks"]["Row"];
type SubTask = Database["public"]["Tables"]["subtasks"]["Row"];

export async function getProjects() {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function createProject(
  project: Omit<Project, "id" | "created_at" | "user_id">,
) {
  const { data, error } = await supabase
    .from("projects")
    .insert([project])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getTasks() {
  const { data, error } = await supabase
    .from("tasks")
    .select(
      `
      *,
      subtasks (*)
    `,
    )
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function createTask(
  task: Omit<Task, "id" | "created_at" | "user_id">,
) {
  const { data, error } = await supabase
    .from("tasks")
    .insert([task])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTask(id: string, task: Partial<Task>) {
  const { data, error } = await supabase
    .from("tasks")
    .update(task)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createSubtask(
  subtask: Omit<SubTask, "id" | "created_at">,
) {
  const { data, error } = await supabase
    .from("subtasks")
    .insert([subtask])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateSubtask(id: string, subtask: Partial<SubTask>) {
  const { data, error } = await supabase
    .from("subtasks")
    .update(subtask)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
