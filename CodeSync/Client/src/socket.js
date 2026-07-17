import { io } from "socket.io-client";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

const options = {
  reconnect_attempt: "Infinity",
  autoConnect: false,
  transports: ["websocket"],
};

export const socket = io(API_URL, options);
