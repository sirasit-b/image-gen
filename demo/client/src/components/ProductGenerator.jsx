import { useState } from "react";
import { buildPrompt, generateProductImage } from "../api";

const INITIAL = {
  name: "NORTHLINE Loop Hoodie",
  type: "oversized pullover hoodie",
  material: "brushed cotton fleece",
  color: "washed charcoal",
  angle: "front view, 85mm lens",
  style: "clean catalog style, no props",
  background: "light grey seamless",
  transparent: true,
};

export default function ProductGenerator() {
  const [form, setForm] = useState(INITIAL);
  const [state, setState] = useState({ status: "idle" });
  const prompt = buildPrompt(form);
  const set = (k) => (e) =>
    setForm({ ...form, [k]: k === "transparent" ? e.target.checked : e.target.value });

  const submit = async () => {
    setState({ status: "loading" });
    try {
      const url = await generateProductImage(prompt, form.transparent);
      setState({ status: "done", url });
    } catch (err) {
      setState({ status: "error", message: err.message });
    }
  };

  return (
    <section className="section" id="generator">
      <div className="section-head">
        <h2>Product Generator</h2>
        <p>กรอกคุณสมบัติสินค้า ระบบประกอบเป็น Prompt แล้วส่งให้ GPT Image 2.5</p>
      </div>

      <div className="split">
        <div className="form">
          {[
            ["name", "Product name"],
            ["type", "Product type / shape"],
            ["material", "Material"],
            ["color", "Color"],
            ["angle", "Angle / lens"],
            ["style", "Style"],
          ].map(([k, label]) => (
            <label key={k}>
              {label}
              <input value={form[k]} onChange={set(k)} />
            </label>
          ))}
          <label className={form.transparent ? "disabled" : undefined}>
            Background
            <input value={form.background} onChange={set("background")} disabled={form.transparent} />
          </label>
          <label className="toggle">
            <input type="checkbox" checked={form.transparent} onChange={set("transparent")} />
            Transparent background (PNG + alpha)
          </label>
          <button className="primary" onClick={submit} disabled={state.status === "loading"}>
            {state.status === "loading" ? "Generating…" : "Generate product image"}
          </button>
          {state.status === "error" && <p className="error">{state.message}</p>}
        </div>

        <div>
          <p className="label">Prompt preview</p>
          <pre className="prompt">{prompt}</pre>
          {state.status === "done" && (
            <div className="result">
              <img src={state.url} alt="generated product" />
              <p className="filename">{state.url}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
