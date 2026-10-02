import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { toast } from "@touch-grass/ui/components/toast";
interface InstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}
const PwaContext = createContext({
  installed: false,
  canInstall: false,
  install: async () => {},
  needRefresh: false,
  update: async () => {},
  offlineReady: false,
});
export function PwaProvider({ children }: { children: ReactNode }) {
  const [prompt, setPrompt] = useState<InstallEvent>();
  const [installed, setInstalled] = useState(false);
  const [ready, setReady] = useState(false);
  const {
    needRefresh: [needRefresh],
    offlineReady: [offlineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError: () =>
      toast.add({
        title: "Offline setup couldn't finish",
        description: "Keep browsing online and try reloading later.",
        type: "warning",
      }),
  });
  useEffect(() => {
    const media = matchMedia("(display-mode: standalone)");
    setInstalled(media.matches);
    void navigator.serviceWorker
      ?.getRegistration()
      .then((reg) => setReady(Boolean(reg?.active)));
    const before = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallEvent);
    };
    const complete = () => {
      setInstalled(true);
      setPrompt(undefined);
    };
    window.addEventListener("beforeinstallprompt", before);
    window.addEventListener("appinstalled", complete);
    return () => {
      window.removeEventListener("beforeinstallprompt", before);
      window.removeEventListener("appinstalled", complete);
    };
  }, []);
  return (
    <PwaContext
      value={{
        installed,
        canInstall: Boolean(prompt),
        offlineReady: offlineReady || ready,
        needRefresh,
        update: () => updateServiceWorker(true),
        install: async () => {
          if (prompt) {
            await prompt.prompt();
            await prompt.userChoice;
            setPrompt(undefined);
          }
        },
      }}
    >
      {children}
    </PwaContext>
  );
}
export const usePwa = () => useContext(PwaContext);
