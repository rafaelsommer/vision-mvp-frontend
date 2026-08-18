import { StrictMode, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { Activity, Cpu, ImageUp, Loader2, Radar, Server, ShieldCheck } from "lucide-react";
import "./styles.css";

type Detection = {
  class_id: number;
  class_name: string;
  confidence: number;
  bbox: number[];
};

type DetectionResponse = {
  filename: string;
  image_width: number;
  image_height: number;
  inference_ms: number;
  device: string;
  detections: Detection[];
  annotated_image_base64: string | null;
};

const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<DetectionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">("checking");

  useEffect(() => {
    fetch(`${API_URL}/`)
      .then((response) => {
        if (!response.ok) throw new Error("API offline");
        setApiStatus("online");
      })
      .catch(() => setApiStatus("offline"));
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleFileChange(file: File | null) {
    setResult(null);
    setError(null);
    setSelectedFile(file);

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  }

  async function runDetection() {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("file", selectedFile);

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/detectar`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.detail ?? "Falha ao processar imagem.");
      }

      setResult(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  const annotatedSrc = result?.annotated_image_base64
    ? `data:image/jpeg;base64,${result.annotated_image_base64}`
    : null;

  return (
    <main className="app-shell">
      <section className="topbar">
        <div>
          <span className="eyebrow">MVP local</span>
          <h1>Vision MVP</h1>
        </div>
        <StatusPill status={apiStatus} />
      </section>

      <section className="workspace">
        <div className="upload-panel">
          <div className="panel-heading">
            <ImageUp size={22} />
            <div>
              <h2>Imagem de teste</h2>
              <p>Envie uma foto para rodar inferencia no backend FastAPI.</p>
            </div>
          </div>

          <label className="dropzone">
            <input
              type="file"
              accept="image/*"
              onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
            />
            {previewUrl ? (
              <img src={previewUrl} alt="Previa enviada" />
            ) : (
              <span>Selecionar imagem</span>
            )}
          </label>

          <button disabled={!selectedFile || loading} onClick={runDetection}>
            {loading ? <Loader2 className="spin" size={18} /> : <Radar size={18} />}
            {loading ? "Processando" : "Detectar objetos"}
          </button>

          {error && <p className="error">{error}</p>}
        </div>

        <div className="result-panel">
          <div className="panel-heading">
            <Activity size={22} />
            <div>
              <h2>Resultado</h2>
              <p>Caixas, classes, confianca e tempo de inferencia.</p>
            </div>
          </div>

          <div className="metrics">
            <Metric icon={<Server size={18} />} label="Device" value={result?.device ?? "-"} />
            <Metric
              icon={<Cpu size={18} />}
              label="Tempo"
              value={result ? `${result.inference_ms} ms` : "-"}
            />
            <Metric
              icon={<ShieldCheck size={18} />}
              label="Deteccoes"
              value={result ? String(result.detections.length) : "-"}
            />
          </div>

          {annotatedSrc ? (
            <img className="annotated-image" src={annotatedSrc} alt="Imagem com deteccoes" />
          ) : (
            <div className="empty-state">A imagem anotada aparece aqui depois do processamento.</div>
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
    return <div className="empty-table">Nenhuma deteccao carregada.</div>;
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
