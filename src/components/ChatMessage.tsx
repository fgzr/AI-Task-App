import React from "react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Card } from "./ui/card";

interface ChatMessageProps {
  message: string;
  isAi?: boolean;
  timestamp?: string;
  isTyping?: boolean;
}

const ChatMessage = ({
  message = "Hello! How can I help you today?",
  isAi = true,
  timestamp = new Date().toLocaleTimeString(),
  isTyping = false,
}: ChatMessageProps) => {
  return (
    <div className={`flex gap-3 p-4 ${isAi ? "flex-row" : "flex-row-reverse"}`}>
      <Avatar className="w-8 h-8">
        <AvatarFallback
          className={`${isAi ? "bg-zinc-200 text-zinc-800" : "bg-primary text-black"} font-sans text-base font-medium tracking-wider`}
        >
          {isAi ? "AI" : "U"}
        </AvatarFallback>
      </Avatar>

      <Card
        className={`max-w-[80%] p-3 ${isAi ? "bg-secondary" : "bg-primary"}`}
      >
        <div
          className={`text-sm ${isAi ? "text-secondary-foreground" : "text-primary-foreground"}`}
        >
          {isTyping ? (
            <div className="flex items-center gap-1">
              <span className="animate-bounce">.</span>
              <span className="animate-bounce delay-100">.</span>
              <span className="animate-bounce delay-200">.</span>
            </div>
          ) : (
            message
          )}
        </div>
      </Card>
    </div>
  );
};

export default ChatMessage;
