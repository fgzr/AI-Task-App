import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Folder } from "lucide-react";

export interface Project {
  id: string;
  name: string;
  color: string;
}

interface ProjectSelectProps {
  projects: Project[];
  selectedProjectId?: string;
  onProjectSelect: (projectId: string) => void;
}

export function ProjectSelect({
  projects = [],
  selectedProjectId,
  onProjectSelect,
}: ProjectSelectProps) {
  return (
    <Select value={selectedProjectId} onValueChange={onProjectSelect}>
      <SelectTrigger className="w-[180px]">
        <div className="flex items-center gap-2">
          <Folder className="h-4 w-4" />
          <SelectValue placeholder="Select Project" />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">No Project</SelectItem>
        {projects.map((project) => (
          <SelectItem key={project.id} value={project.id}>
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: project.color }}
              />
              {project.name}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
