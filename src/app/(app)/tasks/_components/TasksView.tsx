"use client";

import NextLink from "next/link";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { STATUS_META, TASK_STATUSES } from "@/shared/tasks/constants";
import type { TaskListItem } from "@/shared/tasks/queries";
import type { TaskStatus } from "@/shared/supabase/database.types";
import { TaskList } from "./TaskList";

type TasksViewProps = {
  tasks: TaskListItem[];
  activeStatus?: TaskStatus;
  isManager: boolean;
};

export function TasksView({ tasks, activeStatus, isManager }: TasksViewProps) {
  return (
    <>
      <PageHeader
        title={isManager ? "Все задачи" : "Мои задачи"}
        subtitle={isManager ? "Задачи по всем объектам" : "Задачи, назначенные вам"}
      />

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2.5 }}>
        <Chip
          component={NextLink}
          href="/tasks"
          clickable
          label="Все"
          color={activeStatus ? "default" : "primary"}
          variant={activeStatus ? "outlined" : "filled"}
        />
        {TASK_STATUSES.map((status) => (
          <Chip
            key={status}
            component={NextLink}
            href={`/tasks?status=${status}`}
            clickable
            label={STATUS_META[status].label}
            color={activeStatus === status ? "primary" : "default"}
            variant={activeStatus === status ? "filled" : "outlined"}
          />
        ))}
      </Box>

      {tasks.length === 0 ? (
        <EmptyState title="Задач нет" description={activeStatus && "Попробуйте другой фильтр"} />
      ) : (
        <TaskList tasks={tasks} showObject showAssignee={isManager} />
      )}
    </>
  );
}
