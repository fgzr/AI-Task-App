import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Bell } from "lucide-react";
import { Button } from "./ui/button";

const notifications = [
  {
    id: "1",
    title: "🎉 Welcome to TaskAI Beta!",
    description: "Get started by creating your first task.",
  },
  {
    id: "2",
    title: "✨ New Features",
    description: "Keyboard shortcuts and notifications are now available.",
  },
  {
    id: "3",
    title: "🗺️ Roadmap",
    description: "Coming soon: Task templates and recurring tasks.",
  },
];

export function NotificationsDropdown() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[380px]">
        {notifications.map((notification) => (
          <DropdownMenuItem
            key={notification.id}
            className="flex flex-col items-start py-3 cursor-pointer"
          >
            <div className="font-medium text-sm">{notification.title}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {notification.description}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
