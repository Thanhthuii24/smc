import React, { useEffect, useState } from "react";
import axios from "axios";

interface Voucher {
  id: number;
  name: string;
  discount: number;
  min_price: number;
  expired_date: string;
  category: string;
}

const Promotion: React.FC = () => {
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
        console.log("Dữ liệu từ API:", response.data);
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
          throw new Error("Dữ liệu không đúng định dạng");
        }
      } catch (err: any) {
        console.error("Lỗi khi gọi API:", err);
        let errorMessage = "Không thể tải danh sách mã giảm giá";
        if (err.code === "ERR_NETWORK") {
          errorMessage = "Lỗi kết nối mạng: Vui lòng kiểm tra server backend.";
        } else if (err.response) {
          errorMessage = `Lỗi từ server: ${err.response.status} - ${
            err.response.data.detail || "Lỗi không xác định"
          }`;
        } else {
          errorMessage = err.message || errorMessage;
        }
        setError(errorMessage);
        setLoading(false);
      }
    };
    fetchVouchers();
  }, [searchQuery]); // Re-run when searchQuery changes

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setLoading(true); // Show loading state while fetching new results
    setError(null); // Clear previous errors
  };

  return (
    <div className="vh-100 bg-light d-flex justify-content-center align-items-center">
      <div className="card w-75 shadow">
        <div className="card-body">
          <h2 className="text-center mb-4">Danh Sách Mã Giảm Giá</h2>
          {/* Search Input */}
          <div className="mb-4">
            <input
              type="text"
              className="form-control"
              placeholder="Tìm kiếm theo tên hoặc danh mục..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
          {loading ? (
            <p className="text-center text-muted">Đang tải...</p>
          ) : error ? (
            <p className="text-danger text-center">{error}</p>
          ) : vouchers.length === 0 ? (
            <p className="text-center text-muted">Không có mã giảm giá nào</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped table-bordered">
                <thead className="table-dark">
                  <tr>
                    <th scope="col">ID</th>
                    <th scope="col">Tên Voucher</th>
                    <th scope="col">Giảm giá (%)</th>
                    <th scope="col">Giá tối thiểu (VNĐ)</th>
                    <th scope="col">Hết hạn</th>
                    <th scope="col">Danh mục</th>
                  </tr>
                </thead>
                <tbody>
                  {vouchers.map((voucher) => (
                    <tr key={voucher.id}>
                      <td>{voucher.id}</td>
                      <td>{voucher.name}</td>
                      <td>{voucher.discount}</td>
                      <td>{voucher.min_price.toLocaleString("vi-VN")}</td>
                      <td>
                        {new Date(voucher.expired_date).toLocaleDateString(
                          "vi-VN"
                        )}
                      </td>
                      <td>{voucher.category || "Tất cả"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <a
            href="#"
            className="btn btn-secondary mt-4 d-block mx-auto"
            style={{ width: "fit-content" }}
            onClick={() => window.history.back()}
          >
            Quay lại
          </a>
        </div>
      </div>
    </div>
  );
};

export default Promotion;
