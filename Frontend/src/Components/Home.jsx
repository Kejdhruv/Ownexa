import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import bungalow from "../assets/bungalow.png";
import "../Styles/Components/Home.css";
import OwnexaFooter from "./Market/footer";
import Navbar from "./Market/Navbar";

export default function Home() {
  const navigate = useNavigate();
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

  const metricCards = [
    {
      label: "Verified Assets",
      value: stats?.properties ?? "--",
      note: "properties prepared for tokenized ownership",
    },
    {
      label: "Investors",
      value: stats?.users ?? "--",
      note: "users exploring fractional real estate",
    },
    {
      label: "Transfers",
      value: stats?.transactions ?? "--",
      note: "ownership actions recorded on platform",
    },
  ];

  return (
    <>
     <Navbar/>
      <main className="Home">
      <section className="Home-hero" aria-label="Ownexa landing page">
        <div className="Home-copy">
          <h1>
            Welcome to OWNEXA
            <br />
            Tokenized NFT Marketplace
          </h1>
          <p>
            Real estate ownership made fluid, beautiful, and on-chain with live
            platform activity already moving through Ownexa.
          </p>

          <div className="Home-ctaRow">
            <button type="button" onClick={() => navigate("/PrimaryMarket")}>
              Digital Asset Securities
            </button>
            <button type="button" onClick={() => navigate("/SecondaryMarket")}>
              NFT Market Place
            </button>
          </div>
        </div>

        <div className="Home-visual" aria-hidden="true">
          <div className="Home-softSquare Home-softSquareOne" />
          <div className="Home-softSquare Home-softSquareTwo" />
          <div className="Home-coin Home-coinLeft">₿</div>
          <div className="Home-coin Home-coinRight">Ξ</div>
          <img src={bungalow} alt="" className="Home-bungalow" />
        </div>
      </section>

      <section className="Home-insights" aria-label="Ownexa platform insights">
        <div className="Home-insightsHeader">
          <div>
            <div className="Home-pills">
              <span>RWA INVESTMENTS</span>
              <span>ON-CHAIN OWNERSHIP</span>
            </div>
            <h2>
              Data-driven <em> real-estate</em> insights
            </h2>
          </div>

          <p>
            Ownexa turns premium real-world assets into accessible digital
            ownership. Investors can discover verified properties, participate
            in fractional ownership, and track marketplace activity with a
            cleaner, transparent flow.
          </p>
        </div>

        <div className="Home-insightsPanel">
          <div className="Home-insightsList">
            <article className="Home-insightItem">
              <span>01</span>
              <div>
                <h3>Verified Property Pipeline</h3>
                <p>
                  Properties move through review before reaching investors, so
                  listed assets are structured around clarity, documentation,
                  and ownership readiness.
                </p>
              </div>
            </article>

            <article className="Home-featureCard">
              <div className="Home-featureIcon">▥</div>
              <div>
                <h3>Tokenized Ownership</h3>
                <p>
                  Ownexa connects real estate with blockchain rails, making
                  asset participation more flexible while keeping the ownership
                  story simple to follow.
                </p>
              </div>
            </article>

            <article className="Home-insightItem">
              <span>03</span>
              <div>
                <h3>Marketplace Movement</h3>
                <p>
                  Track demand, investor activity, and asset transfers as the
                  market grows from primary listings into secondary liquidity.
                </p>
              </div>
            </article>
          </div>

          <div className="Home-statsCanvas">
            <div className="Home-statsCard">
              <div className="Home-statsTop">
                <span>Platform Stats</span>
                <button type="button" aria-label="More platform stats">
                  ...
                </button>
              </div>

              <strong>{stats?.volume ? `INR ${stats.volume}` : "Live RWA"}</strong>
              <div className="Home-growth">+ transparent activity</div>

              <div className="Home-metrics">
                {metricCards.map((metric) => (
                  <div className="Home-metric" key={metric.label}>
                    <strong>{metric.value}</strong>
                    <span>{metric.label}</span>
                    <small>{metric.note}</small>
                  </div>
                ))}
              </div>

              <div className="Home-chart" aria-hidden="true">
                <span style={{ "--bar": "46%" }} />
                <span style={{ "--bar": "38%" }} />
                <span style={{ "--bar": "66%" }} />
                <span style={{ "--bar": "44%" }} />
                <span style={{ "--bar": "82%" }} />
                <span style={{ "--bar": "50%" }} />
                <span style={{ "--bar": "64%" }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="Home-motivation" aria-label="Ownexa motivation">
        <p className="Home-motivationKicker">OWNEXA</p>
        <h2>
          Founded to open real estate ownership to people who believe premium
          assets should not be locked behind old systems
        </h2>
        <p className="Home-motivationText">
          Ownexa is building a more transparent ecosystem for verified
          properties, fractional participation, and digital ownership flows,
          designed to make real-world asset investment simpler from discovery to
          settlement.
        </p>
        <button type="button" onClick={() => navigate("/PrimaryMarket")}>
          Read Our Story
        </button>
      </section>

      <section className="Home-discover" aria-label="Discover investment tokens">
        <div className="Home-discoverCard">
          <div className="Home-mapMock" aria-hidden="true">
            <div className="Home-mapGrid" />
            <div className="Home-mapRiver" />
            <div className="Home-mapRoad Home-mapRoadOne" />
            <div className="Home-mapRoad Home-mapRoadTwo" />
            <div className="Home-mapRadius" />
            <span className="Home-mapPin Home-mapPinOne">1</span>
            <span className="Home-mapPin Home-mapPinTwo">2</span>
            <span className="Home-mapPrice Home-mapPriceDark">₹ 48L token pool</span>
            <span className="Home-mapPrice Home-mapPriceLight">12.4% yield</span>
          </div>

          <div className="Home-discoverCopy">
            <h2>Discover Best Investment Tokens Tailored to You</h2>
            <p>
              Explore verified real estate tokens, compare ownership
              opportunities, and find assets that match your capital goals,
              risk preference, and investment horizon.
            </p>
            <button type="button" onClick={() => navigate("/PrimaryMarket")}>
              Explore Tokens
              <span>↗</span>
            </button>
          </div>
        </div>
      </section>
      </main>
      <OwnexaFooter />
    </>
  );
}
