import { useEffect } from "react";
import { Building2, Gem, ArrowRight } from "lucide-react";
import "../../Styles/Components/Loaders/TxLoader.css";

export default function TxLoader({
  open,
  direction = "ESTATE_TO_ETH", // or "ETH_TO_ESTATE"
  title = "Processing transaction",
  subtitle = "Confirm in MetaMask…",
  txHash,
  onClose,
}) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const reverse = direction === "ETH_TO_ESTATE";

  return (
    <div className="txm-overlay" onClick={onClose}>
      <div className="txm-card" onClick={(e) => e.stopPropagation()}>
        <div className="txm-head">
          <div className="txm-title">{title}</div>
          <button className="txm-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className={`txm-flow ${reverse ? "txm-reverse" : ""}`}>
          <div className="txm-node">
            <div className="txm-iconWrap txm-estate">
              <Building2 size={22} />
            </div>
            <div className="txm-nodeText">ESTATE</div>
          </div>

          <div className="txm-rail" aria-hidden="true">
            <div className="txm-stream" />
            <div className="txm-arrows">
              <ArrowRight size={18} />
              <ArrowRight size={18} />
              <ArrowRight size={18} />
              <ArrowRight size={18} />
            </div>
          </div>

          <div className="txm-node">
            <div className="txm-iconWrap txm-eth">
              <Gem size={22} />
            </div>
            <div className="txm-nodeText">ETH</div>
          </div>
        </div>

        <div className="txm-sub">{subtitle}</div>

        {txHash ? (
          <div className="txm-hash">
            <span className="txm-hashLabel">Tx:</span>
            <span className="txm-hashVal">{txHash}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}