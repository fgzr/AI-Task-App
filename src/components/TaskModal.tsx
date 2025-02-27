import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon, Clock } from "lucide-react";

import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Switch } from "./ui/switch";
import { Textarea } from "./ui/textarea";
import { ProjectSelect } from "./ProjectSelect";

type Priority = "low" | "medium" | "high";
type RecurringFrequency = "daily" | "weekly" | "biweekly" | "monthly";

interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

interface TaskData {
  id: string;
  title: string;
  description?: string;
  priority?: Priority;
  projectId?: string;
  dueDate?: Date;
  isRecurring: boolean;
  recurringFrequency?: RecurringFrequency;
  recurringDay?: Date;
  timeEstimate: number;
  subtasks: SubTask[];
}

interface TaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: TaskData;
  onSave: (task: TaskData) => void;
  onDelete?: (taskId: string) => void;
  projects?: Array<{ id: string; name: string; color: string }>;
}

const defaultTask: TaskData = {
  id: "",
  title: "",
  description: "",
  priority: undefined,
  isRecurring: false,
  timeEstimate: 0,
  subtasks: [],
};

export function TaskModal({
  open,
  onOpenChange,
  task = defaultTask,
  onSave,
  onDelete,
  projects = [],
}: TaskModalProps) {
  const [taskData, setTaskData] = React.useState<TaskData>(task);

  React.useEffect(() => {
    setTaskData(task);
  }, [task]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{task.id ? "Edit Task" : "Create Task"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={taskData.title}
              onChange={(e) =>
                setTaskData({ ...taskData, title: e.target.value })
              }
              placeholder="Task title"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={taskData.description}
              onChange={(e) =>
                setTaskData({ ...taskData, description: e.target.value })
              }
              placeholder="Task description"
            />
          </div>

          <div className="grid gap-2">
            <Label>Priority</Label>
            <Select
              value={taskData.priority || "medium"}
              onValueChange={(value) =>
                setTaskData({ ...taskData, priority: value as Priority })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Project</Label>
            <ProjectSelect
              projects={projects}
              selectedProjectId={taskData.projectId}
              onProjectSelect={(projectId) =>
                setTaskData({ ...taskData, projectId })
              }
            />
          </div>

          <div className="grid gap-2">
            <Label>Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {taskData.dueDate ? (
                    format(taskData.dueDate, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={taskData.dueDate}
                  onSelect={(date) =>
                    setTaskData({ ...taskData, dueDate: date || undefined })
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid gap-2">
            <Label>Time Estimate (hours)</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={taskData.timeEstimate}
                onChange={(e) =>
                  setTaskData({
                    ...taskData,
                    timeEstimate: parseInt(e.target.value) || 0,
                  })
                }
                min="0"
                className="w-20"
              />
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="recurring">Recurring</Label>
              <Switch
                id="recurring"
                checked={taskData.isRecurring}
                onCheckedChange={(checked) =>
                  setTaskData({ ...taskData, isRecurring: checked })
                }
              />
            </div>
            {taskData.isRecurring && (
              <Select
                value={taskData.recurringFrequency}
                onValueChange={(value) =>
                  setTaskData({
                    ...taskData,
                    recurringFrequency: value as RecurringFrequency,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Bi-weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
        <DialogFooter className="flex justify-between">
          <div>
            {task.id && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  if (confirm("Are you sure you want to delete this task?")) {
                    onDelete?.(task.id);
                  }
                }}
              >
                Delete Task
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={() => onOpenChange(false)} variant="outline">
              Cancel
            </Button>
            <Button
              onClick={() => {
                onSave(taskData);
                onOpenChange(false);
              }}
            >
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
