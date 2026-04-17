"use client"

import { useState, useRef, useEffect } from 'react'
import { Send, MessageSquare, User } from 'lucide-react'

type Message = {
  id: string
  sender: string
  text: string
  timestamp: Date
  isCurrentUser: boolean
}

export function TeamChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'Alex Johnson',
      text: 'Hey team, how is everyone doing with the problems?',
      timestamp: new Date(Date.now() - 3600000),
      isCurrentUser: false
    },
    {
      id: '2',
      sender: 'Taylor Swift',
      text: 'Going well! Just finished problem #3',
      timestamp: new Date(Date.now() - 1800000),
      isCurrentUser: false
    },
    {
      id: '3',
      sender: 'You',
      text: 'Working on the last one now',
      timestamp: new Date(Date.now() - 600000),
      isCurrentUser: true
    }
  ])

  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    const message: Message = {
      id: Date.now().toString(),
      sender: 'You',
      text: newMessage,
      timestamp: new Date(),
      isCurrentUser: true
    }

    setMessages([...messages, message])
    setNewMessage('')
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden shadow-lg mt-6">
      <div className="px-4 py-2 border-b border-border bg-secondary/30">
        <h3 className="text-[1.05rem] font-semibold text-foreground flex items-center gap-2.5 pt-4">
          <MessageSquare className="w-4.5 h-4.5 text-blue-500" />
          Team Chat
        </h3>
      </div>
      
      <div className="h-64 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`flex ${message.isCurrentUser ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-xs md:max-w-md rounded-lg px-4 py-2 ${
                message.isCurrentUser 
                  ? 'bg-primary text-primary-foreground rounded-tr-none' 
                  : 'bg-secondary text-foreground rounded-tl-none'
              }`}
            >
              {!message.isCurrentUser && (
                <div className="font-medium text-xs text-muted-foreground">
                  {message.sender}
                </div>
              )}
              <p className="text-sm">{message.text}</p>
              <div className="text-xs text-right mt-1 opacity-70">
                {formatTime(message.timestamp)}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-3 border-t border-border flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-background border border-border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <button
          type="submit"
          className="p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          disabled={!newMessage.trim()}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  )
}
