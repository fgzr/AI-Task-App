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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = inputValue;
    setInputValue("");
    onSendMessage(userMessage);
  };

  return (
    <Card className="flex flex-col h-full bg-muted/30 rounded-none border-0">
      <ScrollArea className="flex-1 p-4 h-[calc(100vh-13rem)]">
        <div>
          <div className="space-y-4">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message.message}
                isAi={message.isAi}
                timestamp={message.timestamp}
                isTyping={message.isTyping}
              />
            ))}
          </div>
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="p-4 border-t mt-auto">
        <div className="flex gap-2">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Type your message..."
            className="flex-1 resize-none overflow-hidden min-h-[40px] max-h-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            style={{ height: "auto" }}
            rows={1}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = `${target.scrollHeight}px`;
            }}
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
