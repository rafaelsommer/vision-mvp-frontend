import { StrictMode, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { Activity, Camera, CircleStop, Cpu, Loader2, Play, Server, ShieldCheck, Wifi } from "lucide-react";
import { BACKEND_URL, BACKEND_WS_URL, FRAME_INTERVAL_MS, FRAME_WIDTH } from "./config";
import type { Detection, DetectionResponse } from "./types";
import "./styles.css";

function App() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const sendingRef = useRef(false);
  const frameIdRef = useRef(0);

  const [result, setResult] = useState<DetectionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">("checking");
  const [streamStatus, setStreamStatus] = useState<"idle" | "starting" | "live" | "stopped">("idle");
  const [socketStatus, setSocketStatus] = useState<"offline" | "connecting" | "online">("offline");

  useEffect(() => {
    fetch(`${BACKEND_URL}/`)
      .then((response) => {
        if (!response.ok) throw new Error("API offline");
        setApiStatus("online");
      })
      .catch(() => setApiStatus("offline"));

    return () => stopStream();
  }, []);

  const annotatedSrc = result?.annotated_image_base64
    ? `data:image/jpeg;base64,${result.annotated_image_base64}`
    : null;

  const streamLabel = useMemo(() => {
    if (streamStatus === "live") return "camera ao vivo";
    if (streamStatus === "starting") return "iniciando camera";
    if (streamStatus === "stopped") return "transmissao parada";
    return "aguardando camera";
  }, [streamStatus]);

  async function startStream() {
    setError(null);
    setStreamStatus("starting");
    setSocketStatus("connecting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "environment",
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const socket = new WebSocket(BACKEND_WS_URL);
      socketRef.current = socket;

      socket.onopen = () => {
        setSocketStatus("online");
        setStreamStatus("live");
        timerRef.current = window.setInterval(sendFrame, FRAME_INTERVAL_MS);
      };

      socket.onmessage = (event) => {
        sendingRef.current = false;
        const payload = JSON.parse(event.data);
        if (payload.error) {
          setError(payload.error);
          return;
        }
        setResult(payload);
      };

      socket.onerror = () => {
        sendingRef.current = false;
        setSocketStatus("offline");
        setError("Nao foi possivel conectar ao WebSocket do backend.");
      };

      socket.onclose = () => {
        sendingRef.current = false;
        setSocketStatus("offline");
      };
    } catch (err) {
      stopStream();
      setError(err instanceof Error ? err.message : "Nao foi possivel iniciar a camera.");
    }
  }

  function stopStream() {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    socketRef.current?.close();
    socketRef.current = null;

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    sendingRef.current = false;
    setSocketStatus("offline");
    setStreamStatus("stopped");
  }

  function sendFrame() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const socket = socketRef.current;

    if (!video || !canvas || !socket || socket.readyState !== WebSocket.OPEN || sendingRef.current) {
      return;
    }

    if (!video.videoWidth || !video.videoHeight) {
      return;
    }

    const scale = FRAME_WIDTH / video.videoWidth;
    canvas.width = FRAME_WIDTH;
    canvas.height = Math.round(video.videoHeight * scale);

    const context = canvas.getContext("2d");
    if (!context) return;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const frame = canvas.toDataURL("image/jpeg", 0.78);

    sendingRef.current = true;
    socket.send(
      JSON.stringify({
        frame_id: frameIdRef.current++,
        frame,
      }),
    );
  }

  return (
    <main className="app-shell">
      <section className="topbar">
        <div>
          <span className="eyebrow">MVP tempo real</span>
          <h1>Vision Live</h1>
        </div>
        <div className="status-row">
          <StatusPill status={apiStatus} />
          <span className={`status-pill ${socketStatus}`}>
            {socketStatus === "online" ? "stream conectado" : "stream offline"}
          </span>
        </div>
      </section>

      <section className="workspace live-workspace">
        <div className="camera-panel">
          <div className="panel-heading">
            <Camera size={22} />
            <div>
              <h2>Camera ao vivo</h2>
              <p>O navegador captura frames da camera e envia para o backend detectar em tempo real.</p>
            </div>
          </div>

          <div className="video-frame">
            <video ref={videoRef} playsInline muted />
            {streamStatus !== "live" && <span>{streamLabel}</span>}
          </div>
          <canvas ref={canvasRef} hidden />

          <div className="control-row">
            <button disabled={streamStatus === "starting" || streamStatus === "live"} onClick={startStream}>
              {streamStatus === "starting" ? <Loader2 className="spin" size={18} /> : <Play size={18} />}
              {streamStatus === "starting" ? "Iniciando" : "Iniciar camera"}
            </button>
            <button className="secondary-button" disabled={streamStatus !== "live"} onClick={stopStream}>
              <CircleStop size={18} />
              Parar
            </button>
          </div>

          {error && <p className="error">{error}</p>}
        </div>

        <div className="result-panel">
          <div className="panel-heading">
            <Activity size={22} />
            <div>
              <h2>Deteccao em tempo real</h2>
              <p>Retorno do WebSocket com classes, confianca, caixas e latencia de inferencia.</p>
            </div>
          </div>

          <div className="metrics">
            <Metric icon={<Server size={18} />} label="Device" value={result?.device ?? "-"} />
            <Metric icon={<Cpu size={18} />} label="Tempo" value={result ? `${result.inference_ms} ms` : "-"} />
            <Metric icon={<ShieldCheck size={18} />} label="Deteccoes" value={result ? String(result.detections.length) : "-"} />
            <Metric icon={<Wifi size={18} />} label="Fluxo" value={streamStatus === "live" ? `${Math.round(1000 / FRAME_INTERVAL_MS)} fps` : "-"} />
          </div>

          {annotatedSrc ? (
            <img className="annotated-image live-result" src={annotatedSrc} alt="Frame com deteccoes" />
          ) : (
            <div className="empty-state live-result">O frame anotado aparece aqui quando a camera estiver transmitindo.</div>
          )}

          <DetectionTable detections={result?.detections ?? []} />
        </div>
      </section>
    </main>
  );
}

function StatusPill({ status }: { status: "checking" | "online" | "offline" }) {
  const label = status === "checking" ? "checando API" : status === "online" ? "API online" : "API offline";
  return <span className={`status-pill ${status}`}>{label}</span>;
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="metric">
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function DetectionTable({ detections }: { detections: Detection[] }) {
  if (detections.length === 0) {
    return <div className="empty-table">Nenhuma deteccao recebida.</div>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Classe</th>
            <th>Confianca</th>
            <th>Bounding box</th>
          </tr>
        </thead>
        <tbody>
          {detections.map((detection, index) => (
            <tr key={`${detection.class_id}-${index}`}>
              <td>{detection.class_name}</td>
              <td>{Math.round(detection.confidence * 100)}%</td>
              <td>{detection.bbox.map((value) => value.toFixed(0)).join(", ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
