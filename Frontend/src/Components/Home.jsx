import { useEffect, useState } from "react";
import "../Styles/Components/Home.css";

export default function Home() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("http://localhost:4000/public/stats");
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch stats", err);
      }
    };
    fetchStats();
  }, []);

    useEffect(() => {
    const els = document.querySelectorAll("[data-reveal]");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);


  const formatVolume = (num) => {
    if (!num) return "₹ 0000 0000 0000";
    const digits = num.toString().slice(0, 12);
    return `₹ ${digits.replace(/(\d{4})(\d{4})(\d{4})/, "$1 $2 $3")}`;
  };

  return (
    <>
      <section className="Home">
        {/* Background Text */}
        <div className="Home-bgText" data-reveal="bg">
          <span>REAL VALUE</span>
          <span>ON CHAIN</span>
        </div>

        {/* Floating Glass Panels */}
        <div className="Home-panels" data-reveal>
          {/* LEFT PANEL */}
          <div className="Home-panel Home-panelLeft">
            <div className="Home-brand">OWNEXA</div>

            <div className="Home-amount">
              {formatVolume(stats?.volume)}
              <span className="Home-label">TOTAL VOLUME TRANSFERRED</span>
            </div>

            <div className="Home-footer">
              <span>SECURED REAL ASSET FLOWS</span>
              <span>POWERED BY ETH</span>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="Home-panel Home-panelRight">
            <div className="Home-brand">OWNEXA</div>

            <div className="Home-stats">
              <span>{stats ? `${stats.users}+ INVESTORS` : "— INVESTORS"}</span>
              <span>
                {stats ? `${stats.properties}+ PROPERTIES` : "— PROPERTIES"}
              </span>
              <span>
                {stats ? `${stats.transactions}+ TRANSACTIONS` : "— TRANSACTIONS"}
              </span>
            </div>

            <div className="Home-footer">
              <span>PLATFORM ACTIVITY</span>
              <span className="Home-live">LIVE</span>
            </div>
          </div>
        </div>
      </section>
      {/* =========================
          VALUE FLOW SECTION
      ========================= */}
      <section className="Flow">
        <div className="Flow-title" data-reveal>Make Your Assets Work</div>

        {/* Continuous Flow Glow */}
        <div className="Flow-glow" />

        <div className="Flow-cards" data-reveal>
          {/* MONEY IN */}
          <div className="Flow-card Flow-cardMoney" data-flow="1">
            <div className="Flow-cardTop">
              <span className="Flow-cardIssuer">0X</span>
              <span className="Flow-cardNetwork">INR</span>
            </div>

            <div className="Flow-cardNumber">
              XXXX&nbsp;XXXX&nbsp;XXX
            </div>

            <div className="Flow-cardStatus">
              LIQUID
            </div>

            <div className="Flow-cardMeta">
              IN FLOW
            </div>
          </div>

          {/* ASSET */}
          <div className="Flow-card Flow-cardMoney" data-flow="2">
            <div className="Flow-cardTop">
              <span className="Flow-cardIssuer">0X</span>
              <span className="Flow-cardNetwork">VERIFIED</span>
            </div>

            <div className="Flow-cardNumber">
              REAL ESTATE
            </div>

            <div className="Flow-cardStatus">
              FRACTIONAL OWNERSHIP
            </div>

            <div className="Flow-cardMeta">
              VALIDATED
            </div>
          </div>

          {/* TOKEN */}
          <div className="Flow-card Flow-cardMoney" data-flow="3">
            <div className="Flow-cardTop">
              <span className="Flow-cardIssuer">0X</span>
              <span className="Flow-cardNetwork">ERC-1155</span>
            </div>

            <div className="Flow-cardNumber">
              TOKEN
            </div>

            <div className="Flow-cardStatus">
              PROGRAMMABLE
            </div>

            <div className="Flow-cardMeta">
              ON-CHAIN
            </div>
          </div>

          {/* MONEY OUT */}
          <div className="Flow-card Flow-cardMoney" data-flow="4">
            <div className="Flow-cardTop">
              <span className="Flow-cardIssuer">0X</span>
              <span className="Flow-cardNetwork">ETH</span>
            </div>

            <div className="Flow-cardNumber">
              AVAILABLE
            </div>

            <div className="Flow-cardStatus">
              WALLET
            </div>

            <div className="Flow-cardMeta">
              YOU CONTROL
            </div>
          </div>
        </div>
      </section>



      <section className="Lifecycle">
        {/* LEFT — SYSTEM FLOW */}
        <div className="Lifecycle-left" data-reveal>
          {/* Subtle Principle */}
          <div className="Lifecycle-principle" data-reveal>
            <span className="span1">VALUE IN</span>
            <span className="span2">MOTION</span>
          </div>

          {/* Curve */}
          <svg
            className="Lifecycle-curve"
            viewBox="0 0 300 800"
            preserveAspectRatio="none"
          >
            <path
              d="
               M5 600
               Q 300 400,
               300 20
                "
              fill="none"
              stroke="rgba(59,130,246,0.35)"
              strokeWidth="2"
            />
          </svg>

          {/* Floating States */}
          <div className="Lifecycle-states" data-reveal>
            <div className="Lifecycle-state" data-step="1">LISTED</div>
            <div className="Lifecycle-state" data-step="2">VERIFIED</div>
            <div className="Lifecycle-state" data-step="3">TRADE</div>
            <div className="Lifecycle-state" data-step="4">SETTLE</div>
          </div>

          {/* Flow Glow */}
          <div className="Lifecycle-flowGlow" />
        </div>

        {/* RIGHT — PHILOSOPHY */}
        <div className="Lifecycle-right" >
          <p className="line1">REAL ASSETS ARE ILLIQUID.</p>
          <p className="line1">CRYPTO IS VOLATILE.</p>
          <p className="line1">TRADITIONAL SYSTEMS ARE CLOSED.</p>

          <br />

          <p className="Lifecycle-emphasis" data-reveal>OWNEXA CONNECTS THEM.</p>
        </div>
      </section>
    </>
  );
}