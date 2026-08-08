import { io } from "socket.io-client";
import { getApiUrl } from "./utils/apiUrl";

const options = {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  transports: ["polling", "websocket"],
};

export const socket = io(getApiUrl(), options);
