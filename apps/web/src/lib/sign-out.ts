import { authClient } from "./auth-client";
import { clearAccountCache } from "./journal";
import { disableReminders } from "./notifications";

export async function signOutAccount(userId?: string) {
  // Optional notification cleanup must never prevent session revocation.
  await disableReminders().catch(() => {});
  const result = await authClient.signOut();
  if (result.error) throw new Error("Couldn't sign out. Please try again.");
  // Storage can be unavailable in private/restricted browsers. Still revoke
  // the session and attempt each independent piece of local cleanup.
  if (userId) await clearAccountCache(userId).catch(() => {});
  try {
    localStorage.removeItem("touch-grass:user");
  } catch {
    // The browser has denied access to local storage.
  }
}
