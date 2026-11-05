"use client";

import NextLink from "next/link";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import Typography from "@mui/material/Typography";
import { StatusChip } from "@/components/StatusChip";
import type { TaskListItem } from "@/shared/tasks/queries";

type TaskListProps = {
  tasks: TaskListItem[];
  showObject: boolean;
  showAssignee: boolean;
};

export function TaskList({ tasks, showObject, showAssignee }: TaskListProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {tasks.map((task) => {
        const details = [
          showObject ? task.object.name : null,
          showAssignee ? task.assignee.full_name : null,
        ].filter(Boolean);

        return (
          <Card key={task.id}>
            <CardActionArea
              component={NextLink}
              href={`/tasks/${task.id}`}
              data-test-id="task-row"
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
                p: 2,
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 600, overflowWrap: "anywhere" }}>
                  {task.title}
                </Typography>
                {details.length > 0 && (
                  <Typography variant="body2" color="text.secondary">
                    {details.join(" · ")}
                  </Typography>
                )}
              </Box>
              <Box sx={{ flexShrink: 0 }}>
                <StatusChip status={task.status} />
              </Box>
            </CardActionArea>
          </Card>
        );
      })}
    </Box>
  );
}
