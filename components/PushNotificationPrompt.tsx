"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import {
  isPushSupported,
  getPermissionStatus,
  subscribeToPush,
  saveSubscriptionToServer,
} from "@/lib/push-notifications";

export default function PushNotificationPrompt() {
  const { user } = useAuth();
  const [status, setStatus] = useState<"loading" | "prompt" | "subscribed" | "denied" | "unsupported">("loading");
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    if (!user) return;

    if (!isPushSupported()) {
      setStatus("unsupported");
      return;
    }

    const perm = getPermissionStatus();
    if (perm === "granted") {
      // Already granted — make sure subscription is saved
      subscribeToPush().then((sub) => {
        if (sub) saveSubscriptionToServer(sub, user.id);
        setStatus("subscribed");
      });
    } else if (perm === "denied") {
      setStatus("denied");
    } else {
      setStatus("prompt");
    }
  }, [user]);

  const handleEnable = async () => {
    if (!user) return;
    setSubscribing(true);

    const sub = await subscribeToPush();
    if (sub) {
      await saveSubscriptionToServer(sub, user.id);
      setStatus("subscribed");
    } else {
      setStatus(getPermissionStatus() === "denied" ? "denied" : "prompt");
    }

    setSubscribing(false);
  };

  if (status === "loading" || status === "subscribed" || status === "unsupported") return null;

  if (status === "denied") {
    return (
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-center gap-3 mb-4">
        <span className="material-icons-round text-amber-400 text-lg flex-shrink-0">notifications_off</span>
        <p className="text-text-secondary text-xs">
          Notifications are blocked. To get alerts when you&apos;re next, enable them in your browser settings.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 flex items-center justify-between gap-3 mb-4">
      <div className="flex items-center gap-3 min-w-0">
        <span className="material-icons-round text-primary text-lg flex-shrink-0">notifications_active</span>
        <p className="text-text-secondary text-xs">
          Enable notifications so you know when you&apos;re next to sing!
        </p>
      </div>
      <button
        onClick={handleEnable}
        disabled={subscribing}
        className="bg-primary text-white font-bold text-xs px-4 py-2 rounded-lg flex-shrink-0 hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50"
      >
        {subscribing ? "Enabling..." : "Enable"}
      </button>
    </div>
  );
}
