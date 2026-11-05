import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MotionConfig } from "motion/react";
import { App } from "./App";
import { LangProvider } from "./lib/i18n";
import { unlockAudio } from "./lib/sound";
import "./styles.css";

// Audio may only start inside a user gesture; any tap anywhere unlocks it.
for (const type of ["pointerup", "touchend", "click", "keydown"]) {
  document.addEventListener(type, unlockAudio, { passive: true });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LangProvider>
      <MotionConfig reducedMotion="user">
        <App />
      </MotionConfig>
    </LangProvider>
  </StrictMode>,
);
