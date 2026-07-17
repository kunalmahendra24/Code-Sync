const express = require("express");
const cors = require("cors");
const colors = require("colors");
const socketio = require("socket.io");
const ACTIONS = require("./Actions");
require("dotenv").config();
const http = require("http");
const errorHandler = require("./middleware/errorMiddleware");
const connectDB = require("./config/db");
const Space = require("./models/spaceSchema");
connectDB();

const port = process.env.PORT || 5001;

const isAllowedOrigin = (origin) => {
  if (!origin) return true;

  const allowed = [process.env.CLIENT_URL, "http://localhost:3000"].filter(
    Boolean
  );
  if (allowed.includes(origin)) return true;
  if (origin.startsWith("https://") && origin.endsWith(".vercel.app")) {
    return true;
  }

  return false;
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
};

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});
app.use("/spaces", require("./routes/spaceRoutes"));
app.use("/users", require("./routes/userRoutes"));
app.use(errorHandler);

const server = http.createServer(app);
const io = socketio(server, {
  cors: corsOptions,
});

const removeActiveUser = async (spaceId, name, email) => {
  return Space.findOneAndUpdate(
    { spaceId },
    { $pull: { activeUsers: { name, email: email ?? null } } },
    { new: true }
  );
};

const addActiveUser = async (spaceId, name, email) => {
  await removeActiveUser(spaceId, name, email);
  return Space.findOneAndUpdate(
    { spaceId },
    { $push: { activeUsers: { name, email: email ?? null } } },
    { new: true }
  );
};

io.on("connection", (socket) => {
  console.log(`${socket.id} connected`);

  socket.on(ACTIONS.JOIN, async ({ spaceId, email, name }) => {
    try {
      if (!spaceId || !name) return;

      const space = await Space.findOne({ spaceId });
      if (!space) return;

      socket.data = { spaceId, name, email: email ?? null };
      socket.join(spaceId);

      const updated = await addActiveUser(spaceId, name, email ?? null);
      if (!updated) return;

      io.to(spaceId).emit(ACTIONS.JOINED, updated.activeUsers);
    } catch (e) {
      console.log(e);
    }
  });

  socket.on(ACTIONS.LEAVE, async ({ spaceId, name, email }) => {
    try {
      if (!spaceId || !name) return;

      const updated = await removeActiveUser(spaceId, name, email ?? null);
      if (!updated) return;

      socket.broadcast
        .to(spaceId)
        .emit(ACTIONS.LEFT, { activeUsers: updated.activeUsers, name });
      socket.leave(spaceId);
      socket.data = {};
    } catch (e) {
      console.log(e);
    }
  });

  socket.on(ACTIONS.CODE_CHANGE, ({ spaceId, change }) => {
    if (!spaceId) return;
    socket.broadcast.to(spaceId).emit(ACTIONS.SYNC_CODE, { change });
  });

  socket.on(
    ACTIONS.FILE_METADATA_CHANGE,
    async ({ spaceId, fileLang, fileName }) => {
      try {
        if (!spaceId) return;

        const space = await Space.findOne({ spaceId });
        if (!space?.spaceData?.[0]) return;

        space.spaceData[0].fileLang = fileLang;
        space.spaceData[0].fileName = fileName;
        await space.save();

        socket.broadcast
          .to(spaceId)
          .emit(ACTIONS.SYNC_FILE_METADATA, { fileName, fileLang });
      } catch (e) {
        console.log(e);
      }
    }
  );

  socket.on("disconnect", async () => {
    try {
      const { spaceId, name, email } = socket.data || {};
      if (!spaceId || !name) return;

      const updated = await removeActiveUser(spaceId, name, email ?? null);
      if (!updated) return;

      socket.broadcast
        .to(spaceId)
        .emit(ACTIONS.LEFT, { activeUsers: updated.activeUsers, name });
    } catch (e) {
      console.log(e);
    }
  });
});

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
