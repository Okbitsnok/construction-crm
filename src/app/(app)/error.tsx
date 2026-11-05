"use client";

import Button from "@mui/material/Button";
import { EmptyState } from "@/components/EmptyState";

type ErrorPageProps = {
  reset: () => void;
};

export default function ErrorPage({ reset }: ErrorPageProps) {
  return (
    <>
      <EmptyState title="Не удалось загрузить данные" description="Попробуйте обновить страницу" />
      <Button onClick={reset} sx={{ mt: 2 }}>
        Повторить
      </Button>
    </>
  );
}
