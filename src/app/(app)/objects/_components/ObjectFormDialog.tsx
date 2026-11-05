"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import { createObject, updateObject, type ObjectFormValues } from "@/shared/objects/actions";
import type { ObjectData } from "@/shared/objects/queries";

const notBlank = (value: string) => value.trim().length > 0 || "Заполните поле";

type ObjectFormDialogProps = {
  open: boolean;
  onClose: () => void;
  object?: ObjectData;
};

export function ObjectFormDialog({ open, onClose, object }: ObjectFormDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ObjectFormValues>();

  useEffect(() => {
    if (open) {
      reset({ name: object?.name ?? "", address: object?.address ?? "" });
    }
  }, [open, object, reset]);

  const handleClose = () => {
    setErrorMessage(null);
    onClose();
  };

  const onSubmit = (values: ObjectFormValues) => {
    setErrorMessage(null);
    startTransition(async () => {
      const result = object ? await updateObject(object.id, values) : await createObject(values);
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
        <DialogTitle>{object ? "Редактировать объект" : "Новый объект"}</DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "8px !important" }}
        >
          <TextField
            label="Название"
            autoFocus
            error={Boolean(errors.name)}
            helperText={errors.name?.message}
            slotProps={{ htmlInput: { maxLength: 200 } }}
            {...register("name", { validate: notBlank })}
          />
          <TextField
            label="Адрес"
            error={Boolean(errors.address)}
            helperText={errors.address?.message}
            slotProps={{ htmlInput: { maxLength: 500 } }}
            {...register("address", { validate: notBlank })}
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
