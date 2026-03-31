"use client";

import dynamic from "next/dynamic";
import { LoaderCircle } from "lucide-react";

import type { SessionUser } from "@/lib/auth";

const ChatWorkspace = dynamic(
  () =>
    import("@/components/chat/chat-workspace").then((module) => module.ChatWorkspace),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full flex-col gap-6 lg:flex-row">
        <div className="glass-panel panel-shine h-[26rem] w-full rounded-[32px] lg:h-full lg:max-w-[24rem]" />
        <div className="glass-panel panel-shine flex min-h-[32rem] flex-1 items-center justify-center rounded-[32px]">
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <LoaderCircle className="size-4 animate-spin text-cyan-300" />
            Initializing neural relay
          </div>
        </div>
      </div>
    ),
  },
);

type ChatWorkspaceLazyProps = {
  currentUser: SessionUser;
};

export function ChatWorkspaceLazy({ currentUser }: ChatWorkspaceLazyProps) {
  return <ChatWorkspace currentUser={currentUser} />;
}
