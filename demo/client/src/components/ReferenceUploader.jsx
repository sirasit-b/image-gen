import { useRef, useState } from "react";
import { CAMPAIGNS } from "../campaigns";
import { generateFromReference } from "../api";

const LOCK = `Keep exactly: hoodie shape, silhouette, fabric, main color, logo and graphic position. Change only: background, lighting, composition, mood.`;

export default function ReferenceUploader() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [campaign, setCampaign] = useState("summer");
  const [prompt, setPrompt] = useState(LOCK);
  const [state, setState] = useState({ status: "idle" });
  const inputRef = useRef(null);

  const accept = (f) => {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setState({ status: "idle" });
  };

  const onDrop = (e) => {
    e.preventDefault();
    accept(e.dataTransfer.files[0]);
  };

  const submit = async () => {
    if (!file) return;
    setState({ status: "loading" });
    try {
      const url = await generateFromReference(file, prompt, campaign);
      setState({ status: "done", url });
    } catch (err) {
      setState({ status: "error", message: err.message });
    }
  };

  return (
    <section className="section" id="reference">
      <div className="section-head">
        <h2>Reference Uploader</h2>
        <p>อัปโหลดภาพสินค้าจริง แล้วให้โมเดลเปลี่ยนเฉพาะฉาก ไม่เปลี่ยนตัวสินค้า</p>
      </div>

      <div className="split">
        <div>
          <div
            className="dropzone"
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
          >
            {preview
              ? <img src={preview} alt="reference preview" />
              : <p>ลากไฟล์มาวาง หรือคลิกเพื่อเลือก<br /><span>PNG / JPG ไม่เกิน 10 MB</span></p>}
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              hidden
              onChange={(e) => accept(e.target.files[0])}
            />
          </div>
          {file && <p className="filename">{file.name}</p>}
        </div>

        <div className="form">
          <label>
            Campaign
            <select value={campaign} onChange={(e) => setCampaign(e.target.value)}>
              {Object.entries(CAMPAIGNS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </label>
          <label>
            Prompt — ล็อกสินค้า เปลี่ยนเฉพาะฉาก
            <textarea rows={5} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
          </label>
          <button className="primary" onClick={submit} disabled={!file || state.status === "loading"}>
            {state.status === "loading" ? "Generating…" : "Generate campaign image"}
          </button>
          {state.status === "error" && <p className="error">{state.message}</p>}
          {state.status === "done" && (
            <div className="result">
              <img src={state.url} alt="campaign result" />
              <p className="filename">{state.url}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
