import React from "react";
import { Routes, Route } from "react-router-dom";
import Profile from "./components/Profile";
import Search from "./components/Search";
import Promotion from "./components/Promotion";
import Map from "./components/Map";
// import Navigation from "./components/Navigation";
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
        </Routes>
      </main>
      {/* <Navigation /> */}
    </div>
  );
};

export default App;
