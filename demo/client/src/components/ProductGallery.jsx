import { useState } from "react";
import { PRODUCTS } from "../products";

function ProductCard({ product }) {
  const [variant, setVariant] = useState(product.variants[0].key);
  const active = product.variants.find((v) => v.key === variant);

  return (
    <article className="card">
      <div className="card-media" style={{ background: active.swatch + "1f" }}>
        <img src={product.image} alt={`${product.name} — ${active.label}`} />
      </div>
      <div className="card-body">
        <p className="category">{product.category}</p>
        <h3>{product.name}</h3>
        <p className="price">{product.price}</p>
        <div className="swatches" role="group" aria-label={`${product.name} color`}>
          {product.variants.map((v) => (
            <button
              key={v.key}
              className="swatch"
              style={{ background: v.swatch }}
              aria-label={v.label}
              aria-pressed={v.key === variant}
              onClick={() => setVariant(v.key)}
            />
          ))}
        </div>
        <p className="variant-label">{active.label}</p>
      </div>
    </article>
  );
}

export default function ProductGallery() {
  return (
    <section className="section" id="gallery">
      <div className="section-head">
        <h2>Product Gallery</h2>
        <p>Asset โปร่งใสไฟล์เดียวต่อ SKU วางบนพื้นหลังของ Variant ได้ทันที</p>
      </div>
      <div className="grid">
        {PRODUCTS.map((p) => <ProductCard key={p.sku} product={p} />)}
      </div>
    </section>
  );
}
