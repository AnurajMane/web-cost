import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Send, Bot, User } from 'lucide-react';
import { ChatMessage } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import ReactMarkdown from 'react-markdown';

export function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
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
    const { data, error } = await supabase
      .from('chat_history')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(50);

    if (!error && data) {
      setMessages(data);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    const tempUserMsg: ChatMessage = {
      id: crypto.randomUUID(),
      user_id: user!.id,
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);

    // Create a temporary assistant message that will be updated as we stream
    const assistantMsgId = crypto.randomUUID();
    const tempAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      user_id: user!.id,
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempAssistantMsg]);

    try {
      await supabase.from('chat_history').insert([
        {
          role: 'user',
          content: userMessage,
        },
      ]);

      // Use fetch for streaming instead of supabase.functions.invoke
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/ai-cost-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get AI response: ${errorText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      if (!reader) {
        throw new Error('No response body');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        fullResponse += chunk;

        // Update the assistant message in real-time
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId ? { ...msg, content: fullResponse } : msg
          )
        );
      }

      // Save the complete response to chat history
      await supabase.from('chat_history').insert([
        {
          role: 'assistant',
          content: fullResponse,
        },
      ]);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      
      // Remove the empty assistant message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== assistantMsgId));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col animate-fade-in">
      <div className="mb-6">
        <h2 className="text-3xl font-bold tracking-tight">AI Cost Assistant</h2>
        <p className="text-muted-foreground">Get intelligent recommendations to optimize your AWS costs</p>
      </div>

      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Chat with AI Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <Bot className="h-16 w-16 text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Start a conversation</h3>
                  <p className="text-muted-foreground max-w-md">
                    Ask me about AWS cost optimization strategies, identify spending patterns, or get recommendations
                    for reducing your cloud costs.
                  </p>
                </div>
                <div className="grid gap-2 w-full max-w-md">
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => setInput('What are the best ways to reduce EC2 costs?')}
                  >
                    What are the best ways to reduce EC2 costs?
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => setInput('How can I detect cost anomalies?')}
                  >
                    How can I detect cost anomalies?
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => setInput('Explain AWS Reserved Instances vs Savings Plans')}
                  >
                    Explain AWS Reserved Instances vs Savings Plans
                  </Button>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="bg-primary/10 p-2 rounded-lg h-fit">
                      <Bot className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[70%] p-4 rounded-lg ${
                      message.role === 'assistant'
                        ? 'bg-muted text-foreground'
                        : 'bg-gradient-primary text-primary-foreground'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
                            ul: ({ children }) => <ul className="mb-3 ml-4 list-disc space-y-1">{children}</ul>,
                            ol: ({ children }) => <ol className="mb-3 ml-4 list-decimal space-y-1">{children}</ol>,
                            li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                            h1: ({ children }) => <h1 className="text-lg font-bold mb-2 mt-4 first:mt-0">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-base font-bold mb-2 mt-3 first:mt-0">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-sm font-bold mb-2 mt-3 first:mt-0">{children}</h3>,
                            code: ({ children }) => <code className="bg-background/50 px-1.5 py-0.5 rounded text-xs">{children}</code>,
                            pre: ({ children }) => <pre className="bg-background/50 p-3 rounded-lg overflow-x-auto mb-3">{children}</pre>,
                            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                            em: ({ children }) => <em className="italic">{children}</em>,
                            blockquote: ({ children }) => <blockquote className="border-l-4 border-primary/30 pl-3 italic my-2">{children}</blockquote>,
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
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
            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="bg-primary/10 p-2 rounded-lg h-fit">
                  <Bot className="h-5 w-5 text-primary animate-pulse" />
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Thinking...</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about AWS cost optimization..."
              disabled={loading}
            />
            <Button onClick={handleSend} disabled={loading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}