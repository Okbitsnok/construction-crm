"use client";

import { useEffect, useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { createTask, updateTask, type TaskFormValues } from "@/shared/tasks/actions";
import type { Executor } from "@/shared/tasks/queries";

type EditableTask = TaskFormValues & {
  id: string;
};

type TaskFormDialogProps = {
  open: boolean;
  onClose: () => void;
  executors: Executor[];
  objectId?: string;
  task?: EditableTask;
};

export function TaskFormDialog({ open, onClose, executors, objectId, task }: TaskFormDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TaskFormValues>();

  useEffect(() => {
    if (open) {
      reset({
        title: task?.title ?? "",
        description: task?.description ?? "",
        assigneeId: task?.assigneeId ?? "",
      });
    }
  }, [open, task, reset]);

  const handleClose = () => {
    setErrorMessage(null);
    onClose();
  };

  const onSubmit = (values: TaskFormValues) => {
    setErrorMessage(null);
    startTransition(async () => {
      const result = task
        ? await updateTask(task.id, values)
        : await createTask(objectId ?? "", values);
      if (!result.ok) {
        setErrorMessage(result.message);
        return;
      }
      handleClose();
    });
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <Box component="form" noValidate onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>{task ? "Редактировать задачу" : "Новая задача"}</DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "8px !important" }}
        >
          <TextField
            label="Название"
            autoFocus
            error={Boolean(errors.title)}
            helperText={errors.title?.message}
            slotProps={{ htmlInput: { maxLength: 200 } }}
            {...register("title", {
              validate: (value) => value.trim().length > 0 || "Укажите название",
            })}
          />
          <TextField
            label="Описание"
            multiline
            minRows={3}
            slotProps={{ htmlInput: { maxLength: 5000 } }}
            {...register("description")}
          />
          <Controller
            name="assigneeId"
            control={control}
            rules={{ required: "Выберите исполнителя" }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                value={field.value ?? ""}
                select
                label="Исполнитель"
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
              >
                {executors.map((executor) => (
                  <MenuItem key={executor.id} value={executor.id}>
                    {executor.full_name}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={isPending}>
            Отмена
          </Button>
          <Button type="submit" variant="contained" loading={isPending}>
            Сохранить
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
