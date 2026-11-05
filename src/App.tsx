import { useLayoutEffect } from "react";
import { TopBar } from "./components/TopBar";
import { findStick } from "./data/sticks";
import { navigate, usePath } from "./lib/router";
import { Home } from "./pages/Home";
import { PrintPage } from "./pages/PrintPage";
import { SlipPage } from "./pages/SlipPage";

// Routes. /s/<n> are printed into QR codes on the real Sticks and must never
// change (docs/adr/0001).
const SLIP_PATH = /^\/s\/(\d+)\/?$/;

function ToHome() {
  useLayoutEffect(() => navigate("/", { replace: true }), []);
  return null;
}

export function App() {
  const path = usePath();

  if (path === "/print" || path === "/print/") return <PrintPage />;

  let page;
  const slip = SLIP_PATH.exec(path);
  const stick = slip ? findStick(Number(slip[1])) : undefined;
  if (path === "/") page = <Home />;
  else if (stick) page = <SlipPage key={stick.number} stick={stick} />;
  else return <ToHome />; // unknown address or Stick number → back to the cup

  return (
    <div className="app">
      <TopBar />
      {page}
    </div>
  );
}
