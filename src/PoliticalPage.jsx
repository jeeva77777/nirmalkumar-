import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  Copy,
  GraduationCap,
  Inbox,
  KeyRound,
  Landmark,
  LogOut,
  Mail,
  Menu,
  Scale,
  ShieldCheck,
  Sun,
  X
} from "lucide-react";
import "./political.css";

const media = "https://ctrnirmalkumar.com/wp-content/uploads/2026/";
const stories = [
  {
    date: "24 OCT 2026",
    dateTamil: "24 அக்டோபர் 2026",
    category: "INFRASTRUCTURE & TRANSIT · MADURAI",
    categoryTamil: "உள்கட்டமைப்பு & போக்குவரத்து · மதுரை",
    title: "Inauguration of New Bus Terminus Built at ₹8.50 Crore in Chekkanurani, Madurai",
    tamil: "மதுரை செக்கானூரணியில் ₹8.50 கோடி மதிப்பீட்டில் கட்டப்பட்ட புதிய பேருந்து நிலையத்தைத் திறந்து வைத்தார் CTR. நிர்மல் குமார்",
    summary: "Minister CTR Nirmal Kumar inaugurated the newly constructed modern transit bus terminus at Chekkanurani in Madurai district, built at a cost of ₹8.50 crore under the Integrated Assigned Revenue Scheme (SCPAR).",
    summaryTamil: "மதுரை மாவட்டம் திருமங்கலம் ஊராட்சி ஒன்றியம், ஆ.கொக்குளம் ஊராட்சி செக்கானூரணியில் ஒப்படைக்கப்பட்ட வருவாய் திட்டத்தின் (SCPAR) கீழ் ₹8.50 கோடி மதிப்பீட்டில் புதிதாகக் கட்டப்பட்டுள்ள நவீன பேருந்து நிலையத்தை மாண்புமிகு அமைச்சர் CTR. நிர்மல் குமார் திறந்து வைத்தார்.",
    image: "/chekkanurani-bus-terminus.jpg",
    alt: "CTR Nirmal Kumar inaugurating Chekkanurani bus terminus dedication stone plaque in Madurai",
    altTamil: "மதுரை செக்கானூரணி புதிய பேருந்து நிலைய கல்வெட்டை திறந்து வைக்கும் CTR. நிர்மல் குமார்",
    caption: "BUS TERMINUS · CHEKKANURANI",
    captionTamil: "புதிய பேருந்து நிலையம் · செக்கானூரணி"
  },
  {
    date: "18 OCT 2026",
    dateTamil: "18 அக்டோபர் 2026",
    category: "WELFARE & INFRASTRUCTURE · THENI",
    categoryTamil: "மக்கள் நலம் & உள்கட்டமைப்பு · தேனி",
    title: "Theni: 3 School Buildings Opened, Welfare Aid to 1,960 Beneficiaries & 6 Buses Launched",
    tamil: "தேனியில் 3 பள்ளிக் கட்டடங்கள் திறப்பு, 1,960 பயனாளிகளுக்கு நலத்திட்ட உதவிகள் மற்றும் 6 புதிய பேருந்துகள் தொடக்கம்",
    summary: "Inaugurated 3 school buildings worth ₹2.82 crore, distributed ₹26.45 crore welfare assistance to 1,960 beneficiaries, and flagged off 6 new buses under the Vettri Payanam scheme at Theni Collectorate.",
    summaryTamil: "தேனி மாவட்ட ஆட்சியர் அலுவலகப் புதிய கூட்டரங்கில் பள்ளிக்கல்வித்துறையின் சார்பில் ரூ.2.82 கோடி மதிப்பீட்டில் 3 பள்ளிக் கட்டடங்களைத் திறந்து வைத்து, 1,960 பயனாளிகளுக்கு ரூ.26.45 கோடி நலத்திட்ட உதவிகள் வழங்கி, வெற்றிப் பயணம் திட்டத்தின் கீழ் 6 புதிய பேருந்துகளை CTR. நிர்மல் குமார் கொடியசைத்துத் தொடங்கி வைத்தார்.",
    image: "/theni-welfare-event.jpg",
    alt: "CTR Nirmal Kumar presenting welfare assistance to beneficiaries at Theni Collectorate",
    altTamil: "தேனியில் பயனாளிகளுக்கு நலத்திட்ட உதவிகளை வழங்கும் CTR. நிர்மல் குமார்",
    caption: "WELFARE & BUSES · THENI",
    captionTamil: "நலத்திட்டம் & பேருந்துகள் · தேனி"
  },
  {
    date: "OCT 2026",
    dateTamil: "அக்டோபர் 2026",
    category: "EMPLOYMENT & YOUTH",
    categoryTamil: "வேலைவாய்ப்பு மற்றும் இளைஞர் நலன்",
    title: "Employment opportunities for the people of Madurai",
    tamil: "மதுரையில் மாபெரும் தனியார்துறை வேலைவாய்ப்பு முகாம்: தேர்வானவர்களுக்கு பணி நியமன ஆணைகள் வழங்கல்",
    summary: "Appointment orders were issued to candidates selected at a major private-sector job fair held at a Madurai college.",
    summaryTamil: "மதுரை கல்லூரியில் நடைபெற்ற மாபெரும் தனியார்துறை வேலைவாய்ப்பு முகாமில் தேர்வு செய்யப்பட்டவர்களுக்கு பணி நியமன ஆணைகள் வழங்கப்பட்டன.",
    image: `${media}10/ctr-nirmal-kumar-madurai-job-fair-768x512.jpg`,
    alt: "CTR Nirmal Kumar presenting appointment orders at Madurai job fair",
    altTamil: "மதுரை வேலைவாய்ப்பு முகாமில் பணி நியமன ஆணைகளை வழங்கும் CTR. நிர்மல் குமார்",
    caption: "JOB FAIR · MADURAI",
    captionTamil: "வேலைவாய்ப்பு முகாம் · மதுரை"
  },
  {
    date: "OCT 2026",
    dateTamil: "அக்டோபர் 2026",
    category: "ENTERPRISE & HONOUR",
    categoryTamil: "தொழில்முனைவு மற்றும் பாராட்டு",
    title: "Celebrating the spirit of enterprise at CEDOI Awards",
    tamil: "CEDOI விருதுகள் 2026 தொழில்முனைவோர் பாராட்டு விழாவில் பங்கேற்பு",
    summary: "Participation in the CEDOI Awards 2026 entrepreneur recognition event at Velammal IDA Scudder Auditorium, Madurai.",
    summaryTamil: "மதுரை வேலம்மாள் IDA ஸ்கடர் அரங்கில் நடைபெற்ற CEDOI விருதுகள் 2026 தொழில்முனைவோர் பாராட்டு நிகழ்ச்சியில் பங்கேற்பு.",
    image: `${media}10/ctr-nirmal-kumar-cedoi-awards-2026-768x624.jpg`,
    alt: "CTR Nirmal Kumar at CEDOI Awards 2026 in Madurai",
    altTamil: "மதுரையில் நடைபெற்ற CEDOI விருதுகள் 2026 விழாவில் CTR. நிர்மல் குமார்",
    caption: "CEDOI AWARDS · MADURAI",
    captionTamil: "CEDOI விருதுகள் · மதுரை"
  },
  {
    date: "OCT 2026",
    dateTamil: "அக்டோபர் 2026",
    category: "LEADERSHIP & SERVICE",
    categoryTamil: "தலைமை மற்றும் சேவை",
    title: "A meeting of commitment, service and a shared future",
    tamil: "வெற்றி நாயகன், முதலமைச்சர் விஜய் அண்ணனை சந்தித்து வாழ்த்து தெரிவித்த போது",
    summary: "A moment of meeting and congratulating Tamil Nadu Chief Minister Vijay.",
    summaryTamil: "தமிழக முதலமைச்சர் விஜய் அண்ணனைச் சந்தித்து வாழ்த்து தெரிவித்த தருணம்.",
    image: `${media}10/ctr-nirmal-kumar-cm-vijay-meeting-768x515.jpg`,
    alt: "CTR Nirmal Kumar meeting Chief Minister Vijay",
    altTamil: "முதலமைச்சர் விஜய்யை சந்தித்த CTR. நிர்மல் குமார்",
    caption: "WITH CM VIJAY · CHENNAI",
    captionTamil: "முதலமைச்சருடன் · சென்னை"
  },
  {
    date: "OCT 2026",
    dateTamil: "அக்டோபர் 2026",
    category: "ENERGY & ENVIRONMENT",
    categoryTamil: "எரிசக்தி மற்றும் சுற்றுச்சூழல்",
    title: "Windergy India 2026: Addressing the international wind energy conference",
    tamil: "Windergy India 2026 சர்வதேச காற்றாலை மின் கண்காட்சி மற்றும் மாநாட்டில் சிறப்புரை",
    summary: "Delivered an address on behalf of Tamil Nadu’s Energy Department at the international wind energy exhibition and conference in Chennai.",
    summaryTamil: "சென்னை நந்தம்பாக்கத்தில் நடைபெற்ற Windergy India 2026 சர்வதேச காற்றாலை மின் கண்காட்சி மற்றும் மாநாட்டில் தமிழ்நாடு எரிசக்தித் துறை சார்பாகச் சிறப்புரையாற்றினார்.",
    image: `${media}10/ctr-nirmal-kumar-windergy-india-2026-1024x683.jpg`,
    alt: "CTR Nirmal Kumar addressing Windergy India 2026 conference",
    altTamil: "Windergy India 2026 மாநாட்டில் உரையாற்றும் CTR. நிர்மல் குமார்",
    caption: "WINDERGY INDIA · CHENNAI",
    captionTamil: "விண்டர்ஜி இந்தியா · சென்னை"
  },
  { date: "26 SEP 2026", dateTamil: "26 செப்டம்பர் 2026", category: "LAW & EDUCATION", categoryTamil: "சட்டம் மற்றும் கல்வி", title: "CTR Nirmal Kumar awards degrees at Government Law College Madurai", tamil: "மதுரை அரசு சட்டக் கல்லூரி 2ஆம் ஆண்டு பட்டமளிப்பு விழாவில் மாணவர்களுக்கு பட்டம் வழங்கிய CTR. நிர்மல் குமார்", summary: "At the second graduation ceremony of Government Law College, Madurai, held at Tamukkam Ground Convention Hall, CTR Nirmal Kumar presented degrees to graduates. Justices A.D. Jagadish Chandra, C. Saravanan and B. Murugesan also attended.", summaryTamil: "26.09.2026 அன்று மதுரை தமுக்கம் மைதானம் Convention Hall-ல் நடைபெற்ற அரசு சட்டக் கல்லூரியின் 2ஆம் ஆண்டு பட்டமளிப்பு விழாவில் கலந்து கொண்டு, பட்டம் பெற்ற மாணவ, மாணவியர்களுக்கு CTR. நிர்மல் குமார் பட்டங்களை வழங்கி வாழ்த்தினார். மாண்புமிகு நீதியரசர்கள் A.D. ஜெகதீஷ் சந்திரா, C. சரவணன், B. முருகேசன் உள்ளிட்ட சட்டத்துறை விருந்தினர்களும் பங்கேற்றனர்.", image: "/law-college-graduation.png", alt: "Graduates and guests at the Government Law College Madurai graduation ceremony", altTamil: "மதுரை அரசு சட்டக் கல்லூரி பட்டமளிப்பு விழாவில் பங்கேற்ற மாணவர்கள் மற்றும் விருந்தினர்கள்", caption: "GRADUATION CEREMONY · MADURAI", captionTamil: "பட்டமளிப்பு விழா · மதுரை" },
  { date: "SEP 2026", dateTamil: "செப்டம்பர் 2026", category: "MADURAI · TEMPLE VISIT", categoryTamil: "மதுரை · திருக்கோயில் சந்திப்பு", title: "At Madurai Meenakshi Amman Temple with Chief Minister Vijay", tamil: "மதுரை மீனாட்சி அம்மன் கோயிலில் முதலமைச்சர் விஜய் அண்ணனுடன் CTR. நிர்மல் குமார்", summary: "CTR Nirmal Kumar visited Arulmigu Meenakshi Sundaraswarar Temple in Madurai with Chief Minister Joseph Vijay.", summaryTamil: "மதுரை அருள்மிகு மீனாட்சி சுந்தரேசுவரர் திருக்கோயிலில் மாண்புமிகு முதலமைச்சர் ஜோசப் விஜய் அண்ணனுடன் CTR. நிர்மல் குமார் சந்தித்த தருணம்.", image: "/meenakshi-temple-meeting.png", portrait: true, alt: "CTR Nirmal Kumar with Chief Minister Joseph Vijay at Meenakshi Amman Temple, Madurai", altTamil: "மதுரை மீனாட்சி அம்மன் கோயிலில் முதலமைச்சர் ஜோசப் விஜய்யுடன் CTR. நிர்மல் குமார்", caption: "WITH THE CHIEF MINISTER · MADURAI", captionTamil: "முதலமைச்சருடன் · மதுரை" },
  { date: "03 OCT 2026", dateTamil: "03 அக்டோபர் 2026", category: "LAWYERS CONFERENCE · ERODE", categoryTamil: "வழக்கறிஞர்கள் மாநாடு · ஈரோடு", title: "CTR Nirmal Kumar attends lawyers’ conference and general council meeting in Erode", tamil: "ஈரோட்டில் வழக்கறிஞர்கள் எழுச்சி மாநாடு மற்றும் பொதுக்குழுக் கூட்டத்தில் CTR. நிர்மல் குமார் பங்கேற்பு", summary: "On 3 October 2026, CTR Nirmal Kumar attended the Lawyers’ Uprising Conference and General Council Meeting organised by the Federation of Bar Associations of Tamil Nadu and Puducherry in Erode.", summaryTamil: "03.10.2026 அன்று ஈரோடு மாவட்டத்தில் தமிழ்நாடு மற்றும் புதுச்சேரி வழக்கறிஞர்கள் சங்கங்களின் கூட்டமைப்பு சார்பில் நடைபெற்ற வழக்கறிஞர்கள் எழுச்சி மாநாடு மற்றும் பொதுக்குழுக் கூட்டத்தில் CTR. நிர்மல் குமார் கலந்து கொண்டார்.", image: "/erode-lawyers-conference.png", alt: "CTR Nirmal Kumar at the lawyers’ conference in Erode", altTamil: "ஈரோட்டில் நடைபெற்ற வழக்கறிஞர்கள் எழுச்சி மாநாட்டில் CTR. நிர்மல் குமார்", caption: "LAWYERS’ CONFERENCE · ERODE", captionTamil: "வழக்கறிஞர்கள் மாநாடு · ஈரோடு" }
];

