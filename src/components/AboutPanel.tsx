import { X } from 'lucide-react';
import qrArtwork from '../assets/ura-yamanote-animated-qr-square.webp';

interface AboutPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutPanel({ isOpen, onClose }: AboutPanelProps) {
  if (!isOpen) return null;

  return (
    <div className="about-backdrop" onMouseDown={onClose}>
      <aside
        className="about-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          className="icon-button about-close"
          type="button"
          onClick={onClose}
          aria-label="Close about panel"
          title="Close"
        >
          <X size={18} />
        </button>
        <p className="eyebrow">LOOP 01 · AUDIO SYSTEM</p>
        <h2 id="about-title">ウラ YAMANOTE</h2>
        <img src={qrArtwork} alt="Ura Yamanote animated artwork" />
        <p lang="ja">
          東京の中心ループの下に、もう一つの音響空間が共鳴している。
          各駅は、山手線の見えないリズムへつながるポータルとなる。
        </p>
        <p>
          A location-reactive sound work for Tokyo&apos;s central loop. Each station opens a different
          passage into the hidden rhythms of the Yamanote Line.
        </p>
        <p className="privacy-note">Location stays in your browser and is used only to select the nearest sound zone.</p>
        <p className="privacy-note">
          3D rail geometry is created from Japan&apos;s 2025 National Land Numerical Information railway data.
        </p>
        <a
          href="https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N02-2025.html"
          target="_blank"
          rel="noreferrer"
        >
          Railway data · MLIT Japan
        </a>
        <a
          href="https://www.mlit.go.jp/plateau/"
          target="_blank"
          rel="noreferrer"
        >
          Buildings & roads · MLIT Project PLATEAU · CC BY 4.0
        </a>
        <a
          href="https://docs.plateauview.mlit.go.jp/datasets/terrain/"
          target="_blank"
          rel="noreferrer"
        >
          Terrain · PLATEAU | Mapterhorn | GSI
        </a>
        <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">
          Weather · Open-Meteo
        </a>
        <a href="mailto:contact@ula-yamanote.tokyo">contact@ula-yamanote.tokyo</a>
      </aside>
    </div>
  );
}
