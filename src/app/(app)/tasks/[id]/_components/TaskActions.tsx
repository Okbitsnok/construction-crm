"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import { changeTaskStatus } from "@/shared/tasks/actions";
import { ACTION_META } from "@/shared/tasks/constants";
import type { TaskTransition } from "@/shared/tasks/queries";
import type { TaskStatus } from "@/shared/supabase/database.types";

type CommentFormValues = {
  comment: string;
};

type TaskActionsProps = {
  taskId: string;
  transitions: TaskTransition[];
};

// The list of transitions comes from the database, so the buttons always match its rules.
export function TaskActions({ taskId, transitions }: TaskActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [commentTarget, setCommentTarget] = useState<TaskStatus | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CommentFormValues>({ defaultValues: { comment: "" } });

  const closeCommentDialog = () => {
    setCommentTarget(null);
    reset();
  };

  const submitStatus = (status: TaskStatus, comment?: string) => {
    setErrorMessage(null);
    startTransition(async () => {
      const result = await changeTaskStatus(taskId, status, comment);
      if (!result.ok) {
        setErrorMessage(result.message);
        return;
      }
      closeCommentDialog();
    });
  };

  if (transitions.length === 0) {
    return null;
  }

  return (
    <>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        {transitions.map(({ to_status: status, comment_required: isCommentRequired }) => (
          <Button
            key={status}
            variant="contained"
            color={ACTION_META[status].color}
            disabled={isPending}
            data-test-id={`action-${status}`}
            onClick={() => {
              if (isCommentRequired) {
                setCommentTarget(status);
                return;
              }
              submitStatus(status);
            }}
          >
            {ACTION_META[status].label}
          </Button>
        ))}
      </Box>

      {errorMessage && !commentTarget && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {errorMessage}
        </Alert>
      )}

      <Dialog open={Boolean(commentTarget)} onClose={closeCommentDialog} fullWidth maxWidth="sm">
        <Box
          component="form"
          noValidate
          onSubmit={handleSubmit(({ comment }) => {
            if (commentTarget) {
              submitStatus(commentTarget, comment.trim());
            }
          })}
        >
          <DialogTitle>{commentTarget && ACTION_META[commentTarget].label}</DialogTitle>
          <DialogContent sx={{ pt: "8px !important" }}>
            <TextField
              label="Что нужно исправить"
              autoFocus
              fullWidth
              multiline
              minRows={3}
              error={Boolean(errors.comment)}
              helperText={errors.comment?.message}
              slotProps={{ htmlInput: { maxLength: 2000, "data-test-id": "status-comment" } }}
              {...register("comment", {
                validate: (value) => value.trim().length > 0 || "Комментарий обязателен",
              })}
            />
            {errorMessage && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {errorMessage}
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={closeCommentDialog} disabled={isPending}>
              Отмена
            </Button>
            <Button
              type="submit"
              variant="contained"
              color={commentTarget ? ACTION_META[commentTarget].color : "primary"}
              loading={isPending}
            >
              Подтвердить
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );
}
