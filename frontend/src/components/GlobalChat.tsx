"use client";

import {
  memo,
  useState,
  useRef,
  useEffect,
  useCallback,
  useId,
} from "react";
import { prepare, layout, prepareWithSegments, measureNaturalWidth, measureLineStats } from "@chenglou/pretext";
import { useUser } from "@clerk/nextjs";
import {
  MessageCircle,
  X,
  SendHorizontal,
  Search,
  Users,
  ChevronDown,
  Reply,
  Smile,
  ThumbsUp,
  Heart,
  Laugh,
  Flame,
  Trophy,
  Hand,
  Pin,
} from "lucide-react";
import { useChatState, REACTION_EMOJIS, type Message, type ReplyRef } from "@/hooks/useChatState";

/* ─── Constants ──────────────────────────────────────────────── */

const MESSAGE_FONT = '12px "Inter", system-ui, sans-serif';
const INPUT_FONT   = '13px "Inter", system-ui, sans-serif';
const INPUT_LINE_HEIGHT = 20;
const MAX_BUBBLE_WIDTH  = 250;
const MIN_BUBBLE_WIDTH  = 60;

const ONLINE_USERS = [
  { name: "alex",   status: "online", avatar: "🟣" },
  { name: "sarah",  status: "online", avatar: "🔵" },
  { name: "marcus", status: "online", avatar: "🟢" },
  { name: "luna",   status: "idle",   avatar: "🟡" },
  { name: "jordan", status: "online", avatar: "🔴" },
  { name: "riley",  status: "idle",   avatar: "🟠" },
  { name: "casey",  status: "online", avatar: "🟤" },
  { name: "avery",  status: "online", avatar: "🔷" },
];

const REACTION_ICON_MAP: Record<string, React.ElementType> = {
  "👍": ThumbsUp,
  "❤️": Heart,
  "😂": Laugh,
  "🔥": Flame,
  "🏆": Trophy,
  "💪": Hand,
};

/* ─── Pretext Helpers ────────────────────────────────────────── */

function measureInputLines(text: string, containerWidth: number): number {
  if (!text) return 1;
  try {
    const handle = prepare(text, INPUT_FONT, { whiteSpace: "pre-wrap" });
    const { lineCount } = layout(handle, containerWidth, INPUT_LINE_HEIGHT);
    return Math.max(1, Math.min(4, lineCount));
  } catch {
    return 1;
  }
}

function measureBubbleWidth(text: string): number {
  if (!text) return MIN_BUBBLE_WIDTH;
  try {
    const prepared = prepareWithSegments(text, MESSAGE_FONT);
    const natural  = measureNaturalWidth(prepared);
    const { lineCount } = measureLineStats(prepared, MAX_BUBBLE_WIDTH);
    if (lineCount <= 1) return Math.min(Math.max(natural + 28, MIN_BUBBLE_WIDTH), MAX_BUBBLE_WIDTH);
    return MAX_BUBBLE_WIDTH;
  } catch {
    return MAX_BUBBLE_WIDTH;
  }
}

/* ─── Shared Sub-Components ──────────────────────────────────── */

const TypingIndicator = memo(function TypingIndicator({ user = "riley" }: { user?: string }) {
  return (
    <div className="flex items-center gap-1.5 px-1">
      <span className="text-[10px] font-medium text-violet-400/80">{user}</span>
      <div className="flex items-center gap-[3px]">
        {[0, 150, 300].map((d) => (
          <span
            key={d}
            className="inline-block h-[3px] w-[3px] rounded-full bg-violet-400/60 animate-bounce"
            style={{ animationDelay: `${d}ms` }}
          />
        ))}
      </div>
    </div>
  );
});

