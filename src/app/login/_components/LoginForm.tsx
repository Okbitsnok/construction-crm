"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { signIn } from "@/shared/auth/actions";

type LoginFormValues = {
  email: string;
  password: string;
};

export function LoginForm() {
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ defaultValues: { email: "", password: "" } });

  const onSubmit = (values: LoginFormValues) => {
    setErrorMessage(null);
    startTransition(async () => {
      const result = await signIn(values);
      if (!result.ok) {
        setErrorMessage(result.message);
      }
    });
  };

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
    >
      <Paper variant="outlined" sx={{ width: "100%", maxWidth: 400, p: { xs: 3, sm: 4 } }}>
        <Typography variant="h1" component="h1">
          Мини-CRM
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>
          Войдите, чтобы продолжить. Доступы выдаёт администратор.
        </Typography>
        <Box
          component="form"
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            autoFocus
            error={Boolean(errors.email)}
            helperText={errors.email?.message}
            {...register("email", { required: "Укажите email" })}
          />
          <TextField
            label="Пароль"
            type="password"
            autoComplete="current-password"
            error={Boolean(errors.password)}
            helperText={errors.password?.message}
            {...register("password", { required: "Укажите пароль" })}
          />
          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
          <Button type="submit" variant="contained" size="large" loading={isPending}>
            Войти
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
