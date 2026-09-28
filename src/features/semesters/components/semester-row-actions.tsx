"use client";

import { RotateCcw, Trash2 } from "lucide-react";
import { ConfirmAction } from "@/components/confirm-action";
import { Button } from "@/components/ui/button";
import { deleteSemesterAction, resetSemesterSessionsAction } from "../actions";

export function SemesterRowActions({
  id,
  name,
  allotment,
  canReset,
  canDelete,
}: {
  id: string;
  name: string;
  allotment: number;
  canReset: boolean;
  canDelete: boolean;
}) {
  return (
    <>
      {canReset && (
        <ConfirmAction
          trigger={
            <Button variant="ghost" size="icon" aria-label={`Reset all students' sessions for ${name}`}>
              <RotateCcw />
            </Button>
          }
          title="Reset every student's sessions now?"
          description={`All active students go back to ${allotment} remaining sessions. Each change is recorded in the student's history. Use this if the allotment changed mid-semester.`}
          confirmLabel="Reset sessions"
          destructive
          successMessage="Sessions reset"
          action={() => resetSemesterSessionsAction({ id })}
        />
      )}
      {canDelete && (
        <ConfirmAction
          trigger={
            <Button variant="ghost" size="icon" aria-label={`Delete ${name}`}>
              <Trash2 />
            </Button>
          }
          title={`Delete ${name}?`}
          description="Only possible because nothing has happened in this semester yet."
          confirmLabel="Delete"
          destructive
          successMessage="Semester deleted"
          action={() => deleteSemesterAction({ id })}
        />
      )}
    </>
  );
}