export const MessageBubble = memo(function MessageBubble({
  msg,
  isOwn,
  showUser,
  myName,
  onReact,
  onReply,
  compact = false,
}: {
  msg: Message;
  isOwn: boolean;
  showUser: boolean;
  myName: string;
  onReact: (msgId: number, emoji: string) => void;
  onReply: (ref: ReplyRef) => void;
  compact?: boolean;
}) {
  const [bubbleWidth, setBubbleWidth] = useState(MAX_BUBBLE_WIDTH);
  const [pickerOpen, setPickerOpen]   = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setBubbleWidth(measureBubbleWidth(msg.text));
  }, [msg.text]);

  // Close picker on outside click
  useEffect(() => {
    if (!pickerOpen) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [pickerOpen]);

  const activeReactions = Object.entries(msg.reactions).filter(([, users]) => users.size > 0);

  /** The action buttons (reply + emoji picker trigger) */
  const ActionButtons = (
    <div ref={pickerRef} className="relative flex items-center gap-0.5">
      {/* Emoji picker panel — slides in beside the smiley button */}
      {pickerOpen && (
        <div
          className={`absolute ${isOwn ? "right-full mr-1" : "left-full ml-1"} top-1/2 -translate-y-1/2 flex items-center gap-0.5 rounded-full border border-white/[0.08] bg-[#16161a]/98 px-1.5 py-1 shadow-xl shadow-black/50 backdrop-blur-md z-20`}
        >
          {REACTION_EMOJIS.map((emoji) => {
            const Icon = REACTION_ICON_MAP[emoji];
            const isMine = msg.reactions[emoji]?.has(myName);
            return (
              <button
                key={emoji}
                onClick={() => { onReact(msg.id, emoji); setPickerOpen(false); }}
                title={emoji}
                className={`rounded-full p-1 transition-all duration-150 active:scale-90 ${
                  isMine ? "text-violet-400 bg-violet-500/20" : "text-zinc-500 hover:bg-white/[0.08] hover:text-zinc-300"
                }`}
              >
                {Icon ? <Icon size={12} strokeWidth={1.5} /> : <span className="text-[11px]">{emoji}</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* Smiley trigger */}
      <button
        onClick={() => setPickerOpen((v) => !v)}
        className={`opacity-0 group-hover/msg:opacity-100 flex-shrink-0 rounded-full p-1 transition-all duration-150 ${
          pickerOpen
            ? "opacity-100 text-violet-400 bg-violet-500/15"
            : "text-white/20 hover:text-white/60 hover:bg-white/[0.06]"
        }`}
      >
        <Smile size={11} strokeWidth={1.5} />
      </button>

      {/* Reply button */}
      <button
        onClick={() => onReply({ id: msg.id, user: msg.user, text: msg.text })}
        className="opacity-0 group-hover/msg:opacity-100 flex-shrink-0 rounded-full p-1 text-white/20 hover:text-white/60 hover:bg-white/[0.06] transition-all duration-150"
      >
        <Reply size={11} strokeWidth={1.5} />
      </button>
    </div>
  );

  return (
    <div className={`group/msg relative flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
      {/* Username + Time */}
      {showUser && (
        <div className="flex items-baseline gap-1.5 px-1 mb-0.5">
          <span className={`text-[10px] font-semibold transition-colors ${isOwn ? "text-violet-400" : "text-zinc-400 group-hover/msg:text-zinc-300"}`}>
            {isOwn ? "you" : msg.user}
          </span>
          <span className="text-[9px] text-zinc-600">{msg.time}</span>
        </div>
      )}

      {/* Reply context quote */}
      {msg.replyTo && (
        <div className={`flex items-center gap-1.5 mb-1 px-1 max-w-[260px] ${isOwn ? "self-end" : "self-start"}`}>
          <div className="w-3.5 h-3.5 border-l-2 border-t-2 border-white/20 rounded-tl-sm flex-shrink-0" />
          <span className="text-[10px] text-white/30 font-medium truncate">
            <span className="text-white/40">{msg.replyTo.user}</span>
            {" · "}{msg.replyTo.text}
          </span>
        </div>
      )}

      {/* Bubble row: actions sit beside the bubble, always in the flex flow */}
      <div className="flex items-center gap-1">
        {/* Own messages: actions on LEFT of bubble */}
        {isOwn && ActionButtons}

        {/* Bubble */}
        <div
          suppressHydrationWarning
          style={{ maxWidth: compact ? bubbleWidth : Math.min(bubbleWidth * 1.4, 420), width: "fit-content" }}
          className={`rounded-2xl px-3 py-2 text-[12px] leading-[18px] shadow-sm transition-all duration-200 ${
            isOwn
              ? "rounded-tr-sm bg-violet-950/60 border border-violet-500/[0.12] text-white/85"
              : "rounded-tl-sm border border-white/[0.05] bg-white/[0.03] text-zinc-300 group-hover/msg:bg-white/[0.05]"
          }`}
        >
          {msg.text}
        </div>

        {/* Other messages: actions on RIGHT of bubble */}
        {!isOwn && ActionButtons}
      </div>

      {/* Active Reaction Pills */}
      {activeReactions.length > 0 && (
        <div className={`flex flex-wrap items-center gap-1 mt-1.5 ${isOwn ? "justify-end pr-1" : "pl-1"}`}>
          {activeReactions.map(([emoji, users]) => {
            const isMine = users.has(myName);
            return (
              <button
                key={emoji}
                onClick={() => onReact(msg.id, emoji)}
                title={isMine ? `Remove ${emoji}` : `React with ${emoji}`}
                className={`flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] transition-all duration-200 ${
                  isMine
                    ? "border-violet-500/30 bg-violet-500/10 text-violet-300"
                    : "border-white/[0.06] bg-white/[0.02] text-zinc-500 hover:border-violet-500/20 hover:bg-violet-500/[0.06] hover:text-zinc-300"
                }`}
              >
                <span>{emoji}</span>
                <span className="text-[9px] font-medium">{users.size}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
});

/* ─── Shared Input Bar ───────────────────────────────────────── */

export const ChatInput = memo(function ChatInput({
  input,
  onInput,
  onSend,
  containerWidth,
  replyTo,
  onCancelReply,
}: {
  input: string;
  onInput: (val: string) => void;
  onSend: () => void;
  containerWidth: number;
  replyTo?: ReplyRef;
  onCancelReply?: () => void;
}) {
  const [inputLines, setInputLines] = useState(1);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      onInput(val);
      const w = containerWidth - 72;
      setInputLines(measureInputLines(val, w));
    },
    [containerWidth, onInput]
  );

  return (
    <div className="flex-shrink-0 border-t border-white/[0.06] bg-[#0a0a0c] px-3 pt-2 pb-2">
      {/* Reply banner */}
      {replyTo && (
        <div className="flex items-center gap-2 mb-1.5 px-1">
          <Reply size={11} strokeWidth={1.5} className="text-violet-400/60 flex-shrink-0" />
          <span className="text-[10px] text-white/30 truncate flex-1">
            <span className="text-violet-400/70 font-medium">{replyTo.user}</span>
            {" · "}{replyTo.text}
          </span>
          <button onClick={onCancelReply} className="text-white/20 hover:text-white/50 transition-colors flex-shrink-0">
            <X size={10} strokeWidth={2} />
          </button>
        </div>
      )}
      <form
        onSubmit={(e) => { e.preventDefault(); onSend(); setInputLines(1); }}
        className="flex items-end gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 focus-within:border-violet-500/40 focus-within:bg-white/[0.05] focus-within:shadow-[0_0_20px_rgba(139,92,246,0.08)] transition-all duration-300"
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={handleChange}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (input.trim()) { onSend(); setInputLines(1); }
            }
          }}
          placeholder={replyTo ? `Reply to ${replyTo.user}...` : "Message..."}
          rows={1}
          style={{ height: inputLines * INPUT_LINE_HEIGHT + 4 }}
          className="chat-input-reset chat-scroll flex-1 w-full text-[13px] leading-[20px] text-white/90 placeholder:text-white/25 outline-none max-h-[88px] overflow-y-auto"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className={`flex-shrink-0 rounded-lg p-1.5 transition-all duration-200 ${
            input.trim()
              ? "text-violet-400 bg-violet-500/10 hover:bg-violet-500/20 hover:text-violet-300 active:scale-95"
              : "text-white/10"
          }`}
        >
          <SendHorizontal size={13} strokeWidth={1.5} />
        </button>
      </form>
    </div>
  );
});

/* ─── Message List ───────────────────────────────────────────── */

const MessageList = memo(function MessageList({
  grouped,
  myName,
  onReact,
  onReply,
  compact = false,
  showTyping = false,
  scrollRef,
}: {
  grouped: { user: string; msgs: Message[] }[];
  myName: string;
  onReact: (msgId: number, emoji: string) => void;
  onReply: (ref: ReplyRef) => void;
  compact?: boolean;
  showTyping?: boolean;
  scrollRef: React.RefObject<HTMLDivElement>;
}) {
  return (
    <div ref={scrollRef} className="chat-scroll flex-1 overflow-y-auto px-4 py-3">
      <div className="space-y-3">
        {grouped.map((group) => (
          <div key={group.msgs[0].id} className="space-y-1">
            {group.msgs.map((msg, idx) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                isOwn={msg.user === myName}
                showUser={idx === 0}
                myName={myName}
                onReact={onReact}
                onReply={onReply}
                compact={compact}
              />
            ))}
          </div>
        ))}
        {showTyping && <TypingIndicator />}
      </div>
    </div>
  );
});

/* ─── Full-page Inline Chat ──────────────────────────────────── */

export const InlineGlobalChat = memo(function InlineGlobalChat({ myName }: { myName: string }) {
  const { grouped, input, setInput, handleReact, handleSend } = useChatState(myName);
  const [showSearch, setShowSearch]   = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showTyping]                  = useState(false);
  const [replyTo, setReplyTo]         = useState<ReplyRef | undefined>();
  const scrollRef    = useRef<HTMLDivElement>(null!);
  const containerRef = useRef<HTMLDivElement>(null!);
  const [containerWidth, setContainerWidth] = useState(600);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setContainerWidth(el.clientWidth));
    ro.observe(el);
    setContainerWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (scrollRef.current)
      requestAnimationFrame(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; });
  }, [grouped]);

  // Filter by search
  const filteredGrouped = searchQuery.trim()
    ? (() => {
        const q = searchQuery.toLowerCase();
        const flat = grouped.flatMap((g) => g.msgs).filter((m) => m.text.toLowerCase().includes(q) || m.user.toLowerCase().includes(q));
        const out: { user: string; msgs: Message[] }[] = [];
        for (const msg of flat) {
          const last = out[out.length - 1];
          if (last && last.user === msg.user) last.msgs.push(msg);
          else out.push({ user: msg.user, msgs: [msg] });
        }
        return out;
      })()
    : grouped;

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col w-full h-full min-h-0 rounded-2xl border border-white/[0.06] bg-[#0a0a0c]/80 backdrop-blur-xl overflow-hidden"
    >
      {/* ── Floating top-right controls — online first, then search ── */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
        {/* Online count bubble */}
        <span className="flex items-center gap-1 rounded-full border border-emerald-500/20 bg-black/50 px-2.5 py-1 text-[10px] text-emerald-400 font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {ONLINE_USERS.filter((u) => u.status === "online").length}
        </span>

        {/* Search bubble — 32×32 so icon is always visible */}
        <button
          onClick={() => { setShowSearch((v) => !v); if (showSearch) setSearchQuery(""); }}
          className={`flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-200 ${
            showSearch
              ? "border-violet-500/40 bg-violet-500/15 text-violet-400"
              : "border-white/[0.08] bg-black/50 text-white/40 hover:text-white/70 hover:border-white/20"
          }`}
        >
          <Search size={13} strokeWidth={1.5} />
        </button>
      </div>

      {/* ── Search expand row ── */}
      {showSearch && (
        <div className="flex-shrink-0 flex items-center gap-2 border-b border-white/[0.05] px-4 py-2 bg-[#0a0a0c]/60">
          <Search size={11} strokeWidth={1.5} className="text-zinc-600 flex-shrink-0" />
          <input
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages..."
            className="chat-input-reset flex-1 text-[12px] text-white/80 placeholder:text-white/20"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="text-zinc-600 hover:text-zinc-400 transition-colors">
              <X size={10} strokeWidth={2} />
            </button>
          )}
        </div>
      )}

      {/* ── Messages ── */}
      <MessageList
        grouped={filteredGrouped}
        myName={myName}
        onReact={handleReact}
        onReply={setReplyTo}
        compact={false}
        showTyping={showTyping}
        scrollRef={scrollRef}
      />

      {/* ── Input ── */}
      <ChatInput
        input={input}
        onInput={setInput}
        onSend={() => { handleSend(input, replyTo); setInput(""); setReplyTo(undefined); }}
        containerWidth={containerWidth}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(undefined)}
      />
    </div>
  );
});

/* ─── Sidebar Drawer ─────────────────────────────────────────── */

interface ChatPanelProps {
  open: boolean;
  onToggle: () => void;
  pinned: boolean;
  onTogglePin: () => void;
  hidden?: boolean;
}

const ChatPanel = memo(function ChatPanel({ open, onToggle, pinned, onTogglePin, hidden = false }: ChatPanelProps) {
  const { user } = useUser();
  const myName = user?.firstName ?? "you";
  const { grouped, input, setInput, handleReact, handleSend } = useChatState(myName);

  const [showSearch, setShowSearch]   = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnline, setShowOnline]   = useState(false);
  const [showTyping, setShowTyping]   = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);
  const [replyTo, setReplyTo]         = useState<ReplyRef | undefined>();
  const scrollRef    = useRef<HTMLDivElement>(null!);
  const containerRef = useRef<HTMLDivElement>(null!);
  const [containerWidth, setContainerWidth] = useState(320);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setContainerWidth(el.clientWidth));
    ro.observe(el);
    setContainerWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (open && scrollRef.current)
      requestAnimationFrame(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; });
  }, [open, grouped]);

  useEffect(() => {
    if (open) {
      setTimeout(() => containerRef.current?.querySelector("textarea")?.focus(), 300);
      setUnreadCount(0);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const interval = setInterval(() => { setShowTyping(true); setTimeout(() => setShowTyping(false), 3000); }, 15000);
    return () => clearInterval(interval);
  }, [open]);

  const filteredGrouped = searchQuery.trim()
    ? (() => {
        const q = searchQuery.toLowerCase();
        const flat = grouped.flatMap((g) => g.msgs).filter((m) => m.text.toLowerCase().includes(q) || m.user.toLowerCase().includes(q));
        const out: { user: string; msgs: Message[] }[] = [];
        for (const msg of flat) {
          const last = out[out.length - 1];
          if (last && last.user === msg.user) last.msgs.push(msg);
          else out.push({ user: msg.user, msgs: [msg] });
        }
        return out;
      })()
    : grouped;

  return (
    <>
      {/* Floating Toggle — single circle bubble */}
      {!open && !hidden && (
        <button
          onClick={onToggle}
          className="fixed bottom-6 right-6 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-[#0f0f12] border border-white/10 text-violet-400 shadow-md shadow-black/50 hover:text-violet-300 hover:border-violet-500/30 hover:bg-violet-500/10 transition-all duration-200"
        >
          <MessageCircle size={17} strokeWidth={1.5} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-violet-500 text-[8px] font-bold text-white leading-none">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Backdrop — only in overlay (unpinned) mode */}
      {open && !pinned && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] transition-opacity duration-300"
          onClick={onToggle}
        />
      )}

      {/* Drawer Panel */}
      <div
        ref={containerRef}
        className={`fixed top-0 right-0 z-50 flex h-screen flex-col border-l border-white/[0.06] bg-[#0a0a0c]/98 backdrop-blur-xl transition-all duration-300 ease-out ${
          open
            ? "w-[320px] sm:w-[360px] translate-x-0 opacity-100"
            : "w-[320px] sm:w-[360px] translate-x-full opacity-0"
        }`}
      >
        {/* Header */}
        <div className="flex-shrink-0 border-b border-white/[0.06]">
          <div className="flex h-12 items-center justify-between px-4">
            <div className="flex items-center gap-2.5">
              <MessageCircle size={14} strokeWidth={1.5} className="text-violet-400" />
              <span className="text-[13px] font-semibold text-white/90">Chat</span>
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {ONLINE_USERS.filter((u) => u.status === "online").length}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowSearch((v) => !v)}
                className={`rounded-lg p-1.5 transition-colors ${showSearch ? "text-violet-400 bg-violet-500/10" : "text-zinc-600 hover:text-zinc-400 hover:bg-white/[0.05]"}`}
              >
                <Search size={14} strokeWidth={1.5} />
              </button>
              <button
                onClick={() => setShowOnline((v) => !v)}
                className={`rounded-lg p-1.5 transition-colors ${showOnline ? "text-violet-400 bg-violet-500/10" : "text-zinc-600 hover:text-zinc-400 hover:bg-white/[0.05]"}`}
              >
                <Users size={14} strokeWidth={1.5} />
              </button>
              {/* Pin — lives inside the panel */}
              <button
                onClick={onTogglePin}
                title={pinned ? "Unpin (overlay)" : "Pin (push content)"}
                className={`rounded-lg p-1.5 transition-colors ${
                  pinned ? "text-violet-400 bg-violet-500/10 hover:bg-violet-500/20" : "text-zinc-600 hover:text-zinc-400 hover:bg-white/[0.05]"
                }`}
              >
                <Pin size={13} strokeWidth={1.5} fill={pinned ? "currentColor" : "none"} />
              </button>
              <button
                onClick={onToggle}
                className="rounded-lg p-1.5 text-zinc-600 hover:text-zinc-400 hover:bg-white/[0.05] transition-colors"
              >
                <X size={14} strokeWidth={1.5} />
              </button>
            </div>
          </div>

          {showSearch && (
            <div className="px-3 pb-3">
              <div className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 focus-within:border-violet-500/40 transition-all">
                <Search size={12} strokeWidth={1.5} className="text-zinc-600" />
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search messages..."
                  className="chat-input-reset flex-1 text-[11px] text-white/90 placeholder:text-white/25"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="text-zinc-600 hover:text-zinc-400">
                    <X size={10} strokeWidth={2} />
                  </button>
                )}
              </div>
            </div>
          )}

          {showOnline && (
            <div className="px-3 pb-3">
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Online</span>
                  <ChevronDown size={10} className="text-zinc-600" />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {ONLINE_USERS.map((u) => (
                    <div key={u.name} className="flex items-center gap-1.5 rounded-full border border-white/[0.05] bg-white/[0.02] px-2 py-1 hover:bg-white/[0.05] transition-colors cursor-pointer">
                      <span className="text-[11px]">{u.avatar}</span>
                      <span className="text-[10px] text-zinc-400 font-medium">{u.name}</span>
                      <span className={`h-1.5 w-1.5 rounded-full ${u.status === "online" ? "bg-emerald-500" : "bg-amber-500"}`} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Messages */}
        <MessageList
          grouped={filteredGrouped}
          myName={myName}
          onReact={handleReact}
          onReply={setReplyTo}
          compact={true}
          showTyping={showTyping}
          scrollRef={scrollRef}
        />

        {/* Input */}
        <ChatInput
          input={input}
          onInput={setInput}
          onSend={() => { handleSend(input, replyTo); setInput(""); setReplyTo(undefined); }}
          containerWidth={containerWidth}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(undefined)}
        />
      </div>
    </>
  );
});

export default ChatPanel;
