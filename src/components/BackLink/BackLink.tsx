"use client";

import NextLink from "next/link";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import Link from "@mui/material/Link";

type BackLinkProps = {
  href: string;
  label: string;
};

export function BackLink({ href, label }: BackLinkProps) {
  return (
    <Link
      component={NextLink}
      href={href}
      underline="hover"
      sx={{ alignItems: "center", display: "inline-flex", gap: 0.5, mb: 2, fontSize: "0.875rem" }}
    >
      <ArrowBackRoundedIcon fontSize="small" />
      {label}
    </Link>
  );
}
