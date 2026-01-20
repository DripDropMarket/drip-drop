export function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return Promise.resolve(false);
  }

  if (Notification.permission === "granted") {
    return Promise.resolve(true);
  }

  if (Notification.permission === "denied") {
    return Promise.resolve(false);
  }

  return Notification.requestPermission().then((permission) => {
    return permission === "granted";
  });
}

export function showNotification(title: string, options?: NotificationOptions): void {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return;
  }

  if (Notification.permission === "granted") {
    new Notification(title, {
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      ...options,
    });
  }
}

export function isNotificationSupported(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return "Notification" in window;
}

export function getNotificationPermission(): NotificationPermission | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }
  return Notification.permission;
}
