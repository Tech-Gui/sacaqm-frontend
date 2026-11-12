import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import OurCityNewsWidget from "../screens/OurCityNewsWidget";

const WIDGET_ACCESS_KEY = "sacaqmWidgetAccess";

export default function WidgetAccessRoute() {
  const location = useLocation();
  const isEmbed = new URLSearchParams(location.search).get("embed") === "1";
  const hasAccess = sessionStorage.getItem(WIDGET_ACCESS_KEY) === "granted";

  if (isEmbed || hasAccess) return <OurCityNewsWidget />;

  return (
    <Navigate
      to="/news-widget-login"
      replace
      state={{ from: `${location.pathname}${location.search}` }}
    />
  );
}
