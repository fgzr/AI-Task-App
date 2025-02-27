import React from "react";
import { Checkbox } from "./ui/checkbox";
import { Badge } from "./ui/badge";
import { GripVertical, Star, ChevronRight, Folder } from "lucide-react";
import {
  formatDistanceToNow,
  isToday,
  isTomorrow,
  isYesterday,
} from "date-fns";
import { cn } from "@/lib/utils";

interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

interface TaskItemProps {
  id?: string;
  title?: string;
  completed?: boolean;
  priority?: "low" | "medium" | "high" | undefined;
  projectId?: string;
  dueDate?: Date;
  isStarred?: boolean;
  timeEstimate?: number;
  subtasks?: SubTask[];
  projects?: Array<{ id: string; name: string; color: string }>;
  onToggleStar?: () => void;
  onToggleSubtask?: (subtaskId: string) => void;
  onUpdateSubtasks?: (subtasks: SubTask[]) => void;
  onToggleComplete?: (id: string) => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onClick?: () => void;
}

export const TaskItem = ({
  id = "1",
  title = "Example Task",
  completed = false,
  priority,
  projectId,
  projects = [],
  onToggleComplete = () => {},
  onDragStart = () => {},
  onDragEnd = () => {},
  onClick = () => {},
  dueDate,
  isStarred = false,
  timeEstimate = 0,
  onToggleStar = () => {},
  subtasks = [],
  onToggleSubtask = () => {},
  onUpdateSubtasks = () => {},
}: TaskItemProps) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const priorityColors = {
    low: "bg-green-500",
    medium: "bg-yellow-500",
    high: "bg-red-500",
  };

  const handleCheckboxChange = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleComplete(id);
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        "relative flex items-start gap-3 p-4 bg-secondary/50 border rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer",
        completed && "opacity-60",
      )}
      onClick={(e) => {
        const isControlElement =
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLButtonElement ||
          (e.target instanceof HTMLElement && e.target.closest("button")) ||
          (e.target instanceof HTMLElement &&
            e.target.closest('[role="button"]'));

        if (!isControlElement) {
          onClick();
        }
      }}
    >
      <GripVertical className="h-5 w-5 text-gray-400 cursor-move relative z-10" />
      <div
        onClick={(e) => {
          e.stopPropagation();
          if (subtasks.length > 0) {
            setIsExpanded(!isExpanded);
          }
        }}
        className="cursor-pointer"
      >
        {subtasks.length > 0 && (
          <ChevronRight
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              isExpanded && "transform rotate-90",
            )}
          />
        )}
      </div>
      <div
        onClick={handleCheckboxChange}
        className="h-5 w-5 flex items-center justify-center"
      >
        <Checkbox checked={completed} className="h-5 w-5" />
      </div>
      <div className="flex-1 relative z-0">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2">
            <p
              className={cn(
                "text-sm font-medium",
                completed
                  ? "line-through text-muted-foreground/70"
                  : "text-foreground",
              )}
            >
              {title}
            </p>
            {timeEstimate > 0 && (
              <span className="text-xs text-muted-foreground">
                {timeEstimate} {timeEstimate === 1 ? "hour" : "hours"}
              </span>
            )}
            {subtasks.length > 0 && (
              <div
                className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-red-500 rounded-full"
                title={`${subtasks.length} ${subtasks.length === 1 ? "subtask" : "subtasks"}`}
              >
                {subtasks.length}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <div className="w-[100px]">
              {projectId && (
                <Badge
                  variant="outline"
                  className="text-xs flex items-center gap-1 w-full justify-center"
                >
                  <Folder className="h-3 w-3" />
                  {projects.find((p) => p.id === projectId)?.name || "Unknown"}
                </Badge>
              )}
            </div>
            <div className="w-[20px] flex justify-center">
              {priority && (
                <div
                  className={cn(
                    "w-3 h-3 rounded-full",
                    priorityColors[priority],
                  )}
                  title={`${priority.charAt(0).toUpperCase() + priority.slice(1)} Priority`}
                />
              )}
            </div>
            <div className="w-[80px] flex justify-end">
              <span className="text-xs text-muted-foreground">
                {dueDate
                  ? isToday(dueDate)
                    ? "Today"
                    : isTomorrow(dueDate)
                      ? "Tomorrow"
                      : isYesterday(dueDate)
                        ? "Yesterday"
                        : formatDistanceToNow(dueDate, { addSuffix: true })
                  : ""}
              </span>
            </div>
            <Star
              className={cn(
                "h-4 w-4 cursor-pointer",
                isStarred
                  ? "text-yellow-500 fill-yellow-500"
                  : "text-muted-foreground hover:text-yellow-500",
              )}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleStar();
              }}
            />
          </div>
        </div>
        {subtasks.length > 0 && isExpanded && (
          <div className="mt-4 -ml-8 space-y-3">
            {subtasks.map((subtask) => (
              <div
                key={subtask.id}
                className="flex items-center gap-2 group"
                draggable
                onDragStart={(e) => {
                  e.stopPropagation();
                  e.dataTransfer.setData("subtaskId", subtask.id);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const draggedId = e.dataTransfer.getData("subtaskId");
                  const draggedIndex = subtasks.findIndex(
                    (st) => st.id === draggedId,
                  );
                  const dropIndex = subtasks.findIndex(
                    (st) => st.id === subtask.id,
                  );
                  if (draggedIndex !== -1 && dropIndex !== -1) {
                    const newSubtasks = [...subtasks];
                    const [draggedTask] = newSubtasks.splice(draggedIndex, 1);
                    newSubtasks.splice(dropIndex, 0, draggedTask);
                    onUpdateSubtasks(newSubtasks);
                  }
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-move mr-1" />
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSubtask(subtask.id);
                  }}
                  className="flex items-center justify-center"
                >
                  <Checkbox
                    checked={subtask.completed}
                    className="h-4 w-4 rounded-full data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                  />
                </div>
                <span
                  className={cn(
                    "text-sm font-normal",
                    subtask.completed
                      ? "line-through text-muted-foreground/70"
                      : "text-muted-foreground",
                  )}
                >
                  {subtask.title}
                </span>
              </div>
            ))}
            <div
              className="flex items-center gap-2 group"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-4 mr-1" />
              <Checkbox
                checked={false}
                className="h-4 w-4 rounded-full opacity-50"
                disabled
              />
              <input
                type="text"
                placeholder="Add subtask... (press Enter to add)"
                className="text-sm font-normal text-muted-foreground bg-transparent border-none outline-none w-full"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.currentTarget.value.trim()) {
                    const newSubtask = {
                      id: Math.random().toString(36).substr(2, 9),
                      title: e.currentTarget.value.trim(),
                      completed: false,
                    };
                    const newSubtasks = [...subtasks, newSubtask];
                    onUpdateSubtasks(newSubtasks);
                    e.currentTarget.value = "";
                    e.preventDefault();
                    e.stopPropagation();
                  }
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskItem;
