"use client";

import { EyeOff, LoaderCircle, MoreHorizontal, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { memo, useState } from "react";

import type { ChatMessage, MessageDeletionType } from "@/lib/chat";
import { getRenderableMessageContent } from "@/lib/chat";

type ChatMessageBubbleProps = {
  currentUserId: string;
  isDeleting: boolean;
  message: ChatMessage;
  onDelete: (messageId: string, type: MessageDeletionType) => Promise<void>;
};

const messageTimeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

function ChatMessageBubbleComponent({
  currentUserId,
  isDeleting,
  message,
  onDelete,
}: ChatMessageBubbleProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isOwnMessage = message.senderId === currentUserId;
  const isDeletedForEveryone = message.deletedForEveryone;
  const renderedContent = getRenderableMessageContent(message);

  const handleDelete = async (type: MessageDeletionType) => {
    setIsMenuOpen(false);
    await onDelete(message.id, type);
  };

  return (
    <div
      className={[
        "group relative max-w-[85%] rounded-[26px] border px-4 py-3 sm:max-w-[70%]",
        isOwnMessage
          ? "border-cyan-400/24 bg-cyan-400/[0.12] text-cyan-50 shadow-[0_0_40px_rgba(34,211,238,0.08)]"
          : "border-white/10 bg-white/[0.04] text-slate-100",
        isDeletedForEveryone ? "border-white/12 bg-white/[0.03] text-slate-300" : "",
      ].join(" ")}
    >
      <div className="absolute right-3 top-3">
        <button
          type="button"
          aria-label="Message actions"
          onClick={() => setIsMenuOpen((current) => !current)}
          className="inline-flex size-8 items-center justify-center rounded-full border border-white/10 bg-slate-950/70 text-slate-300 opacity-100 transition-all duration-200 hover:border-cyan-400/30 hover:text-cyan-200 sm:opacity-0 sm:group-hover:opacity-100"
        >
          {isDeleting ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <MoreHorizontal className="size-4" />
          )}
        </button>

        <AnimatePresence initial={false}>
          {isMenuOpen ? (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.16 }}
              className="absolute right-0 z-10 mt-2 min-w-44 rounded-2xl border border-white/10 bg-slate-950/95 p-2 shadow-[0_20px_60px_rgba(2,6,23,0.5)] backdrop-blur-xl"
            >
              <button
                type="button"
                onClick={() => void handleDelete("me")}
                disabled={isDeleting}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-slate-200 transition-colors duration-200 hover:bg-white/5 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <EyeOff className="size-4" />
                Delete for me
              </button>
              {isOwnMessage && !isDeletedForEveryone ? (
                <button
                  type="button"
                  onClick={() => void handleDelete("everyone")}
                  disabled={isDeleting}
                  className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-rose-100 transition-colors duration-200 hover:bg-rose-400/10 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 className="size-4" />
                  Delete for everyone
                </button>
              ) : null}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-3 pr-10 text-[11px] uppercase tracking-[0.22em] text-slate-400">
        <span>{isOwnMessage ? "You" : message.sender.name}</span>
        <span>{messageTimeFormatter.format(new Date(message.createdAt))}</span>
      </div>
      <p
        className={[
          "mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-inherit",
          isDeletedForEveryone ? "italic text-slate-400" : "",
        ].join(" ")}
      >
        {renderedContent}
      </p>
    </div>
  );
}

function areEqual(
  previousProps: Readonly<ChatMessageBubbleProps>,
  nextProps: Readonly<ChatMessageBubbleProps>,
) {
  return (
    previousProps.currentUserId === nextProps.currentUserId &&
    previousProps.isDeleting === nextProps.isDeleting &&
    previousProps.message === nextProps.message &&
    previousProps.onDelete === nextProps.onDelete
  );
}

export const ChatMessageBubble = memo(ChatMessageBubbleComponent, areEqual);
