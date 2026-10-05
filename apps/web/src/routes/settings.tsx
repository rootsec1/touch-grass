import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@touch-grass/ui/components/button";
import { Switch } from "@touch-grass/ui/components/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@touch-grass/ui/components/dialog";
import { toast } from "@touch-grass/ui/components/toast";
import { Download, Bell, LogOut, Share, PlusSquare, Leaf } from "lucide-react";
import { PageHeading, ErrorState } from "@/components/page";
import { useUser, useConfig, useJournal, useOnline } from "@/lib/use-journal";
import { usePwa } from "@/lib/pwa";
import { api } from "@/lib/api";
import { disableReminders, getPushManager } from "@/lib/notifications";
import { signOutAccount } from "@/lib/sign-out";
export const Route = createFileRoute("/settings")({ component: Settings });
function Settings() {
  const { user } = useUser();
  const { items } = useJournal();
  const { data: config } = useConfig();
  const online = useOnline();
  const pwa = usePwa();
  const [help, setHelp] = useState(false);
  const [push, setPush] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const client = useQueryClient();
  const [supported, setSupported] = useState(false);
  useEffect(() => {
    let active = true;
    void getPushManager()
      .then(async (manager) => {
        if (!active) return;
        setSupported(Boolean(manager) && "Notification" in window);
        const sub = user && (await manager?.getSubscription());
        const enabled = sub
          ? await api.notifications.status.query({ endpoint: sub.endpoint })
          : false;
        if (active) setPush(enabled);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [user?.id, pwa.offlineReady]);
  async function reminders(enabled: boolean) {
    setBusy(true);
    setError("");
    try {
      if (!enabled) {
        await disableReminders();
        setPush(false);
        return;
      }
      if (!supported || !("Notification" in window))
        throw new Error(
          "Reminders aren't available in this browser. On iPhone, open Touch Grass from your home screen.",
        );
      if (!config?.pushKey)
        throw new Error("Reminders aren't configured on this server yet.");
      if ((await Notification.requestPermission()) !== "granted")
        throw new Error(
          "Notifications aren't allowed. You can enable them in your browser's site settings.",
        );
      const manager = await getPushManager();
      if (!manager)
        throw new Error("Reminders aren’t ready. Please reload and try again.");
      const key = Uint8Array.from(
        atob(config.pushKey.replace(/-/g, "+").replace(/_/g, "/")),
        (c) => c.charCodeAt(0),
      );
      const sub =
        (await manager.getSubscription()) ||
        (await manager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: key,
        }));
      const json = sub.toJSON();
      await api.notifications.subscribe.mutate({
        endpoint: sub.endpoint,
        keys: { p256dh: json.keys!.p256dh!, auth: json.keys!.auth! },
      });
      setPush(true);
      toast.add({
        title: "A gentle nudge, now and then",
        description:
          "Follow a discovery to receive a revisit reminder, at most every two weeks.",
        type: "success",
      });
    } catch (e) {
      setError(
        e instanceof DOMException
          ? "This browser couldn’t connect to its notification service. Try opening the installed app in Safari, Chrome, or Firefox."
          : e instanceof Error
            ? e.message
            : "Couldn't change reminder settings.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function signOut() {
    setBusy(true);
    setError("");
    try {
      await signOutAccount(user?.id);
      client.clear();
      // Discard mounted session observers along with the signed-out account caches.
      window.location.replace("/");
    } catch {
      setError("Couldn’t sign out. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }
  function exportJournal() {
    const blob = new Blob(
      [
        JSON.stringify(
          { exportedAt: new Date().toISOString(), discoveries: items },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "touch-grass-journal.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div className="page page-narrow">
      <PageHeading
        title="Your journal, your way"
        description="A few things to make yourself at home."
      />
      {error ? (
        <div className="mb-5">
          <ErrorState message={error} />
        </div>
      ) : null}
      <div className="settings-cover">
        <img src="/images/oak-study.webp" alt="" />
        <div>
          <strong>{user?.name || "A curious observer"}</strong>
          <p>A little closer to the world outside.</p>
        </div>
      </div>
      <section className="settings-section">
        <h2>Your account</h2>
        <div className="settings-row">
          <div>
            <strong>{user?.name || "A place for your discoveries"}</strong>
            <p>
              {user?.email || "Sign in to keep your journal across devices."}
            </p>
          </div>
          {user ? (
            <Button
              variant="outline"
              disabled={busy || !online}
              onClick={() => void signOut()}
            >
              <LogOut data-icon="inline-start" />
              Sign out
            </Button>
          ) : (
            <Button nativeButton={false} render={<Link to="/login" />}>
              Sign in
            </Button>
          )}
        </div>
      </section>
      <section className="settings-section">
        <h2>Take it outside</h2>
        <div className="settings-row">
          <div>
            <strong>
              {pwa.installed
                ? "At home on your device"
                : "Keep it in your pocket"}
            </strong>
            <p>
              Add Touch Grass to your home screen. Keep photos on your walk,
              even offline.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() =>
              pwa.canInstall ? void pwa.install() : setHelp(true)
            }
          >
            <Download data-icon="inline-start" />
            {pwa.installed ? "Installed" : "Install"}
          </Button>
        </div>
        <div className="settings-row">
          <div>
            <strong>
              {pwa.needRefresh ? "A fresh version is ready" : "Offline journal"}
            </strong>
            <p>
              {pwa.needRefresh
                ? "Your drafts are saved. Reload to use the latest version."
                : pwa.offlineReady
                  ? "The app is ready offline. Open discoveries once to keep their photos on this device."
                  : "The app downloads its offline essentials while you're connected."}
            </p>
          </div>
          {pwa.needRefresh ? (
            <Button variant="outline" onClick={() => void pwa.update()}>
              Update
            </Button>
          ) : (
            <Leaf className="text-primary shrink-0" />
          )}
        </div>
      </section>
      <section className="settings-section">
        <h2>Gentle reminders</h2>
        <div className="settings-row">
          <div>
            <label htmlFor="reminders" className="font-medium">
              Time for another look?
            </label>
            <p>
              {supported
                ? "A reminder to revisit trees you follow, at most once every two weeks. No streaks to maintain."
                : "This browser doesn't support push yet. On iPhone, add the app to your home screen, then open it there."}
            </p>
            {!user ? <p>Sign in to turn on reminders.</p> : null}
          </div>
          <Switch
            id="reminders"
            checked={push}
            disabled={
              !user || !supported || busy || !online || !config?.pushKey
            }
            onCheckedChange={(value) => void reminders(value)}
          />
        </div>
        {push ? (
          <Button
            className="mt-3"
            variant="outline"
            disabled={!online || busy}
            onClick={() => {
              setBusy(true);
              void api.notifications.test
                .mutate()
                .then(() =>
                  toast.add({ title: "Test reminder sent", type: "success" }),
                )
                .catch((e) => setError(e.message))
                .finally(() => setBusy(false));
            }}
          >
            <Bell data-icon="inline-start" />
            Send a test reminder
          </Button>
        ) : null}
      </section>
      <section className="settings-section">
        <h2>Yours to keep</h2>
        <div className="settings-row">
          <div>
            <strong>Export your journal</strong>
            <p>
              Download names, notes, locations, and visits as JSON. Photographs
              are not included in this export.
            </p>
          </div>
          <Button
            variant="outline"
            disabled={!items.length}
            onClick={exportJournal}
          >
            Export
          </Button>
        </div>
        <div className="settings-row">
          <div>
            <strong>A private little corner</strong>
            <p>
              Only you can see your discoveries and precise locations. Photo
              metadata is removed before storage. Identification photos go to
              Google Gemini only when you request a match.
            </p>
            <p>
              Saved drafts stay on this device until synced. Signing out clears
              downloaded journal photos; unsynced drafts remain tied to your
              account.
            </p>
          </div>
        </div>
      </section>
      <Dialog open={help} onOpenChange={setHelp}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>A little closer, one tap away.</DialogTitle>
            <DialogDescription>
              Install Touch Grass from your browser. No app store needed.
            </DialogDescription>
          </DialogHeader>
          <p className="leading-relaxed">
            <strong>On iPhone or iPad:</strong> open this page in Safari, tap{" "}
            <Share className="inline" size={16} /> Share, then{" "}
            <PlusSquare className="inline" size={16} /> Add to Home Screen.
          </p>
          <p className="leading-relaxed">
            <strong>On Android or desktop:</strong> open your browser menu and
            choose “Install app” or “Add to home screen”. The option appears
            once the app is ready.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
