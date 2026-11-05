export type Lang = "th" | "en";
export type Text = Record<Lang, string>;

export type IngredientKey = "seaweed" | "sausage" | "crabStick" | "cheese";

export interface Stick {
  number: number;
  ingredient: { key: IngredientKey; name: Text };
  fortune: { topic: Text; icon: string; text: Text };
}

// One Stick per Ingredient. The numbers are printed into QR codes (/s/<n>),
// so never renumber an existing Stick — only append new ones.
export const STICKS: Stick[] = [
  {
    number: 1,
    ingredient: { key: "seaweed", name: { th: "สาหร่าย", en: "Seaweed" } },
    fortune: {
      topic: { th: "สมหวัง", en: "Wishes" },
      icon: "✨",
      text: {
        th: "ทุกอย่างลื่นไหล คำขอจะสมหวัง",
        en: "Everything flows — your wish comes true",
      },
    },
  },
  {
    number: 2,
    ingredient: { key: "sausage", name: { th: "ไส้กรอก", en: "Sausage" } },
    fortune: {
      topic: { th: "สุขภาพ", en: "Health" },
      icon: "💪",
      text: {
        th: "อายุยืน แข็งแรง ยาวเหมือนไส้กรอก",
        en: "A long, healthy life — long like a sausage",
      },
    },
  },
  {
    number: 3,
    ingredient: { key: "crabStick", name: { th: "ปูอัด", en: "Crab Stick" } },
    fortune: {
      topic: { th: "มิตรภาพ", en: "Friends" },
      icon: "🤝",
      text: {
        th: "ฉีกแบ่งได้หลายเส้น เพื่อนดีอยู่รอบตัว",
        en: "Made to share — good friends are all around",
      },
    },
  },
  {
    number: 4,
    ingredient: { key: "cheese", name: { th: "ชีส", en: "Cheese" } },
    fortune: {
      topic: { th: "ความรัก", en: "Love" },
      icon: "❤️",
      text: {
        th: "ความรักยืดยาว เหนียวแน่นเหมือนชีสยืด",
        en: "Love that stretches long, like melted cheese",
      },
    },
  },
];

export function findStick(number: number): Stick | undefined {
  return STICKS.find((s) => s.number === number);
}

/** One Shake: every Stick number equally likely. */
export function drawStickNumber(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return (buf[0] % STICKS.length) + 1;
}
