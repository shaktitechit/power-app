import { io } from "socket.io-client"

const backendUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000"

export const socket = io(backendUrl, {
  autoConnect: false,
  withCredentials: true,
})
