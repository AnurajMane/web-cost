import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Send, Bot, User, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import ReactMarkdown from 'react-markdown';

export function AssistantPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadChatHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatHistory = async () => {
    try {
      // Fetch previous chat from backend
      const data = await api.get('/chat/history');
      setMessages(data || []);
    } catch (error) {
      console.error("Failed to load history", error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // Placeholder for the AI response while streaming
    const aiMessageId = Date.now();
    setMessages(prev => [...prev, { role: 'assistant', content: '', id: aiMessageId }]);

    try {
      let fullContent = '';
      
      // Use the stream method from api.js
      await api.stream('/chat/stream', { message: input }, (chunk) => {
        fullContent += chunk;
        
        // Update the last message (AI response) with new chunk
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageId ? { ...msg, content: fullContent } : msg
        ));
      });

    } catch (error) {
      toast({
        title: 'Error generating response',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col animate-fade-in">
      <div className="mb-4">
        <h2 className="text-3xl font-bold tracking-tight">AI Cost Assistant</h2>
        <p className="text-muted-foreground">Ask questions about your AWS spending and optimization</p>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardContent className="flex-1 flex flex-col p-4 overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground opacity-50">
                <Bot className="h-16 w-16 mb-4" />
                <h3 className="text-lg font-semibold">How can I help you today?</h3>
                <p className="max-w-xs">Try asking: "Why is my EC2 bill so high this month?"</p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="bg-muted p-2 rounded-lg h-fit">
                      <Bot className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <div
                    className={`rounded-lg p-3 max-w-[80%] ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/50 border border-border'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <div className="prose prose-sm dark:prose-invert">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed">{message.content}</p>
                    )}
                  </div>
                  {message.role === 'user' && (
                    <div className="bg-primary p-2 rounded-lg h-fit">
                      <User className="h-5 w-5 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))
            )}
            {loading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
               <div className="flex gap-3 justify-start">
                 <div className="bg-muted p-2 rounded-lg h-fit">
                   <Bot className="h-5 w-5 text-primary animate-pulse" />
                 </div>
                 <div className="bg-muted p-3 rounded-lg">
                   <p className="text-sm text-muted-foreground">Thinking...</p>
                 </div>
               </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex gap-2 pt-4 mt-auto">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about AWS cost optimization..."
              disabled={loading}
              className="flex-1"
            />
            <Button onClick={handleSend} disabled={loading || !input.trim()}>
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}