export interface Rule {
  title: string;
  desc: string;
}

export interface RuleCategory {
  slug: string;
  name: string;
  image: string;
  images?: (string | { src: string; name: string })[];
  rules: Rule[];
}

export const allImages = [
  "/media/ChatGPT_Image_4_juin_2026_16_18_01.png",
  "/media/ChatGPT_Image_31_mai_2026_02_50_32.png",
  "/media/ChatGPT_Image_28_mai_2026_15_01_01.png",
  "/media/ChatGPT_Image_27_mai_2026_04_17_56.png",
  "/media/ChatGPT_Image_25_mai_2026_03_08_30.png",
  "/media/ChatGPT_Image_24_mai_2026_11_10_26.png",
  "/media/ChatGPT_Image_22_juin_2026_02_23_43.png",
  "/media/ChatGPT_Image_22_juin_2026_02_02_52.png",
  "/media/c8508b01-06cd-48b7-9f4c-d5d1aed61dbe.png",
  "/media/be5c6ded-5bd3-42a5-bcac-d5bad8e5d308.png",
  "/media/a9a8e741-824c-4868-8bcc-15302c995777.png",
  "/media/a7e7f310-b2d6-4e27-a633-73d2b9536111.png",
  "/media/97fa2aa3-4280-4dae-82ae-1b0220842c4d.png",
  "/media/73A7331E-D407-48E2-8D6A-8D1476D16BE3.png",
  "/media/2dd001fe-7ae5-434f-aa7a-11cf2caef29a.png",
  "/media/129165df-0959-4586-809a-8103cc843127.png",
  "/media/FC193181-C22B-4B22-85C8-2AA44A82D9FB.png",
  "/media/e1629e82-0ba9-4e80-804b-9f525ff74fe3.png",
  "/media/Gemini_Generated_Image_rxa6zsrxa6zsrxa6.png",
  "/media/IMG_5137.png",
  "/media/IMG_2068.png",
  "/media/Gemini_Generated_Image_3a7nh13a7nh13a7n.png",
  "/media/MedalTVGrandTheftAutoVFiveM20260612135423525.png",
  "/media/file_00000000686872469f58cb576cdc71b2.png",
  "/media/fffc37f5-8d18-46e2-b68c-73c4bfe67876.png",
  "/media/ChatGPT_Image_7_juin_2026_18_14_25.png",
  "/media/ChatGPT_Image_May_26_2026_05_20_03_AM.png",
  "/media/ChatGPT_Image_May_29_2026_07_58_56_PM.png",
  "/media/ChatGPT_Image_6_juin_2026_13_31_26.png",
  "/media/FD989994-0B0F-4E11-85A8-EBDA4ED785CA.png",
  "/media/WhatsApp_Image_2026-05-29_at_14.23.28.jpeg",
  "/media/ChatGPT_Image_Jun_15_2026_11_42_11_PM.png",
  "/media/ChatGPT_Image_May_29_2026_02_17_53_PM.png",
];

export const greenzoneImages = [
  "/media/zones/greenzone/APARTMENTS.png",
  "/media/zones/greenzone/EMBASSY.png",
  "/media/zones/greenzone/GARAGE.png",
  "/media/zones/greenzone/HOSPITAL.png",
  "/media/zones/greenzone/POLICE STATION.png",
];

export const noRobberyZoneImages = [
  "/media/zones/no-robbery-zone/NO ROBBERY ZONE   NIGHT CLUB.png",
  "/media/zones/no-robbery-zone/NO ROBBERY ZONE  BURGERSHOT.png",
  "/media/zones/no-robbery-zone/NO ROBBERY ZONE  CARDEALER.png",
  "/media/zones/no-robbery-zone/NO ROBBERY ZONE  HUNTING + FISHING ZONE.png",
  "/media/zones/no-robbery-zone/NO ROBBERY ZONE  MECANO.png",
];

