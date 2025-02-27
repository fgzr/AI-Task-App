import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext.jsx";
import { supabase } from "@/lib/supabase";
import { ScrollArea } from "./ui/scroll-area";
import { Card } from "./ui/card";
import TaskItem from "./TaskItem";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Plus, Search, Folder, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import { ProjectSelect } from "./ProjectSelect";
import { ProjectDialog } from "./ProjectDialog";
import { ProjectsDialog } from "./ProjectsDialog";
import { TaskModal } from "./TaskModal";

interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

interface Task {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: number;
  priority: "low" | "medium" | "high";
  dueDate?: Date;
  isStarred?: boolean;
  subtasks: SubTask[];
  timeEstimate?: number;
  projectId?: string;
}

interface TaskPaneProps {
  tasks?: Task[];
  projects?: Array<{ id: string; name: string; color: string }>;
  onTaskToggle?: (id: string) => void;
  onTaskReorder?: (
    sourceIndex: number,
    targetIndex: number,
    targetSection?: string,
  ) => void;
  onToggleStar?: (id: string) => void;
  onTasksUpdate?: (tasks: Task[]) => void;
}

export const TaskPane = ({
  tasks = [],
  projects = [],
  onTaskToggle = () => {},
  onTaskReorder = () => {},
  onToggleStar = () => {},
  onTasksUpdate = () => {},
}: TaskPaneProps) => {
  const [draggedTask, setDraggedTask] = useState<number | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [isProjectsDialogOpen, setIsProjectsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("none");
  const [dragOverSection, setDragOverSection] = useState<string | null>(null);
  const { user } = useAuth();

  const loadTasks = React.useCallback(async () => {
    if (!user) return;

    try {
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select(`*, subtasks (*)`)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (tasksError) throw tasksError;

      if (tasksData) {
        const transformedTasks = tasksData.map((task) => ({
          id: task.id,
          title: task.title,
          completed: task.completed || false,
          completedAt: task.completed_at
            ? new Date(task.completed_at).getTime()
            : undefined,
          priority: task.priority || "medium",
          dueDate: task.due_date ? new Date(task.due_date) : undefined,
          isStarred: task.is_starred || false,
          projectId: task.project_id,
          timeEstimate: task.time_estimate,
          subtasks:
            task.subtasks?.map((subtask) => ({
              id: subtask.id,
              title: subtask.title,
              completed: subtask.completed || false,
            })) || [],
        }));

        setTasks(transformedTasks);
      }
    } catch (error) {
      console.error("Error loading tasks:", error);
    }
  }, [user]);

  // ... rest of your component code ...

  const handleTaskSave = async (updatedTask: any) => {
    try {
      if (!user) return;

      if (updatedTask.id) {
        // Update existing task
        await supabase
          .from("tasks")
          .update({
            title: updatedTask.title,
            description: updatedTask.description,
            priority: updatedTask.priority,
            project_id: updatedTask.projectId,
            due_date: updatedTask.dueDate?.toISOString(),
            time_estimate: updatedTask.timeEstimate,
          })
          .eq("id", updatedTask.id)
          .eq("user_id", user.id);

        // Update subtasks
        if (updatedTask.subtasks) {
          // Delete existing subtasks
          await supabase
            .from("subtasks")
            .delete()
            .eq("task_id", updatedTask.id);

          // Insert new subtasks
          if (updatedTask.subtasks.length > 0) {
            await supabase.from("subtasks").insert(
              updatedTask.subtasks.map((subtask: any, index: number) => ({
                title: subtask.title,
                completed: subtask.completed,
                task_id: updatedTask.id,
                position: index,
              })),
            );
          }
        }
      } else {
        // Create new task
        const { data: newTask } = await supabase
          .from("tasks")
          .insert([
            {
              title: updatedTask.title,
              description: updatedTask.description,
              priority: updatedTask.priority,
              project_id: updatedTask.projectId,
              due_date: updatedTask.dueDate?.toISOString(),
              time_estimate: updatedTask.timeEstimate,
              user_id: user.id,
            },
          ])
          .select()
          .single();

        // Create subtasks if any
        if (updatedTask.subtasks?.length && newTask) {
          await supabase.from("subtasks").insert(
            updatedTask.subtasks.map((subtask: any, index: number) => ({
              title: subtask.title,
              task_id: newTask.id,
              position: index,
            })),
          );
        }
      }

      await loadTasks();
    } catch (error) {
      console.error("Error saving task:", error);
    }
  };

  return (
    <Card className="h-full bg-gradient-to-b from-zinc-100 to-zinc-50 dark:from-zinc-900 dark:to-zinc-800 rounded-none border-0">
      <div className="p-4 border-b border-border/40">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => {
              setSelectedTask(null);
              setIsModalOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" /> New Task
          </Button>

          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">High Priority</SelectItem>
              <SelectItem value="medium">Medium Priority</SelectItem>
              <SelectItem value="low">Low Priority</SelectItem>
            </SelectContent>
          </Select>

          <ProjectSelect
            projects={projects}
            selectedProjectId={projectFilter}
            onProjectSelect={setProjectFilter}
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => setIsProjectDialogOpen(true)}
                className="cursor-pointer"
              >
                New Project
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setIsProjectsDialogOpen(true)}
                className="cursor-pointer"
              >
                Manage Projects
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4 h-[calc(100vh-13rem)]">
        <div className="space-y-4">
          {tasks
            .filter((task) => {
              if (searchQuery) {
                return task.title
                  .toLowerCase()
                  .includes(searchQuery.toLowerCase());
              }
              if (priorityFilter !== "all") {
                return task.priority === priorityFilter;
              }
              if (projectFilter !== "none") {
                return task.projectId === projectFilter;
              }
              return true;
            })
            .map((task, index) => (
              <TaskItem
                key={task.id}
                {...task}
                projects={projects}
                onToggleComplete={() => onTaskToggle(task.id)}
                onDragStart={(e) => {
                  setDraggedTask(index);
                  e.dataTransfer.setData("text/plain", "");
                }}
                onDragEnd={() => {
                  setDraggedTask(null);
                  setDragOverSection(null);
                }}
                onClick={() => {
                  setSelectedTask(task);
                  setIsModalOpen(true);
                }}
                onToggleStar={() => onToggleStar(task.id)}
              />
            ))}
        </div>
      </ScrollArea>

      <ProjectDialog
        open={isProjectDialogOpen}
        onOpenChange={setIsProjectDialogOpen}
        onProjectsChange={loadTasks}
      />

      <ProjectsDialog
        open={isProjectsDialogOpen}
        onOpenChange={setIsProjectsDialogOpen}
        projects={projects}
        onProjectsChange={loadTasks}
      />

      <TaskModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        task={selectedTask || undefined}
        projects={projects}
        onSave={async (updatedTask) => {
          try {
            await handleTaskSave(updatedTask);
            setSelectedTask(null);
          } catch (error) {
            console.error("Error in onSave:", error);
          }
        }}
        onDelete={async (taskId) => {
          try {
            await supabase
              .from("tasks")
              .delete()
              .eq("id", taskId)
              .eq("user_id", user.id);
            await loadTasks();
            setIsModalOpen(false);
            setSelectedTask(null);
          } catch (error) {
            console.error("Error deleting task:", error);
          }
        }}
      />
    </Card>
  );
};

export default TaskPane;
