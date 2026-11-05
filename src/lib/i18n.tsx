import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Lang, Text } from "../data/sticks";
import { load, save } from "./storage";

const STRINGS = {
  appName: { th: "เซียมซีนาโช่", en: "Siam Si Nacho" },
  shake: { th: "เขย่า!", en: "Shake!" },
  shakeHow: { th: "แตะถ้วย หรือเขย่ามือถือ", en: "Tap the cup or shake your phone" },
  tapHow: { th: "แตะถ้วยเพื่อเขย่า", en: "Tap the cup to shake" },
  enableShake: { th: "เปิดเขย่ามือถือ", en: "Turn on phone shake" },
  tapToStart: { th: "แตะเพื่อเริ่ม", en: "Tap to start" },
  openInChrome: { th: "เปิดใน Chrome เพื่อเขย่ามือถือ", en: "Open in Chrome to shake your phone" },
  keepShaking: { th: "เขย่าต่อ!", en: "Keep shaking!" },
  pull: { th: "ดึง!", en: "Pull!" },
  again: { th: "เขย่าอีกครั้ง", en: "Shake again" },
  mute: { th: "ปิดเสียง", en: "Mute" },
  unmute: { th: "เปิดเสียง", en: "Unmute" },
  cup: { th: "ถ้วยเซียมซี", en: "Siam Si cup" },
  stick: { th: "ไม้เซียมซีหมายเลข", en: "Stick number" },
} satisfies Record<string, Text>;

export type StringKey = keyof typeof STRINGS;

/** The team behind the project; the same in every language. */
export const TEAM_NAME = "Nacho Show Pow(er)";

const KEY = "siamsi.lang";

interface LangContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: StringKey) => string;
  /** Pick the current language out of a bilingual value. */
  tx: (text: Text) => string;
}

const LangContext = createContext<LangContextValue | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() =>
    load(KEY) === "en" ? "en" : "th",
  );

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    save(KEY, next);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = `${STRINGS.appName[lang]} · ${TEAM_NAME}`;
  }, [lang]);

  const value = useMemo<LangContextValue>(
    () => ({
      lang,
      setLang,
      t: (key) => STRINGS[key][lang],
      tx: (text) => text[lang],
    }),
    [lang, setLang],
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used inside <LangProvider>");
  return ctx;
}
