export interface Faq {
  q: string;
  a: string;
}

export const DEFAULT_FAQS: Faq[] = [
  { q: "How do I join the server?", a: "Join our Discord, complete the whitelist application, and once approved you can connect using the FiveM server IP provided in the #server-info channel." },
  { q: "What are the server requirements?", a: "A stable internet connection and a legitimate copy of GTA V. We recommend at least 8GB RAM and a dedicated GPU for the best experience." },
  { q: "Is there a whitelist?", a: "Yes. All new players must complete a brief whitelist application to ensure everyone understands our rules and roleplay standards." },
  { q: "Can I play as a cop or EMS?", a: "Absolutely. Once whitelisted, you can apply for any department position. Training is provided for all roles." },
  { q: "Are there families?", a: "Yes. Multiple families operate in the city. You can create your own crew or join an existing organization." },
  { q: "How do I report a rule violation?", a: "Open a ticket in our Discord with evidence (screenshots or video clips). Staff reviews all reports within 48 hours." },
  { q: "What language is used on the server?", a: "English is the primary language for RP. Tunisian Arabic is welcome in appropriate contexts and casual interactions." },
];
