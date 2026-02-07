import { useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ethers } from "ethers";
import "../../Styles/Forms/AddProperty.css";

const API = import.meta.env.VITE_API_BASE;
export default function AddProperty() {
  const [walletAddress, setWalletAddress] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    ownerName: "",
    title: "",
    bhk: "",
    propertyType: "",
    builtUpAreaSqFt: "",
    addressLine: "",
    city: "",
    state: "",
    pincode: "",
    registryName: "",
    registryNumber: "",
    registrationDate: "",
    expectedPriceInr: "",
    tokenName: ""
  });

  const [propertyImages, setPropertyImages] = useState([]);
  const [legalDocuments, setLegalDocuments] = useState([]);

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        toast.error("MetaMask not found");
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setWalletAddress(accounts[0]);
    } catch (err) {
      toast.error("Wallet connection failed", err);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, value);
      });
      formData.append("accountaddress", walletAddress);
      [...propertyImages].forEach((file) =>
        formData.append("propertyImages", file)
      );

      [...legalDocuments].forEach((file) =>
        formData.append("legalDocuments", file)
      );

      const res = await fetch(
        `${API}/property/add`,
        {
          method: "POST",
          credentials: "include",
          body: formData
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success("Property submitted for admin validation");
    } catch (err) {
      toast.error(err.message || "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="add-property-page">
        <div className="form-panel">
          <h2>Add Property</h2>

          <form className="form-grid" onSubmit={handleSubmit}>
            <input
              className="full"
              name="ownerName"
              placeholder="Owner Name"
              onChange={handleChange}
              required
            />

            <input name="title" placeholder="Property Title" onChange={handleChange} required />
            <input name="bhk" placeholder="BHK" onChange={handleChange} required />
            <input name="propertyType" placeholder="Property Type" onChange={handleChange} required />
            <input name="builtUpAreaSqFt" placeholder="Built-up Area (sqft)" onChange={handleChange} required />

            <input
              className="full"
              name="addressLine"
              placeholder="Address Line"
              onChange={handleChange}
              required
            />

            <input name="city" placeholder="City" onChange={handleChange} required />
            <input name="state" placeholder="State" onChange={handleChange} required />
            <input name="pincode" placeholder="Pincode" onChange={handleChange} required />

            <input name="registryName" placeholder="Registry Name" onChange={handleChange} required />
            <input name="registryNumber" placeholder="Registry Number" onChange={handleChange} required />
            <input type="date" name="registrationDate" onChange={handleChange} required />

            <input name="expectedPriceInr" placeholder="Expected Price (INR)" onChange={handleChange} required />
            <input name="tokenName" placeholder="Token Name" onChange={handleChange} required />

            <label className="full">Property Images</label>
            <input
              className="full"
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setPropertyImages([...e.target.files])}
              required
            />

            <label className="full">Legal Documents</label>
            <input
              className="full"
              type="file"
              multiple
              accept=".pdf,image/*"
              onChange={(e) => setLegalDocuments([...e.target.files])}
              required
            />

            <div className="full wallet-actions">
              {!walletAddress ? (
                <button
                  type="button"
                  className="wallet-btn"
                  onClick={connectWallet}
                >
                  🔗 Connect Wallet
                </button>
              ) : (
                <div className="wallet-connected">
                  ✅ Connected: {walletAddress.slice(0, 6)}...
                  {walletAddress.slice(-4)}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !walletAddress}
                className="SubmitBtn"
              >
                {loading ? "Submitting..." : "Submit for Validation"}
              </button>
            </div>
          </form>
        </div>

        <div className="preview-panel">
          <h2>Live Preview</h2>
          <PreviewItem label="Wallet Address" value={walletAddress} />
          <PreviewItem label="Owner Name" value={form.ownerName} />


          <PreviewItem label="Title" value={form.title} />
          <PreviewItem label="BHK" value={form.bhk} />
          <PreviewItem label="Property Type" value={form.propertyType} />
          <PreviewItem label="Built-up Area" value={form.builtUpAreaSqFt} />

          <PreviewItem
            label="Address"
            value={`${form.address_line}, ${form.city}, ${form.state} - ${form.pincode}`}
          />

          <PreviewItem label="Registry Name" value={form.registryName} />
          <PreviewItem label="Registry Number" value={form.registryNumber} />
          <PreviewItem label="Registration Date" value={form.registrationDate} />
          <PreviewItem label="Expected Price (INR)" value={form.expectedPriceInr} />
          <PreviewItem label="Token Name" value={form.tokenName} />

          {propertyImages.length > 0 && (
            <div className="preview-card">
              <div className="preview-label">Property Images</div>
              <div className="image-preview">
                {propertyImages.map((img, idx) => (
                  <img key={idx} src={URL.createObjectURL(img)} alt="property" />
                ))}
              </div>
            </div>
          )}

          {legalDocuments.length > 0 && (
            <div className="preview-card">
              <div className="preview-label">Legal Documents</div>
              {legalDocuments.map((doc, idx) => (
                <div key={idx} className="doc-preview">📄 {doc.name}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* PREVIEW ITEM */
function PreviewItem({ label, value }) {
  if (!value) return null;

  return (
    <div className="preview-card">
      <div className="preview-label">{label}</div>
      <div className="preview-value">{value}</div>
    </div>
  );
}