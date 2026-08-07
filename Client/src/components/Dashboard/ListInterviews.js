import { Box } from "@mui/material";
import React from "react";
import LoadingCard from "./LoadingCard";
import InterviewCard from "./InterviewCard";

function ListInterviews({
  setMessage,
  setSuccess,
  setError,
  loggedInUser,
  listInterviews,
  dispatch,
}) {
  return (
    <Box
      sx={{
        pl: 5,
        pr: 5,
        display: "flex",
        justifyContent: "center",
      }}
    >
      {listInterviews !== undefined ? (
        listInterviews.length === 0 ? (
          <Box
            component="img"
            sx={{
              height: 400,
              display: "block",
              ml: "auto",
              mr: "auto",
              width: "35%",
            }}
            alt="No interviews found"
            src="/no_result1.png"
          />
        ) : (
          <Box>
            {listInterviews.map((item) => (
              <InterviewCard
                key={item.roomId}
                item={item}
                loggedInUser={loggedInUser}
                setMessage={setMessage}
                setSuccess={setSuccess}
                setError={setError}
                dispatch={dispatch}
              />
            ))}
          </Box>
        )
      ) : (
        <LoadingCard />
      )}
    </Box>
  );
}

export default ListInterviews;
