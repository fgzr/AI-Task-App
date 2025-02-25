import React from "react";
import { ScrollArea } from "./ui/scroll-area";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Send } from "lucide-react";
import ChatMessage from "./ChatMessage";

interface ChatPaneProps {
  messages?: Array<{
    id: string;
    message: string;
    isAi: boolean;
    timestamp: string;
  }>;
  onSendMessage?: (message: string) => void;
}

const ChatPane = ({
  messages = [
    {
      id: "1",
      message: "Hello! How can I help you manage your tasks today?",
      isAi: true,
      timestamp: new Date().toLocaleTimeString(),
    },
    {
      id: "2",
      message: "I need to create a new task for tomorrow.",
      isAi: false,
      timestamp: new Date().toLocaleTimeString(),
    },
  ],
  onSendMessage = () => {},
}: ChatPaneProps) => {
  const [inputValue, setInputValue] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue);
      setInputValue("");
    }
  };

  return (
    <Card className="flex flex-col h-full bg-muted/30 rounded-none">
      <ScrollArea className="flex-1 p-4">
        <div>
          <div className="space-y-4">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message.message}
                isAi={message.isAi}
                timestamp={message.timestamp}
              />
            ))}
          </div>
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message..."
            className="flex-1"
          />
          <Button type="submit" size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default ChatPane;
