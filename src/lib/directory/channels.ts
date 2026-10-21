export interface DirectoryCategory {
  id: string;
  label: string;
  description: string;
  seedQuery: string;
}

export interface CuratedChannel {
  id: string;
  name: string;
  handle: string;
  category: string;
  description?: string;
}

export const DIRECTORY_CATEGORIES: DirectoryCategory[] = [
  {
    id: "all",
    label: "All Tech",
    description: "Diverse shuffle of 75% authentic Indian engineering creators + top global dev & Web3",
    seedQuery: "full stack web development rust engineering systems",
  },
  {
    id: "web3",
    label: "Web3 & Systems",
    description: "Solidity, DeFi, Solana, Rust, smart contract security & protocol engineering",
    seedQuery: "solidity rust smart contract security defi evm",
  },
  {
    id: "dev-india",
    label: "Dev India",
    description: "Authentic Indian software engineers, full-stack builders, and systems educators",
    seedQuery: "harkirat full stack chai aur code piyush garg akshay saini striver",
  },
  {
    id: "dev-global",
    label: "Dev Global",
    description: "TypeScript, systems programming, browser internals, and modern architecture",
    seedQuery: "typescript react nextjs system design performance primeagen",
  },
  {
    id: "ai-research",
    label: "AI Research",
    description: "LLMs, agents, machine learning research, and model releases",
    seedQuery: "llm architecture ai research agents transformers karpathy",
  },
  {
    id: "cybersecurity",
    label: "Cybersecurity",
    description: "Binary exploitation, CTFs, reverse engineering, and exploit research",
    seedQuery: "reverse engineering binary exploitation ctf liveoverflow",
  },
  {
    id: "startups",
    label: "Startups & SaaS",
    description: "Technical founders, product builders, Indie Hackers, and engineering breakdowns",
    seedQuery: "startup technical founder saas indie hacker ycombinator",
  },
  {
    id: "privacy",
    label: "Privacy & Linux",
    description: "Tor, Linux security, anonymity, decentralization, and digital freedom",
    seedQuery: "linux privacy tor open source security mental outlaw",
  },
  {
    id: "infra",
    label: "Infra & DevOps",
    description: "Linux internals, Kubernetes, self-hosting, homelabs, and distributed systems",
    seedQuery: "linux self hosting kubernetes homelab devops docker",
  },
  {
    id: "robotics",
    label: "Robotics",
    description: "Humanoids, ROS, drones, simulation, and physical AI",
    seedQuery: "humanoid robot learning ros2 physical ai boston dynamics",
  },
  {
    id: "hardware",
    label: "Hardware & Chips",
    description: "Semiconductor architecture, microcontrollers, embedded systems, and PCBs",
    seedQuery: "computer architecture chip design embedded electronics ben eater",
  },
  {
    id: "science",
    label: "Space & Science",
    description: "Space exploration, quantum computing, physics, and future technology",
    seedQuery: "physics quantum space exploration breakthrough veritasium",
  },
];

