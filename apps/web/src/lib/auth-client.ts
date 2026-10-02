import { createAuthClient } from "better-auth/react";

import { ENV } from "../env";

export const authClient = createAuthClient({
  baseURL:
    typeof window === "undefined"
      ? ENV.VITE_SERVER_URL
      : window.location.origin,
});
