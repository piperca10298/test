import { redirect } from "next/navigation";

import { ChatWorkspaceLazy } from "@/components/chat/chat-workspace-lazy";
import { PageShell } from "@/components/page-shell";
import { getSessionUser } from "@/lib/auth";

export default async function ChatPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/access");
  }

  return (
    <PageShell
      showFooter={false}
      mainClassName="relative z-10 flex-1"
      glowClassName="bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.28),transparent_64%)]"
    >
      <section className="flex min-h-[calc(100vh-6rem)] flex-col px-4 pb-6 pt-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-1">
          <ChatWorkspaceLazy currentUser={user} />
        </div>
      </section>
    </PageShell>
  );
}
