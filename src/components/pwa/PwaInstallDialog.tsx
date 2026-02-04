import * as React from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const DISMISS_KEY = "pwa_install_dismissed_at";
const DISMISS_DAYS = 7;

const wasDismissedRecently = () => {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const ts = Number(raw);
    if (!Number.isFinite(ts)) return false;
    const ms = DISMISS_DAYS * 24 * 60 * 60 * 1000;
    return Date.now() - ts < ms;
  } catch {
    return false;
  }
};

const markDismissed = () => {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    // ignore
  }
};

const isStandaloneMode = () => {
  // display-mode is standard; navigator.standalone is iOS Safari legacy
  const dm = window.matchMedia?.("(display-mode: standalone)")?.matches;
  const iosStandalone = (navigator as any).standalone === true;
  return Boolean(dm || iosStandalone);
};

const isIOS = () => {
  const ua = navigator.userAgent || "";
  return /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
};

export const PwaInstallDialog: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  const [installEvent, setInstallEvent] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [mode, setMode] = React.useState<"prompt" | "ios">("prompt");

  React.useEffect(() => {
    if (!import.meta.env.PROD) return;
    if (isStandaloneMode()) return;
    if (wasDismissedRecently()) return;

    if (isIOS()) {
      // iOS Safari doesn't fire beforeinstallprompt
      setMode("ios");
      setOpen(true);
      return;
    }

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
      setMode("prompt");
      setOpen(true);
    };

    const onInstalled = () => {
      setOpen(false);
      setInstallEvent(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt as EventListener);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt as EventListener);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const onLater = () => {
    markDismissed();
    setOpen(false);
  };

  const onInstall = async () => {
    if (!installEvent) {
      markDismissed();
      setOpen(false);
      return;
    }

    try {
      await installEvent.prompt();
      await installEvent.userChoice;
    } finally {
      markDismissed();
      setInstallEvent(null);
      setOpen(false);
    }
  };

  if (!import.meta.env.PROD) return null;
  if (isStandaloneMode()) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => {
      if (!v) markDismissed();
      setOpen(v);
    }}>
      <DialogContent className="w-[95vw] max-w-lg">
        <DialogHeader>
          <DialogTitle>Installer l’application</DialogTitle>
          <DialogDescription>
            {mode === "ios"
              ? "Sur iPhone/iPad : ouvre le menu Partager, puis “Sur l’écran d’accueil”."
              : "Installe l’app pour un accès rapide, et pour que le mode hors-ligne fonctionne au mieux."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onLater}>
            Plus tard
          </Button>
          <Button onClick={onInstall} disabled={mode !== "ios" && !installEvent}>
            Installer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
