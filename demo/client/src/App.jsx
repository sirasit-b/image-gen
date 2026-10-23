import Hero from "./components/Hero";
import ProductGallery from "./components/ProductGallery";
import CampaignSwitcher from "./components/CampaignSwitcher";
import ReferenceUploader from "./components/ReferenceUploader";
import ProductGenerator from "./components/ProductGenerator";

export default function App() {
  return (
    <div className="page">
      <nav className="nav">
        <span className="wordmark">NORTHLINE</span>
        <div className="nav-links">
          <a href="#gallery">Gallery</a>
          <a href="#campaigns">Campaigns</a>
          <a href="#reference">Reference</a>
          <a href="#generator">Studio</a>
        </div>
      </nav>
      <Hero />
      <ProductGallery />
      <CampaignSwitcher />
      <ReferenceUploader />
      <ProductGenerator />
      <footer className="footer">
        <p>NORTHLINE Basecamp 01 · Demo สำหรับบทความ GPT Image 2.5</p>
        <p>ทุกภาพต้องผ่าน Human Review (draft → approved → published) ก่อนขึ้นจริง</p>
      </footer>
    </div>
  );
}
