import { useLang } from "../lib/i18n";
import { setMuted, useMuted } from "../lib/sound";

function ChipMark() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden>
      <path
        d="M13 3 L23 21 L3 21 Z"
        fill="#f6a623"
        stroke="#f6a623"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <circle cx="11" cy="15" r="1.6" fill="#c8102e" />
      <circle cx="15.5" cy="17.5" r="1.3" fill="#c8102e" />
    </svg>
  );
}

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />
      {muted ? (
        <path d="M16 9.5l5 5M21 9.5l-5 5" />
      ) : (
        <>
          <path d="M15.5 9a4 4 0 0 1 0 6" />
          <path d="M18.5 6.5a7.5 7.5 0 0 1 0 11" />
        </>
      )}
    </svg>
  );
}

export function TopBar() {
  const { lang, setLang, t } = useLang();
  const muted = useMuted();

  return (
    <header className="topbar">
      <div className="brand">
        <ChipMark />
        {/* the team name, TEAM_NAME, with its "(er)" set small */}
        <span>
          Nacho Show Pow<span className="brand-er">(er)</span>
        </span>
      </div>
      <div className="controls">
        <div className="lang" role="group" aria-label="Language">
          <button type="button" aria-pressed={lang === "th"} onClick={() => setLang("th")}>
            TH
          </button>
          <button type="button" aria-pressed={lang === "en"} onClick={() => setLang("en")}>
            EN
          </button>
        </div>
        <button
          type="button"
          className="icon-btn"
          aria-label={muted ? t("unmute") : t("mute")}
          onClick={() => setMuted(!muted)}
        >
          <SpeakerIcon muted={muted} />
        </button>
      </div>
    </header>
  );
}
