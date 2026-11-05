"use client";

import { useMemo, useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { BackLink } from "@/components/BackLink";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DateTimeText } from "@/components/DateTimeText";
import { PageHeader } from "@/components/PageHeader";
import { StatusChip } from "@/components/StatusChip";
import { deleteTask } from "@/shared/tasks/actions";
import type { Executor, TaskData, TaskHistoryItem, TaskTransition } from "@/shared/tasks/queries";
import { TaskFormDialog } from "../../_components/TaskFormDialog";
import { TaskActions } from "./TaskActions";
import { TaskHistory } from "./TaskHistory";

type DialogName = "edit" | "delete";

type TaskDetailsViewProps = {
  task: TaskData;
  history: TaskHistoryItem[];
  transitions: TaskTransition[];
  executors: Executor[];
  canManage: boolean;
};

export function TaskDetailsView({
  task,
  history,
  transitions,
  executors,
  canManage,
}: TaskDetailsViewProps) {
  const router = useRouter();
  const [openDialog, setOpenDialog] = useState<DialogName | null>(null);
  const closeDialog = () => setOpenDialog(null);

  const editableTask = useMemo(
    () => ({
      id: task.id,
      title: task.title,
      description: task.description,
      assigneeId: task.assignee_id,
    }),
    [task]
  );

  const fields = [
    {
      label: "Объект",
      value: (
        <Link component={NextLink} href={`/objects/${task.object.id}`} underline="hover">
          {task.object.name}
        </Link>
      ),
    },
    { label: "Адрес", value: task.object.address },
    { label: "Исполнитель", value: task.assignee.full_name },
    { label: "Автор", value: task.author.full_name },
    { label: "Создана", value: <DateTimeText value={task.created_at} /> },
  ];

  return (
    <>
      <BackLink href={`/objects/${task.object.id}`} label={task.object.name} />
      <PageHeader
        title={task.title}
        actions={
          canManage && (
            <>
              {task.status !== "accepted" && (
                <Button variant="outlined" onClick={() => setOpenDialog("edit")}>
                  Редактировать
                </Button>
              )}
              <Button variant="outlined" color="error" onClick={() => setOpenDialog("delete")}>
                Удалить
              </Button>
            </>
          )
        }
      />

      <Box
        sx={{
          display: "grid",
          gap: 2,
          alignItems: "start",
          gridTemplateColumns: { xs: "1fr", md: "minmax(0, 3fr) minmax(0, 2fr)" },
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Paper variant="outlined" sx={{ p: 2.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Статус
              </Typography>
              <StatusChip status={task.status} />
            </Box>
            <TaskActions taskId={task.id} transitions={transitions} />
            <Typography variant="h3" sx={{ mt: 2.5, mb: 1 }}>
              Описание
            </Typography>
            <Typography
              color={task.description ? "text.primary" : "text.secondary"}
              sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
            >
              {task.description || "Описания нет"}
            </Typography>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2.5 }}>
            <Box component="dl" sx={{ m: 0, display: "grid", gap: 1.5 }}>
              {fields.map(({ label, value }) => (
                <Box key={label}>
                  <Typography component="dt" variant="caption" color="text.secondary">
                    {label}
                  </Typography>
                  <Typography component="dd" sx={{ m: 0, overflowWrap: "anywhere" }}>
                    {value}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Box>

        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <Typography variant="h3" sx={{ mb: 2 }}>
            История
          </Typography>
          <TaskHistory history={history} />
        </Paper>
      </Box>

      {canManage && (
        <>
          <TaskFormDialog
            open={openDialog === "edit"}
            onClose={closeDialog}
            executors={executors}
            task={editableTask}
          />
          <ConfirmDialog
            open={openDialog === "delete"}
            title="Удалить задачу?"
            description="Задача исчезнет из всех списков. Её история сохранится в базе."
            confirmLabel="Удалить"
            onClose={closeDialog}
            onConfirm={() => deleteTask(task.id)}
            onSuccess={() => router.replace(`/objects/${task.object.id}`)}
          />
        </>
      )}
    </>
  );
}
