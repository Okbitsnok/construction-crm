"use client";

import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";

export default function Loading() {
  return (
    <Box>
      <Skeleton variant="text" width={220} height={44} sx={{ mb: 2 }} />
      <Skeleton variant="rounded" height={84} sx={{ mb: 1.5 }} />
      <Skeleton variant="rounded" height={84} sx={{ mb: 1.5 }} />
      <Skeleton variant="rounded" height={84} />
    </Box>
  );
}
