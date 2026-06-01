import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";

import Sidebar from "@/components/Sidebar";

export default function AppLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SignedIn>
        <div className="app-shell">
          <Sidebar />
          <div className="app-shell-main">{children}</div>
        </div>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}
