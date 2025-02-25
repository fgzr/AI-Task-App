import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Card } from "./ui/card";

interface ChatMessageProps {
  message: string;
  isAi?: boolean;
  timestamp?: string;
}

const ChatMessage = ({
  message = "Hello! How can I help you today?",
  isAi = true,
  timestamp = new Date().toLocaleTimeString(),
}: ChatMessageProps) => {
  return (
    <div className={`flex gap-3 p-4 ${isAi ? "flex-row" : "flex-row-reverse"}`}>
      <Avatar className="w-8 h-8">
        {isAi ? (
          <AvatarImage
            src="https://api.dicebear.com/7.x/bottts/svg?seed=ai"
            alt="AI Avatar"
          />
        ) : (
          <AvatarImage
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=user"
            alt="User Avatar"
          />
        )}
        <AvatarFallback>{isAi ? "AI" : "You"}</AvatarFallback>
      </Avatar>

      <Card
        className={`max-w-[80%] p-3 ${isAi ? "bg-secondary" : "bg-primary"}`}
      >
        <div
          className={`text-sm ${isAi ? "text-secondary-foreground" : "text-primary-foreground"}`}
        >
          {message}
        </div>
        <div
          className={`text-xs mt-1 ${isAi ? "text-secondary-foreground/70" : "text-primary-foreground/70"}`}
        >
          {timestamp}
        </div>
      </Card>
    </div>
  );
};

export default ChatMessage;