function shuffleImages(seed: string): string[] {
  const arr = [...allImages];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  for (let i = arr.length - 1; i > 0; i--) {
    hash = ((hash << 5) - hash + i) | 0;
    const j = Math.abs(hash) % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const shuffled = shuffleImages("tunisian-phoenix-rules-2026");

export const categories: RuleCategory[] = [
  {
    slug: "general",
    name: "General Rules",
    image: shuffled[0],
    rules: [
      { title: "OOC Chat", desc: "OOC is only for chat — keep it out of roleplay." },
      { title: "RDM", desc: "Interdit to9tel player men ghir reason!" },
      { title: "VDM", desc: "Interdit to9tel player b vehicle wala tothrbou!" },
      { title: "VOL", desc: "Lezmek t5af ala hyet l character mte3ek!" },
      { title: "Power Gaming", desc: "Interdit tet9awa 3al character mte3ek — example: taamel accident w t9oum tejri / tnagez men blasa 3alya!" },
      { title: "Meta Gaming", desc: "Interdit testa3mel info makech me5oha in game — kol info lazemha record si nn meta!" },
      { title: "Fail RP", desc: "Interdit ta3mel 7aja moch ma39oula w matemchich m3a character mte3ek!" },
      { title: "Force RP", desc: "Interdit tforsi 3la player bech tekhou advantage fi scene — example: tfok info wela flous bl force." },
      { title: "Win RP", desc: "Ma 3andekch el 7a9 tekhtare3 7ajet moch mawjoudin fel rp bech terba7 bihom scene." },
      { title: "Combat Logging", desc: "Altf4 wela ta3mal rou7ek afk fi west scene." },
      { title: "Combat Storing", desc: "Ma 3andekch el 7a9 tohreb l greenzone fi west scene." },
      { title: "Clear Shot", desc: "Ma famesh 7aja esmha clear shot fel RP — ki yebda famma hostage." },
      { title: "Revenge Kill", desc: "Ken makech f family lazemek record & info rp & 2h bech tnajam ta3mal revenge!" },
      { title: "Disrespect / Toxicity", desc: "Interdit tetmanyak 3ala player w houwa taye7 — la b emote w la b klem! Any kind of toxicity = ban 7 days." },
      { title: "Use Rule", desc: "Tcouveri rou7ek b rule f scene — example: teprovoqui chkoun fi greenzone khater ta3ref maynajamch ya3malek chy." },
      { title: "Pain RP", desc: "Ki tetdhrab wala ta3mel accident wala 3amaliya lezmek tetwaja3 w tetasarref kima IRL." },
      { title: "Kofr Rabbi", desc: "Bannable 7atta lawken bin las7ab!" },
      { title: "Glitch Abuse", desc: "Abusing any glitch or finding one and not reporting it to staff will result in a permanent ban." },
      { title: "Cheats / Mods", desc: "Using any third party cheats or mods that give visual advantage = permanent ban." },
      { title: "Sexual Abuse", desc: "Any sexual abuse or ra**ping scenes = extremely severe sanction." },
      { title: "Scene Skipping", desc: "Skipping a scene with EMS, Police or lawyer = ban 24h." },
      { title: "Realistic Name", desc: "You must choose a realistic name — otherwise your character will get deleted." },
      { title: "Third Party / Free Loot", desc: "Third party or free loot are not allowed." },
      { title: "Inactive Boss", desc: "Ki tebda boss mta3 charika w to93od inactif 7 days yetna7alek l boss." },
      { title: "Looting Dead Bodies", desc: "Mamnou3 tkhalli 7aja men amlekek l player e5er ki bech tsirlek mort rp." },
      { title: "New Character Rules", desc: "Ki tsirlek mort rp characterek jdid lezem ykoun ma 3andou 7atta 3ale9a bel character l 9dim." },
      { title: "Fail RP Report", desc: "Ken 7ad faila m3ak tkammel scene w treporti fellekher — tnajam treporti meloul ama lazem tekteb 'spectate'." },
      { title: "Refund", desc: "Ay refund lazmou record — no record = no refund. Tickets without record will be refused." },
      { title: "Work Clothes", desc: "Interdit tib9a b dbach il khedma wenti off duty." },
      { title: "/me Command", desc: "Used to describe a feeling." },
      { title: "/do Command", desc: "Used to describe an action." },
      { title: "Mass RP", desc: "Dima lazem t7ot f balek elli lemdina m3ebya — temchi l markez troll wa7dek 5atrou fera8 & etc." },
      { title: "New Life Rule", desc: "Ki tmout bounya tetdhakar — ki tmout b sle7 abyadh tetdhakar mba3d 12h — ki tmout b pistol tensa scene kemla!" },
      { title: "No Troll / Army Disrespect", desc: "Interdit troll walla disrespecti l army — 0 vol = ban." },
      { title: "No Fight Without Interaction", desc: "Any fight without interaction (social scene) = ban 4 days for the player who started + family strike." },
      { title: "Spam Punch", desc: "Spam punch = power gaming & bannable." },
      { title: "No Report Without Record", desc: "No report without record — no record = no ticket." },
      { title: "Fake Price / Troll in Shop", desc: "Troll or fake price in Vente-enterprise = perma ban." },
    ],
  },
  {
    slug: "gang",
    name: "Illegal Rules",
    image: shuffled[1],
    rules: [
      { title: "No Illegal in Green Time / State of Emergency", desc: "Interdit taamel ay 7aja illegal fel green time w halet tawer2." },
      { title: "ATM / Store Robbery Wait", desc: "ATM / Store robbery: lezmek testna 10 min — ken majetch l police tnajem tohreb." },
      { title: "Rahina for Robberies", desc: "Rahina maj3oula lel robberies." },
      { title: "No Reasonless Robbery", desc: "Braquage men ghir reason interdit." },
      { title: "No White Weapon Robberies", desc: "Interdit 3lik ta3mel medium or large robbery b sle7 abyedh." },
      { title: "Hostage Time Limit", desc: "Ki ta5taf player ma 3andekch l7a9 tab9a 5atfou akthar men 15 min." },
      { title: "No Heli in Small Robbery", desc: "Mamnou3 3lik testa3mel hélicoptère fi small robbery." },
      { title: "Minimum Criminals for Braquage", desc: "Minimum criminals fi scene braquage = 3." },
      { title: "Police Looting Restriction", desc: "Police tanjem tlootih ken fl ma7jouz — interdit 3lik thez 7ajet okhra." },
      { title: "Mask Rules", desc: "Interdit ta3mal fight blesh mask — ki ta3mal illegal matnajam tna7i l mask ken mba3ed 10 min meli toufa scene." },
      { title: "Record Required", desc: "Record obligatoir fi ay scene illegal." },
      { title: "Robbery Cooldown (Small)", desc: "Bin robbery w robbery lezmek testna 15 min." },
      { title: "Robbery Cooldown (Medium/Large)", desc: "Fl medium & high robberies testna 2 hours." },
      { title: "Family War Requirements", desc: "Interdit family war men4ir ma zouz bosses yet9ablou w yahkiw — lazem reason 9wey w record. Revenge after 24 hours. Sanction: family strike." },
      { title: "Fight Limit", desc: "Ay family tbda akther mn fight fi nhar ttsma power gaming — fiha family strike." },
      { title: "No Unofficial Fight Looting", desc: "Interdit loot fi ay fight mouch official." },
      { title: "Official Fight / Family War", desc: "Fight official wala family war ma t9ich ella ba3d scene mafia." },
      { title: "React Cooldown", desc: "React ma tsir ken ba3ed 24h — family amlet act matnajem lfamily lokhra tamel react ken ba3ed 24h." },
      { title: "No Rob During Mafia Fight", desc: "Aya rob tssyr mch fi fight officiel mn mafia raw fiha ban 3 ayam." },
      { title: "No Kidnap Police Without Order", desc: "Interdit ta5tef police men4ir ordre mel MAFIA — ban!" },
      { title: "Gangster Info Leak", desc: "Interdit gangster yaati info l family mte3ou wala l mafia lel police — tafsid rp + fail rp = ban 15 days." },
      { title: "Mort RP / Attack Family", desc: "Mort rp wala besh te3dem wehed mel family lezm ikoun 3andek reason w tsiir scene e3dem." },
      { title: "No Random Deathmatching", desc: "Killing without valid roleplay reason is permanently prohibited." },
      { title: "No Vehicle Deathmatching", desc: "Using vehicles as weapons against players is not allowed under any circumstances." },
      { title: "Conflict Limits", desc: "Maximum 5v5 in standard conflicts. Police can bring up to 8 officers." },
      { title: "Conflict Cooldown", desc: "Wait between major conflict events. Give others a chance to RP." },
    ],
  },
  {
    slug: "police",
    name: "Police Rules",
    image: shuffled[2],
    rules: [
      { title: "Respect Citizens", desc: "Respect m3a lmouwaten aham 7aja benesba lik — 7ata idhaken maw9ouf wela 9atel rou7 9odemek." },
      { title: "No Corruption", desc: "Mamnou3 alik tkoun fesed = perma ban." },
      { title: "No Unauthorized Dismissals", desc: "El 7akem me3ndouch el 7a9 ifase5 B3 wela i5arej ay 7aja mel ma7jouz." },
      { title: "Missing Roll Call", desc: "Ki t8ib jem3a men8ir permission, tnajem t3aredh ro7ek lel tared." },
      { title: "Cadet Promotion Cost", desc: "Ken theb to5rej mel hakem (itha enti cadet) lezem tadfa3 50m lel police (yet3taw lel commendant) w lezem sbab mo9ne3 (scene RP). Itha kont officer mort RP." },
      { title: "Green Time", desc: "El high command el wa7ida eli tnajeem ta3meel green time w lezem sabab mo9ne3." },
      { title: "Grade-Appropriate Weapons", desc: "Ma andekch lha9 thez sle7 mahouch mta3 gradek." },
      { title: "No Troll / Toxicity", desc: "Mamnou3 ay naw3 mta3 troll wela toxicity!" },
      { title: "Identify Yourself", desc: "Ki twakef wehed, obligee 3lik ta3tih esmeek, gradek, w badge number mta3eek. Ma3andekch el ha9 ta3tih ay detail 8aleet." },
      { title: "Dispatch / EMS Respect", desc: "El dispatch wela high command 3andou el 7a9 yod5eel el radio EMS bch totleb haja, ta7ki maah b ihtiram." },
      { title: "Family War Protocol", desc: "Fi 7alet woujoud family war, el hakem yo93od yestana men b3id lin tekmel el fight, w mba3d ysay9 ki youfa el fight." },
      { title: "No Entering Hoods", desc: "Me3andkch el 7a9 tote5l l 7ouma ken ki tebda fama 7alet taweraa." },
      { title: "Helicopter Restrictions", desc: "Helicopter tahbet ken fi robberies li fihom rahina." },
      { title: "Off Duty Protocol", desc: "El police me3andouch l7a9 yokhrej off duty ela mayestachir high command w mat5arejch ay item mta3 w tna7i lebset el 5edma." },
      { title: "Detective Bureau", desc: "Detective bureau li aando l7a9 yokhrej police civil just bsh yjib info (to5reej mara fel jom3a). Yokhrej blesh items lkhedma (radio, teaser, handcuffs...) w maandoush l7a9 yodkhel lel 7wem. Ki talka info maandeksh l7a9 todkhel lel radio w tkoul ls7abek. Baad mtkml mission mte3k ta3mel ta9rir w thezo lel markez." },
      { title: "Traffic Stop Protocol", desc: "Ki twa9f wehed 3ala controle papier wela 7ra9 feu methbtouch men karhbtou — 9olou ysaker moutour el karhba w yhabbet chobek mte3ou." },
      { title: "Emergency Button", desc: "Aandek l7a9 testa3mel button emergency ken ki thes hyetek fi khtar wela ela makhtouf (mara barka. Testa3melha mn ghir spam w ki tmout matb3ethesh signal)." },
      { title: "Helicopter Taser Use", desc: "Bil nesba lil hakem, 3andou 7a9 ken fi tizer w matraque khw contre ay rob w ay fight ki yebda mafamach pistols fel server. Ken ili inagiz fil mee (ekartesh a3liih), wela el pursuit fatet 15mn (ekartesh 3la 3jeli el karhba)." },
      { title: "Sheriff Detention Rules", desc: "Sheriff mayfrket kan fi markez — ma yfrket chkoun fi tri9 wala ya3mel hard cuff blghyr la thama scene w traf. Lakher yorfdh yhez yeddou. Fiha BAN." },
      { title: "Visa Rule", desc: "elli region moush Roxwood yaamel visa — ma3adesh fama character delete." },
    ],
  },
  {
    slug: "robbery",
    name: "Robbery Rules",
    image: shuffled[3],
    rules: [
      { title: "House Robbery", desc: "Testana l police lin yjik w ta3mel pursuit. Max criminals: 2 · Max police: 4 · Max criminal vehicles: 1 car or 1 motorcycle · Max police vehicles: 2 car or 2 motorcycle." },
      { title: "Store Robbery", desc: "Testana l police lin yjik w ta3mel pursuit. Max criminals: 2 · Max police: 4 · Max criminal vehicles: 1 car or 1 motorcycle · Max police vehicles: 2 car or 2 motorcycle." },
      { title: "Ammunation Robbery", desc: "Testana l police lin ijik w ta3mel pursuit. Lezmek rahina. Max criminals: 3 · Max police: 6 · Max criminal vehicles: 2 car or 2 motorcycle · Max police vehicles: 3 car or 3 motorcycle." },
      { title: "Drop Robbery", desc: "Tstna l police lin yjik w t3ml m3ah fight. Min police: 7 · Max police: 9 · Min criminals: 6 · Max criminals: 8. Gangster only mel weapon, police only matrak." },
    ],
  },
  {
    slug: "greenzone",
    name: "Greenzone",
    image: greenzoneImages[0],
    images: [
      { src: "/media/zones/greenzone/APARTMENTS.png", name: "Apartments" },
      { src: "/media/zones/greenzone/EMBASSY.png", name: "Embassy" },
      { src: "/media/zones/greenzone/GARAGE.png", name: "Garage" },
      { src: "/media/zones/greenzone/HOSPITAL.png", name: "Hospital" },
      { src: "/media/zones/greenzone/POLICE STATION.png", name: "Police Station" },
    ],
    rules: [
      { title: "NO ILLEGAL ACTIVITY", desc: "You cannot speak or do anything illegal in greenzones." },
    ],
  },
  {
    slug: "no-robbery-zone",
    name: "No Robbery Zone",
    image: noRobberyZoneImages[0],
    images: [
      { src: "/media/zones/no-robbery-zone/NO ROBBERY ZONE   NIGHT CLUB.png", name: "Night Club" },
      { src: "/media/zones/no-robbery-zone/NO ROBBERY ZONE  BURGERSHOT.png", name: "Burgershot" },
      { src: "/media/zones/no-robbery-zone/NO ROBBERY ZONE  CARDEALER.png", name: "Car Dealer" },
      { src: "/media/zones/no-robbery-zone/NO ROBBERY ZONE  HUNTING + FISHING ZONE.png", name: "Hunting & Fishing" },
      { src: "/media/zones/no-robbery-zone/NO ROBBERY ZONE  MECANO.png", name: "Mechanic" },
    ],
    rules: [],
  },
  {
    slug: "ems",
    name: "EMS Rules",
    image: shuffled[5],
    rules: [
      { title: "Patient Priority", desc: "Sa7et lmridh aham haja lik ka EMS." },
      { title: "Off Duty Limit", desc: "EMS ma3andekch il 7a9 to5rej off duty akther men 1 hour." },
      { title: "No Item Selling", desc: "Mamnou3 3al EMS ya3ti items mta3 khedmtou wala ybi3hom = BAN." },
      { title: "Hospital RP Commands", desc: "Scene RP li tsir fi sbitar tt3mal b /do w /me — example: /do n3melk fi zor9a, /do n7ilk fi kartoucha, /do n3melk fi t7lil." },
      { title: "Partner Rule", desc: "Jatek 7ala fi nord, tkalem l 7akem bech ymchi m3ak. Ken temchi wa7dek tet7amel mas2oulitek." },
      { title: "Skip Scene", desc: "Skip scene = BAN." },
      { title: "No Corrupt EMS", desc: "Interdit tkoun EMS fesed — example: taati infos lel families 3al police wala tbi3 material. Ama tnajem ikalmouk tfaya9 chkoun f noir w to5les." },
    ],
  },
];

export function getCategoryBySlug(slug: string): RuleCategory | undefined {
  return categories.find((c) => c.slug === slug);
}
