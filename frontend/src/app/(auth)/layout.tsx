import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();

  // Already signed in — send them to the app
  if (userId) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
