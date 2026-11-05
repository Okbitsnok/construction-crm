"use client";

import type { ReactNode } from "react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import DomainRoundedIcon from "@mui/icons-material/DomainRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useColorScheme } from "@mui/material/styles";
import type { CurrentProfile } from "@/shared/auth/getCurrentProfile";
import { signOut } from "@/shared/auth/actions";

const DRAWER_WIDTH = 248;

const ROLE_LABELS: Record<CurrentProfile["role"], string> = {
  manager: "Постановщик",
  executor: "Исполнитель",
};

function getNavigation(role: CurrentProfile["role"]) {
  return [
    { href: "/objects", label: "Объекты", icon: <DomainRoundedIcon /> },
    {
      href: "/tasks",
      label: role === "manager" ? "Все задачи" : "Мои задачи",
      icon: <AssignmentRoundedIcon />,
    },
  ];
}

function ThemeToggle() {
  const { mode, systemMode, setMode } = useColorScheme();
  const resolvedMode = mode === "system" ? systemMode : mode;

  if (!resolvedMode) {
    return null;
  }

  const isDark = resolvedMode === "dark";

  return (
    <Tooltip title={isDark ? "Светлая тема" : "Тёмная тема"}>
      <IconButton
        size="small"
        aria-label="Сменить тему"
        onClick={() => setMode(isDark ? "light" : "dark")}
      >
        {isDark ? (
          <LightModeRoundedIcon fontSize="small" />
        ) : (
          <DarkModeRoundedIcon fontSize="small" />
        )}
      </IconButton>
    </Tooltip>
  );
}

function LogoutButton() {
  return (
    <form action={signOut}>
      <Tooltip title="Выйти">
        <IconButton size="small" type="submit" aria-label="Выйти" data-test-id="logout">
          <LogoutRoundedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </form>
  );
}

type AppShellProps = {
  profile: CurrentProfile;
  children: ReactNode;
};

export function AppShell({ profile, children }: AppShellProps) {
  const pathname = usePathname();
  const navigation = getNavigation(profile.role);
  const activeHref = navigation.find(({ href }) => pathname.startsWith(href))?.href ?? false;

  return (
    <Box sx={{ display: "flex", minHeight: "100dvh" }}>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          width: DRAWER_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": { width: DRAWER_WIDTH, display: "flex", flexDirection: "column" },
        }}
      >
        <Box sx={{ px: 2.5, py: 2.5 }}>
          <Typography variant="h2" component="div">
            Мини-CRM
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Объекты и задачи
          </Typography>
        </Box>
        <List sx={{ px: 1, flexGrow: 1 }}>
          {navigation.map(({ href, label, icon }) => (
            <ListItemButton
              key={href}
              component={NextLink}
              href={href}
              selected={activeHref === href}
              sx={{ borderRadius: 2, mb: 0.5 }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{icon}</ListItemIcon>
              <ListItemText primary={label} />
            </ListItemButton>
          ))}
        </List>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            p: 2,
            borderTop: 1,
            borderColor: "divider",
          }}
        >
          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
            <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
              {profile.fullName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {ROLE_LABELS[profile.role]}
            </Typography>
          </Box>
          <ThemeToggle />
          <LogoutButton />
        </Box>
      </Drawer>

      <Box sx={{ flexGrow: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <Paper
          square
          elevation={0}
          sx={{
            display: { xs: "flex", md: "none" },
            alignItems: "center",
            gap: 0.5,
            px: 2,
            py: 1,
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
            <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
              {profile.fullName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {ROLE_LABELS[profile.role]}
            </Typography>
          </Box>
          <ThemeToggle />
          <LogoutButton />
        </Paper>

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: "100%",
            maxWidth: 1040,
            mx: "auto",
            px: { xs: 2, md: 4 },
            pt: { xs: 2.5, md: 4 },
            pb: { xs: 11, md: 4 },
          }}
        >
          {children}
        </Box>
      </Box>

      <Paper
        elevation={3}
        sx={{
          display: { xs: "block", md: "none" },
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: "appBar",
        }}
      >
        <BottomNavigation showLabels value={activeHref}>
          {navigation.map(({ href, label, icon }) => (
            <BottomNavigationAction
              key={href}
              component={NextLink}
              href={href}
              value={href}
              label={label}
              icon={icon}
            />
          ))}
        </BottomNavigation>
      </Paper>
    </Box>
  );
}
