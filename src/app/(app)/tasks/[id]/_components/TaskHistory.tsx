"use client";

import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { DateTimeText } from "@/components/DateTimeText";
import { StatusChip } from "@/components/StatusChip";
import type { TaskHistoryItem } from "@/shared/tasks/queries";

type TaskHistoryProps = {
  history: TaskHistoryItem[];
};

export function TaskHistory({ history }: TaskHistoryProps) {
  return (
    <Box component="ol" sx={{ m: 0, p: 0, listStyle: "none" }} data-test-id="task-history">
      {history.map((item, index) => (
        <Box
          component="li"
          key={item.id}
          sx={{
            position: "relative",
            pl: 3,
            pb: index === history.length - 1 ? 0 : 2.5,
            "&::before": {
              content: '""',
              position: "absolute",
              left: 5,
              top: 7,
              width: 10,
              height: 10,
              borderRadius: "50%",
              bgcolor: index === 0 ? "primary.main" : "action.disabled",
            },
            "&::after":
              index === history.length - 1
                ? undefined
                : {
                    content: '""',
                    position: "absolute",
                    left: 9,
                    top: 22,
                    bottom: 0,
                    width: 2,
                    bgcolor: "divider",
                  },
          }}
        >
          <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 0.5 }}>
            {item.from_status ? (
              <>
                <StatusChip status={item.from_status} />
                <ArrowForwardRoundedIcon fontSize="small" color="action" />
              </>
            ) : (
              <Typography variant="body2" sx={{ fontWeight: 500, mr: 0.5 }}>
                Создана
              </Typography>
            )}
            <StatusChip status={item.to_status} />
          </Box>
          <Typography variant="body2" sx={{ mt: 0.75 }}>
            {item.actor.full_name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            <DateTimeText value={item.changed_at} />
          </Typography>
          {item.comment && (
            <Typography
              variant="body2"
              sx={{
                mt: 1,
                p: 1.25,
                borderRadius: 1,
                bgcolor: "action.hover",
                whiteSpace: "pre-wrap",
                overflowWrap: "anywhere",
              }}
            >
              {item.comment}
            </Typography>
          )}
        </Box>
      ))}
    </Box>
  );
}
