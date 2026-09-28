"use client";

import { Archive, Mail, RotateCcw, Trash2, UserCheck, UserX } from "lucide-react";
import { useRouter } from "next/navigation";
import { ConfirmAction } from "@/components/confirm-action";
import { Button } from "@/components/ui/button";
import {
  deleteStudentAction,
  resendInviteAction,
  resetStudentSessionsAction,
  setStudentPhotoAction,
  setStudentStatusAction,
} from "../actions";
import { PhotoUploader } from "./photo-uploader";

type Student = {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  status: "ACTIVE" | "INACTIVE" | "ARCHIVED";
  remainingSessions: number;
  hasHistory: boolean;
  passwordPending: boolean;
};

export function StudentPhoto({ student }: { student: Pick<Student, "id" | "firstName" | "lastName" | "photoUrl"> }) {
  return (
    <PhotoUploader
      firstName={student.firstName}
      lastName={student.lastName}
      photoUrl={student.photoUrl}
      upload={(photo) => setStudentPhotoAction({ id: student.id, photo })}
    />
  );
}

/** Account actions for staff. Each one is confirmed, runs server-side, and is audit-logged. */
export function StudentAdminActions({
  student,
  allotment,
  canArchive,
  canDelete,
}: {
  student: Student;
  allotment: number;
  canArchive: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const id = student.id;
  const name = `${student.firstName} ${student.lastName}`;

  return (
    <div className="flex flex-col gap-2">
      <ConfirmAction
        trigger={
          <Button variant="outline" className="justify-start">
            <RotateCcw /> Reset sessions to {allotment}
          </Button>
        }
        title="Reset sessions?"
        description={`${name} has ${student.remainingSessions} session(s) left. This sets it to ${allotment}, the current semester allotment. The change is recorded in their points & sessions history.`}
        confirmLabel="Reset sessions"
        successMessage="Sessions reset"
        action={() => resetStudentSessionsAction({ id })}
      />

      {student.passwordPending && student.status === "ACTIVE" && (
        <ConfirmAction
          trigger={
            <Button variant="outline" className="justify-start">
              <Mail /> Resend set-password email
            </Button>
          }
          title="Resend the set-password email?"
          description="Any earlier link stops working."
          confirmLabel="Send email"
          successMessage="Email sent"
          action={() => resendInviteAction({ id })}
        />
      )}

      {student.status === "ACTIVE" ? (
        <ConfirmAction
          trigger={
            <Button variant="outline" className="justify-start">
              <UserX /> Deactivate
            </Button>
          }
          title={`Deactivate ${name}?`}
          description="They'll be signed out and can't sign in until reactivated. Their pending and approved reservations are cancelled."
          confirmLabel="Deactivate"
          destructive
          successMessage="Student deactivated"
          action={() => setStudentStatusAction({ id, status: "INACTIVE" })}
        />
      ) : (
        <ConfirmAction
          trigger={
            <Button variant="outline" className="justify-start">
              <UserCheck /> Reactivate
            </Button>
          }
          title={`Reactivate ${name}?`}
          description="They'll be able to sign in again."
          confirmLabel="Reactivate"
          successMessage="Student reactivated"
          action={() => setStudentStatusAction({ id, status: "ACTIVE" })}
        />
      )}

      {canArchive && student.status !== "ARCHIVED" && (
        <ConfirmAction
          trigger={
            <Button variant="outline" className="justify-start">
              <Archive /> Archive
            </Button>
          }
          title={`Archive ${name}?`}
          description="Archived students can't sign in and are hidden from the student list, but all their history is kept for reports. You can restore them later."
          confirmLabel="Archive"
          destructive
          successMessage="Student archived"
          action={() => setStudentStatusAction({ id, status: "ARCHIVED" })}
        />
      )}

      {canDelete && (
        <ConfirmAction
          trigger={
            <Button
              variant="ghost"
              className="text-destructive justify-start"
              disabled={student.hasHistory}
              title={student.hasHistory ? "Students with lab history can only be archived" : undefined}
            >
              <Trash2 /> Delete permanently
            </Button>
          }
          title={`Permanently delete ${name}?`}
          description="Only for accounts created by mistake. This can't be undone."
          confirmLabel="Delete"
          destructive
          successMessage="Student deleted"
          action={() => deleteStudentAction({ id })}
          onDone={() => router.push("/admin/students")}
        />
      )}
      {canDelete && student.hasHistory && (
        <p className="text-muted-foreground text-xs">Students with lab history can be archived but not deleted.</p>
      )}
    </div>
  );
}
