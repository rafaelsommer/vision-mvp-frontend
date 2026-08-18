export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? "http://127.0.0.1:8000";
export const BACKEND_WS_URL = BACKEND_URL.replace(/^http/, "ws") + "/ws/detectar-video";

export const FRAME_INTERVAL_MS = 650;
export const FRAME_WIDTH = 640;

