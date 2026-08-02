export interface ApplicationField {
  name: string;
  label: string;
  type: "text" | "textarea" | "number" | "select";
  required: boolean;
  placeholder?: string;
  options?: string[];
}

export interface ApplicationDepartment {
  slug: string;
  name: string;
  description: string;
  image: string;
  images: string[];
  roleAccess: string[];
  fields: ApplicationField[];
  subType?: string;
}

export const APPLICATION_DEPARTMENTS: ApplicationDepartment[] = [
  {
    slug: "staff",
    name: "Staff Application",
    description: "Apply to become a server staff member and help the community.",
    image: "/media/departments/staff.png",
    images: [
      "/media/ChatGPT_Image_22_juin_2026_02_02_52.png",
      "/media/ChatGPT_Image_22_juin_2026_02_23_43.png",
      "/media/ChatGPT_Image_24_mai_2026_11_10_26.png",
    ],
    roleAccess: ["1504840081926525069"],
    fields: [],
  },
  {
    slug: "police",
    name: "Police Department",
    description: "Apply to join the LSPD and protect the city.",
    image: "/media/departments/police.png",
    images: [
      "/media/ChatGPT_Image_22_juin_2026_02_23_43.png",
      "/media/ChatGPT_Image_25_mai_2026_03_08_30.png",
      "/media/ChatGPT_Image_27_mai_2026_04_17_56.png",
    ],
    roleAccess: ["1504840125245554769", "1504849769845899284"],
    fields: [
      { name: "realName", label: "Real Name", type: "text", required: true, placeholder: "Your real name" },
      { name: "age", label: "Age", type: "number", required: true, placeholder: "Your age" },
      { name: "discordTag", label: "Discord Tag", type: "text", required: true, placeholder: "username" },
      { name: "whyPD", label: "Why do you want to join the Police Department?", type: "textarea", required: true, placeholder: "Tell us why you want to be a police officer..." },
      { name: "rpExperience", label: "Do you have police RP experience?", type: "textarea", required: false, placeholder: "Describe your previous police roleplay experience..." },
      { name: "characterConcept", label: "Character Concept", type: "textarea", required: true, placeholder: "Describe your character idea for the PD..." },
      { name: "availableHours", label: "How many hours per week can you be active?", type: "text", required: true, placeholder: "e.g. 10-15 hours" },
    ],
  },
  {
    slug: "ems",
    name: "EMS / Hospital",
    description: "Apply to save lives as part of the medical team.",
    image: "/media/departments/ems.png",
    images: [
      "/media/ChatGPT_Image_24_mai_2026_11_10_26.png",
      "/media/ChatGPT_Image_28_mai_2026_15_01_01.png",
      "/media/ChatGPT_Image_31_mai_2026_02_50_32.png",
    ],
    roleAccess: ["1504840125245554769", "1504849769845899284"],
    fields: [
      { name: "realName", label: "Real Name", type: "text", required: true, placeholder: "Your real name" },
      { name: "age", label: "Age", type: "number", required: true, placeholder: "Your age" },
      { name: "discordTag", label: "Discord Tag", type: "text", required: true, placeholder: "username" },
      { name: "whyEMS", label: "Why do you want to join EMS?", type: "textarea", required: true, placeholder: "Tell us why you want to be a medic..." },
      { name: "medicalKnowledge", label: "Do you have any medical knowledge or experience?", type: "textarea", required: false, placeholder: "Describe any medical background..." },
      { name: "characterConcept", label: "Character Concept", type: "textarea", required: true, placeholder: "Describe your character idea for EMS..." },
    ],
  },
  {
    slug: "mechanic",
    name: "Mechanic Shop",
    description: "Apply to run the local mechanic and repair vehicles.",
    image: "/media/departments/mechanic.png",
    images: [
      "/media/ChatGPT_Image_25_mai_2026_03_08_30.png",
      "/media/ChatGPT_Image_6_juin_2026_13_31_26.png",
      "/media/ChatGPT_Image_7_juin_2026_18_14_25.png",
    ],
    roleAccess: ["1504840125245554769", "1504849769845899284"],
    fields: [
      { name: "realName", label: "Real Name", type: "text", required: true, placeholder: "Your real name" },
      { name: "age", label: "Age", type: "number", required: true, placeholder: "Your age" },
      { name: "discordTag", label: "Discord Tag", type: "text", required: true, placeholder: "username" },
      { name: "whyMechanic", label: "Why do you want to run a mechanic shop?", type: "textarea", required: true, placeholder: "Tell us about your interest in vehicles..." },
      { name: "mechanicExperience", label: "Do you have mechanic RP experience?", type: "textarea", required: false, placeholder: "Describe any mechanic RP you've done..." },
    ],
  },
  {
    slug: "gang",
    name: "Gang Application",
    description: "Apply to establish or join a gang in the city.",
    image: "/media/departments/gang.png",
    images: [
      "/media/ChatGPT_Image_27_mai_2026_04_17_56.png",
      "/media/ChatGPT_Image_4_juin_2026_16_18_01.png",
      "/media/ChatGPT_Image_Jun_15_2026_11_42_11_PM.png",
    ],
    roleAccess: ["1504840081926525069", "1504840125245554769", "1504849769845899284"],
    fields: [
      { name: "realName", label: "Real Name", type: "text", required: true, placeholder: "Your real name" },
      { name: "age", label: "Age", type: "number", required: true, placeholder: "Your age" },
      { name: "discordTag", label: "Discord Tag", type: "text", required: true, placeholder: "username" },
      { name: "gangName", label: "Gang Name", type: "text", required: true, placeholder: "Name of your gang" },
      { name: "gangMembers", label: "How many members will be joining?", type: "text", required: true, placeholder: "e.g. 5-10 founding members" },
      { name: "whyGang", label: "Why do you want to start/join a gang?", type: "textarea", required: true, placeholder: "Tell us about your gang's goals and RP..." },
      { name: "gangConcept", label: "Gang Concept", type: "textarea", required: true, placeholder: "Describe your gang's identity, territory, and activities..." },
    ],
  },
  {
    slug: "doj",
    name: "Department of Justice",
    description: "Apply to become a judge or lawyer in the city.",
    image: "/media/departments/doj.png",
    images: [
      "/media/ChatGPT_Image_28_mai_2026_15_01_01.png",
      "/media/ChatGPT_Image_May_29_2026_02_17_53_PM.png",
      "/media/ChatGPT_Image_May_29_2026_07_58_56_PM.png",
    ],
    roleAccess: ["1504840125245554769", "1504849769845899284"],
    fields: [
      { name: "realName", label: "Real Name", type: "text", required: true, placeholder: "Your real name" },
      { name: "age", label: "Age", type: "number", required: true, placeholder: "Your age" },
      { name: "discordTag", label: "Discord Tag", type: "text", required: true, placeholder: "username" },
      { name: "position", label: "Position", type: "select", required: true, options: ["Judge", "Lawyer", "Both"] },
      { name: "whyDOJ", label: "Why do you want to join the DOJ?", type: "textarea", required: true, placeholder: "Tell us why you want to be in the justice system..." },
      { name: "legalExperience", label: "Do you have any legal RP experience?", type: "textarea", required: false, placeholder: "Describe any legal roleplay experience..." },
      { name: "characterConcept", label: "Character Concept", type: "textarea", required: true, placeholder: "Describe your character idea for the DOJ..." },
    ],
  },
];

