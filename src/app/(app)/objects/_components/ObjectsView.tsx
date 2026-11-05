"use client";

import { useState } from "react";
import NextLink from "next/link";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { StatusChip } from "@/components/StatusChip";
import type { ObjectListItem } from "@/shared/objects/queries";
import { TASK_STATUSES } from "@/shared/tasks/constants";
import { ObjectFormDialog } from "./ObjectFormDialog";

function getTaskWord(count: number) {
  const lastTwo = count % 100;
  const last = count % 10;

  if (lastTwo >= 11 && lastTwo <= 14) {
    return "задач";
  }
  if (last === 1) {
    return "задача";
  }
  if (last >= 2 && last <= 4) {
    return "задачи";
  }
  return "задач";
}

function ObjectCard({ object }: { object: ObjectListItem }) {
  const activeStatuses = TASK_STATUSES.filter((status) =>
    object.tasks.some((task) => task.status === status)
  );

  return (
    <Card sx={{ height: "100%" }}>
      <CardActionArea
        component={NextLink}
        href={`/objects/${object.id}`}
        sx={{ height: "100%", alignItems: "stretch", display: "flex" }}
        data-test-id="object-card"
      >
        <CardContent sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 1 }}>
          <Typography variant="h3" sx={{ overflowWrap: "anywhere" }}>
            {object.name}
          </Typography>
          <Box sx={{ display: "flex", gap: 0.5, color: "text.secondary" }}>
            <PlaceOutlinedIcon fontSize="small" />
            <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>
              {object.address}
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ mt: "auto", pt: 1, fontWeight: 500 }}>
            {object.tasks.length} {getTaskWord(object.tasks.length)}
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, minHeight: 24 }}>
            {activeStatuses.map((status) => (
              <StatusChip key={status} status={status} />
            ))}
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

type ObjectsViewProps = {
  objects: ObjectListItem[];
  canManage: boolean;
};

export function ObjectsView({ objects, canManage }: ObjectsViewProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <>
      <PageHeader
        title="Объекты"
        subtitle={canManage ? "Все стройки компании" : "Стройки, где у вас есть задачи"}
        actions={
          canManage && (
            <Button
              variant="contained"
              startIcon={<AddRoundedIcon />}
              onClick={() => setIsCreateOpen(true)}
              data-test-id="add-object"
            >
              Добавить объект
            </Button>
          )
        }
      />

      {objects.length === 0 ? (
        <EmptyState
          title="Объектов пока нет"
          description={canManage ? "Добавьте первую стройку" : "Вам ещё не назначили задачи"}
        />
      ) : (
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
          }}
        >
          {objects.map((object) => (
            <ObjectCard key={object.id} object={object} />
          ))}
        </Box>
      )}

      {canManage && <ObjectFormDialog open={isCreateOpen} onClose={() => setIsCreateOpen(false)} />}
    </>
  );
}
