import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";

export default function OAuthConsent() {
  useEffect(() => {
    window.location.replace("/");
  }, []);
  return <Navigate to="/" replace />;
}

