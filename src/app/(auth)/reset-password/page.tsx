import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FormAlert } from "@/components/forms/form-alert";
import { ResetPasswordForm } from "@/features/auth/components/password-forms";

export const metadata: Metadata = { title: "Reset password" };

export default async function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  const { token } = await searchParams;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Choose a new password</CardTitle>
        <CardDescription>This will sign you out everywhere else.</CardDescription>
      </CardHeader>
      <CardContent>
        {typeof token === "string" && token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <FormAlert message="This reset link is incomplete. Open the link from your email again." />
        )}
      </CardContent>
      <CardFooter className="justify-center text-sm">
        <Link href="/forgot-password" className="underline-offset-4 hover:underline">
          Request a new link
        </Link>
      </CardFooter>
    </Card>
  );
}
