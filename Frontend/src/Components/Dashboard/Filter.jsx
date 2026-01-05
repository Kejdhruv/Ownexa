import { useState } from "react";
import "../../Styles/Components/Filter.css"

export default function SortBar({ options, data, onChange }) {
  const [activeKey, setActiveKey] = useState(null);
  const [direction, setDirection] = useState(null);

  const handleSort = (key) => {
    let nextDirection = "asc";

    if (activeKey === key) {
      if (direction === "asc") nextDirection = "desc";
      else if (direction === "desc") nextDirection = null;
    }

    if (!nextDirection) {
      setActiveKey(null);
      setDirection(null);
      onChange([...data]);
      return;
    }

    const sorted = [...data].sort((a, b) => {
      if (a[key] < b[key]) return nextDirection === "asc" ? -1 : 1;
      if (a[key] > b[key]) return nextDirection === "asc" ? 1 : -1;
      return 0;
    });

    setActiveKey(key);
    setDirection(nextDirection);
    onChange(sorted);
  };

  return (
    <div className="sortbar">
      {options.map((opt) => {
        const isActive = activeKey === opt.key;

        return (
          <button
            key={opt.key}
            className={`sortbar-btn ${isActive ? "active" : ""}`}
            onClick={() => handleSort(opt.key)}
          >
            {opt.label}
            <span className="sortbar-icon">
              {!isActive && "↕"}
              {isActive && direction === "asc" && "↑"}
              {isActive && direction === "desc" && "↓"}
            </span>
          </button>
        );
      })}
    </div>
  );
}