import React from "react";
import { Routes, Route } from "react-router-dom";
import Profile from "./components/Profile";
import Search from "./components/Search";
import Promotion from "./components/Promotion";
import Map from "./components/Map";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

const App: React.FC = () => {
  return (
    <div className="min-vh-100 d-flex flex-column">
      <main className="flex-grow-1">
        <Routes>
          <Route path="/" element={<Profile />} />
          <Route path="/search" element={<Search />} />
          <Route path="/promotion" element={<Promotion />} />
          <Route path="/map" element={<Map />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
};

const NotFound: React.FC = () => {
  return (
    <div className="d-flex justify-content-center align-items-center flex-grow-1">
      <div className="card shadow">
        <div className="card-body text-center">
          <h2 className="mb-4">404 - Trang không tìm thấy</h2>
          <p>Đường dẫn bạn truy cập không tồn tại.</p>
          <a href="/" className="btn btn-primary">
            Quay lại Trang chủ
          </a>
        </div>
      </div>
    </div>
  );
};

export default App;
