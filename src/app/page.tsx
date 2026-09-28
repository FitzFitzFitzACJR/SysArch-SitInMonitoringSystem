import { redirect } from "next/navigation";
import { homePathFor } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/session";

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.mustChangePassword) redirect("/change-password");
  redirect(homePathFor(user.role));
}