export const CURATED_CHANNELS: CuratedChannel[] = [
  { id: "UC1Wp34xZ9N4S4S62c9P79hA", name: "Harkirat Singh", handle: "@Harkirat1", category: "dev-india" },
  { id: "UCeVMnSShP_Iviwkknt83cww", name: "Chai aur Code", handle: "@chaiaurcode", category: "dev-india" },
  { id: "UC59K-uG2A5ogwIrHw4bmlEg", name: "Piyush Garg", handle: "@piyushgargdev", category: "dev-india" },
  { id: "UCBwmMxybNva6P_5VmxjuxqA", name: "Akshay Saini", handle: "@akshaymarch7", category: "dev-india" },
  { id: "UCJskGeByzRRSvmOyZOz61ig", name: "Striver (take U forward)", handle: "@takeUforward", category: "dev-india" },
  { id: "UCUHW4n6jMglhYj5V3_gO7mA", name: "Kunal Kushwaha", handle: "@KunalKushwaha", category: "dev-india" },
  { id: "UCQHLxxgmY4Z94UZNIsz4nKA", name: "Love Babbar", handle: "@LoveBabbar", category: "dev-india" },
  { id: "UCdtXXpQYy1eJtG2X-Qp3Tzw", name: "Sheryians Coding School", handle: "@SheryiansCodingSchool", category: "dev-india" },
  { id: "UCO1cgocoWuCdeLGTauxRcgQ", name: "Gaurav Sen", handle: "@gkcs", category: "dev-india" },
  { id: "UCr_vFz2yLg_wZ1R8m4p7X8g", name: "Keerti Purswani", handle: "@KeertiPurswani", category: "dev-india" },

  { id: "UCn-3f8TW_805x428mgRpq1w", name: "Patrick Collins / Cyfrin", handle: "@PatrickAlphaC", category: "web3" },
  { id: "UCJWh7F3AFyQ_x01VKzr9eyA", name: "Smart Contract Programmer", handle: "@smartcontractprogrammer", category: "web3" },
  { id: "UCb1j2g8_1C6G21u8S_FvF4g", name: "RareSkills", handle: "@RareSkills_io", category: "web3" },
  { id: "UC1Wp34xZ9N4S4S62c9P79hA", name: "Harkirat (Web3 & Rust)", handle: "@Harkirat1", category: "web3" },
  { id: "UCfA_S_S7z1Qn7eP44bJd9Sw", name: "Dapp University", handle: "@DappUniversity", category: "web3" },
  { id: "UCa_F6dK0y9Jg1829eD1Z4Aw", name: "Ethereum Foundation", handle: "@ethereumfoundation", category: "web3" },

  { id: "UCsBjURrPoezykLs9EqgamOA", name: "Fireship", handle: "@fireship", category: "dev-global" },
  { id: "UC8ENHE5xdFSwx71u3fDH5Xw", name: "ThePrimeagen", handle: "@ThePrimeagen", category: "dev-global" },
  { id: "UCbRP3c757lWg9M-U7TyEkXA", name: "Theo — t3.gg", handle: "@t3dotgg", category: "dev-global" },
  { id: "UCFbNIlP45GZN29v17E4eXoQ", name: "Web Dev Simplified", handle: "@WebDevSimplified", category: "dev-global" },

  { id: "UCYO_jab_esuFRV4b17AJtAw", name: "3Blue1Brown", handle: "@3blue1brown", category: "ai-research" },
  { id: "UCbfYPyITQ-7l4upoX8nvctg", name: "Two Minute Papers", handle: "@twominutepapers", category: "ai-research" },
  { id: "UCZHmQk67mSJgfCCTn7xBfew", name: "Yannic Kilcher", handle: "@YannicKilcher", category: "ai-research" },
  { id: "UCXUPKJO5MZqnPe1oj1Stfcw", name: "Andrej Karpathy", handle: "@AndrejKarpathy", category: "ai-research" },
  { id: "UCJiAkgc4n6vWp4P8gO1HoxQ", name: "AI Explained", handle: "@ai-explained-official", category: "ai-research" },

  { id: "UClcE-kVhqyiHCcjYwcpfj9w", name: "LiveOverflow", handle: "@LiveOverflow", category: "cybersecurity" },
  { id: "UCVeW9qkBjo3zosnqUbG7CFw", name: "John Hammond", handle: "@_JohnHammond", category: "cybersecurity" },
  { id: "UCa6eh7gCkpPo5XXUDf5Q14g", name: "IppSec", handle: "@ippsec", category: "cybersecurity" },
  { id: "UC6q_b7hQZg9K1V_8e4n_0uQ", name: "Low Level Learning", handle: "@LowLevelLearning", category: "cybersecurity" },

  { id: "UCcefcZRL2oaA_TsBi54SXmw", name: "Y Combinator", handle: "@ycombinator", category: "startups" },
  { id: "UC3N_O4h7eR2A1n6F3c2D8Aw", name: "MicroConf", handle: "@MicroConf", category: "startups" },
  { id: "UCL_k_49_e9z_74_0b8fA2bQ", name: "Lenny's Podcast", handle: "@LennysPodcast", category: "startups" },

  { id: "UC7YOGHUfC1Tb6E4dy53ZAzw", name: "Mental Outlaw", handle: "@MentalOutlaw", category: "privacy" },
  { id: "UCHnyfMqiRRG1u-2MsSQLbXA", name: "The Hated One", handle: "@TheHatedOne", category: "privacy" },
  { id: "UC2eYFnH61tmytImy1mTYvhA", name: "Louis Rossmann", handle: "@rossmanngroup", category: "privacy" },

  { id: "UCvA_w871FbqP77695_z9WdQ", name: "Jeff Geerling", handle: "@JeffGeerling", category: "infra" },
  { id: "UC787Z1a4s_S6hR_4G8hK8wQ", name: "Learn Linux TV", handle: "@LearnLinuxTV", category: "infra" },
  { id: "UC4_s5b2-3n4F9hJ_8m7K1bA", name: "Chris Titus Tech", handle: "@ChrisTitusTech", category: "infra" },

  { id: "UC7vVhkEfw4nOGp8TyDk7RcQ", name: "Boston Dynamics", handle: "@BostonDynamics", category: "robotics" },
  { id: "UC4xK4mZl2eY_U26245lB1fw", name: "Unitree Robotics", handle: "@UnitreeRobotics", category: "robotics" },
  { id: "UC2AgmpmxpT65Jz6x_90qCqw", name: "Stuff Made Here", handle: "@StuffMadeHere", category: "robotics" },
  { id: "UCF51bLqT_63eCgH_1Yd2Q1A", name: "James Bruton", handle: "@JamesBruton", category: "robotics" },

  { id: "UCS0N5BaLq6W5PXCG7gX2eGA", name: "Ben Eater", handle: "@BenEater", category: "hardware" },
  { id: "UCJ0-OtVpF0wOKEqT2Z1HEtA", name: "ElectroBOOM", handle: "@ElectroBOOM", category: "hardware" },
  { id: "UC4_e_B8f3wB2f9k_4y9X8aQ", name: "Asianometry", handle: "@Asianometry", category: "hardware" },

  { id: "UCHnyfMqiRRG1u-2MsSQLbXA", name: "Veritasium", handle: "@veritasium", category: "science" },
  { id: "UCsXVk37bltHxD1rDPwtNM8Q", name: "Kurzgesagt", handle: "@kurzgesagt", category: "science" },
  { id: "UC7_gcs09iThXybpVgjHZ_7g", name: "PBS Space Time", handle: "@pbsspacetime", category: "science" },
];

