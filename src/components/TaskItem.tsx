import React from "react";
import { Checkbox } from "./ui/checkbox";
import { Badge } from "./ui/badge";
import { GripVertical, Star, ChevronRight } from "lucide-react";
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
  priority?: "low" | "medium" | "high";
  dueDate?: Date;
  isStarred?: boolean;
  timeEstimate?: number;
  subtasks?: SubTask[];
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
  priority = "medium",
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
    low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    medium:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        "flex items-start gap-3 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer",
        completed && "opacity-60",
      )}
      onClick={(e) => {
        if (
          !(e.target instanceof HTMLInputElement) &&
          !(e.target instanceof HTMLButtonElement)
        ) {
          onClick();
        }
      }}
    >
      <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
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
              "h-4 w-4 text-gray-400 transition-transform",
              isExpanded && "transform rotate-90",
            )}
          />
        )}
      </div>
      <Checkbox
        checked={completed}
        onCheckedChange={() => onToggleComplete?.(id)}
        className="h-5 w-5"
        onClick={(e) => e.stopPropagation()}
      />
      <div className="flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <p
              className={cn(
                "text-sm font-medium",
                completed
                  ? "line-through text-gray-400 dark:text-gray-500"
                  : "text-gray-900 dark:text-gray-100",
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
              <Badge
                variant="secondary"
                className="text-xs bg-muted text-muted-foreground"
              >
                {subtasks.length}{" "}
                {subtasks.length === 1 ? "subtask" : "subtasks"}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className={cn("text-xs", priorityColors[priority])}
            >
              {priority}
            </Badge>
            {dueDate && (
              <span className="text-xs text-muted-foreground">
                {isToday(dueDate)
                  ? "Today"
                  : isTomorrow(dueDate)
                    ? "Tomorrow"
                    : isYesterday(dueDate)
                      ? "Yesterday"
                      : formatDistanceToNow(dueDate, { addSuffix: true })}
              </span>
            )}
            <Star
              className={cn(
                "h-4 w-4 cursor-pointer",
                isStarred
                  ? "text-yellow-400 fill-yellow-400"
                  : "text-gray-400 hover:text-yellow-400",
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
                <GripVertical className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 cursor-move mr-1" />
                <Checkbox
                  checked={subtask.completed}
                  onCheckedChange={() => onToggleSubtask(subtask.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="h-4 w-4 rounded-full data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                />
                <span
                  className={cn(
                    "text-sm font-normal",
                    subtask.completed
                      ? "line-through text-gray-400"
                      : "text-gray-600 dark:text-gray-400",
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
                className="text-sm font-normal text-gray-600 dark:text-gray-400 bg-transparent border-none outline-none w-full"
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
