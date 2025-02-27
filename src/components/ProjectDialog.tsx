import * as React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface Project {
  id: string;
  name: string;
  color: string;
}

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project;
  onProjectsChange: () => void;
}

export function ProjectDialog({
  open,
  onOpenChange,
  project,
  onProjectsChange,
}: ProjectDialogProps) {
  const { user } = useAuth();
  const [name, setName] = React.useState(project?.name || "");
  const [color, setColor] = React.useState(project?.color || "#4f46e5");

  React.useEffect(() => {
    if (project) {
      setName(project.name);
      setColor(project.color);
    } else {
      setName("");
      setColor("#4f46e5");
    }
  }, [project]);

  const handleSave = async () => {
    if (!user) return;

    try {
      if (project?.id) {
        await supabase
          .from("projects")
          .update({ name, color })
          .eq("id", project.id)
          .eq("user_id", user.id);
      } else {
        await supabase.from("projects").insert([
          {
            name,
            color,
            user_id: user.id,
          },
        ]);
      }
      onProjectsChange();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving project:", error);
    }
  };

  const handleDelete = async () => {
    if (!project?.id || !user) return;

    try {
      await supabase
        .from("projects")
        .delete()
        .eq("id", project.id)
        .eq("user_id", user.id);
      onProjectsChange();
      onOpenChange(false);
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {project ? "Edit Project" : "Create Project"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="color">Color</Label>
            <div className="flex gap-2">
              <Input
                id="color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-12 h-12 p-1"
              />
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#000000"
                className="flex-1"
              />
            </div>
          </div>
        </div>
        <DialogFooter className="flex justify-between">
          <div>
            {project && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
              >
                Delete Project
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleSave}>
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
