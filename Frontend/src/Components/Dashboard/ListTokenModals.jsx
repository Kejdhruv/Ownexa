import { useState } from "react";

export default function ListTokenModal({ holding, onClose, onSubmit }) {
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <h2>List Tokens</h2>

        <p className="modal-sub">
          {holding.properties.token_name}
        </p>

        <label>
          Quantity
          <input
            type="number"
            max={holding.token_quantity}
            value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="Enter Amount"
          />
        </label>

        <label>
          Price per Token (INR)
          <input
            type="number"
            value={price}
                      onChange={(e) => setPrice(e.target.value)} 
                      placeholder="Enter your Price"
          />
        </label>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={() =>
              onSubmit({
                quantity,
                price,
              })
            }
          >
            List on Market
          </button>
        </div>
      </div>
    </div>
  );
}