export function getCategories(): DirectoryCategory[] {
  return DIRECTORY_CATEGORIES;
}

export function getChannelsByCategory(categoryId: string): CuratedChannel[] {
  if (categoryId === "all") {
    const indian = CURATED_CHANNELS.filter((ch) => ch.category === "dev-india");
    const web3 = CURATED_CHANNELS.filter((ch) => ch.category === "web3");
    const globalDev = CURATED_CHANNELS.filter((ch) => ch.category === "dev-global");

    return [
      ...indian.slice(0, 8),
      ...web3.slice(0, 2),
      ...globalDev.slice(0, 1),
    ];
  }

  return CURATED_CHANNELS.filter((ch) => ch.category === categoryId);
}

export function shuffleVideos<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function interleaveAndShuffle<T extends { channelName?: string; channelId?: string }>(videos: T[]): T[] {
  if (videos.length <= 1) return videos;

  const byCreator = new Map<string, T[]>();
  for (const v of videos) {
    const key = v.channelId || v.channelName || "unknown";
    if (!byCreator.has(key)) {
      byCreator.set(key, []);
    }
    byCreator.get(key)!.push(v);
  }

  const queues = Array.from(byCreator.values()).map((q) => shuffleVideos(q));

  const interleaved: T[] = [];
  let remaining = true;
  while (remaining) {
    remaining = false;
    const shuffledOrder = shuffleVideos([...queues]);
    for (const q of shuffledOrder) {
      if (q.length > 0) {
        interleaved.push(q.shift()!);
        remaining = true;
      }
    }
  }

  return interleaved;
}
