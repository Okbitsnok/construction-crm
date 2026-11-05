"use client";

import { BackLink } from "@/components/BackLink";
import { EmptyState } from "@/components/EmptyState";

// Someone else's record and a missing one look the same, so nothing leaks about its existence.
export default function NotFoundPage() {
  return (
    <>
      <BackLink href="/" label="На главную" />
      <EmptyState
        title="Не найдено"
        description="Запись не существует или у вас нет к ней доступа"
      />
    </>
  );
}
