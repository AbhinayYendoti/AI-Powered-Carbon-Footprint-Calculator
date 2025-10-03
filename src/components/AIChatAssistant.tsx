import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Send, 
  Bot, 
  User, 
  MessageCircle, 
  X, 
  Minimize2,
  Maximize2,
  Sparkles,
  Lightbulb,
  TrendingDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { geminiService, type CarbonFootprintData } from "@/services/geminiService";
import { carbonService } from "@/services/carbonService";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  type?: 'info' | 'suggestion' | 'question';
}

interface AIChatAssistantProps {
  onSuggestion?: (suggestion: string) => void;
  context?: any;
  carbonData?: CarbonFootprintData;
}

const QUICK_QUESTIONS = [
  "What is carbon footprint?",
  "How can I reduce my emissions?",
  "Explain my results",
  "Give me personalized tips",
  "What's my biggest impact area?",
  "How do I compare to others?"
];

export const AIChatAssistant = ({ onSuggestion, context, carbonData }: AIChatAssistantProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: carbonData 
        ? `Hi! I've analyzed your carbon footprint of ${carbonData.total} kg CO2/year. I'm here to help you understand your results and find personalized ways to reduce your environmental impact. What would you like to know?`
        : "Hi! I'm your Carbon Wise AI assistant powered by Google Gemini. I can help you understand carbon footprints and find ways to reduce environmental impact. What would you like to know?",
      sender: 'bot',
      timestamp: new Date(),
      type: 'info'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    // Smooth scroll via sentinel element
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    // Fallback: force scroll container to bottom
    const el = scrollAreaRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  };

  useEffect(() => {
    // Delay to allow DOM paint before scrolling
    const id = requestAnimationFrame(scrollToBottom);
    return () => cancelAnimationFrame(id);
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    requestAnimationFrame(scrollToBottom);
    setInputValue('');
    setIsLoading(true);

    try {
      let response: string;

      const useGemini = geminiService.isReady();

      if (useGemini) {
        // Use specific methods based on the message content
        if (text.toLowerCase().includes('recommend') || text.toLowerCase().includes('tips') || text.toLowerCase().includes('advice')) {
          if (carbonData) {
            response = await geminiService.getPersonalizedRecommendations(carbonData);
          } else {
            response = await geminiService.sendChatMessage(text);
          }
        } else if (text.toLowerCase().includes('explain') && carbonData) {
          // Extract category if mentioned
          const categories = ['transport', 'home', 'diet', 'shopping'];
          const mentionedCategory = categories.find(cat => text.toLowerCase().includes(cat));
          
          if (mentionedCategory) {
            response = await geminiService.explainCarbonImpact(
              mentionedCategory, 
              carbonData.breakdown[mentionedCategory as keyof typeof carbonData.breakdown], 
              carbonData
            );
          } else {
            response = await geminiService.getCarbonFootprintAdvice(carbonData, text);
          }
        } else {
          // General chat with carbon context if available
          response = await geminiService.sendChatMessage(text, carbonData);
        }
      } else {
        // Backend proxy fallback when Gemini isn't configured
        response = await carbonService.sendChatMessage(text, carbonData);
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'bot',
        timestamp: new Date(),
        type: 'info'
      };

      setMessages(prev => [...prev, botMessage]);
      requestAnimationFrame(scrollToBottom);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I'm having trouble connecting to my AI brain right now. Please try again in a moment!",
        sender: 'bot',
        timestamp: new Date(),
        type: 'info'
      };

      setMessages(prev => [...prev, errorMessage]);
      requestAnimationFrame(scrollToBottom);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    sendMessage(question);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading) sendMessage(inputValue);
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={toggleChat}
              size="lg"
              className="rounded-full h-16 w-16 shadow-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              <MessageCircle className="h-8 w-8" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50 w-96 max-w-[95vw] h-[520px] md:h-[560px]"
          >
            <Card className="h-full shadow-2xl border-0 flex flex-col">
              <CardHeader className="pb-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/bot-avatar.png" />
                      <AvatarFallback className="bg-white/20">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        Carbon Wise AI
                        <Sparkles className="h-4 w-4" />
                      </CardTitle>
                      <div className="text-xs opacity-90">Powered by Google Gemini</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleMinimize}
                      className="text-white hover:bg-white/20"
                    >
                      {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleChat}
                      className="text-white hover:bg-white/20"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <AnimatePresence>
                {!isMinimized && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="flex flex-col h-full"
                  >
                    <CardContent className="flex-1 p-0 flex flex-col min-h-0">
                      {/* Messages */}
                      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                        <div className="space-y-4">
                          {messages.map((message) => (
                            <motion.div
                              key={message.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`flex gap-3 ${
                                message.sender === 'user' ? 'justify-end' : 'justify-start'
                              }`}
                            >
                              {message.sender === 'bot' && (
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src="/bot-avatar.png" />
                                  <AvatarFallback className="bg-green-100">
                                    <Bot className="h-4 w-4 text-green-600" />
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              
                              <div
                                className={`max-w-[80%] rounded-lg p-3 ${
                                  message.sender === 'user'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted'
                                }`}
                              >
                                <div className="text-sm">{message.text}</div>
                                <div className="text-xs opacity-70 mt-1">
                                  {message.timestamp.toLocaleTimeString([], { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </div>
                              </div>

                              {message.sender === 'user' && (
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="bg-primary">
                                    <User className="h-4 w-4 text-primary-foreground" />
                                  </AvatarFallback>
                                </Avatar>
                              )}
                            </motion.div>
                          ))}
                          
                          {isLoading && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="flex gap-3 justify-start"
                            >
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-green-100">
                                  <Bot className="h-4 w-4 text-green-600" />
                                </AvatarFallback>
                              </Avatar>
                              <div className="bg-muted rounded-lg p-3">
                                <div className="flex space-x-1">
                                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                          
                          <div ref={messagesEndRef} />
                        </div>
                      </ScrollArea>

                      {/* Quick Questions and Smart Actions */}
                      {messages.length === 1 && (
                        <div className="p-4 border-t">
                          {carbonData ? (
                            <>
                              <div className="text-xs text-muted-foreground mb-2">Smart actions for your footprint:</div>
                              <div className="flex flex-wrap gap-2 mb-3">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleQuickQuestion("Give me personalized tips")}
                                  className="text-xs h-auto py-1 px-2 flex items-center gap-1"
                                >
                                  <Lightbulb className="h-3 w-3" />
                                  Get Smart Tips
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleQuickQuestion("What's my biggest impact area?")}
                                  className="text-xs h-auto py-1 px-2 flex items-center gap-1"
                                >
                                  <TrendingDown className="h-3 w-3" />
                                  Biggest Impact
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleQuickQuestion("Explain my results")}
                                  className="text-xs h-auto py-1 px-2"
                                >
                                  Explain Results
                                </Button>
                              </div>
                            </>
                          ) : null}
                          <div className="text-xs text-muted-foreground mb-2">Quick questions:</div>
                          <div className="flex flex-wrap gap-2">
                            {QUICK_QUESTIONS.slice(carbonData ? 3 : 0).map((question, index) => (
                              <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                onClick={() => handleQuickQuestion(question)}
                                className="text-xs h-auto py-1 px-2"
                              >
                                {question}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Input */}
                      <div className="p-4 border-t">
                        <div className="flex gap-2">
                          <Input
                            ref={inputRef}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask me about carbon footprints..."
                            disabled={isLoading}
                            className="flex-1"
                          />
                          <Button
                            onClick={() => !isLoading && sendMessage(inputValue)}
                            disabled={isLoading || !inputValue.trim()}
                            size="icon"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}; 