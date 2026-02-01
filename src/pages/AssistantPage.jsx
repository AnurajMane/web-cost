import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Loader2, Bot, User, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function AssistantPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);
  const { toast } = useToast();

  // Load chat history on mount
  useEffect(() => {
    loadChatHistory();
  }, []);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  const loadChatHistory = async () => {
    try {
      // Updated to fetch from your new backend API layer
      const history = await api.get('/assistant/history');
      setMessages(history || []);
    } catch (error) {
      console.error("Failed to load history:", error);
    }
  };

  const handleSend = async (e) => {
  e.preventDefault();
  if (!input.trim() || isLoading) return;

  const userMessage = { role: 'user', content: input };
  setMessages((prev) => [...prev, userMessage]);
  const currentInput = input; // Capture input before clearing
  setInput('');
  setIsLoading(true);

  try {
      // Calling our new Java Gemini Gateway
      const response = await api.post('/assistant/chat', { message: currentInput });
      
      const botMessage = { 
        role: 'assistant', 
        content: response.answer // This matches the Map.of("answer", text) from Java
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      toast({
        title: "Assistant Error",
        description: "Gemini is currently unreachable. Check your Java API Key.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <div className="bg-primary/10 p-2 rounded-lg">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Cost Intelligence Assistant</h1>
          <p className="text-sm text-muted-foreground">Ask anything about your AWS spending and optimization</p>
        </div>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden border-border shadow-sm">
        <ScrollArea ref={scrollRef} className="flex-1 p-6">
          <div className="space-y-6">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 space-y-8">
                <div className="text-center">
                  <Bot className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-4" />
                  <p className="text-muted-foreground">How can I help you optimize your cloud costs today?</p>
                </div>

                {/* Suggested Prompts Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
                  {[
                    "Explain my AWS Free Tier limits",
                    "How can I reduce S3 storage costs?",
                    "Analyze my current EC2 usage",
                    "Suggest a cleanup policy for MySQL"
                  ].map((prompt) => (
                    <Button
                      key={prompt}
                      variant="outline"
                      className="h-auto py-3 px-4 justify-start text-left font-normal hover:bg-primary/5 hover:border-primary/50 transition-all"
                      onClick={() => handleQuickPrompt(prompt)}
                    >
                      <Sparkles className="h-4 w-4 mr-2 text-primary shrink-0" />
                      <span className="truncate">{prompt}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="h-5 w-5 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted border border-border/50'
                  }`}
                >
                  <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-zinc-900 prose-pre:p-4">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                </div>
                {message.role === 'user' && (
                  <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <User className="h-5 w-5" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-4 justify-start">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 animate-pulse">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div className="bg-muted rounded-2xl px-4 py-3 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground animate-pulse">Gemini is thinking...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t bg-card">
          <form onSubmit={handleSend} className="flex gap-2">
            <Input
              placeholder="Ask about your costs..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !input.trim()}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span className="ml-2 text-primary-foreground">Send</span>
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}