export function getDepartment(slug: string): ApplicationDepartment | undefined {
  return APPLICATION_DEPARTMENTS.find((d) => d.slug === slug);
}

export function getApplicationLabels(deptSlug: string): Record<string, string> {
  if (deptSlug.startsWith("staff_")) {
    const s = STAFF_APPLICATIONS.find((x) => x.slug === deptSlug.replace("staff_", ""));
    if (s) return Object.fromEntries(s.fields.map((f) => [f.name, f.label]));
    return {};
  }
  const d = APPLICATION_DEPARTMENTS.find((x) => x.slug === deptSlug);
  if (d) return Object.fromEntries(d.fields.map((f) => [f.name, f.label]));
  return {};
}

export function getDepartmentsForRole(roleId: string): ApplicationDepartment[] {
  return APPLICATION_DEPARTMENTS.filter((d) => d.roleAccess.includes(roleId));
}

export const STAFF_APPLICATIONS = [
  {
    slug: "staffteam",
    name: "Staff Team",
    description: "Apply to join the Tunisian Phoenix RP Staff Team.",
    fields: [
      { name: "rpName", label: "1. Chnoua esmik fel RP ?", type: "text" as const, required: true, placeholder: "Esmeik fel roleplay" },
      { name: "discordName", label: "2. Chnoua esmik fel Discord ?", type: "text" as const, required: true, placeholder: "Exemple: username" },
      { name: "age", label: "3. 9adech 3omrek ?", type: "number" as const, required: true, placeholder: "3omrek" },
      { name: "gtaExperience", label: "4. 9adech 3andek tal3ab GTA V Roleplay ?", type: "text" as const, required: true, placeholder: "Exemple: 3 snin" },
      { name: "serversPlayed", label: "5. Chnouma les serveurs RP elli l3abt fihom 9bal ?", type: "textarea" as const, required: true, placeholder: "Cité les serveurs elli l3abt fihom..." },
      { name: "staffExperience", label: "6. 3omrek kont Staff fi serveur RP ? Ken ey, chnoua kont ta3mel w chnoua kanet rank mte3ek ?", type: "textarea" as const, required: true, placeholder: "Wassif ta3arifek fi l Staff..." },
      { name: "weeklyHours", label: "7. 9adech ta3ti men wa9tek lel serveur (par jour/semaine) ?", type: "text" as const, required: true, placeholder: "Exemple: 4h/jour" },
      { name: "aboutYou", label: "8. 3arrefna b rou7ek chwaya", type: "textarea" as const, required: true, placeholder: "3arrefna b rou7ek..." },
      { name: "whyJoin", label: "9. 3lech t7eb todkhol lel Staff Team mta3na ?", type: "textarea" as const, required: true, placeholder: "3lech t7eb tkoun m3ana ?" },
      { name: "whyYou", label: "10. 3lech na5tarouk enti bech tkoun membre fel Staff ?", type: "textarea" as const, required: true, placeholder: "Chnoua elli ymeyzek 3an ghayrek ?" },
      { name: "strengths", label: "11. Chnouma les qualités mte3ek elli ynajmou y3awnou el serveur ?", type: "textarea" as const, required: false, placeholder: "Les points forts mte3ek..." },
      { name: "weaknesses", label: "12. Chnouma les défauts mte3ek elli t7eb t7assanhom ?", type: "textarea" as const, required: false, placeholder: "Les points elli t7eb t7assan fihom..." },
      { name: "goodStaff", label: "13. Kifech tassawer mte3ek l wehed Staff behi ?", type: "textarea" as const, required: false, placeholder: "Chnoua el mawassef mte3 Staff behi ?" },
      { name: "goal", label: "14. Chnoua l'objectif mta3ek ki todkhol lel Staff ?", type: "textarea" as const, required: false, placeholder: "Chnoua t7eb to5ale9 ki tkoun Staff ?" },
      { name: "suggestions", label: "15. 3andek afkar wala suggestions bech t7assen el serveur ?", type: "textarea" as const, required: false, placeholder: "Afkarek l el serveur..." },
      { name: "rpMeaning", label: "16. Chnoua ma3neha Roleplay bennesba lik ?", type: "textarea" as const, required: false, placeholder: "Ma3neha el RP bennesba leik..." },
      { name: "icOoc", label: "17. Chnoua el far9 bin IC w OOC ?", type: "textarea" as const, required: false, placeholder: "Faser el far9..." },
      { name: "terms", label: "18. Fasrelna les termes hedhom : RDM, VDM, Meta Gaming, Power Gaming, Fear RP, Fail RP, No Pain RP, Power Admin", type: "textarea" as const, required: false, placeholder: "Faser kol terme..." },
      { name: "metagamingCase", label: "19. Player ista3mel ma3louma 5dheha mel Discord bech yal9a player ekher in game, chnoua el fail elli sayer ?", type: "textarea" as const, required: false, placeholder: "Chnoua esm el fail ?" },
      { name: "failRpCase", label: "20. Player ma y7ebech ykamel scène 5ater bech y5asser, chnoua esm el comportement hedha ?", type: "textarea" as const, required: false, placeholder: "Chnoua esm el comportement ?" },
      { name: "successFactors", label: "21. Fi ra2yek, chnoua aham 7aja bech serveur RP ykoun neja7 ?", type: "textarea" as const, required: false, placeholder: "Chnoua el 7aja aham ?" },
      { name: "conflictHandling", label: "22. Zouz players 3andhom mochkel, kol wa7ed ya7ki 7keya mo5talfa. Kifech tet3amel m3ahom ?", type: "textarea" as const, required: false, placeholder: "Kifech te5ou el 7keya ?" },
      { name: "friendRules", label: "23. Choufet player ykhalef fel rules w enti ta3rfou. Chnoua ta3mel ?", type: "textarea" as const, required: false, placeholder: "Chnoua el 7al elli te5ou ?" },
      { name: "friendFail", label: "24. Ken sa7bek fel serveur 3amel fail, t3a9bou wala le ? W 3lech ?", type: "textarea" as const, required: false, placeholder: "3alel 3la 5tar mte3ek..." },
      { name: "insultHandling", label: "25. Player bda ysebb fik wa9t intervention Staff (situation), kifech trod 3lih w kifech tetsaref ?", type: "textarea" as const, required: false, placeholder: "Kifech te5ou el situation ?" },
      { name: "powerAccusation", label: "26. Player y9ollek \"enti testa3mel fi power mte3ek k Staff\", kifech tetsaref ?", type: "textarea" as const, required: false, placeholder: "Kifech trod 3lih ?" },
      { name: "staffMisconduct", label: "27.A Choufet Staff e5er ya3mel fi fail wala power, chnoua ta3mel ?", type: "textarea" as const, required: false, placeholder: "Chnoua 7al mte3ek ?" },
      { name: "highStaffMisconduct", label: "27.B Choufet High Staff ya3mel f fail wala power. Kifech tetsaref ?", type: "textarea" as const, required: false, placeholder: "Kifech tetsaref m3a High Staff ?" },
      { name: "firstOffense", label: "28. Player 3andou barcha wa9t fel serveur ama aamal fail awel mara, ta3tiih sanction wala t5allih ?", type: "textarea" as const, required: false, placeholder: "Chnoua 7al mte3ek ?" },
      { name: "sanctionDecision", label: "29. Kifech ta7ded el sanction elli lezem tet3ata lel player ?", type: "textarea" as const, required: false, placeholder: "Kifech t7eseb el sanction ?" },
      { name: "warnKickBan", label: "30. Chnoua el far9 bin Warn / Kick / Ban ?", type: "textarea" as const, required: false, placeholder: "Faser kol wa7ed..." },
      { name: "preventAbuse", label: "31. Kifech t7areb l abuse mta3 l power ki tkoun Staff ?", type: "textarea" as const, required: false, placeholder: "Kifech t5ali rou7ek 3adl ?" },
      { name: "staffEssential", label: "32. Chnoua benesba lik aham 7aja lezem tkoun mawjouda fi ay membre Staff ?", type: "textarea" as const, required: false, placeholder: "Aham 7aja..." },
      { name: "position", label: "33. Chnoua el poste elli t7eb tabda bih ?", type: "select" as const, required: true, options: ["Support", "Whitelister", "Admin In Game (Mod)", "Designer"] },
      { name: "followRules", label: "34. Hal enti mosta3ed taba3 w taba9 rules mta3 el Staff w ta9bel les remarques mel High Ranks ?", type: "select" as const, required: true, options: ["Yes", "No"] },
      { name: "additional", label: "35. 3andek 7aja o5ra t7eb tzidha fel application mte3ek ?", type: "textarea" as const, required: false, placeholder: "7aja o5ra t7eb t9olha..." },
    ],
  },
];

export const ROLE_IDS = {
  WHITELISTED: "1504840081926525069",
  CHECKIN: "1504849769845899284",
  BANNED: "1504840125245554769",
} as const;
