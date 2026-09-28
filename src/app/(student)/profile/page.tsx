import { KeyRound } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OwnPhoto, ProfileForm } from "@/features/students/components/profile-form";
import { StudentQr } from "@/features/sit-ins/components/student-qr";
import { listActiveCourses } from "@/features/students/queries";
import { db } from "@/lib/db";
import { requireStudent } from "@/lib/session";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const session = await requireStudent();
  const [me, courses] = await Promise.all([
    db.user.findUniqueOrThrow({
      where: { id: session.id },
      select: {
        idNumber: true,
        firstName: true,
        middleName: true,
        lastName: true,
        email: true,
        courseId: true,
        yearLevel: true,
        photoUrl: true,
        qrToken: true,
      },
    }),
    listActiveCourses(),
  ]);

  return (
    <>
      <PageHeader title="Your profile" description={`ID number ${me.idNumber}`} />
      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
            <CardDescription>Your ID number can only be changed by the lab staff.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <OwnPhoto firstName={me.firstName} lastName={me.lastName} photoUrl={me.photoUrl} />
            <ProfileForm
              courses={courses}
              initial={{
                firstName: me.firstName,
                middleName: me.middleName ?? "",
                lastName: me.lastName,
                email: me.email,
                courseId: me.courseId ?? "",
                yearLevel: me.yearLevel ? String(me.yearLevel) : "",
              }}
            />
          </CardContent>
        </Card>
        <div className="grid content-start gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Check-in code</CardTitle>
            </CardHeader>
            <CardContent>
              <StudentQr token={me.qrToken} idNumber={me.idNumber} rotatable />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild className="w-full">
                <Link href="/change-password">
                  <KeyRound /> Change password
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
