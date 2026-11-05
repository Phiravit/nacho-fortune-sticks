import { Fragment, useEffect, useState } from "react";
import { motion } from "motion/react";
import { IngredientArt } from "../components/IngredientArt";
import { SlipStick } from "../components/SlipStick";
import type { Stick } from "../data/sticks";
import { vibrate } from "../lib/haptics";
import { useLang } from "../lib/i18n";
import { getNavState, navigate } from "../lib/router";
import { playChime } from "../lib/sound";

/**
 * Thai has no spaces between words, so browsers may wrap mid-phrase
 * ("ทีละ / ชั้น"). The space in a Thai Fortune marks a phrase break: wrap only there.
 */
function ThaiPhrases({ text }: { text: string }) {
  return text.split(" ").map((phrase, i) => (
    <Fragment key={i}>
      {i > 0 && " "}
      <span className="phrase">{phrase}</span>
    </Fragment>
  ));
}

/**
 * One Slip. Reached two ways: after Shake → Pull (the stick drops in from where
 * it flew off, and "shake again" is offered) or by Scan (the stick is already
 * pulled, and no Shake is offered — booth guests keep the stick they drew).
 */
export function SlipPage({ stick }: { stick: Stick }) {
  const { lang, t, tx } = useLang();
  const [fromShake] = useState(() => getNavState().fromShake === true);

  useEffect(() => {
    if (!fromShake) return;
    const id = window.setTimeout(() => {
      playChime();
      vibrate([20, 40, 70]);
    }, 450);
    return () => clearTimeout(id);
  }, [fromShake]);

  const name = tx(stick.ingredient.name);

  return (
    <main className="slip">
      <motion.div
        className="slip-stick"
        initial={fromShake ? { y: -460, rotate: -84 } : { y: -18, rotate: -6, opacity: 0 }}
        animate={{ y: 0, rotate: -5, opacity: 1 }}
        transition={{ type: "spring", stiffness: 150, damping: 15 }}
      >
        <SlipStick number={stick.number} label={`${t("stick")} ${stick.number}`} />
      </motion.div>

      <motion.section
        className="slip-card"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: fromShake ? 0.4 : 0.08, duration: 0.45, ease: "easeOut" }}
      >
        <motion.div
          className="art-wrap"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: fromShake ? 0.55 : 0.15, type: "spring", stiffness: 260, damping: 14 }}
        >
          <IngredientArt ingredient={stick.ingredient.key} label={name} />
        </motion.div>
        <h1 className="ingredient-name">{name}</h1>
        <div className="topic">
          <span aria-hidden>{stick.fortune.icon}</span>
          {tx(stick.fortune.topic)}
        </div>
        <p className="fortune">
          {lang === "th" ? <ThaiPhrases text={stick.fortune.text.th} /> : stick.fortune.text.en}
        </p>
      </motion.section>

      {fromShake && (
        <motion.button
          type="button"
          className="again"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          onClick={() => navigate("/")}
        >
          <span aria-hidden>↻</span> {t("again")}
        </motion.button>
      )}
    </main>
  );
}
