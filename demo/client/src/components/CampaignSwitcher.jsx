import { useState } from "react";
import { CAMPAIGNS } from "../campaigns";

export default function CampaignSwitcher() {
  const [key, setKey] = useState("studio");
  const c = CAMPAIGNS[key];

  return (
    <section className="section" id="campaigns">
      <div className="section-head">
        <h2>Campaign Switcher</h2>
        <p>ไฟล์ loop-hoodie.png ไฟล์เดิม เปลี่ยนแค่ Background, Typography และ Copy</p>
      </div>

      <div className="tabs" role="group" aria-label="campaign">
        {Object.entries(CAMPAIGNS).map(([k, v]) => (
          <button key={k} className="tab" aria-pressed={k === key} onClick={() => setKey(k)}>
            {v.label}
          </button>
        ))}
      </div>

      <div className="banner" style={{ background: c.bg, color: c.ink }}>
        <div className="banner-copy">
          <p className="eyebrow" style={{ color: c.ink, opacity: 0.6 }}>Basecamp 01</p>
          <h3>{c.copy}</h3>
          <p className="banner-sku">Loop Hoodie · {key}</p>
        </div>
        <img src="/generated/transparent/loop-hoodie.png" alt="Loop Hoodie" />
      </div>
    </section>
  );
}
