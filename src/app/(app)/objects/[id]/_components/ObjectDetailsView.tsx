"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { BackLink } from "@/components/BackLink";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { deleteObject } from "@/shared/objects/actions";
import type { ObjectData } from "@/shared/objects/queries";
import type { Executor, TaskListItem } from "@/shared/tasks/queries";
import { TaskFormDialog } from "@/app/(app)/tasks/_components/TaskFormDialog";
import { TaskList } from "@/app/(app)/tasks/_components/TaskList";
import { ObjectFormDialog } from "../../_components/ObjectFormDialog";

type DialogName = "edit" | "delete" | "task";

type ObjectDetailsViewProps = {
  object: ObjectData;
  tasks: TaskListItem[];
  executors: Executor[];
  canManage: boolean;
};

export function ObjectDetailsView({ object, tasks, executors, canManage }: ObjectDetailsViewProps) {
  const router = useRouter();
  const [openDialog, setOpenDialog] = useState<DialogName | null>(null);
  const closeDialog = () => setOpenDialog(null);

  return (
    <>
      <BackLink href="/objects" label="Все объекты" />
      <PageHeader
        title={object.name}
        subtitle={object.address}
        actions={
          canManage && (
            <>
              <Button variant="outlined" onClick={() => setOpenDialog("edit")}>
                Редактировать
              </Button>
              <Button variant="outlined" color="error" onClick={() => setOpenDialog("delete")}>
                Удалить
              </Button>
            </>
          )
        }
      />

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h2">{canManage ? "Задачи" : "Ваши задачи на объекте"}</Typography>
        {canManage && (
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={() => setOpenDialog("task")}
            data-test-id="add-task"
          >
            Новая задача
          </Button>
        )}
      </Box>

      {tasks.length === 0 ? (
        <EmptyState title="Задач пока нет" />
      ) : (
        <TaskList tasks={tasks} showObject={false} showAssignee={canManage} />
      )}

      {canManage && (
        <>
          <ObjectFormDialog open={openDialog === "edit"} onClose={closeDialog} object={object} />
          <TaskFormDialog
            open={openDialog === "task"}
            onClose={closeDialog}
            objectId={object.id}
            executors={executors}
          />
          <ConfirmDialog
            open={openDialog === "delete"}
            title="Удалить объект?"
            description="Объект исчезнет из списков. Удалить можно только объект без задач."
            confirmLabel="Удалить"
            onClose={closeDialog}
            onConfirm={() => deleteObject(object.id)}
            onSuccess={() => router.replace("/objects")}
          />
        </>
      )}
    </>
  );
}
