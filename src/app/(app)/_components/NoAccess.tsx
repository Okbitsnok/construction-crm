"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { signOut } from "@/shared/auth/actions";

export function NoAccess() {
  return (
    <Box sx={{ minHeight: "100dvh", display: "grid", placeItems: "center", p: 2 }}>
      <Box sx={{ textAlign: "center", maxWidth: 420 }}>
        <Typography variant="h1">Нет доступа</Typography>
        <Typography color="text.secondary" sx={{ my: 2 }}>
          Для вашего аккаунта не назначена роль. Обратитесь к администратору.
        </Typography>
        <form action={signOut}>
          <Button type="submit" variant="outlined">
            Выйти
          </Button>
        </form>
      </Box>
    </Box>
  );
}
