import React from "react";
import { useNavigate } from "react-router-dom";
import Logo from "./assets/logo.png";

const Header: React.FC = () => {
  const navigate = useNavigate();

  return (
    <header className="bg-info text-white p-3 w-100">
      <div className="d-flex align-items-center justify-content-center">
        <img
          src={Logo}
          alt="ICSLab logo"
          className="me-3"
          style={{ height: "60px", width: "60px" }}
          onClick={() => navigate("/")}
        />
        <h1 className="h4 mb-0">Smart Shopping Cart with Voice Interaction</h1>
      </div>
    </header>
  );
};

export default Header;
