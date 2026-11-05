"use client";

import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

type EmptyStateProps = {
  title: string;
  description?: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <Paper variant="outlined" sx={{ p: 4, textAlign: "center", borderStyle: "dashed" }}>
      <Typography variant="h3">{title}</Typography>
      {description && (
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          {description}
        </Typography>
      )}
    </Paper>
  );
}
