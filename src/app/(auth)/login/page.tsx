import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/features/auth/components/login-form";
import { homePathFor } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const user = await getCurrentUser();
  if (user) redirect(user.mustChangePassword ? "/change-password" : homePathFor(user.role));

  const { callbackUrl } = await searchParams;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Sign in</CardTitle>
        <CardDescription>Use your school ID number and password.</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm callbackUrl={typeof callbackUrl === "string" ? callbackUrl : undefined} />
      </CardContent>
      <CardFooter className="text-muted-foreground justify-center text-sm">
        New student?&nbsp;
        <Link href="/register" className="text-foreground font-medium underline-offset-4 hover:underline">
          Create an account
        </Link>
      </CardFooter>
    </Card>
  );
}
