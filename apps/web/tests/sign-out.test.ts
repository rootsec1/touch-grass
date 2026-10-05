import { afterAll, beforeEach, expect, mock, test } from "bun:test";

const revoke = mock(async () => ({
  error: null as null | { message: string },
}));
const clearCache = mock(async (_id: string) => {});
const removeIdentity = mock((_key: string) => {});
const removeServer = mock(async (_input: { endpoint: string }) => {});
const unsubscribe = mock(async () => true);
const getSubscription = mock(async () => ({
  endpoint: "https://push.example/sub",
  unsubscribe,
}));
mock.module("../src/lib/auth-client", () => ({
  authClient: { signOut: revoke },
}));
mock.module("../src/lib/journal", () => ({ clearAccountCache: clearCache }));
mock.module("../src/lib/api", () => ({
  api: { notifications: { unsubscribe: { mutate: removeServer } } },
}));
const { signOutAccount } = await import("../src/lib/sign-out");
const { disableReminders } = await import("../src/lib/notifications");
const originals = ["navigator", "localStorage"].map(
  (key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const,
);
function browser(registration: unknown = { pushManager: { getSubscription } }) {
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: { serviceWorker: { getRegistration: async () => registration } },
  });
}
beforeEach(() => {
  for (const fn of [
    revoke,
    clearCache,
    removeIdentity,
    removeServer,
    unsubscribe,
    getSubscription,
  ])
    fn.mockClear();
  browser();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: { removeItem: removeIdentity },
  });
});
afterAll(() => {
  for (const [key, descriptor] of originals) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else Reflect.deleteProperty(globalThis, key);
  }
});
for (const [name, registration] of [
  ["Safari registration without Push API", {}],
  ["no registration", null],
] as const) {
  test(`sign out with ${name}`, async () => {
    browser(registration);
    await signOutAccount("owner");
    expect(revoke).toHaveBeenCalledTimes(1);
    expect(clearCache).toHaveBeenCalledWith("owner");
    expect(removeIdentity).toHaveBeenCalledWith("touch-grass:user");
  });
}
test("sign out without service workers", async () => {
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: {},
  });
  await signOutAccount("owner");
  expect(revoke).toHaveBeenCalledTimes(1);
});
test("a blocked service worker cannot prevent sign out", async () => {
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: {
      serviceWorker: {
        getRegistration: async () => {
          throw new Error("Denied");
        },
      },
    },
  });
  await signOutAccount("owner");
  expect(revoke).toHaveBeenCalledTimes(1);
});
test("failed subscription lookup cannot prevent sign out", async () => {
  getSubscription.mockRejectedValueOnce(new Error("Push unavailable"));
  await signOutAccount("owner");
  expect(revoke).toHaveBeenCalledTimes(1);
});
test("failed server cleanup still attempts browser cleanup and signs out", async () => {
  removeServer.mockRejectedValueOnce(new Error("Network"));
  await signOutAccount("owner");
  expect(unsubscribe).toHaveBeenCalledTimes(1);
  expect(revoke).toHaveBeenCalledTimes(1);
});
test("failed browser cleanup still attempts server cleanup; explicit removal reports failure", async () => {
  unsubscribe.mockRejectedValueOnce(new Error("Push service"));
  await expect(disableReminders()).rejects.toThrow("Push service");
  expect(removeServer).toHaveBeenCalledTimes(1);
});
test("failed authentication revocation preserves the account cache", async () => {
  revoke.mockResolvedValueOnce({ error: { message: "Network" } });
  await expect(signOutAccount("owner")).rejects.toThrow("Couldn't sign out");
  expect(clearCache).not.toHaveBeenCalled();
  expect(removeIdentity).not.toHaveBeenCalled();
});
test("unavailable local caches do not leave the remote session active", async () => {
  clearCache.mockRejectedValueOnce(new Error("IndexedDB denied"));
  removeIdentity.mockImplementationOnce(() => {
    throw new Error("Storage denied");
  });
  await signOutAccount("owner");
  expect(revoke).toHaveBeenCalledTimes(1);
  expect(removeIdentity).toHaveBeenCalledTimes(1);
});
