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
  priority: Priority;
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
}

const defaultTask: TaskData = {
  id: "",
  title: "",
  description: "",
  priority: "medium",
  isRecurring: false,
  timeEstimate: 0,
  subtasks: [],
};

export function TaskModal({
  open,
  onOpenChange,
  task = defaultTask,
  onSave,
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
                setTaskData((prev) => ({ ...prev, title: e.target.value }))
              }
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={taskData.description}
              onChange={(e) =>
                setTaskData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
            />
          </div>

          <div className="grid gap-2">
            <Label>Priority</Label>
            <Select
              value={taskData.priority}
              onValueChange={(value: Priority) =>
                setTaskData((prev) => ({ ...prev, priority: value }))
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
            <Label>Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
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
                    setTaskData((prev) => ({ ...prev, dueDate: date }))
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
                  setTaskData((prev) => ({
                    ...prev,
                    timeEstimate: parseFloat(e.target.value) || 0,
                  }))
                }
                min={0}
                step={0.5}
              />
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Switch
                id="recurring"
                checked={taskData.isRecurring}
                onCheckedChange={(checked) =>
                  setTaskData((prev) => ({ ...prev, isRecurring: checked }))
                }
              />
              <Label htmlFor="recurring">Recurring Task</Label>
            </div>

            {taskData.isRecurring && (
              <div className="grid gap-4 pl-4 border-l-2 border-border">
                <div className="grid gap-2">
                  <Label>Frequency</Label>
                  <Select
                    value={taskData.recurringFrequency}
                    onValueChange={(value: RecurringFrequency) =>
                      setTaskData((prev) => ({
                        ...prev,
                        recurringFrequency: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Every Other Week</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Recurring Day</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {taskData.recurringDay ? (
                          format(taskData.recurringDay, "PPP")
                        ) : (
                          <span>Pick a recurring day</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={taskData.recurringDay}
                        onSelect={(date) =>
                          setTaskData((prev) => ({
                            ...prev,
                            recurringDay: date,
                          }))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-2">
            <Label>Subtasks</Label>
            <div className="space-y-2">
              {taskData.subtasks.map((subtask, index) => (
                <div key={subtask.id} className="flex items-center gap-2">
                  <Input
                    value={subtask.title}
                    onChange={(e) => {
                      const newSubtasks = [...taskData.subtasks];
                      newSubtasks[index] = {
                        ...subtask,
                        title: e.target.value,
                      };
                      setTaskData((prev) => ({
                        ...prev,
                        subtasks: newSubtasks,
                      }));
                    }}
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const newSubtasks = taskData.subtasks.filter(
                        (_, i) => i !== index,
                      );
                      setTaskData((prev) => ({
                        ...prev,
                        subtasks: newSubtasks,
                      }));
                    }}
                  >
                    ×
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  const newSubtask = {
                    id: Math.random().toString(36).substr(2, 9),
                    title: "",
                    completed: false,
                  };
                  setTaskData((prev) => ({
                    ...prev,
                    subtasks: [...prev.subtasks, newSubtask],
                  }));
                }}
              >
                Add Subtask
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
