"use client";

import { useState, useCallback, useMemo } from "react";

export interface ReplyRef {
  id: number;
  user: string;
  text: string;
}

export interface Message {
  id: number;
  user: string;
  text: string;
  time: string;
  reactions: Record<string, Set<string>>;
  replyTo?: ReplyRef;
}

export const REACTION_EMOJIS = ["👍", "❤️", "😂", "🔥", "🏆", "💪"];

const INITIAL_MESSAGES: Message[] = [
  { id: 1, user: "alex",   text: "anyone up for 1v1?", time: "2m", reactions: { "👍": new Set(["sarah"]) } },
  { id: 2, user: "sarah",  text: "just finished practice, feeling good about the upcoming tournament 🏆", time: "5m", reactions: {} },
  { id: 3, user: "marcus", text: "spring sprint is live now! join fast", time: "8m", reactions: { "🔥": new Set(["alex", "luna"]) } },
  { id: 4, user: "luna",   text: "gg that was close", time: "12m", reactions: {} },
  { id: 5, user: "jordan", text: "any tips for speed round? I keep running out of time on the last section", time: "15m", reactions: {} },
  { id: 6, user: "riley",  text: "lets run team battle 🎯", time: "18m", reactions: { "💪": new Set(["casey"]) } },
  {
    id: 7, user: "casey", text: "ranked up to #8!", time: "25m",
    reactions: { "🏆": new Set(["alex", "sarah", "marcus"]), "❤️": new Set(["luna"]) },
  },
  {
    id: 8, user: "avery", text: "gg casey!", time: "28m", reactions: {},
    replyTo: { id: 7, user: "casey", text: "ranked up to #8!" },
  },
  { id: 9, user: "avery", text: "who's joining night owl?", time: "30m", reactions: {} },
];

export function useChatState(myName: string) {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");

  /** One reaction per user per message — swap on different, toggle off on same. */
  const handleReact = useCallback(
    (msgId: number, emoji: string) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== msgId) return msg;
          const reactions = { ...msg.reactions };
          const existingEmoji = Object.entries(reactions).find(([, u]) => u.has(myName))?.[0];

          if (existingEmoji === emoji) {
            const updated = new Set(reactions[emoji]);
            updated.delete(myName);
            if (updated.size === 0) delete reactions[emoji];
            else reactions[emoji] = updated;
          } else {
            if (existingEmoji) {
              const old = new Set(reactions[existingEmoji]);
              old.delete(myName);
              if (old.size === 0) delete reactions[existingEmoji];
              else reactions[existingEmoji] = old;
            }
            const updated = new Set(reactions[emoji] ?? []);
            updated.add(myName);
            reactions[emoji] = updated;
          }
          return { ...msg, reactions };
        })
      );
    },
    [myName]
  );

  const handleSend = useCallback(
    (text: string, replyTo?: ReplyRef) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          user: myName,
          text: trimmed,
          time: "now",
          reactions: {},
          ...(replyTo ? { replyTo } : {}),
        },
      ]);
    },
    [myName]
  );

  const grouped = useMemo(() => {
    const groups: { user: string; msgs: Message[] }[] = [];
    for (const msg of messages) {
      const last = groups[groups.length - 1];
      // break group if this message is a reply (it should stand alone visually)
      if (last && last.user === msg.user && !msg.replyTo) {
        last.msgs.push(msg);
      } else {
        groups.push({ user: msg.user, msgs: [msg] });
      }
    }
    return groups;
  }, [messages]);

  return { messages, grouped, input, setInput, handleReact, handleSend };
}
