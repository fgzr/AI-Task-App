import * as React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ScrollArea } from "./ui/scroll-area";

interface Project {
  id: string;
  name: string;
  color: string;
}

interface ProjectsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: Project[];
  onProjectsChange: () => void;
}

export function ProjectsDialog({
  open,
  onOpenChange,
  projects,
  onProjectsChange,
}: ProjectsDialogProps) {
  const { user } = useAuth();
  const [selectedProject, setSelectedProject] = React.useState<Project | null>(
    null,
  );
  const [name, setName] = React.useState("");
  const [color, setColor] = React.useState("#4f46e5");

  React.useEffect(() => {
    if (selectedProject) {
      setName(selectedProject.name);
      setColor(selectedProject.color);
    } else {
      setName("");
      setColor("#4f46e5");
    }
  }, [selectedProject]);

  const handleSave = async () => {
    if (!user) return;

    try {
      if (selectedProject?.id) {
        await supabase
          .from("projects")
          .update({ name, color })
          .eq("id", selectedProject.id)
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
      setSelectedProject(null);
      setName("");
      setColor("#4f46e5");
    } catch (error) {
      console.error("Error saving project:", error);
    }
  };

  const handleDelete = async () => {
    if (!selectedProject?.id || !user) return;

    try {
      await supabase
        .from("projects")
        .delete()
        .eq("id", selectedProject.id)
        .eq("user_id", user.id);
      onProjectsChange();
      setSelectedProject(null);
      setName("");
      setColor("#4f46e5");
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Manage Projects</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="font-medium">Projects</div>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {projects.map((project) => (
                  <Button
                    key={project.id}
                    variant={
                      selectedProject?.id === project.id ? "secondary" : "ghost"
                    }
                    className="w-full justify-start gap-2"
                    onClick={() => setSelectedProject(project)}
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: project.color }}
                    />
                    {project.name}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => setSelectedProject(null)}
                >
                  + New Project
                </Button>
              </div>
            </ScrollArea>
          </div>
          <div className="space-y-4 border-l pl-6">
            <div className="font-medium">
              {selectedProject ? "Edit Project" : "New Project"}
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Project name"
                />
              </div>
              <div className="space-y-2">
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
              <div className="flex justify-between pt-4">
                {selectedProject && (
                  <Button variant="destructive" onClick={handleDelete}>
                    Delete Project
                  </Button>
                )}
                <Button className="ml-auto" onClick={handleSave}>
                  {selectedProject ? "Save Changes" : "Create Project"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
