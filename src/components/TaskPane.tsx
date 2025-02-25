import React, { useState } from "react";
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
import { Plus, Search } from "lucide-react";
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
}

interface TaskPaneProps {
  tasks?: Task[];
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
  onTaskToggle = () => {},
  onTaskReorder = () => {},
  onToggleStar = () => {},
  onTasksUpdate = () => {},
}: TaskPaneProps) => {
  const [draggedTask, setDraggedTask] = useState<number | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [dragOverSection, setDragOverSection] = useState<string | null>(null);

  const handleDragStart = (index: number) => (e: React.DragEvent) => {
    setDraggedTask(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverSection(null);
  };

  const renderTaskItem = (task: Task, globalIndex: number) => (
    <div
      key={`task-${task.id}-${globalIndex}`}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (draggedTask !== null && draggedTask !== globalIndex) {
          const rect = e.currentTarget.getBoundingClientRect();
          const midpoint = rect.top + rect.height / 2;
          const newIndex = e.clientY < midpoint ? globalIndex : globalIndex + 1;
          if (!dragOverSection) {
            onTaskReorder(draggedTask, newIndex);
            setDraggedTask(newIndex);
          }
        }
      }}
      className="group"
    >
      <TaskItem
        {...task}
        onToggleComplete={() => onTaskToggle(task.id)}
        onToggleStar={() => onToggleStar(task.id)}
        onToggleSubtask={(subtaskId) => {
          const updatedTasks = [...tasks];
          const taskIndex = updatedTasks.findIndex((t) => t.id === task.id);
          if (taskIndex !== -1) {
            const updatedSubtasks = task.subtasks.map((st) =>
              st.id === subtaskId ? { ...st, completed: !st.completed } : st,
            );
            updatedTasks[taskIndex] = { ...task, subtasks: updatedSubtasks };
            onTasksUpdate(updatedTasks);
          }
        }}
        onUpdateSubtasks={(newSubtasks) => {
          const updatedTasks = [...tasks];
          const taskIndex = updatedTasks.findIndex((t) => t.id === task.id);
          if (taskIndex !== -1) {
            updatedTasks[taskIndex] = { ...task, subtasks: newSubtasks };
            onTasksUpdate(updatedTasks);
          }
        }}
        onDragStart={handleDragStart(globalIndex)}
        onDragEnd={handleDragEnd}
        onClick={() => {
          setSelectedTask(task);
          setIsModalOpen(true);
        }}
      />
    </div>
  );

  const filterTasks = (task: Task) => {
    const matchesSearch = task.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesPriority =
      priorityFilter === "all" || task.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  };

  const renderSection = (
    title: string,
    filterFn: (t: Task) => boolean,
    sortFn?: (a: Task, b: Task) => number,
  ) => {
    const filteredTasks = tasks.filter((t) => filterFn(t) && filterTasks(t));
    if (filteredTasks.length === 0) return null;

    const tasksToRender = sortFn
      ? [...filteredTasks].sort(sortFn)
      : [...filteredTasks];

    return (
      <div
        className={`space-y-2 p-4 m-1 rounded-lg transition-colors ${dragOverSection === title ? "bg-muted/50 ring-2 ring-primary/20" : ""}`}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (draggedTask !== null) {
            setDragOverSection(title);
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (draggedTask !== null) {
            setDragOverSection(title);
          }
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX;
          const y = e.clientY;

          if (
            x < rect.left ||
            x >= rect.right ||
            y < rect.top ||
            y >= rect.bottom
          ) {
            setDragOverSection(null);
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (draggedTask !== null) {
            const sectionTasks = tasks.filter(filterFn);
            const targetIndex =
              sectionTasks.length > 0
                ? tasks.indexOf(sectionTasks[0])
                : tasks.length;
            onTaskReorder(draggedTask, targetIndex, title);
            setDraggedTask(null);
            setDragOverSection(null);
          }
        }}
      >
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          <span>{title}</span>
          <div className="h-px flex-1 bg-border" />
        </div>
        <div className="space-y-4 mt-2">
          {tasksToRender.map((task) =>
            renderTaskItem(
              task,
              tasks.findIndex((t) => t.id === task.id),
            ),
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className="h-full bg-background rounded-none">
      <div className="p-4 border-b">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Input
              placeholder="Search tasks..."
              className="w-full pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[calc(100%-5rem)] p-3">
        <div className="space-y-8 max-w-[700px] mx-auto">
          {renderSection("Starred Tasks", (t) => !t.completed && t.isStarred)}

          {renderSection(
            "Due Today & Overdue",
            (t) =>
              !t.completed &&
              !t.isStarred &&
              t.dueDate &&
              new Date(t.dueDate).setHours(23, 59, 59, 999) <=
                new Date().setHours(23, 59, 59, 999),
            (a, b) => (a.dueDate?.getTime() || 0) - (b.dueDate?.getTime() || 0),
          )}

          {renderSection(
            "Due Tomorrow",
            (t) =>
              !t.completed &&
              !t.isStarred &&
              t.dueDate &&
              new Date(t.dueDate).toDateString() ===
                new Date(Date.now() + 86400000).toDateString(),
          )}

          {renderSection(
            "Due This Week",
            (t) =>
              !t.completed &&
              !t.isStarred &&
              t.dueDate &&
              new Date(t.dueDate) > new Date(Date.now() + 86400000) &&
              new Date(t.dueDate) <= new Date(Date.now() + 86400000 * 7),
            (a, b) => (a.dueDate?.getTime() || 0) - (b.dueDate?.getTime() || 0),
          )}

          {renderSection(
            "Due Next Week",
            (t) =>
              !t.completed &&
              !t.isStarred &&
              t.dueDate &&
              new Date(t.dueDate) > new Date(Date.now() + 86400000 * 7) &&
              new Date(t.dueDate) <= new Date(Date.now() + 86400000 * 14),
            (a, b) => (a.dueDate?.getTime() || 0) - (b.dueDate?.getTime() || 0),
          )}

          {renderSection(
            "Future Tasks",
            (t) =>
              !t.completed &&
              !t.isStarred &&
              t.dueDate &&
              new Date(t.dueDate) > new Date(Date.now() + 86400000 * 14),
            (a, b) => (a.dueDate?.getTime() || 0) - (b.dueDate?.getTime() || 0),
          )}

          {renderSection(
            "No Due Date",
            (t) => !t.completed && !t.isStarred && !t.dueDate,
          )}

          {renderSection(
            "Completed",
            (t) => t.completed,
            (a, b) => (b.completedAt || 0) - (a.completedAt || 0),
          )}
        </div>
      </ScrollArea>

      <TaskModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        task={selectedTask || undefined}
        onSave={(updatedTask) => {
          console.log("Task saved:", updatedTask);
          setSelectedTask(null);
        }}
      />
    </Card>
  );
};

export default TaskPane;
