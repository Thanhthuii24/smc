import React from "react";
import { useNavigate } from "react-router-dom";
import Logo from "./assets/logo.png";

const Profile: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="vh-100 bg-light m-0 p-0">
      <header className="bg-info text-white p-3 w-100">
        <div className="d-flex align-items-center justify-content-center">
          <img
            src={Logo}
            alt="ICSLab logo"
            className="me-3"
            style={{ height: "60px" }}
          />
          <h1 className="h4 mb-0">
            Smart Shopping Cart with Voice Interaction
          </h1>
        </div>
      </header>
      <main className="d-flex flex-column justify-content-center align-items-center flex-grow-1 mt-5">
        <div className="d-flex justify-content-center gap-5">
          <div
            className="rounded-circle bg-primary text-white d-flex justify-content-center align-items-center cursor-pointer"
            style={{ width: "150px", height: "150px" }}
            onClick={() => navigate("/search")}
          >
            <i className="bi bi-search" style={{ fontSize: "50px" }}></i>
          </div>
          <div
            className="rounded-circle bg-success text-white d-flex justify-content-center align-items-center cursor-pointer"
            style={{ width: "150px", height: "150px" }}
            onClick={() => navigate("/promotion")}
          >
            <i className="bi bi-gift" style={{ fontSize: "50px" }}></i>
          </div>
          <div
            className="rounded-circle bg-danger text-white d-flex justify-content-center align-items-center cursor-pointer"
            style={{ width: "150px", height: "150px" }}
            onClick={() => navigate("/map")}
          >
            <i className="bi bi-map" style={{ fontSize: "50px" }}></i>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
