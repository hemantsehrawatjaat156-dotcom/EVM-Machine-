import { io } from "socket.io-client";
import { BACKEND_URL } from "../config/api";

const socket = io(BACKEND_URL,{
  autoConnect:false,
  transports:["websocket","polling"]
});

export default socket;
