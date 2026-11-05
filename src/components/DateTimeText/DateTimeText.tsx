"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

function formatDateTime(value: string, timeZone?: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(new Date(value));
}

type DateTimeTextProps = {
  value: string;
};

// The server does not know the viewer's time zone. It renders UTC, and the browser switches to
// local time right after hydration, without a hydration mismatch.
export function DateTimeText({ value }: DateTimeTextProps) {
  const text = useSyncExternalStore(
    subscribe,
    () => formatDateTime(value),
    () => formatDateTime(value, "UTC")
  );

  return <time dateTime={value}>{text}</time>;
}
