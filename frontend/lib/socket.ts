import { io } from "socket.io-client"

export const socket = io("http://localhost", {
  autoConnect: false,
  withCredentials: true
})

// export const socket = io("https://power-backend-production.up.railway.app", {
//   autoConnect: false,
//   withCredentials: true
// })