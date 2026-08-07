import React from "react";
import { Avatar, AvatarGroup, Box, Divider, Typography } from "@mui/material";
import { HtmlTooltip } from "../MUICustom/HtmlTooltip";

export default function ActiveUsers({ activeUsers }) {
  return (
    <HtmlTooltip
      sx={{ overflow: "auto", maxHeight: "15vw" }}
      title={
        <>
          {activeUsers.length > 0 &&
            activeUsers.map((user, index) => (
              <Box
                key={`${user.name}-${index}`}
                sx={{
                  mt: 1,
                  mb: 1,
                  mr: 1,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography
                  sx={{ fontSize: 15, fontWeight: 400, ml: 1, color: "white" }}
                >
                  {user.name}
                </Typography>
                {index !== activeUsers.length - 1 && (
                  <Divider
                    sx={{ backgroundColor: "text.primary", opacity: "0.3" }}
                  />
                )}
              </Box>
            ))}
        </>
      }
    >
      <Box sx={{ display: "flex", alignItems: "center", mr: "2vh", mt: "1vh" }}>
        <Typography
          variant="h5"
          sx={{ color: "text.primary", fontSize: 20, fontWeight: 400 }}
        >
          Users Online -
        </Typography>
        <AvatarGroup max={5}>
          {activeUsers.length > 0 &&
            activeUsers.map((user, index) => (
              <Avatar key={`${user.name}-${index}`}>
                {user.name?.charAt(0)}
              </Avatar>
            ))}
        </AvatarGroup>
      </Box>
    </HtmlTooltip>
  );
}
