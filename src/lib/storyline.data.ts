export interface StorylineScene {
  heading: string;
  paragraphs: string[];
}

export interface StorylineChapter {
  id: string;
  kind: "prologue" | "chapter";
  partLabel: string;
  title: string;
  image: string;
  status: "current" | "past";
  tagline: string;
  scenes: StorylineScene[];
  summary: string;
}

export const STORYLINE_CHAPTERS: StorylineChapter[] = [
  {
    id: "city-of-false-hope",
    kind: "prologue",
    partLabel: "Part I",
    title: "The City of False Hope",
    image: "/media/storyline/prologue-part1.png",
    status: "past",
    tagline: "The world did not end in a single day.",
    scenes: [
      {
        heading: "The End of Days",
        paragraphs: [
          "The world did not end in a single day. It bled to death — a slow, deliberate exsanguination that began the morning the sky over Los Santos turned the color of spoiled milk.",
          "The radiation did not discriminate. It dissolved towers into gray rot, turned streets into graves, and emptied the highways of everything except silence. In a matter of months, the greatest city in the world had become a monument to everything humanity had lost.",
          "Those who remained did not live. They waited — for rescue, for mercy, for the end.",
        ],
      },
      {
        heading: "The Arrival",
        paragraphs: [
          "Then they came.",
          "No warning. No flag. No government. No name. They simply walked out of the irradiated wastes wearing armor that ignored the death in the air, carrying weapons no human laboratory had ever produced.",
          "They called themselves The Military. They did not fight the radiation. They walked straight through it — and they took everyone still healthy enough to save.",
        ],
      },
      {
        heading: "Roxwood",
        paragraphs: [
          "They led humanity to a place that should not have existed: Roxwood. A city untouched by the apocalypse, raised from nothing in the heart of the wasteland.",
          "Clean streets. Glass towers. Markets that never emptied. For the refugees, it was paradise — or close enough that they stopped looking for the difference.",
        ],
      },
      {
        heading: "The Price of Paradise",
        paragraphs: [
          "But paradise was built on forgotten graves.",
          "Its wealth had been paid for in blood. Its peace was guarded by corruption. Gratitude curdled into entitlement, and entitlement curdled into questions: Who truly ruled Roxwood? Why had no one ever seen its leader? Why did every decision arrive from anonymous officers who signed themselves only as The Military?",
          "Even the Sheriff's Department — the city's own law — bent the knee. And those who dug too deep disappeared. Usually without a trace. Always without a body.",
        ],
      },
      {
        heading: "The Man in Pink",
        paragraphs: [
          "In the shadows of the city, another story was already being written.",
          "A faceless man. A broken soul consumed by revenge. No one knew his name or his purpose. Only one detail was ever remembered: he always wore a pair of small, colorful pink earmuffs.",
          "For years he moved through Roxwood like a ghost — while the city he hated slowly revealed its true face.",
        ],
      },
      {
        heading: "The Vanishing",
        paragraphs: [
          "Then, without warning, The Military vanished.",
          "One classified mission. One final venture into the radiation zone, years in the making. None returned. No bodies. No wreckage. No explanation — only silence.",
          "What nobody knew was that they had spent those years studying the radiation itself, hunting for something buried deep within it.",
        ],
      },
      {
        heading: "The Beginning",
        paragraphs: [
          "Their disappearance was not the end. It was the beginning.",
          "Because as Roxwood descended into chaos, the radiation began to move — a slow tide rolling toward the city, pushed by a wind no one could feel.",
          "And beneath the earth, where the first explosion had once bloomed, something that had been waiting since the very beginning began to stir.",
          "The Ashfall Incident was about to begin.",
        ],
      },
    ],
    summary:
      "The world did not end in a single day — it bled to death. Radiation consumed Los Santos, and humanity stood at the edge of extinction until a mysterious force known only as The Military emerged. With technology beyond comprehension, they rescued the survivors and led them to Roxwood, a city untouched by the apocalypse. For a time it was paradise. But paradise was built on forgotten graves: corruption spread, those who sought the truth vanished, and a faceless man in pink earmuffs moved through the shadows. Then, without warning, The Military disappeared on a classified mission into the radiation zone. None returned. They had been hunting something buried beneath the wasteland — and now the radiation is moving toward Roxwood. The Ashfall Incident is about to begin.",
  },
  {
    id: "the-ashfall-incident",
    kind: "prologue",
    partLabel: "Part II",
    title: "The Ashfall Incident",
    image: "/media/storyline/prologue-part2.png",
    status: "past",
    tagline: "The world's second apocalypse.",
    scenes: [
      {
        heading: "The Second Apocalypse",
        paragraphs: [
          "Nobody knows what truly became of The Military. Some whispered they died in the wastes. Others swore they were still out there, watching from the dark.",
          "Before anyone could settle the argument, the radiation reached Roxwood.",
          "It came without warning. A silent fog rolling over the walls. A poisoned wind. And then the nightmare that humanity believed it had escaped — returning at full gallop.",
        ],
      },
      {
        heading: "Collapse",
        paragraphs: [
          "People died in the streets. Others did not die — they changed, into things that no longer walked like men.",
          "Animals turned violent. Food spoiled overnight. Water ran black.",
          "In weeks, civilization collapsed. In months, hope followed it.",
        ],
      },
      {
        heading: "The Underground",
        paragraphs: [
          "Then, from beneath the earth, a mysterious group emerged.",
          "They called themselves The Underground. Hidden since the fall of Los Santos, they had spent decades studying the radiation while the rest of humanity rebuilt its paradise. After countless failures, they finally produced humanity's last chance: the Anti-Bomb.",
          "A device capable of cleansing the atmosphere itself and ending the radiation forever.",
          "But salvation had a price: everyone already consumed by the radiation would be erased. No cure. No recovery. Only purification.",
        ],
      },
      {
        heading: "The Expedition",
        paragraphs: [
          "With no other choice, a final expedition was assembled — Physicians, Sheriffs and Volunteers. Eight souls carried the Anti-Bomb to the birthplace of the first catastrophe.",
          "The countdown began. And then it ended.",
          "A blinding flash crossed the horizon. The earth convulsed. And the world fell silent.",
        ],
      },
      {
        heading: "The Ash",
        paragraphs: [
          "When the ash settled, the radiation was gone. The skies were clear for the first time in years.",
          "Every infected soul had vanished without a trace, leaving behind nothing but endless gray ash. And with them went something no one had predicted: disease itself. Every living being suffering from illness had been carried away alongside the infected.",
          "A consequence no one had foreseen. Or perhaps — one that had been kept secret.",
        ],
      },
      {
        heading: "The Ashen Order",
        paragraphs: [
          "Against all odds, the expedition returned. Alive. Healthy. Perfect. Every wound had healed. Every illness was gone. No one could explain how they had survived — or what had happened to them out there.",
          "Soon after, they vanished without a trace. Some believed they died, leaving behind hidden research and forgotten warnings. Others believed they still watched the world from the shadows.",
          "History remembers them only as The Ashen Order. A legend. Nothing more.",
          "But before they left, they left behind a single conclusion: the Anti-Bomb had not ended humanity's story. It had only delayed its consequences. According to their calculations, the true effects would awaken exactly fifty years after the Ashfall Incident.",
        ],
      },
    ],
    summary:
      "The world's second apocalypse. After The Military vanished, the radiation reached Roxwood — a silent fog, a poisoned wind, and then the nightmare returned. People died; others changed into things no longer human. Civilization collapsed. From beneath the earth emerged The Underground, bearing humanity's final hope: the Anti-Bomb. A team of eight — Physicians, Sheriffs and Volunteers — carried it to the birthplace of the first catastrophe. When it detonated, the radiation vanished, and with it every infected soul. Disease itself was erased from the world, leaving nothing but gray ash. The expedition returned alive, healthy, perfect — then disappeared forever. History remembers them only as The Ashen Order, and the warning they left behind: the Anti-Bomb had not saved humanity, only delayed its fate. The true consequences would awaken exactly fifty years later.",
  },
];
