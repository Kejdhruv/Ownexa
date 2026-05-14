import React from "react";
import "../../Styles/Components/footer.css";

const OwnexaFooter = () => {
  return (
    <footer className="footer">
      <div className="footer-container">

        <div className="footer-layout">

          {/* LEFT */}
          <div className="footer-left">

            <div className="footer-grid">
              <div>
                <h4>// Platform</h4>
                <ul>
                  <li>Primary Market</li>
                  <li>Secondary Market</li>
                  <li>Investor Dashboard</li>
                  <li>Property Portfolio</li>
                  <li>Ownership Records</li>
                </ul>
              </div>

              <div>
                <h4>// Features</h4>
                <ul>
                  <li>Verified Assets</li>
                  <li>Fractional Ownership</li>
                  <li>Token Listings</li>
                  <li>Marketplace Transfers</li>
                  <li>Asset Analytics</li>
                </ul>
              </div>

              <div>
                <h4>// Ownership</h4>
                <ul>
                  <li>Real Estate Tokens</li>
                  <li>Smart Contracts</li>
                  <li>On-chain Transfers</li>
                  <li>Wallet Access</li>
                  <li>Secure Settlement</li>
                </ul>
              </div>

              <div>
                <h4>// Company</h4>
                <ul>
                  <li>About Ownexa</li>
                  <li>Property Partners</li>
                  <li>Compliance</li>
                  <li>Resources</li>
                  <li>Contact</li>
                </ul>
              </div>
            </div>

            <div className="footer-line"></div>

            {/* Newsletter */}
            <div className="footer-news">
              <h3>Stay Updated</h3>
              <p>
                Get new property launches, token updates, and Ownexa platform
                announcements.
              </p>

              <div className="footer-subscribe">
                <input type="email" placeholder="Enter your email" />
                <button>Join</button>
              </div>
            </div>
          </div>

          {/* RIGHT FORM */}
          <div className="footer-form-box">
            <h4>// Contact</h4>
            <p>Have questions about tokenized real estate or asset onboarding?</p>

            <form>
              <input type="text" placeholder="Your Name" />
              <input type="email" placeholder="Your Email" />
              <textarea placeholder="Your Message"></textarea>
              <button type="submit">Send Message</button>
            </form>
          </div>

        </div>

        {/* Bottom */}
        <div className="footer-bottom">
          <p>©2026 Ownexa. All rights reserved.</p>
          <div>
            <span>Privacy</span>
            <span>Terms</span>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default OwnexaFooter;
