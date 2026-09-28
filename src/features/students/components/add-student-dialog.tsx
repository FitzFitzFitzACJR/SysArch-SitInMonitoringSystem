"use client";

import { UserPlus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { StudentForm, type CourseOption } from "./student-form";

export function AddStudentDialog({ courses }: { courses: CourseOption[] }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus /> Add student
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a student</DialogTitle>
          <DialogDescription>They&apos;ll get an email with a link to set their own password.</DialogDescription>
        </DialogHeader>
        <StudentForm courses={courses} onSaved={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