const getPhotoUrl = (img) => (img.startsWith("/") || img.startsWith("http") ? img : `${media}07/${img}`);
const gallery = [
  "/chekkanurani-service-moment.png",
  "/theni-welfare-service-moment.jpg",
  "ctr-nirmal-kumar-tvk-1-1024x501.jpg",
  "ctr-nirmal-kumar-tvk-2-1024x683.jpg",
  "ctr-nirmal-kumar-tvk-3-1024x576.jpg",
  "ctr-nirmal-kumar-tvk-5-1024x683.jpg",
  "ctr-nirmal-kumar-tvk-6-1024x940.jpg",
  "ctr-nirmal-kumar-tvk-7-1024x682.jpg",
  "ctr-nirmal-kumar-tvk-8-scaled.jpg",
  "ctr-nirmal-kumar-tvk-9.jpg",
  "ctr-nirmal-kumar-tvk-4-1.jpg",
  "ctr-nirmal-kumar-tvk-10.jpg",
  "ctr-nirmal-kumar-tvk-11-scaled.jpg",
  "ctr-nirmal-kumar-tvk-12.jpg"
];

export default function PoliticalPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [language, setLanguage] = useState("EN");
  const [scrolled, setScrolled] = useState(false);
  const [portalIntent, setPortalIntent] = useState(null);
  const [portalStage, setPortalStage] = useState("petition");
  const [petitionerName, setPetitionerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [issue, setIssue] = useState("");
  const [details, setDetails] = useState("");
  const [constituency, setConstituency] = useState("Thiruparankundram");
  const [petitionRef, setPetitionRef] = useState("");
  const [petitionResult, setPetitionResult] = useState(null);
  const [verificationToken, setVerificationToken] = useState(null);
  const [userPetitions, setUserPetitions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [copied, setCopied] = useState(false);
  const [activePhoto, setActivePhoto] = useState(null);
  const tamil = language === "தமிழ்";
  const credentials = tamil ? "CTR. நிர்மல் குமார், B.E., LL.B., M.A." : "CTR. Nirmal Kumar, B.E., LL.B., M.A.";

  const copy = tamil ? {
    nav: ["முகப்பு", "அறிமுகம்", "ஆற்றல் மற்றும் சட்டம்", "செய்திகள்", "புகைப்படங்கள்", "எனது மனுக்கள்", "தொடர்பு"],
    brandSubtitle: "பொதுச் சேவை · தமிழ்நாடு", homeLabel: "CTR நிர்மல் குமார் முகப்பு", navigationLabel: "முதன்மை வழிசெலுத்தல்", languageLabel: "மொழியைத் தேர்ந்தெடுக்கவும்", login: "உள்நுழைவு", getInTouch: "தொடர்புகொள்ள",
    government: "தமிழ்நாடு அரசு", heroTop: "மக்களுக்காக.", heroBottom: "தமிழ்நாட்டிற்காக.", ministerRole: "மாண்புமிகு எரிசக்தி வளங்கள் மற்றும் சட்டத்துறை அமைச்சர்", constituencyRole: "திருப்பரங்குன்றம் சட்டமன்ற உறுப்பினர்", heroIntro: "மக்கள் நலன், பொறுப்பான நிர்வாகம் மற்றும் தமிழ்நாட்டின் முன்னேற்றத்திற்கான அர்ப்பணிப்பு.", submit: "மனு அளிக்க", track: "மனுவின் நிலை", meet: "நிர்மல் குமாரை அறிய", values: "சேவை · நேர்மை · முன்னேற்றம்", scroll: "மேலும் காண கீழே செல்லவும்", scrollAbout: "அறிமுகப் பகுதிக்குச் செல்லவும்",
    roleGovernment: "தமிழ்நாடு அரசு", minister: "எரிசக்தி வளங்கள் மற்றும் சட்டத்துறை அமைச்சர்", legislature: "சட்டமன்றம்", constituency: "திருப்பரங்குன்றம் உறுப்பினர்", party: "தமிழக வெற்றிக் கழகம்", jointSecretary: "இணைப் பொதுச் செயலாளர்",
    aboutIndex: "01 / அறிமுகம்", imageAlt: "சமூகத்தினரைச் சந்திக்கும் சி.டி.ஆர். நிர்மல் குமார்", peopleFirst: "மக்கள்\nமுதலில்", imageNote: "கேட்டு, சேவை செய்து, ஒன்றாக முன்னேறுவதற்கான அர்ப்பணிப்பு.", aboutEyebrow: "பொதுச் சேவையில் ஒரு பயணம்", aboutTop: "மக்களை மையமாகக் கொண்ட", aboutBottom: "தலைமை.", aboutLead: "பொறியியல், சட்டம் மற்றும் குற்றவியல் கல்வி பெற்ற சி.டி.ஆர். நிர்மல் குமார், எரிசக்தி வளங்கள் மற்றும் சட்டத்துறையில் கவனம் செலுத்தி தமிழ்நாட்டின் வளர்ச்சிக்காகப் பொதுச் சேவையில் ஈடுபட்டு வருகிறார்.", aboutBody: "அத்தியாவசிய உள்கட்டமைப்பை வலுப்படுத்துதல், நிலையான எரிசக்தி முயற்சிகளுக்கு ஆதரவு அளித்தல், திறமையான சட்டம் மற்றும் நீதித்துறைக்கு பங்களித்தல் ஆகியவற்றில் அவர் கவனம் செலுத்துகிறார். மக்களை மையமாகக் கொண்ட அணுகுமுறையுடன், பொதுமக்களின் தேவைகளையும் தமிழ்நாட்டின் நலன் மற்றும் முன்னேற்றத்தையும் முன்னிறுத்திச் செயல்படுகிறார்.", education: "கல்வி", computerScience: "கணினி அறிவியல்", lawDegree: "சட்டம்", criminology: "குற்றவியல் மற்றும் காவல் நிர்வாகம்",
    workEyebrow: "முன்னேற்றத்திற்கான பணி", workTop: "முன்னேற்றத்திற்கு ஆற்றல்.", workBottom: "நீதியை வலுப்படுத்துதல்.", workIntro: "நம்பகமான பொதுக் கட்டமைப்புகள் மற்றும் அனைவருக்கும் சேவை செய்யும் நிறுவனங்கள் வழியாக வலுவான, நிலையான, நீதியான தமிழ்நாட்டை உருவாக்குதல்.", energy: "எரிசக்தி வளங்கள்", energyText: "புதுப்பிக்கத்தக்க எரிசக்தி, நம்பகமான மின்சாரக் கட்டமைப்பு மற்றும் தமிழ்நாட்டிற்கான நிலையான ஆற்றல் வளர்ச்சிக்கு ஆதரவு.", energyCaption: "தூய்மையான, உறுதியான எதிர்காலம்", law: "சட்டம் மற்றும் நீதி", lawText: "சட்ட நிர்வாகம், நீதித்துறை உள்கட்டமைப்பு மற்றும் திறமையான நீதி அமைப்பை அணுகும் வாய்ப்பை வலுப்படுத்துதல்.", lawCaption: "நியாயம் · அணுகல் · பொறுப்புணர்வு", quote: "ஒவ்வொருவரும் உணரக்கூடிய தாக்கத்தை ஏற்படுத்தும்போதுதான் வளர்ச்சி அர்த்தமுள்ளதாகிறது.", quoteCaption: "மக்களை மையமாகக் கொண்ட நிர்வாக அணுகுமுறை",
    newsEyebrow: "தொகுதியிலிருந்து", newsTitle: "செய்திகள் மற்றும்", newsBottom: "புதுப்பிப்புகள்.", publicUpdate: "பொதுச் செய்தி", galleryEyebrow: "சமூகத்துடன்", galleryTitle: "சேவையின்", galleryBottom: "தருணங்கள்.",
    connectEyebrow: "தொடர்பில் இருங்கள்", connectTop: "பொதுச் சேவை", connectBottom: "ஒரு உரையாடலில் தொடங்குகிறது.", connectText: "தமிழ்நாட்டை வடிவமைக்கும் பணிகள், நிகழ்வுகள் மற்றும் முயற்சிகள் குறித்த புதுப்பிப்புகளைப் பெறுங்கள்.", socialNames: ["பேஸ்புக்", "எக்ஸ் / ட்விட்டர்", "இன்ஸ்டாகிராம்"], footerRole: "எரிசக்தி வளங்கள் மற்றும் சட்டத்துறை அமைச்சர் · தமிழ்நாடு அரசு", backToTop: "மேலே செல்லவும்",
    closePortal: "குடிமக்கள் சேவைப் பலகையை மூடவும்", portalKicker: "சி.டி.ஆர். நிர்மல் குமார் அலுவலகம்",
    verifyTitle: "அடையாளத்தை உறுதிப்படுத்தவும்", verifyText: "குடிமக்கள் சேவையைப் பயன்படுத்த உங்கள் மின்னஞ்சலை உள்ளிடவும்.", mobileLabel: "கைபேசி எண் (விருப்பத்தேர்வு)",
    emailLabel: "மின்னஞ்சல் முகவரி", emailPlaceholder: "பெயர்@gmail.com",
    sendOtp: "மின்னஞ்சல் OTP பெறுக", gmailSmtpNote: "ironkyle007@gmail.com வழியாக உங்கள் மின்னஞ்சல் முகவரிக்கு 6 இலக்க சரிபார்ப்புக் குறியீடு (Gmail SMTP) அனுப்பப்படும்.",
    otpTitle: "சரிபார்ப்புக் குறியீட்டை உள்ளிடவும்", otpText: "இந்த மின்னஞ்சல் முகவரிக்கு அனுப்பிய 6 இலக்கக் குறியீட்டை உள்ளிடவும்: ", otpLabel: "ஒருமுறை குறியீடு (OTP)",
    verifyContinue: "உறுதிப்படுத்தி தொடரவும்",
    petitionTitle: "மனு அளிக்க", petitionText: "உங்கள் கோரிக்கையை தொகுதி அலுவலகத்திற்கு நேரடியாகச் சமர்ப்பிக்கவும்.",
    petitionerName: "மனுதாரர் பெயர்", namePlaceholder: "உங்கள் முழுப் பெயர்",
    subject: "தலைப்பு", subjectPlaceholder: "எந்த உதவி தேவை?", details: "விவரங்கள்", detailsPlaceholder: "பிரச்சினையையும் இருப்பிடத்தையும் விரிவாக விவரிக்கவும்",
    submitPetition: "மனுவைச் சமர்ப்பிக்கவும்",
    trackTitle: "மனுவின் நிலையை அறியவும்", trackText: "சமர்ப்பித்த மனுவின் குறிப்பு எண்ணையும் பதிவுசெய்த மின்னஞ்சலையும் உள்ளிடவும்.",
    reference: "குறிப்பு எண்", checkStatus: "நிலையைச் சரிபார்க்கவும்", petitionReceived: "மனு பெறப்பட்டது",
    databaseRecorded: "மனு அதிகாரப்பூர்வமாகப் பதிவு செய்யப்பட்டது",
    thankYou: "தொடர்புகொண்டதற்கு நன்றி.", localReference: "உங்கள் மனு குறிப்பு எண்:", trackThis: "இந்த மனுவின் நிலையைக் காண்க",
    petitionStatus: "மனுவின் நிலை", requestReceived: "மனு விவரங்கள்", noRecord: "மனு பதிவு காணப்படவில்லை",
    noRecordText: "குறிப்பு எண்ணும் பதிவுசெய்த மின்னஞ்சல் முகவரியும் சரியாக உள்ளனவா எனச் சரிபார்க்கவும்.",
    tryAnother: "வேறு மனுவைச் சரிபார்க்கவும்", citizenPortal: "குடிமக்கள் சேவை மையம்", chooseAction: "தொடர விரும்பும் செயலைத் தேர்ந்தெடுக்கவும்.",
    sendingOtp: "OTP அனுப்பப்படுகிறது...", verifying: "சரிபார்க்கப்படுகிறது...", submitting: "சமர்ப்பிக்கப்படுகிறது...",
    resendIn: "மீண்டும் OTP பெற ", resendOtp: "மீண்டும் OTP பெறுக", changeEmail: "மின்னஞ்சலை மாற்ற", changeMobile: "எண்ணை மாற்ற",
    verifyAndSubmit: "OTP சரிபார்த்து மனுவைச் சமர்ப்பிக்கவும்",
    verifyAndTrack: "OTP சரிபார்த்து நிலையைக் காண்க",
    sendOtpToTrack: "பாதுகாப்பு OTP பெறுக",
    copyRef: "நகலெடு", copied: "நகலெடுக்கப்பட்டது!",
    petitionSaved: "உங்கள் மனு வெற்றிகரமாகப் பதிவு செய்யப்பட்டு தொகுதி அலுவலகத்திற்கு அனுப்பப்பட்டுள்ளது. மின்னஞ்சல் உறுதிப்படுத்தல் அனுப்பப்பட்டுள்ளது.",
    petitionTimeline: "மனு நடவடிக்கை வரலாறு", submittedOn: "சமர்ப்பிக்கப்பட்ட தேதி",
    securityVerificationNote: "பாதுகாப்புக் காரணங்களுக்காக பதிவுசெய்த மின்னஞ்சல் முகவரிக்கு OTP அனுப்பப்படும்.",
    loginTitle: "குடிமக்கள் உள்நுழைவு", loginText: "உங்கள் மின்னஞ்சலை உள்ளிட்டு Gmail SMTP சரிபார்ப்புக் குறியீடு பெற்று உள்நுழையவும்.",
    sendLoginOtp: "உள்நுழைவு OTP பெறுக", verifyAndLogin: "சரிபார்த்து உள்நுழையவும்",
    myPetitionsTitle: "பதிவுசெய்யப்பட்ட மனுக்கள்", noPetitionsYet: "இந்த மின்னஞ்சலில் இதுவரை மனுக்கள் பதிவு செய்யப்படவில்லை.",
    newPetition: "புதிய மனு அளிக்க", signOut: "வெளியேறு", verifiedCitizen: "சரிபார்க்கப்பட்ட பயனர்"
  } : {
    nav: ["Home", "About", "Energy & Law", "News", "Gallery", "My Petitions", "Connect"],
    brandSubtitle: "PUBLIC SERVICE · TAMIL NADU", homeLabel: "CTR Nirmal Kumar home", navigationLabel: "Main navigation", languageLabel: "Choose language", login: "Login", getInTouch: "Get in touch",
    government: "GOVERNMENT OF TAMIL NADU", heroTop: "A future built", heroBottom: "around people.", ministerRole: "Hon’ble Minister for Energy Resources & Law", constituencyRole: "MLA · Thiruparankundram", heroIntro: "Committed to public service, responsible governance and the progress of Tamil Nadu.", submit: "Submit Petition", track: "Track Petition", meet: "Meet Nirmal Kumar", values: "SERVICE · INTEGRITY · PROGRESS", scroll: "SCROLL TO DISCOVER", scrollAbout: "Scroll to about",
    roleGovernment: "GOVERNMENT OF TAMIL NADU", minister: "Minister for Energy Resources & Law", legislature: "LEGISLATIVE ASSEMBLY", constituency: "Member for Thiruparankundram", party: "TAMILAGA VETTRI KAZHAGAM", jointSecretary: "Joint General Secretary",
    aboutIndex: "01 / ABOUT", imageAlt: "CTR Nirmal Kumar meeting with community members", peopleFirst: "PEOPLE\nFIRST", imageNote: "A commitment to listen, serve and move forward together.", aboutEyebrow: "A life in public service", aboutTop: "Leadership that", aboutBottom: "keeps people at the centre.", aboutLead: "C.T.R. Nirmal Kumar, B.E., LL.B., M.A., is committed to public service and the development of Tamil Nadu, with a focus on Energy Resources and Law.", aboutBody: "Through his public responsibilities, he works towards strengthening essential infrastructure, supporting sustainable energy initiatives and contributing to an effective legal and justice system. With a people-centric approach, he remains focused on addressing public needs and contributing to the welfare and progress of Tamil Nadu.", education: "EDUCATION", computerScience: "Computer Science", lawDegree: "Bachelor of Law", criminology: "Criminology & Police Administration",
    workEyebrow: "The work ahead", workTop: "Powering progress.", workBottom: "Strengthening justice.", workIntro: "Building a stronger, sustainable and just Tamil Nadu through dependable public infrastructure and institutions that serve everyone.", energy: "Energy Resources", energyText: "Supporting renewable energy development, reliable power infrastructure and sustainable energy for Tamil Nadu.", energyCaption: "A CLEANER, MORE RESILIENT FUTURE", law: "Law & Justice", lawText: "Strengthening legal administration, judicial infrastructure and access to an effective justice system.", lawCaption: "FAIRNESS · ACCESS · ACCOUNTABILITY", quote: "Development matters when every person can feel its impact.", quoteCaption: "A PEOPLE-FIRST APPROACH TO GOVERNANCE",
    newsEyebrow: "From the constituency", newsTitle: "News &", newsBottom: "updates.", publicUpdate: "PUBLIC UPDATE", galleryEyebrow: "In the community", galleryTitle: "Moments of", galleryBottom: "service.",
    connectEyebrow: "Stay connected", connectTop: "Public service", connectBottom: "starts with a conversation.", connectText: "Follow CTR Nirmal Kumar for updates on the work, events and initiatives shaping Tamil Nadu.", socialNames: ["Facebook", "X / Twitter", "Instagram"], footerRole: "MINISTER FOR ENERGY RESOURCES & LAW · GOVERNMENT OF TAMIL NADU", backToTop: "BACK TO TOP",
    closePortal: "Close citizen portal", portalKicker: "OFFICE OF CTR NIRMAL KUMAR",
    verifyTitle: "Verify identity", verifyText: "Enter your email address to access the citizen portal.", mobileLabel: "Mobile number (Optional)",
    emailLabel: "Email address", emailPlaceholder: "yourname@gmail.com",
    sendOtp: "Send Email OTP", gmailSmtpNote: "A real 6-digit verification code will be sent to your email address via Gmail SMTP (ironkyle007@gmail.com).",
    otpTitle: "Enter verification code", otpText: "Enter the 6-digit code sent to ", otpLabel: "One-time code (OTP)",
    verifyContinue: "Verify and continue",
    petitionTitle: "Submit a petition", petitionText: "Share an issue directly with the constituency office.",
    petitionerName: "Petitioner name", namePlaceholder: "Enter your full name",
    subject: "Subject", subjectPlaceholder: "What do you need help with?", details: "Details", detailsPlaceholder: "Describe the issue and location in detail",
    submitPetition: "Submit petition",
    trackTitle: "Track a petition", trackText: "Enter your petition reference number and registered email address.",
    reference: "Reference number", checkStatus: "Check status", petitionReceived: "PETITION RECEIVED",
    databaseRecorded: "PETITION RECORDED IN DATABASE",
    thankYou: "Thank you for reaching out.", localReference: "Your petition reference is", trackThis: "Track this petition",
    petitionStatus: "PETITION STATUS", requestReceived: "Petition Details", noRecord: "No petition found",
    noRecordText: "Check the reference number and registered email address, or verify if the petition was submitted.",
    tryAnother: "Try another reference", citizenPortal: "Citizen Portal", chooseAction: "Choose what you would like to do.",
    sendingOtp: "Sending OTP...", verifying: "Verifying...", submitting: "Submitting...",
    resendIn: "Resend OTP in ", resendOtp: "Resend OTP", changeEmail: "Change email", changeMobile: "Change email",
    verifyAndSubmit: "Verify & Submit Petition",
    verifyAndTrack: "Verify & View Status",
    sendOtpToTrack: "Send OTP to Track",
    copyRef: "Copy", copied: "Copied!",
    petitionSaved: "Your petition has been recorded in MySQL and forwarded to the constituency office. Confirmation email sent.",
    petitionTimeline: "Status Update Timeline", submittedOn: "Submitted on",
    securityVerificationNote: "For security, a 6-digit OTP will be sent to the registered email address via Gmail SMTP before tracking details are displayed.",
    loginTitle: "Citizen Portal Login", loginText: "Enter your email address to sign in with a secure Gmail SMTP one-time verification code.",
    sendLoginOtp: "Send Login OTP", verifyAndLogin: "Verify & Enter Portal",
    myPetitionsTitle: "My Registered Petitions", noPetitionsYet: "No petitions recorded under this email address yet.",
    newPetition: "Submit New Petition", signOut: "Sign out", verifiedCitizen: "Verified Citizen"
  };

  const nav = copy.nav
    .map((label, index) => [label, ["#home", "#about", "#portfolio", "#news", "#gallery", null, "#connect"][index]])
    .filter(([, href]) => href);
  const socialLinks = copy.socialNames.map((name, index) => ({
    name,
    href: ["https://www.facebook.com/CTR.NirmalKumar", "https://x.com/CTR_Nirmalkumar", "https://www.instagram.com/ctr.nirmalkumar"][index]
  }));

  useEffect(() => {
    document.documentElement.lang = tamil ? "ta" : "en";
    document.title = tamil ? "சி.டி.ஆர். நிர்மல் குமார் | தமிழ்நாடு அமைச்சர்" : "CTR Nirmal Kumar | Minister for Energy Resources & Law, Tamil Nadu";
    document.querySelector('meta[name="description"]')?.setAttribute("content", tamil
      ? "தமிழ்நாடு எரிசக்தி வளங்கள் மற்றும் சட்டத்துறை அமைச்சர், திருப்பரங்குன்றம் சட்டமன்ற உறுப்பினர் சி.டி.ஆர். நிர்மல் குமாரின் அதிகாரப்பூர்வ இணையதளம்."
      : "Official website of CTR Nirmal Kumar, Minister for Energy Resources and Law, Government of Tamil Nadu, and MLA for Thiruparankundram.");
  }, [tamil]);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const openPortal = (intent) => {
    setPortalIntent(intent);
    if (intent === "submit") {
      setPortalStage("petition");
    } else if (intent === "track") {
      setPortalStage("track");
    } else {
      setPortalStage(verificationToken ? "dashboard" : "login");
    }
    setOtp("");
    setPetitionResult(null);
    setLoading(false);
    setErrorMessage("");
    setSuccessMessage("");
    setCooldown(0);
    setCopied(false);
    setMenuOpen(false);
  };

  const closePortal = () => setPortalIntent(null);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const next = window.scrollY > 36;
          setScrolled((prev) => (prev !== next ? next : prev));
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    // High-Performance Hardware-Accelerated Scroll-Trigger Reveal
    const sections = Array.from(document.querySelectorAll(
      ".mandate-strip, .about-section, .portfolio-section, .news-section, .gallery-section, .connect-section, .site-footer"
    ));
    const headings = Array.from(document.querySelectorAll(
      ".about-copy, .section-heading, .gallery-heading, .connect-copy"
    ));
    const cardGrids = Array.from(document.querySelectorAll(
      ".mandate-strip, .portfolio-grid, .news-grid, .gallery-grid, .social-links, .education-items"
    ));

    sections.forEach((sec) => sec.classList.add("aadhav-section-reveal"));
    headings.forEach((hdg) => hdg.classList.add("aadhav-heading-reveal"));

    const itemElements = [];
    cardGrids.forEach((grid) => {
      Array.from(grid.children).forEach((child, idx) => {
        child.classList.add("aadhav-item-reveal");
        child.style.setProperty("--aadhav-stagger", Math.min(idx, 6).toString());
        itemElements.push(child);
      });
    });

    const aboutImg = document.querySelector(".about-image-column");
    if (aboutImg) {
      aboutImg.classList.add("aadhav-item-reveal");
      aboutImg.style.setProperty("--aadhav-stagger", "0");
      itemElements.push(aboutImg);
    }

    const allTargets = [...sections, ...headings, ...itemElements];

    if (!("IntersectionObserver" in window)) {
      allTargets.forEach((el) => el.classList.add("is-inview"));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-inview");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.01,
        rootMargin: "80px 0px 80px 0px"
      }
    );

    allTargets.forEach((target) => observer.observe(target));

    return () => {
      observer.disconnect();
    };
  }, [language]);

  useEffect(() => {
    if (!portalIntent && !activePhoto) return undefined;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        if (activePhoto) setActivePhoto(null);
        else closePortal();
      }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [portalIntent, activePhoto]);

  const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((e || "").trim());
  const isValidIndianMobile = (p) => !p || /^[6-9]\d{9}$/.test((p || "").replace(/\D/g, ""));
  const sanitizeRefNo = (raw) => {
    if (!raw) return "";
    const upper = raw.trim().toUpperCase();
    const match = upper.match(/CTR-\d{4}-\d{6}/);
    return match ? match[0] : upper;
  };

  // Helper for resilient JSON API requests with clear bilingual error messages
  const safeApiRequest = async (url, body) => {
    let res;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
    } catch {
      throw new Error(
        tamil
          ? "சேவையகத்தை தொடர்பு கொள்ள முடியவில்லை. தயவுசெய்து சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும்."
          : "Unable to connect to the server. Please check that the server is running."
      );
    }

    let data = null;
    try {
      const text = await res.text();
      if (text && text.trim().length > 0) {
        data = JSON.parse(text);
      }
    } catch {
      data = null;
    }

    if (!res.ok) {
      const msg = data?.message || (res.status === 502 || res.status === 504 || res.status === 503
        ? (tamil ? "சர்வர் தற்காலிகமாக பதிலளிக்கவில்லை. மீண்டும் முயற்சிக்கவும்." : "Server is temporarily unavailable. Please try again.")
        : (tamil ? `சர்வர் பிழை (${res.status})` : `Server error (${res.status})`));
      throw new Error(msg);
    }

    if (!data) {
      throw new Error(
        tamil
          ? "சேவையகத்திலிருந்து செல்லுபடியான பதில் கிடைக்கவில்லை."
          : "Invalid or empty response received from server."
      );
    }

    if (!data.success) {
      throw new Error(data.message || (tamil ? "கோரிக்கை தோல்வியடைந்தது." : "Request failed."));
    }

    return data;
  };

  // 1. Send OTP for Citizen Login
  const handleSendLoginOtp = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!isValidEmail(email)) {
      setErrorMessage(tamil ? "சரியான மின்னஞ்சல் முகவரியை உள்ளிடவும்." : "Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const data = await safeApiRequest("/api/otp/send", { email: email.trim(), purpose: "login" });
      setPortalStage("login-otp");
      setCooldown(data.cooldownSeconds || 60);
      setSuccessMessage(data.message);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Verify OTP for Citizen Login and Fetch Petitions
  const handleVerifyLogin = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (otp.length !== 6) {
      setErrorMessage(tamil ? "சரியான 6 இலக்கக் குறியீட்டை உள்ளிடவும்." : "Please enter a valid 6-digit OTP.");
      return;
    }

    setLoading(true);
    try {
      const verifyData = await safeApiRequest("/api/otp/verify", { email: email.trim(), otp: otp.trim(), purpose: "login" });
      const token = verifyData.verificationToken;
      setVerificationToken(token);

      // Fetch user's submitted petitions
      try {
        const petData = await safeApiRequest("/api/citizen/my-petitions", { verificationToken: token, email: email.trim() });
        if (petData.success && Array.isArray(petData.petitions)) {
          setUserPetitions(petData.petitions);
        }
      } catch (errPet) {
        console.warn("Could not retrieve user petitions:", errPet.message);
      }

      setPortalStage("dashboard");
      setSuccessMessage(tamil ? "வெற்றிகரமாக உள்நுழைந்துள்ளீர்கள்." : "Logged in successfully.");
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. Send OTP for Petition Submission
  const handleSendSubmitOtp = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!petitionerName.trim() || petitionerName.trim().length < 2) {
      setErrorMessage(tamil ? "மனுதாரர் பெயரை உள்ளிடவும் (குறைந்தது 2 எழுத்துக்கள்)." : "Please enter petitioner name (min 2 characters).");
      return;
    }
    if (!isValidEmail(email)) {
      setErrorMessage(tamil ? "சரியான மின்னஞ்சல் முகவரியை உள்ளிடவும்." : "Please enter a valid email address.");
      return;
    }
    if (phone && !isValidIndianMobile(phone)) {
      setErrorMessage(tamil ? "சரியான 10 இலக்க இந்திய கைபேசி எண்ணை உள்ளிடவும்." : "Please enter a valid 10-digit Indian mobile number.");
      return;
    }
    if (!issue.trim() || issue.trim().length < 3) {
      setErrorMessage(tamil ? "மனு தலைப்பை உள்ளிடவும்." : "Please enter petition subject (min 3 characters).");
      return;
    }
    if (!details.trim() || details.trim().length < 10) {
      setErrorMessage(tamil ? "பிரச்சினை குறித்த விவரங்களை விரிவாக உள்ளிடவும் (குறைந்தது 10 எழுத்துக்கள்)." : "Please describe details of the petition (min 10 characters).");
      return;
    }

    setLoading(true);
    try {
      const data = await safeApiRequest("/api/otp/send", { email: email.trim(), phone: phone.trim() || undefined, purpose: "submit_petition" });
      setPortalStage("otp");
      setCooldown(data.cooldownSeconds || 60);
      setSuccessMessage(data.message);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 4. Verify OTP and Submit Petition
  const handleVerifyAndSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (otp.length !== 6) {
      setErrorMessage(tamil ? "சரியான 6 இலக்கக் குறியீட்டை உள்ளிடவும்." : "Please enter a valid 6-digit OTP.");
      return;
    }

    setLoading(true);
    try {
      // 1. Verify OTP securely on the backend
      const verifyData = await safeApiRequest("/api/otp/verify", {
        email: email.trim(),
        phone: phone.trim() || undefined,
        otp: otp.trim(),
        purpose: "submit_petition"
      });

      const token = verifyData.verificationToken;
      setVerificationToken(token);

      // 2. Submit petition with security verification token
      const submitData = await safeApiRequest("/api/petitions/submit", {
        verificationToken: token,
        email: email.trim(),
        phone: phone.trim() || undefined,
        name: petitionerName,
        subject: issue,
        details,
        constituency
      });

      setPetitionRef(submitData.referenceNo);
      setPortalStage("submitted");
      setSuccessMessage(copy.petitionSaved);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 5. Send OTP for Tracking
  const handleSendTrackOtp = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const cleanRef = sanitizeRefNo(petitionRef);
    if (!cleanRef) {
      setErrorMessage(tamil ? "மனுவின் குறிப்பு எண்ணை உள்ளிடவும்." : "Please enter the petition reference number.");
      return;
    }
    if (!isValidEmail(email)) {
      setErrorMessage(tamil ? "பதிவுசெய்த மின்னஞ்சல் முகவரியை உள்ளிடவும்." : "Please enter the registered email address.");
      return;
    }

    setPetitionRef(cleanRef);
    setLoading(true);
    try {
      const data = await safeApiRequest("/api/otp/send", {
        email: email.trim(),
        purpose: "track_petition",
        referenceNo: cleanRef
      });

      setPortalStage("track-otp");
      setCooldown(data.cooldownSeconds || 60);
      setSuccessMessage(data.message);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 6. Verify OTP and View Track Result
  const handleVerifyAndTrack = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (otp.length !== 6) {
      setErrorMessage(tamil ? "சரியான 6 இலக்கக் குறியீட்டை உள்ளிடவும்." : "Please enter a valid 6-digit OTP.");
      return;
    }

    const cleanRef = sanitizeRefNo(petitionRef);
    setPetitionRef(cleanRef);
    setLoading(true);
    try {
      // 1. Verify OTP on the backend
      const verifyData = await safeApiRequest("/api/otp/verify", {
        email: email.trim(),
        otp: otp.trim(),
        purpose: "track_petition",
        referenceNo: cleanRef
      });

      const token = verifyData.verificationToken;
      setVerificationToken(token);

      // 2. Fetch verified petition status and status timeline history
      const trackData = await safeApiRequest("/api/petitions/track", {
        verificationToken: token,
        referenceNo: cleanRef,
        email: email.trim()
      });

      setPetitionResult(trackData.petition);
      setPortalStage("track-result");
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 7. Resend OTP with cooldown timer
  const handleResendOtp = async (purpose) => {
    if (cooldown > 0 || loading) return;
    setErrorMessage("");
    setSuccessMessage("");
    setLoading(true);
    try {
      const cleanRef = sanitizeRefNo(petitionRef);
      const data = await safeApiRequest("/api/otp/send", {
        email: email.trim(),
        phone: phone.trim() || undefined,
        purpose,
        referenceNo: purpose === "track_petition" ? cleanRef : undefined
      });
      setCooldown(data.cooldownSeconds || 60);
      setSuccessMessage(data.message || (tamil ? "புதிய சரிபார்ப்புக் குறியீடு அனுப்பப்பட்டது." : "New verification code sent."));
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyReference = (refText) => {
    if (!refText) return;
    navigator.clipboard?.writeText(refText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return <main lang={tamil ? "ta" : "en"}>
    <header className={`site-header${scrolled ? " is-scrolled" : ""}`}>
      <a className="brand" href="#home" aria-label={copy.homeLabel}><img className="brand-symbol" src="/hero-thalaivar.png" alt={tamil ? "கழகத் தலைவர் சின்னம்" : "Party Leader Emblem"} /><span className="brand-name">{tamil ? "CTR. நிர்மல் குமார்" : "CTR. NIRMAL KUMAR"}<small>{copy.brandSubtitle}</small></span></a>
      <nav className={menuOpen ? "navigation is-open" : "navigation"} aria-label={copy.navigationLabel}>
        <div className="nav-links">
          {nav.map(([label, href]) => href ? (
            <a
              href={href}
              key={href}
              onClick={(e) => {
                setMenuOpen(false);
                const target = document.querySelector(href);
                if (target) {
                  e.preventDefault();
                  target.scrollIntoView({ behavior: "smooth" });
                }
              }}
            >
              {label}
            </a>
          ) : (
            <button
              className="navigation-action"
              key={label}
              onClick={() => {
                setMenuOpen(false);
                openPortal("login");
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="nav-actions">
          <button
            className="header-portal"
            onClick={() => {
              setMenuOpen(false);
              openPortal("login");
            }}
          >
            {copy.login} <ArrowUpRight size={15} />
          </button>
          <a
            className="header-cta"
            href="#connect"
            onClick={(e) => {
              setMenuOpen(false);
              const target = document.querySelector("#connect");
              if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: "smooth" });
              }
            }}
          >
            {copy.getInTouch} <ArrowUpRight size={15} />
          </a>
        </div>
      </nav>
      <div className="header-actions">
        <div className="language-switch" aria-label={copy.languageLabel}>
          <button className={!tamil ? "selected" : ""} onClick={() => setLanguage("EN")}>EN</button>
          <span />
          <button className={tamil ? "selected" : ""} onClick={() => setLanguage("தமிழ்")}>தமிழ்</button>
        </div>
        <button
          className="menu-button"
          aria-label={menuOpen ? (tamil ? "வழிசெலுத்தலை மூடவும்" : "Close navigation") : (tamil ? "வழிசெலுத்தலைத் திறக்கவும்" : "Open navigation")}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
    </header>

    <section className="hero" id="home">
      <div className="hero-texture" />
      <div className="hero-copy"><div className="overline"><span /> {copy.government} <span /></div>
        <h1>{copy.heroTop}<br /><i>{copy.heroBottom}</i></h1>
        <p className="hero-role">{copy.ministerRole}<br /><strong>{credentials}</strong><br />{copy.constituencyRole}</p>
        <p className="hero-intro">{copy.heroIntro}</p>
        <div className="hero-actions">
          <button className="button button-gold" onClick={() => openPortal("submit")}>{copy.submit} <ArrowRight size={16} /></button>
          <button className="button button-ghost" onClick={() => openPortal("track")}>{copy.track} <ArrowUpRight size={16} /></button>
          <a
            className="hero-about-link"
            href="#about"
            onClick={(e) => {
              e.preventDefault();
              document.querySelector("#about")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            {copy.meet} <ArrowDown size={14} />
          </a>
        </div>
        <div className="hero-caption"><span className="caption-rule" /> {copy.values}</div>
      </div>
      <div className="hero-portrait-wrap"><div className="portrait-halo" /><img src={`${media}07/ctr-nirmal-kumar-cm-joseph-vijay.png`} className="hero-portrait" alt={tamil ? "தமிழ்நாடு முதலமைச்சருடன் CTR. நிர்மல் குமார்" : "CTR Nirmal Kumar with the Chief Minister of Tamil Nadu"} /><div className="portrait-label"><span>{tamil ? "மாண்புமிகு அமைச்சர்" : "HON’BLE MINISTER"}</span><strong>{tamil ? "CTR. நிர்மல் குமார்" : "CTR. NIRMAL KUMAR"}</strong><small>{tamil ? <>எரிசக்தி வளங்கள் மற்றும் சட்டத்துறை அமைச்சர்<br />தமிழ்நாடு அரசு</> : <>MINISTER FOR ENERGY RESOURCES & LAW<br />GOVERNMENT OF TAMIL NADU</>}</small></div></div>
    </section>

    <section className="mandate-strip" aria-label={tamil ? "பொது பொறுப்புகள்" : "Public roles"}>
      <div><span className="strip-icon"><Landmark size={18} /></span><p><small>{copy.roleGovernment}</small><strong>{copy.minister}</strong></p></div><span className="strip-separator" />
      <div><span className="strip-icon"><BriefcaseBusiness size={18} /></span><p><small>{copy.legislature}</small><strong>{copy.constituency}</strong></p></div><span className="strip-separator" />
      <div><span className="strip-icon"><Sun size={18} /></span><p><small>{copy.party}</small><strong>{copy.jointSecretary}</strong></p></div>
    </section>

    <section className="about-section section-pad" id="about">
      <div className="about-image-column"><span className="section-index">{copy.aboutIndex}</span><div className="about-image-frame"><img src={`${media}07/ctr-nirmal-kumar-tvk-2-1024x683.jpg`} alt={copy.imageAlt.replace("சி.டி.ஆர்.", "CTR.")} loading="lazy" /><span className="image-stamp">{copy.peopleFirst}</span></div><span className="image-note">{copy.imageNote}</span></div>
      <div className="about-copy"><span className="eyebrow">{copy.aboutEyebrow}</span><h2>{copy.aboutTop}<br /><em>{copy.aboutBottom}</em></h2><p className="lead">{copy.aboutLead.replace("சி.டி.ஆர்.", "CTR.").replace("C.T.R.", "CTR.")}</p><p>{copy.aboutBody}</p>
        <div className="education-block"><div className="education-heading"><GraduationCap size={19} /><span>{copy.education}</span></div><div className="education-items"><div><strong>B.E.</strong><span>{tamil ? "கணினி அறிவியலில் இளங்கலைப் பட்டம்" : "Bachelor’s Degree in Computer Science"}</span></div><div><strong>LL.B.</strong><span>{tamil ? "சட்டத்தில் இளங்கலைப் பட்டம்" : "Bachelor’s Degree in Law"}</span></div><div><strong>M.A.</strong><span>{tamil ? "குற்றவியல் மற்றும் காவல் நிர்வாகம்" : "Criminology and Police Administration"}</span></div></div></div>
      </div>
    </section>

    <section className="portfolio-section section-pad" id="portfolio"><div className="section-heading"><div><span className="eyebrow">{tamil ? "முக்கிய பொறுப்புகள்" : "Key Responsibilities"}</span><h2>{copy.workTop}<br /><em>{copy.workBottom}</em></h2></div><p>{tamil ? "எரிசக்தி வளங்கள் மற்றும் சட்டத்துறை அமைச்சராக, தமிழ்நாட்டின் எரிசக்தித் துறையை வலுப்படுத்துதல், புதுப்பிக்கத்தக்க எரிசக்தி வளர்ச்சிக்கு ஆதரவு அளித்தல், நம்பகமான மின்சாரக் கட்டமைப்பை உறுதிசெய்தல் மற்றும் திறமையான சட்டம், நீதித்துறைக்குப் பங்களித்தல் ஆகியவற்றில் CTR. நிர்மல் குமார் உறுதியுடன் செயல்படுகிறார்." : "As Minister for Energy Resources and Law, CTR. Nirmal Kumar is committed to strengthening Tamil Nadu’s energy sector, supporting renewable energy development, ensuring reliable power infrastructure, and contributing to an effective legal and justice system."}</p></div>
      <div className="portfolio-grid"><article className="portfolio-card energy-card"><span className="card-number">01</span><Sun size={28} strokeWidth={1.5} /><h3>{copy.energy}</h3><p>{copy.energyText}</p><span className="card-bottom">{copy.energyCaption}</span></article>
        <article className="portfolio-card law-card"><span className="card-number">02</span><Scale size={28} strokeWidth={1.5} /><h3>{copy.law}</h3><p>{copy.lawText}</p><span className="card-bottom">{copy.lawCaption}</span></article>
        <div className="quote-card"><span className="quote-mark">“</span><blockquote>{copy.quote}</blockquote><span className="quote-credit">{copy.quoteCaption}</span></div>
      </div><p className="portfolio-closing">{tamil ? "வலுவான, நிலையான மற்றும் நீதியான தமிழ்நாட்டை உருவாக்குதல்." : "Building a stronger, sustainable and just Tamil Nadu."}</p>
    </section>

    <section className="news-section section-pad" id="news"><div className="section-heading news-heading"><div><span className="eyebrow">{copy.newsEyebrow}</span><h2>{copy.newsTitle} <em>{copy.newsBottom}</em></h2></div><span className="section-badge-pill">{tamil ? "செய்திப் பதிவுகள்" : "Official Updates"}</span></div>
      <div className="news-grid">{stories.map((item, index) => {
        return <article className="news-card news-card-featured" key={item.title}>
          <div className={`news-image${item.portrait ? " news-image-portrait" : ""}`}>
            <img src={item.image} alt={tamil ? item.altTamil : item.alt} loading="lazy" decoding="async" />
            <span className="news-number">0{index + 1}</span>
          </div>
          <div className="news-meta"><span>{tamil ? item.dateTamil : item.date}</span><span>{tamil ? item.categoryTamil ?? copy.publicUpdate : item.category ?? copy.publicUpdate}</span></div>
          <h3>{tamil ? item.tamil : item.title}</h3>
          <p className="news-story-summary">{tamil ? item.summaryTamil : item.summary}</p>
          <span className="news-read news-story-note">{tamil ? item.captionTamil : item.caption}</span>
        </article>;
      })}</div>
    </section>

    <section className="gallery-section" id="gallery"><div className="gallery-heading section-pad"><div><span className="eyebrow">{copy.galleryEyebrow}</span><h2>{copy.galleryTitle} <em>{copy.galleryBottom}</em></h2></div><span className="gallery-badge-pill">{tamil ? "புகைப்பட ஆவணம்" : "Visual Moments"}</span></div>
      <div className="gallery-grid">{gallery.map((image, index) => {
        const photoSrc = getPhotoUrl(image);
        const photoNum = index < 9 ? `0${index + 1}` : `${index + 1}`;
        return (
          <button
            type="button"
            className="gallery-tile"
            key={image}
            onClick={() => setActivePhoto({ src: photoSrc, index: index + 1 })}
            aria-label={tamil ? `புகைப்படம் ${photoNum}ஐ பெரிதாக்கிக் காணவும்` : `View photograph ${photoNum}`}
          >
            <img src={photoSrc} alt={tamil ? `CTR. நிர்மல் குமார், பொதுச் சேவைத் தருணம் ${photoNum}` : `CTR Nirmal Kumar, public service moment ${photoNum}`} loading="lazy" decoding="async" />
            <span>{photoNum} <ArrowUpRight size={15} /></span>
          </button>
        );
      })}</div>
    </section>

    <section className="connect-section section-pad" id="connect"><div className="connect-copy"><span className="eyebrow">{copy.connectEyebrow}</span><h2>{copy.connectTop}<br /><em>{copy.connectBottom}</em></h2><p>{copy.connectText}</p></div><div className="social-links">{socialLinks.map(({ name, href }, index) => <a className="social-link" href={href} target="_blank" rel="noreferrer" key={href}><span>0{index + 1}</span>{name}<ArrowUpRight size={15} /></a>)}</div></section>
    <footer className="site-footer"><a className="footer-brand" href="#home"><img className="brand-symbol footer-symbol" src="/hero-thalaivar.png" alt="" /><span className="footer-identity"><strong>{tamil ? "நிர்மல் குமார்" : "NIRMAL KUMAR"}</strong><small>B.E. · LL.B. · M.A.</small><small>{tamil ? "திருப்பரங்குன்றம் சட்டமன்ற உறுப்பினர்" : "MLA · THIRUPARANKUNDRAM"}</small></span></a><span>{copy.footerRole}</span><a href="#home" aria-label={copy.backToTop} onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}>{copy.backToTop} <ChevronDown size={14} /></a></footer>

    {portalIntent && <div className="portal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closePortal(); }}>
      <section className="portal-dialog" role="dialog" aria-modal="true" aria-labelledby="portal-title">
        <button className="portal-close" onClick={closePortal} aria-label={copy.closePortal}><X size={19} /></button>
        <div className="portal-header-brand">
          <img className="portal-mark-image" src="/hero-thalaivar.png" alt="" />
          <span className="portal-party-name">தமிழக வெற்றிக் கழகம்</span>
        </div>
        <span className="portal-kicker">{copy.portalKicker}</span>

        {errorMessage && <div className="portal-alert-error" role="alert"><AlertCircle size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: '-2px' }} />{errorMessage}</div>}
        {successMessage && <div className="portal-alert-success" role="status"><Check size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: '-2px' }} />{successMessage}</div>}

        {/* 0. CITIZEN LOGIN (EMAIL OTP) */}
        {portalStage === "login" && <form className="portal-form" onSubmit={handleSendLoginOtp}>
          <h2 id="portal-title">{copy.loginTitle}</h2>
          <p>{copy.loginText}</p>

          <label htmlFor="portal-login-email">{copy.emailLabel} *</label>
          <input
            id="portal-login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder={copy.emailPlaceholder}
          />

          <button className="portal-submit" type="submit" disabled={loading || !email.trim()}>
            {loading ? <><span className="portal-spinner" /> {copy.sendingOtp}</> : <><Mail size={16} /> {copy.sendLoginOtp}</>}
          </button>
          <small className="portal-preview-note">{copy.gmailSmtpNote}</small>
        </form>}

        {/* 0B. LOGIN OTP VERIFICATION */}
        {portalStage === "login-otp" && <form className="portal-form" onSubmit={handleVerifyLogin}>
          <h2 id="portal-title">{copy.otpTitle}</h2>
          <p>{copy.otpText}<strong>{email}</strong>.</p>

          <label htmlFor="portal-otp-login">{copy.otpLabel} *</label>
          <input
            className="otp-input"
            id="portal-otp-login"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength="6"
            placeholder="000000"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            required
            pattern="[0-9]{6}"
          />

          <button className="portal-submit" type="submit" disabled={loading || otp.length !== 6}>
            {loading ? <><span className="portal-spinner" /> {copy.verifying}</> : <><KeyRound size={16} /> {copy.verifyAndLogin}</>}
          </button>

          <div className="portal-resend-row">
            <button
              type="button"
              className="portal-text-button"
              disabled={cooldown > 0 || loading}
              onClick={() => handleResendOtp("login")}
            >
              {cooldown > 0 ? `${copy.resendIn}${cooldown}s` : copy.resendOtp}
            </button>
            <button
              type="button"
              className="portal-text-button"
              onClick={() => { setPortalStage("login"); setErrorMessage(""); setSuccessMessage(""); }}
            >
              {copy.changeEmail}
            </button>
          </div>
        </form>}

        {/* 1. SUBMIT PETITION FORM (WITH EMAIL OTP INPUT) */}
        {portalStage === "petition" && <form className="portal-form" onSubmit={handleSendSubmitOtp}>
          <h2 id="portal-title">{copy.petitionTitle}</h2>
          <p>{copy.petitionText}</p>

          <label htmlFor="petitioner-name">{copy.petitionerName} *</label>
          <input
            id="petitioner-name"
            value={petitionerName}
            onChange={(e) => setPetitionerName(e.target.value)}
            required
            maxLength="100"
            placeholder={copy.namePlaceholder}
          />

          <label htmlFor="portal-email">{copy.emailLabel} *</label>
          <input
            id="portal-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder={copy.emailPlaceholder}
          />

          <label htmlFor="portal-phone">{copy.mobileLabel}</label>
          <div className="phone-input">
            <span className="portal-phone-prefix">+91</span>
            <input
              id="portal-phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              maxLength="10"
              placeholder="9876543210 (optional)"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
            />
          </div>

          <label htmlFor="petition-issue">{copy.subject} *</label>
          <input
            id="petition-issue"
            value={issue}
            onChange={(e) => setIssue(e.target.value)}
            required
            maxLength="100"
            placeholder={copy.subjectPlaceholder}
          />

          <label htmlFor="petition-details">{copy.details} *</label>
          <textarea
            id="petition-details"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            required
            rows="4"
            maxLength="1000"
            placeholder={copy.detailsPlaceholder}
          />

          <button className="portal-submit" type="submit" disabled={loading || !email.trim() || !issue.trim() || !details.trim()}>
            {loading ? <><span className="portal-spinner" /> {copy.sendingOtp}</> : <><Mail size={16} /> {copy.sendOtp} <ArrowRight size={16} /></>}
          </button>
          <small className="portal-preview-note">{copy.gmailSmtpNote}</small>
        </form>}

        {/* 2. OTP VERIFICATION FOR SUBMISSION */}
        {portalStage === "otp" && <form className="portal-form" onSubmit={handleVerifyAndSubmit}>
          <h2 id="portal-title">{copy.otpTitle}</h2>
          <p>{copy.otpText}<strong>{email}</strong>.</p>

          <label htmlFor="portal-otp">{copy.otpLabel} *</label>
          <input
            className="otp-input"
            id="portal-otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength="6"
            placeholder="000000"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            required
            pattern="[0-9]{6}"
          />

          <button className="portal-submit" type="submit" disabled={loading || otp.length !== 6}>
            {loading ? <><span className="portal-spinner" /> {copy.submitting}</> : <>{copy.verifyAndSubmit} <ArrowRight size={16} /></>}
          </button>

          <div className="portal-resend-row">
            <button
              type="button"
              className="portal-text-button"
              disabled={cooldown > 0 || loading}
              onClick={() => handleResendOtp("submit_petition")}
            >
              {cooldown > 0 ? `${copy.resendIn}${cooldown}s` : copy.resendOtp}
            </button>
            <button
              type="button"
              className="portal-text-button"
              onClick={() => { setPortalStage("petition"); setErrorMessage(""); setSuccessMessage(""); }}
            >
              {copy.changeEmail}
            </button>
          </div>
        </form>}

        {/* 3. PETITION SUBMITTED SUCCESS */}
        {portalStage === "submitted" && <div className="portal-form portal-result">
          <span className="portal-status">{copy.databaseRecorded}</span>
          <h2 id="portal-title">{copy.thankYou}</h2>
          <p>{copy.petitionSaved}</p>

          <div className="portal-ref-box">
            <div>
              <small style={{ color: "#796e63", display: "block", fontSize: 10, fontWeight: 700 }}>{copy.reference}</small>
              <span className="portal-ref-number">{petitionRef}</span>
            </div>
            <button
              type="button"
              className="portal-copy-btn"
              onClick={() => handleCopyReference(petitionRef)}
            >
              {copied ? <><Check size={12} color="#1e7e34" /> {copy.copied}</> : <><Copy size={12} /> {copy.copyRef}</>}
            </button>
          </div>

          <button className="portal-submit" onClick={() => {
            setPortalIntent("track");
            setPortalStage("track");
            setErrorMessage("");
            setSuccessMessage("");
          }}>
            {copy.trackThis} <ArrowRight size={16} />
          </button>
          <button className="portal-secondary" onClick={closePortal}>
            {copy.closePortal}
          </button>
        </div>}

        {/* 4. TRACK PETITION FORM (WITH EMAIL VERIFICATION) */}
        {portalStage === "track" && <form className="portal-form" onSubmit={handleSendTrackOtp}>
          <h2 id="portal-title">{copy.trackTitle}</h2>
          <p>{copy.trackText}</p>

          <label htmlFor="petition-reference">{copy.reference} *</label>
          <input
            id="petition-reference"
            value={petitionRef}
            onChange={(e) => {
              const val = e.target.value.toUpperCase();
              const match = val.match(/CTR-\d{4}-\d{6}/);
              if (val.length > 15 && match) {
                setPetitionRef(match[0]);
              } else {
                setPetitionRef(val);
              }
            }}
            onPaste={(e) => {
              const pasted = e.clipboardData ? e.clipboardData.getData("text") : "";
              const match = pasted.match(/CTR-\d{4}-\d{6}/i);
              if (match) {
                e.preventDefault();
                setPetitionRef(match[0].toUpperCase());
              }
            }}
            required
            placeholder="CTR-2610-123456"
          />

          <label htmlFor="portal-track-email">{copy.emailLabel} *</label>
          <input
            id="portal-track-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder={copy.emailPlaceholder}
          />

          <button className="portal-submit" type="submit" disabled={loading || !petitionRef.trim() || !email.trim()}>
            {loading ? <><span className="portal-spinner" /> {copy.sendingOtp}</> : <><Mail size={16} /> {copy.sendOtpToTrack} <ArrowRight size={16} /></>}
          </button>
          <small className="portal-preview-note">{copy.securityVerificationNote}</small>
        </form>}

        {/* 5. TRACK OTP VERIFICATION */}
        {portalStage === "track-otp" && <form className="portal-form" onSubmit={handleVerifyAndTrack}>
          <h2 id="portal-title">{copy.otpTitle}</h2>
          <p>{copy.otpText}<strong>{email}</strong>.</p>

          <label htmlFor="portal-otp-track">{copy.otpLabel} *</label>
          <input
            className="otp-input"
            id="portal-otp-track"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength="6"
            placeholder="000000"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            required
            pattern="[0-9]{6}"
          />

          <button className="portal-submit" type="submit" disabled={loading || otp.length !== 6}>
            {loading ? <><span className="portal-spinner" /> {copy.verifying}</> : <>{copy.verifyAndTrack} <ArrowRight size={16} /></>}
          </button>

          <div className="portal-resend-row">
            <button
              type="button"
              className="portal-text-button"
              disabled={cooldown > 0 || loading}
              onClick={() => handleResendOtp("track_petition")}
            >
              {cooldown > 0 ? `${copy.resendIn}${cooldown}s` : copy.resendOtp}
            </button>
            <button
              type="button"
              className="portal-text-button"
              onClick={() => { setPortalStage("track"); setErrorMessage(""); setSuccessMessage(""); }}
            >
              {copy.changeEmail}
            </button>
          </div>
        </form>}

        {/* 6. VERIFIED TRACK RESULT WITH TIMELINE */}
        {portalStage === "track-result" && <div className="portal-form portal-result">
          <span className="portal-status">{copy.petitionStatus}</span>
          <h2 id="portal-title">{petitionResult ? copy.requestReceived : copy.noRecord}</h2>

          {petitionResult ? (
            <>
              <div className="portal-petition-card">
                <div className="portal-card-header">
                  <div>
                    <span style={{ fontSize: 9, color: "#796e63", fontWeight: 700, letterSpacing: ".06em" }}>{copy.reference}</span>
                    <h3 style={{ margin: "2px 0 0", fontSize: 17, color: "#78221e", fontFamily: "var(--serif)" }}>{petitionResult.referenceNo}</h3>
                  </div>
                  <span className={`portal-status-badge status-${petitionResult.status ? petitionResult.status.toLowerCase().replace(/\s+/g, '') : 'received'}`}>
                    {tamil
                      ? (petitionResult.status === "Received" ? "பெறப்பட்டது" : petitionResult.status === "Under Review" ? "பரிசீலனையில் உள்ளது" : petitionResult.status === "In Progress" ? "நடவடிக்கை" : petitionResult.status === "Resolved" ? "தீர்வு" : petitionResult.status)
                      : petitionResult.status}
                  </span>
                </div>

                <div className="portal-field-row">
                  <label>{copy.petitionerName}</label>
                  <span>{petitionResult.petitionerName} {petitionResult.maskedEmail ? `(${petitionResult.maskedEmail})` : ''}</span>
                </div>

                <div className="portal-field-row">
                  <label>{copy.subject}</label>
                  <span>{petitionResult.subject}</span>
                </div>

                <div className="portal-field-row">
                  <label>{copy.details}</label>
                  <span style={{ color: "#54493e", whiteSpace: "normal", fontSize: 11 }}>{petitionResult.description}</span>
                </div>

                <div className="portal-field-row">
                  <label>{copy.submittedOn}</label>
                  <span style={{ color: "#796e63", fontSize: 11 }}>{new Date(petitionResult.createdAt).toLocaleDateString(tamil ? "ta-IN" : "en-IN", { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                {petitionResult.history && petitionResult.history.length > 0 && (
                  <div className="portal-history-section">
                    <span className="portal-history-title">{copy.petitionTimeline}</span>
                    {petitionResult.history.map((hist, idx) => (
                      <div className="portal-timeline-item" key={idx}>
                        <div className="portal-timeline-dot" />
                        <div className="portal-timeline-header">
                          <span>{hist.status}</span>
                          <span className="portal-timeline-date">{new Date(hist.date).toLocaleDateString(tamil ? "ta-IN" : "en-IN", { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        </div>
                        <div className="portal-timeline-comment">{hist.comments}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button className="portal-submit" onClick={() => { setPortalStage("track"); setPetitionResult(null); setErrorMessage(""); setSuccessMessage(""); }}>
                {copy.tryAnother} <ArrowRight size={16} />
              </button>
            </>
          ) : (
            <>
              <p>{copy.noRecordText}</p>
              <button className="portal-submit" onClick={() => { setPortalStage("track"); setErrorMessage(""); setSuccessMessage(""); }}>
                {copy.tryAnother} <ArrowRight size={16} />
              </button>
            </>
          )}
        </div>}

        {/* 7. DASHBOARD SELECTION & CITIZEN PORTAL */}
        {portalStage === "dashboard" && <div className="portal-form portal-result">
          {email && (
            <div className="portal-user-tag">
              <ShieldCheck size={14} color="#1e7e34" />
              <span>{copy.verifiedCitizen}: <strong>{email}</strong></span>
            </div>
          )}

          <h2 id="portal-title">{copy.citizenPortal}</h2>
          <p>{copy.chooseAction}</p>

          {/* User's registered petitions list if logged in */}
          {userPetitions && userPetitions.length > 0 && (
            <div style={{ textAlign: "left", marginBottom: 18 }}>
              <div className="portal-history-title"><Inbox size={13} style={{ display: "inline", verticalAlign: "-2px", marginRight: 5 }} />{copy.myPetitionsTitle}</div>
              <div className="portal-mini-list">
                {userPetitions.map((p) => (
                  <div
                    key={p.referenceNo}
                    className="portal-mini-item"
                    onClick={() => {
                      setPetitionRef(p.referenceNo);
                      setPortalStage("track");
                    }}
                  >
                    <div>
                      <div className="portal-mini-ref">{p.referenceNo}</div>
                      <div className="portal-mini-subject">{p.subject}</div>
                    </div>
                    <span className={`portal-status-badge status-${p.status ? p.status.toLowerCase().replace(/\s+/g, '') : 'received'}`} style={{ fontSize: 9, padding: "2px 7px" }}>
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button className="portal-submit" onClick={() => { setPortalIntent("submit"); setPortalStage("petition"); setErrorMessage(""); setSuccessMessage(""); }}>
            {copy.submitPetition} <ArrowRight size={16} />
          </button>
          <button className="portal-secondary" onClick={() => { setPortalIntent("track"); setPortalStage("track"); setErrorMessage(""); setSuccessMessage(""); }}>
            {copy.trackTitle} <ArrowRight size={16} />
          </button>

          {verificationToken && (
            <button
              className="portal-secondary"
              style={{ marginTop: 8, borderColor: "transparent", color: "#8b3027", fontSize: 10 }}
              onClick={() => {
                setVerificationToken(null);
                setUserPetitions([]);
                setPortalStage("login");
              }}
            >
              <LogOut size={12} style={{ display: "inline", verticalAlign: "-1px", marginRight: 4 }} />
              {copy.signOut}
            </button>
          )}
        </div>}
      </section>
    </div>}

    {activePhoto && (
      <div className="photo-lightbox-backdrop" onClick={() => setActivePhoto(null)} role="dialog" aria-modal="true">
        <div className="photo-lightbox-content" onClick={(e) => e.stopPropagation()}>
          <button className="photo-lightbox-close" onClick={() => setActivePhoto(null)} aria-label={tamil ? "மூடவும்" : "Close"}>
            <X size={20} />
          </button>
          <img src={activePhoto.src} alt="" className="photo-lightbox-img" />
          <div className="photo-lightbox-caption">
            <span>{tamil ? `புகைப்படம் ${activePhoto.index < 10 ? `0${activePhoto.index}` : activePhoto.index} / ${gallery.length} · மக்கள் சேவைத் தருணங்கள்` : `Photograph ${activePhoto.index < 10 ? `0${activePhoto.index}` : activePhoto.index} / ${gallery.length} · Moments of Public Service`}</span>
          </div>
        </div>
      </div>
    )}
  </main>;
}