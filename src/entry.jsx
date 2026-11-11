import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import PoliticalPage from "./PoliticalPage.jsx";
import AdminApp from "../admin-portal/AdminApp.jsx";

function AppRouter() {
  const [pathname, setPathname] = useState(() => window.location.pathname.toLowerCase());

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname.toLowerCase());
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Dedicated Admin Portal (Login + Dashboard + Reports + CSV)
  if (
    pathname === "/admin" ||
    pathname === "/admin/" ||
    pathname === "/admin/login" ||
    pathname === "/admin/login/" ||
    pathname.startsWith("/admin/")
  ) {
    return <AdminApp />;
  }

  // Public Citizen Portal & Website
  return <PoliticalPage />;
}

createRoot(document.getElementById("root")).render(<AppRouter />);
