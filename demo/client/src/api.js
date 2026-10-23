export const buildPrompt = (f) =>
  `${f.name} ${f.type}, ${f.material}, ${f.color}, ${f.angle}, ${f.style}. ` +
  (f.transparent ? "Isolated, transparent background, no shadow." : `${f.background} background.`);

export async function generateProductImage(prompt, transparent) {
  const res = await fetch("/api/images/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, transparent }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "generate failed");
  return data.url;
}

export async function generateFromReference(file, prompt, campaign) {
  const form = new FormData();
  form.append("reference", file);
  form.append("prompt", prompt);
  form.append("campaign", campaign);
  const res = await fetch("/api/images/reference", { method: "POST", body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "reference generation failed");
  return data.url;
}
