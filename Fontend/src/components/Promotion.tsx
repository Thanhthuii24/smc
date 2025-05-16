import React, { useEffect, useState } from "react";
import axios from "axios";
import Header from "./Header";

interface Voucher {
  id: number;
  name: string;
  discount: number;
  min_price: number;
  expired_date: string;
  category: string;
}

const VoucherList: React.FC = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Fetch vouchers based on search query or all vouchers if query is empty
  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        const url = searchQuery
          ? `http://127.0.0.1:8000/vouchers/search?query=${encodeURIComponent(
              searchQuery
            )}`
          : "http://127.0.0.1:8000/vouchers";
        const response = await axios.get(url, {
          timeout: 5000,
        });
        console.log("Data from API:", response.data);
        const data = Array.isArray(response.data)
          ? response.data
          : response.data.vouchers || [];
        if (
          data.every(
            (item: any) =>
              typeof item.id === "number" &&
              typeof item.name === "string" &&
              typeof item.discount === "number" &&
              typeof item.min_price === "number" &&
              typeof item.expired_date === "string" &&
              (typeof item.category === "string" || item.category === null)
          )
        ) {
          setVouchers(data as Voucher[]);
          setLoading(false);
        } else {
          throw new Error("Data format is incorrect");
        }
      } catch (err: any) {
        console.error("Error fetching API:", err);
        let errorMessage = "Unable to load voucher list";
        if (err.code === "ERR_NETWORK") {
          errorMessage = "Network error: Please check the backend server.";
        } else if (err.response) {
          errorMessage = `Server error: ${err.response.status} - ${
            err.response.data.detail || "Unknown error"
          }`;
        } else {
          errorMessage = err.message || errorMessage;
        }
        setError(errorMessage);
        setLoading(false);
      }
    };
    fetchVouchers();
  }, [searchQuery]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setLoading(true);
    setError(null);
  };

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <Header />
      <main
        className="flex-grow-1 d-flex flex-column align-items-center py-4"
        style={{ overflowY: "auto" }}
      >
        <div
          className="card shadow"
          style={{ maxWidth: "800px", width: "100%" }}
        >
          <div className="card-body text-center">
            <h2 className="mb-4">Voucher List</h2>

            {/* Search Input */}
            <div className="mb-3">
              <input
                type="text"
                className="form-control mb-2"
                placeholder="Search by name or category..."
                value={searchQuery}
                onChange={handleSearchChange}
                disabled={loading}
              />
            </div>

            {/* Loading State */}
            {loading && (
              <div className="mt-3">
                <div className="spinner-border" role="status"></div>
                <p>Loading, please wait...</p>
              </div>
            )}

            {/* Error Message */}
            {error && <p className="text-danger mt-3">{error}</p>}

            {/* Voucher Table */}
            {!loading && !error && vouchers.length === 0 ? (
              <p className="text-muted mt-3">No vouchers available</p>
            ) : (
              !loading &&
              !error && (
                <div className="table-responsive text-start">
                  <table className="table table-striped table-bordered">
                    <thead className="table-dark">
                      <tr>
                        <th scope="col">ID</th>
                        <th scope="col">Voucher Name</th>
                        <th scope="col">Discount (%)</th>
                        <th scope="col">Min. Price ($)</th>
                        <th scope="col">Expires</th>
                        <th scope="col">Category</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vouchers.map((voucher) => (
                        <tr key={voucher.id}>
                          <td>{voucher.id}</td>
                          <td>{voucher.name}</td>
                          <td>{voucher.discount}</td>
                          <td>{voucher.min_price.toLocaleString("en-US")}</td>
                          <td>
                            {new Date(voucher.expired_date).toLocaleDateString(
                              "en-US"
                            )}
                          </td>
                          <td>{voucher.category || "All"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}

            {/* Back Button */}
            <a
              href="#"
              className="btn btn-secondary mt-3"
              onClick={() => window.history.back()}
            >
              Back
            </a>
          </div>
        </div>
      </main>
    </div>
  );
};

export default VoucherList;
