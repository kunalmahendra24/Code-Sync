import { Avatar, Box, Typography } from "@mui/material";

const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

export default function Profile({ loggedInUser }) {
  const name = loggedInUser.user?.name || "User";
  const email = loggedInUser.user?.email || "";

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        minWidth: 0,
        maxWidth: { xs: "100%", sm: 280 },
      }}
    >
      <Avatar
        sx={{
          width: 40,
          height: 40,
          fontSize: 16,
          fontWeight: 700,
          bgcolor: "primary.main",
          color: "primary.contrastText",
        }}
      >
        {getInitials(name)}
      </Avatar>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="subtitle2" fontWeight={600} noWrap>
          {name}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          noWrap
          sx={{ display: "block" }}
        >
          {email}
        </Typography>
      </Box>
    </Box>
  );
}
