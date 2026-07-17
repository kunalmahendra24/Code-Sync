import { io } from "socket.io-client";
import { getApiUrl } from "./utils/apiUrl";

const options = {
  reconnect_attempt: "Infinity",
  autoConnect: false,
  transports: ["websocket", "polling"],
};

export const socket = io(getApiUrl(), options);
