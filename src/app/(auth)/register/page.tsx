import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RegisterForm } from "@/features/auth/components/register-form";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Create account" };

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/");

  const courses = await db.course.findMany({
    where: { isActive: true },
    orderBy: { code: "asc" },
    select: { id: true, code: true, name: true },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Create your student account</CardTitle>
        <CardDescription>You&apos;ll use your ID number to sign in and check in to the lab.</CardDescription>
      </CardHeader>
      <CardContent>
        <RegisterForm courses={courses} />
      </CardContent>
      <CardFooter className="text-muted-foreground justify-center text-sm">
        Already registered?&nbsp;
        <Link href="/login" className="text-foreground font-medium underline-offset-4 hover:underline">
          Sign in
        </Link>
      </CardFooter>
    </Card>
  );
}
