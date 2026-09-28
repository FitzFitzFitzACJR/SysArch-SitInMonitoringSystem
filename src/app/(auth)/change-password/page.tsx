import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { logoutAction } from "@/features/auth/actions";
import { ChangePasswordForm } from "@/features/auth/components/password-forms";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Change password" };

export default async function ChangePasswordPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Change your password</CardTitle>
        <CardDescription>
          {user.mustChangePassword
            ? "For security, you need to choose a new password before continuing."
            : "You'll stay signed in on this device; other devices will be signed out."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChangePasswordForm />
      </CardContent>
      <CardFooter className="justify-center">
        <form action={logoutAction}>
          <Button type="submit" variant="link" size="sm">
            Sign out instead
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
