'use client';

import React, { useState, useRef, useEffect, FormEvent } from 'react';
import { useChat, ChatMessage, ChatParticipant } from '@/hooks/use-chat';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useUser } from '@clerk/nextjs';
import io, { Socket } from 'socket.io-client';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, MessageSquare } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useWebRTC } from '@/hooks/use-webrtc';

interface ChatProps {
  webrtcHook: ReturnType<typeof useWebRTC>;
}

export function Chat({ webrtcHook }: ChatProps) {
  const { messages, isConnected, sendMessage, participants } = useChat(webrtcHook);
  const [inputValue, setInputValue] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'error'>('connecting');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();
  const [autoScroll, setAutoScroll] = useState(true);

  // Update connection status when webrtcHook connection status changes
  useEffect(() => {
    setConnectionStatus(isConnected ? 'connected' : 'connecting');
    
    // Listen for errors from the webrtcHook
    const handleError = (error: Error) => {
      console.error('WebRTC error in Chat component:', error);
      setConnectionError(error.message || 'Connection error');
      setConnectionStatus('error');
    };
    
    // Add error listener
    if (webrtcHook?.webrtcClient) {
      webrtcHook.webrtcClient.on('error', handleError);
      
      // Clean up on unmount
      return () => {
        webrtcHook.webrtcClient?.removeListener('error', handleError);
      };
    }
  }, [isConnected, webrtcHook?.webrtcClient]);

  useEffect(() => {
    // Scroll to the bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Add another effect to monitor messages state
  useEffect(() => {
    console.log('Chat messages updated. Count:', messages.length);
    if (messages.length > 0) {
      console.log('Latest message:', messages[messages.length - 1]);
    }
  }, [messages]);

  // Auto-scroll to the bottom on new messages
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, autoScroll]);

  // Handle scroll events to determine if auto-scroll should be enabled
  const handleScroll = () => {
    if (!scrollRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    // If we're close to the bottom, enable auto-scroll
    const isCloseToBottom = scrollHeight - scrollTop - clientHeight < 100;
    setAutoScroll(isCloseToBottom);
  };

  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !user) return;

    sendMessage(inputValue);
    setInputValue('');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#212121] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-2 border-black overflow-hidden">
      <div className="p-4 border-b-2 border-black flex justify-between items-center bg-[#FFDC58] text-black">
        <h2 className="text-lg font-bold">Chat</h2>
        <Badge variant="outline" className={`${connectionStatus === 'connected' ? 'bg-green-500' : connectionStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500'} text-white border-0`}>
          {connectionStatus === 'connected' ? 'Connected' : connectionStatus === 'error' ? 'Error' : 'Connecting...'}
        </Badge>
      </div>
      
      {connectionStatus === 'error' ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center text-red-500">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>{connectionError || 'Connection error'}</p>
            <Button 
              variant="outline" 
              className="mt-4" 
              onClick={() => {
                window.location.reload();
              }}
            >
              Reload Page
            </Button>
          </div>
        </div>
      ) : connectionStatus === 'connecting' ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#FFDC58] mx-auto mb-2"></div>
            <p>Connecting to chat...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Messages container */}
          <ScrollArea 
            ref={scrollRef} 
            className="p-4 flex-1" 
            onScroll={handleScroll}
          >
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                No messages yet. Start the conversation!
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {messages.map((message) => {
                  const isOwnMessage = message.senderId === user?.id;
                  const sender = participants.find(p => p.id === message.senderId) || {
                    name: message.senderName || 'Unknown',
                    imageUrl: ''
                  };
                  
                  return (
                    <div 
                      key={message.id} 
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex gap-2 max-w-[80%] ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={sender.imageUrl} />
                          <AvatarFallback>
                            {sender.name?.charAt(0).toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div>
                          <div className={`
                            px-3 py-2 rounded-lg 
                            ${isOwnMessage 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted'
                            }
                          `}>
                            <div className="text-xs font-semibold mb-1">
                              {isOwnMessage ? 'You' : sender.name}
                            </div>
                            <div className="break-words">
                              {message.content}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 px-1">
                            {format(new Date(message.timestamp), 'HH:mm')}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
          
          {/* Input form */}
          <form onSubmit={handleSendMessage} className="p-4 border-t-2 border-black dark:border-white">
            <div className="flex gap-2">
              <Textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type a message..."
                className="resize-none border-2 border-black dark:border-white"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                rows={1}
              />
              <Button
                type="submit"
                className="bg-[#FFDC58] text-black border-2 border-black hover:bg-[#f0d050] h-auto"
                variant="default"
                disabled={!inputValue.trim() || !isConnected}
              >
                Send
              </Button>
            </div>
          </form>
        </>
      )}
    </div>
  );
} 