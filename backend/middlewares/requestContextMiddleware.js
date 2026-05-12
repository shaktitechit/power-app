import { randomUUID } from "crypto";
import { requestStore } from "../lib/requestContext.js";

const requestContextMiddleware = (req, res, next) => {
  req.requestId = randomUUID();
  req.requestStartTime = Date.now();

  res.setHeader("X-Request-Id", req.requestId);

  // Bind the current request into AsyncLocalStorage so helpers (e.g.
  // createRecentActivity) can read request data (cookies, user, etc.)
  // without needing req passed as an argument.
  requestStore.run(req, next);
};

export default requestContextMiddleware;
