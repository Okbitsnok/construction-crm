"use client";

import Chip from "@mui/material/Chip";
import { STATUS_META } from "@/shared/tasks/constants";
import type { TaskStatus } from "@/shared/supabase/database.types";

type StatusChipProps = {
  status: TaskStatus;
};

export function StatusChip({ status }: StatusChipProps) {
  const { label, color } = STATUS_META[status];

  return <Chip size="small" label={label} color={color} data-test-id={`status-${status}`} />;
}
