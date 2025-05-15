import React, { useState } from "react";
import axios from "axios";

const Map: React.FC = () => {
  const [product, setProduct] = useState("");
  const [location, setLocation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/location/${encodeURIComponent(product)}`
      );
      setLocation(response.data.location || "Location not found");
    } catch (err) {
      setError("Failed to fetch location");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="vh-100 bg-light d-flex justify-content-center align-items-center">
      <div className="card w-75">
        <div className="card-body">
          <h2 className="text-center">Product Location Map</h2>
          <form onSubmit={handleSearch} className="mb-3">
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Enter product name..."
                value={product}
                onChange={(e) => setProduct(e.target.value)}
              />
              <button
                className="btn btn-primary"
                type="submit"
                disabled={loading}
              >
                {loading ? "Searching..." : "Find Location"}
              </button>
            </div>
          </form>
          {error && <p className="text-danger text-center">{error}</p>}
          {location && (
            <div className="text-center">
              <p>
                <strong>Location:</strong> {location}
              </p>
              <div className="border" style={{ height: "300px" }}>
                <p>Map placeholder (integrate Google Maps here)</p>
              </div>
            </div>
          )}
          <a
            href="#"
            className="btn btn-secondary mt-3"
            onClick={() => window.history.back()}
          >
            Back
          </a>
        </div>
      </div>
    </div>
  );
};

export default Map;
