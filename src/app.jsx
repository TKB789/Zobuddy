const { useState, useEffect, useMemo } = React;

const ZODIAC_ANIMALS = [
  { id:"rat",emoji:"🐀",face:"🐭",color:"#8B7355",accent:"#C4A882" },
  { id:"ox",emoji:"🐂",face:"🐮",color:"#6B4423",accent:"#A0522D" },
  { id:"tiger",emoji:"🐅",face:"🐯",color:"#FF8C00",accent:"#FFB347" },
  { id:"rabbit",emoji:"🐇",face:"🐰",color:"#FFB6C1",accent:"#FF69B4" },
  { id:"dragon",emoji:"🐉",face:"🐲",color:"#228B22",accent:"#32CD32" },
  { id:"snake",emoji:"🐍",face:null,color:"#6A5ACD",accent:"#9370DB" },
  { id:"horse",emoji:"🐎",face:"🐴",color:"#CD853F",accent:"#DEB887" },
  { id:"goat",emoji:"🐐",face:null,color:"#BC8F8F",accent:"#F5DEB3" },
  { id:"monkey",emoji:"🐒",face:"🐵",color:"#D2691E",accent:"#F4A460" },
  { id:"rooster",emoji:"🐓",face:"🐔",color:"#DC143C",accent:"#FF6347" },
  { id:"dog",emoji:"🐕",face:"🐶",color:"#DAA520",accent:"#FFD700" },
  { id:"pig",emoji:"🐷",face:"🐷",color:"#FFB6C1",accent:"#FFC0CB" },
];

// All available animal emojis for custom picker (no lizard 🦎)
const EXTRA_ANIMALS = ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐻‍❄️","🐨","🦁","🐮","🐸","🐵","🙈","🐔","🐧","🐦","🐤","🦆","🦅","🦉","🦇","🐺","🐗","🐴","🦄","🐝","🐛","🦋","🐌","🐞","🐜","🐢","🦖","🦕","🐙","🦑","🦐","🦞","🦀","🐡","🐠","🐟","🐬","🐳","🐋","🦈","🐊","🐆","🦓","🦍","🦧","🐘","🦛","🦏","🐪","🐫","🦒","🦘","🦬","🐃","🐄","🐖","🐏","🐑","🦙","🦌","🐩","🦮","🐈","🐈‍⬛","🦃","🦚","🦜","🦢","🦩","🕊️","🦝","🦨","🦡","🦫","🦦","🦥","🐿️","🦔","🐾","🐉"];

// Effects are categorized: "overlay" = static emoji/visual on buddy, "transform" = changes buddy shape/look, "movement" = buddy animates
// Rule: only ONE movement effect applies at a time (first wins). Transforms and overlays stack freely.
const NEGATIVE_EFFECTS = [
  // --- Overlay effects (static emojis around buddy) ---
  { id:"fire",name:"Catches fire",icon:"🔥",visual:"fire",cat:"overlay" },
  { id:"storm",name:"Thunder storm",icon:"⛈️",visual:"storm",cat:"overlay" },
  { id:"cobweb",name:"Gets cobwebs",icon:"🕸️",visual:"cobweb",cat:"overlay" },
  { id:"balloon",name:"Floats away",icon:"🎈",visual:"balloon",cat:"overlay" },
  { id:"tangled",name:"Gets tangled",icon:"🧶",visual:"tangled",cat:"overlay" },
  { id:"alarm",name:"Alarm ringing",icon:"🚨",visual:"alarm",cat:"overlay" },
  { id:"stars",name:"Sees stars",icon:"💫",visual:"stars",cat:"overlay" },
  { id:"cracked",name:"Cracked screen",icon:"📱",visual:"cracked",cat:"overlay" },
  { id:"dizzy",name:"Gets dizzy",icon:"😵‍💫",visual:"dizzy",cat:"overlay" },
  { id:"cry",name:"Starts crying",icon:"😢",visual:"cry",cat:"overlay" },
  { id:"zzz",name:"Falls asleep",icon:"💤",visual:"zzz",cat:"overlay" },
  // --- Transform effects (change buddy appearance) ---
  { id:"shrink",name:"Shrinks down",icon:"🔍",visual:"shrink",cat:"transform" },
  { id:"ghost",name:"Goes transparent",icon:"👻",visual:"ghost",cat:"transform" },
  { id:"frozen",name:"Freezes solid",icon:"🧊",visual:"frozen",cat:"transform" },
  { id:"upside",name:"Flips upside down",icon:"🙃",visual:"upside",cat:"transform" },
  { id:"melts",name:"Melts down",icon:"🫠",visual:"melts",cat:"transform" },
  // --- Movement effects (buddy animates — only 1 active at a time) ---
  { id:"shiver",name:"Shivers",icon:"🥶",visual:"shiver",cat:"movement" },
  { id:"glitch",name:"Glitches out",icon:"📺",visual:"glitch",cat:"movement" },
  { id:"bounce",name:"Bounces around",icon:"🏀",visual:"bounce_move",cat:"movement" },
  { id:"spin",name:"Spins wildly",icon:"🌀",visual:"spin_move",cat:"movement" },
  { id:"wobble",name:"Wobbles side to side",icon:"🥴",visual:"wobble",cat:"movement" },
  { id:"vibrate",name:"Vibrates intensely",icon:"📳",visual:"vibrate",cat:"movement" },
  { id:"drift",name:"Drifts off screen",icon:"🍃",visual:"drift",cat:"movement" },
  { id:"tremble",name:"Trembles in fear",icon:"😱",visual:"tremble",cat:"movement" },
];
const EFFECT_CATS={overlay:"📍 Overlay",transform:"🔄 Transform",movement:"💨 Movement"};

// Smart effect suggestions: which effects pair well with certain habit keywords
const EFFECT_HINTS = {
  sleep:["zzz","dizzy","stars"],meditate:["shiver","stars","frozen"],read:["dizzy","zzz","cobweb"],
  outside:["cobweb","frozen","storm"],walk:["cobweb","melts","wobble"],junk:["bounce_move","fire","melts"],
  food:["spin_move","fire","melts"],stretch:["shrink","frozen","tangled"],screen:["glitch","cracked","ghost"],
  guitar:["cry","tangled","alarm"],journal:["ghost","cobweb","zzz"],coffee:["shiver","alarm","vibrate"],
  water:["fire","melts","drift"],exercise:["shrink","wobble","melts"],run:["shrink","drift","balloon"],
  yoga:["tangled","upside","shiver"],study:["dizzy","zzz","cobweb"],clean:["tremble","cobweb","alarm"],
  default:[]
};
const getHintedEffects=(name)=>{const n=name.toLowerCase();for(const[k,v]of Object.entries(EFFECT_HINTS))if(n.includes(k))return v;return[];};

// Auto-suggest emoji icon based on goal name keywords
const ICON_HINTS={
  sleep:"😴",nap:"😴",rest:"😴",bed:"🛏️",
  meditat:"🧘",mindful:"🧘",zen:"🧘",
  read:"📚",book:"📚",study:"📖",learn:"🧠",
  outside:"🌿",nature:"🌿",park:"🌳",garden:"🌱",sun:"☀️",
  walk:"🚶",step:"👟",hike:"🥾",
  run:"🏃",jog:"🏃",sprint:"🏃",
  exercise:"💪",workout:"💪",gym:"🏋️",lift:"🏋️",train:"💪",
  junk:"🥗",sugar:"🍬",candy:"🍬",snack:"🍿",fast:"🍔",
  fruit:"🍎",apple:"🍎",banana:"🍌",berry:"🫐",
  veggie:"🥦",vegetable:"🥦",salad:"🥗",
  water:"💧",hydrat:"💧",drink:"💧",
  stretch:"🤸",yoga:"🧘‍♀️",flex:"🤸",
  screen:"📵",phone:"📱",digital:"📵",
  guitar:"🎸",music:"🎵",piano:"🎹",sing:"🎤",instrument:"🎵",
  journal:"✍️",write:"✍️",diary:"📓",
  coffee:"☕",caffeine:"☕",tea:"🍵",
  gratitude:"🙏",grateful:"🙏",thank:"🙏",pray:"🙏",
  call:"📞",text:"💬",friend:"👋",family:"👨‍👩‍👧",loved:"❤️",connect:"🤝",
  cook:"🍳",meal:"🍽️",recipe:"👨‍🍳",kitchen:"🍳",
  clean:"🧹",tidy:"🧹",organiz:"🗃️",declutter:"🧹",
  breath:"🌬️",inhale:"🌬️",
  laugh:"😄",humor:"😂",funny:"😄",joy:"😊",smile:"😊",
  kind:"🤝",help:"🤝",volunteer:"🤝",donat:"💝",
  compliment:"💬",encourage:"💬",
  posture:"🧍",ergonom:"🧍",
  teeth:"🪥",floss:"🪥",dental:"🪥",
  vitamin:"💊",supplement:"💊",medicine:"💊",
  paint:"🎨",draw:"🎨",art:"🎨",creat:"🎨",craft:"✂️",
  photo:"📸",camera:"📸",
  swim:"🏊",bike:"🚴",cycl:"🚴",
  save:"💰",budget:"💰",money:"💰",invest:"📈",
  pet:"🐾",dog:"🐕",cat:"🐈",
  shower:"🚿",bath:"🛁",skin:"🧴",
  laundry:"👕",iron:"👔",
  plan:"📋",goal:"🎯",list:"📝",schedul:"📅",
};
const suggestIcon=(name)=>{
  const n=name.toLowerCase();
  for(const[k,emoji]of Object.entries(ICON_HINTS)){if(n.includes(k))return emoji;}
  return null;
};

const PRESET_HABITS = [
  { id:"fruits",name:"Eat Fruits",icon:"🍎",negVisual:"grayscale",negEffect:"Loses color" },
  { id:"veggies",name:"Eat Veggies",icon:"🥦",negVisual:"shrink",negEffect:"Shrinks down" },
  { id:"water",name:"Drink Water",icon:"💧",negVisual:"deflate",negEffect:"Deflates flat" },
  { id:"workout",name:"Work Out",icon:"💪",negVisual:"upside",negEffect:"Flips upside down" },
];
// Effects already claimed by presets — hide from custom picker
const PRESET_VISUALS=new Set(PRESET_HABITS.map(h=>h.negVisual));
const CUSTOM_EFFECTS=NEGATIVE_EFFECTS.filter(e=>!PRESET_VISUALS.has(e.visual));

const CUSTOM_EXAMPLES = [
  {name:"Sleep 7+ hrs",icon:"😴"},{name:"Meditate",icon:"🧘"},{name:"Read 20min",icon:"📚"},
  {name:"Go outside",icon:"🌿"},{name:"No junk food",icon:"🥗"},{name:"Stretch",icon:"🤸"},
  {name:"Limit screens",icon:"📵"},{name:"Journal",icon:"✍️"},{name:"Drink less coffee",icon:"☕"},
  {name:"Gratitude list",icon:"🙏"},{name:"Call a loved one",icon:"📞"},{name:"Walk 20min",icon:"🚶"},
  {name:"Deep breathing",icon:"🌬️"},{name:"No sugar",icon:"🍬"},{name:"Tidy up space",icon:"🧹"},
  {name:"Learn something new",icon:"🧠"},{name:"Help someone",icon:"🤝"},{name:"Laugh today",icon:"😄"},
  {name:"Say no to one thing",icon:"✋"},{name:"Cook a meal",icon:"🍳"},
];

// Daily Quest Pool: science-backed wellness goals rotated daily to encourage variety
const DAILY_QUEST_POOL = [
  {id:"dq_gratitude",name:"Write 3 things you're grateful for",icon:"🙏"},
  {id:"dq_call",name:"Call or text a loved one",icon:"📞"},
  {id:"dq_walk",name:"Take a 20-minute walk",icon:"🚶"},
  {id:"dq_sleep",name:"Get 7+ hours of sleep",icon:"😴"},
  {id:"dq_meditate",name:"Meditate for 5 minutes",icon:"🧘"},
  {id:"dq_breathe",name:"Do 5 minutes of deep breathing",icon:"🌬️"},
  {id:"dq_journal",name:"Write in a journal",icon:"✍️"},
  {id:"dq_outside",name:"Spend 15 min in nature",icon:"🌿"},
  {id:"dq_kindness",name:"Do something kind for someone",icon:"🤝"},
  {id:"dq_read",name:"Read for 20 minutes",icon:"📚"},
  {id:"dq_laugh",name:"Watch or do something that makes you laugh",icon:"😄"},
  {id:"dq_tidy",name:"Tidy up your space for 10 min",icon:"🧹"},
  {id:"dq_learn",name:"Learn one new thing today",icon:"🧠"},
  {id:"dq_stretch",name:"Stretch for 10 minutes",icon:"🤸"},
  {id:"dq_cook",name:"Cook a healthy meal",icon:"🍳"},
  {id:"dq_noscreen",name:"Take a 30-min screen break",icon:"📵"},
  {id:"dq_water",name:"Drink 8 glasses of water",icon:"💧"},
  {id:"dq_posture",name:"Check your posture 3 times",icon:"🧍"},
  {id:"dq_compliment",name:"Give someone a genuine compliment",icon:"💬"},
  {id:"dq_music",name:"Listen to music that lifts you up",icon:"🎵"},
];

const FILTERS = [
  { id:"none",name:"None",css:"" },
  { id:"sparkle",name:"✨ Sparkle",css:"drop-shadow(0 0 8px gold) drop-shadow(0 0 16px rgba(255,215,0,0.5))" },
  { id:"rainbow",name:"🌈 Rainbow",css:"hue-rotate(45deg) saturate(1.5)" },
  { id:"vintage",name:"📷 Vintage",css:"sepia(0.4) contrast(1.1) brightness(1.05)" },
  { id:"cool",name:"❄️ Cool",css:"hue-rotate(200deg) saturate(0.8) brightness(1.1)" },
  { id:"warm",name:"🔥 Warm",css:"sepia(0.2) saturate(1.4) hue-rotate(-10deg)" },
  { id:"neon",name:"💜 Neon",css:"saturate(2) contrast(1.2) brightness(1.1)" },
  { id:"dreamy",name:"☁️ Dreamy",css:"blur(0.5px) brightness(1.15) saturate(1.3)" },
];

const LEVEL_REQUIREMENTS = [
  { level:1,auraDays:0,name:"Seedling" },{ level:2,auraDays:3,name:"Sprout" },
  { level:3,auraDays:7,name:"Bloom" },{ level:4,auraDays:14,name:"Guardian" },
  { level:5,auraDays:21,name:"Champion" },{ level:6,auraDays:30,name:"Legend" },
  { level:7,auraDays:60,name:"Mythic" },
];
const RARITIES=["Common","Uncommon","Rare","Epic","Legendary","Mythic","TRANSCENDENT"];
const RARITY_COLORS={Common:"#aaa",Uncommon:"#4ade80",Rare:"#60a5fa",Epic:"#c084fc",Legendary:"#fbbf24",Mythic:"#f472b6",TRANSCENDENT:"#67e8f9"};

const getAnimalData=(state)=>{
  const preset=ZODIAC_ANIMALS.find(a=>a.id===state?.animal);
  if(preset)return{...preset,emoji:preset.face||preset.emoji};
  if(state?.customAnimal)return{id:"custom",name:state.buddyName||"Buddy",emoji:state.customAnimal.emoji||"🐾",color:"#8b5cf6",accent:"#a78bfa"};
  return ZODIAC_ANIMALS[0];
};

const toDateStr=(d)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const getToday=()=>toDateStr(new Date());
const getDaysBetween=(d1,d2)=>Math.floor((new Date(d2)-new Date(d1))/86400000);

// Tokens: 7d streak=1, 14d=+2(3 total), 21d=+3(6), 28d=+4(10), etc.
const calcTokens=(streak)=>{let t=0;for(let w=1;w*7<=streak;w++)t+=w;return t;};
const calcDuelStats=(s)=>{
  if(!s)return{power:0,hp:100,streak:0,level:1,goals:0,days:0,tokens:0};
  const streak=s.auraStreak||0,days=s.startDate?getDaysBetween(s.startDate,getToday())+1:0;
  const comp=Object.values(s.completionLog||{}).reduce((a,d)=>a+(d?.length||0),0);
  const goals=s.selectedHabits?.length||1;
  const possible=days*goals;const rate=possible>0?Math.min(1,comp/possible):0;
  const done=s.completionLog?.[getToday()]||[];
  // HP with daily quest 3x: quest completion counts 3x if matched
  const questData=getDailyQuest(s);const questDone=questData?.matchedHabitId&&done.includes(questData.matchedHabitId);
  const effectiveCount=done.length+(questDone?2:0); // +2 extra for quest (total 3x)
  const hp=Math.min(100,Math.round((effectiveCount/goals)*100));
  // Apply spacing penalty
  const ts=s.completionTimestamps?.[getToday()]||[];
  const batchPenalty=ts.length>=3&&((ts[ts.length-1]-ts[0])/60000<2);
  const lv=getLevel(s);const tokens=calcTokens(streak);
  // Power: more goals = more power potential. Goals give a direct multiplier + bonus.
  const goalBonus=goals*12; // +12 power per active goal
  const finalHP=batchPenalty?Math.min(hp,75):hp;
  const power=(tokens*50)+(days*8)+(streak*15)+Math.round(finalHP*0.3)+(lv.level*10)+(comp*2)+Math.round(rate*40)+goalBonus;
  return{power,hp:finalHP,streak,level:lv.level,goals,days,tokens};
};

const getAllDone=(s)=>{const d=s.completionLog?.[getToday()]||[];return s.selectedHabits?.length>0&&d.length>=s.selectedHabits.length;};
// Streak: counts consecutive days where ALL goals completed (starts when you complete all)
const getAuraStreak=(s)=>{
  let streak=0;const now=new Date();
  for(let i=0;i<365;i++){const d=new Date(now);d.setDate(d.getDate()-i);const ds=toDateStr(d);
  const done=s.completionLog?.[ds]||[];
  if(done.length>=(s.selectedHabits?.length||1)&&s.selectedHabits?.length>0)streak++;
  else{if(i===0)continue;break;}}return streak;
};
const getLevel=(s)=>{const st=s.auraStreak||0;let l=LEVEL_REQUIREMENTS[0];for(const r of LEVEL_REQUIREMENTS)if(st>=r.auraDays)l=r;return l;};
// HP with spacing bonus: completing goals spread out earns more than all-at-once
const getHP=(s)=>{
  const d=s.completionLog?.[getToday()]||[];const goals=s.selectedHabits?.length||1;
  const baseHP=Math.round((d.length/goals)*100);
  // Check timestamps for spacing penalty
  const ts=s.completionTimestamps?.[getToday()]||[];
  if(ts.length>=3){
    const sorted=[...ts].sort();
    const first=sorted[0],last=sorted[sorted.length-1];
    const spanMin=(last-first)/60000;
    // If 3+ goals completed within 2 minutes → batch penalty
    if(spanMin<2&&d.length>=goals)return Math.min(baseHP,75);
  }
  return baseHP;
};
// Roaming: days since last activity (completed at least 1 goal)
const getDaysInactive=(s)=>{
  if(!s?.completionLog||!s?.startDate)return 0;
  // Don't count as inactive if player started less than 7 days ago
  const daysSinceStart=getDaysBetween(s.startDate,getToday());
  if(daysSinceStart<7)return 0;
  // If decoded from battle code or freshly restored, never roaming
  if(s._decoded)return 0;
  // Check if any log entry actually has completions (not just empty arrays)
  const logKeys=Object.keys(s.completionLog);
  const hasAnyCompletions=logKeys.some(k=>(s.completionLog[k]||[]).length>0);
  if(!hasAnyCompletions)return 0;
  const now=new Date();
  for(let i=0;i<60;i++){
    const d=new Date(now);d.setDate(d.getDate()-i);const ds=toDateStr(d);
    if((s.completionLog[ds]||[]).length>0)return i;
  }
  return 60;
};
// Count recent active days (out of last N days)
const getRecentActiveDays=(s,n)=>{
  if(!s?.completionLog)return 0;let c=0;const now=new Date();
  for(let i=0;i<n;i++){
    const d=new Date(now);d.setDate(d.getDate()-i);const ds=toDateStr(d);
    if((s.completionLog[ds]||[]).length>0)c++;
  }
  return c;
};
// Daily Quest: pick from wellness pool (date-seeded). If user has a matching goal, link to it.
const getDailyQuest=(s)=>{
  const d=getToday();let hash=0;for(let i=0;i<d.length;i++)hash=((hash<<5)-hash)+d.charCodeAt(i);
  const quest=DAILY_QUEST_POOL[Math.abs(hash)%DAILY_QUEST_POOL.length];
  // Check if user has a goal that matches this quest (by ID or keyword overlap)
  const userHabits=s?.selectedHabits||[];
  const allH=[...PRESET_HABITS,...(s?.allHabits||[]).filter(h=>h.id?.startsWith("custom_"))];
  // First check: exact ID match (quest was added via + Add button)
  const idMatch=userHabits.find(hId=>hId===`custom_${quest.id}`);
  if(idMatch)return{quest,matchedHabitId:idMatch};
  // Second check: keyword overlap
  const qWords=quest.name.toLowerCase().split(/\s+/);
  const match=userHabits.find(hId=>{
    const h=allH.find(x=>x.id===hId);if(!h)return false;
    const hWords=h.name.toLowerCase().split(/\s+/);
    return qWords.some(w=>w.length>3&&hWords.some(hw=>hw.includes(w)||w.includes(hw)));
  });
  return{quest,matchedHabitId:match||null};
};
const loadState=()=>{try{const s=localStorage.getItem("zodibuddies_v1");if(!s)return null;const st=JSON.parse(s);
  // Migrate: normalize any UTC-formatted dates in completionLog/timestamps to local format
  if(st.completionLog){const cl={};const ct={};
    Object.keys(st.completionLog).forEach(k=>{const d=new Date(k+"T12:00:00");const lk=toDateStr(d);cl[lk]=(cl[lk]||[]).concat(st.completionLog[k]);});
    if(st.completionTimestamps)Object.keys(st.completionTimestamps).forEach(k=>{const d=new Date(k+"T12:00:00");const lk=toDateStr(d);ct[lk]=(ct[lk]||[]).concat(st.completionTimestamps[k]);});
    st.completionLog=cl;st.completionTimestamps=ct||st.completionTimestamps;
    if(st.startDate){const sd=new Date(st.startDate+"T12:00:00");st.startDate=toDateStr(sd);}
  }return st;}catch{return null;}};
const saveState=(s)=>{try{localStorage.setItem("zodibuddies_v1",JSON.stringify(s));}catch{}};

// Duel Code: 8-character alphanumeric code encoding key stats
// Layout (packed into 40 bits → 8 base32 chars):
//   animal: 4 bits (0-15, 13 animals + custom)
//   streak: 9 bits (0-511)
//   days:   10 bits (0-1023)
//   goals:  3 bits (1-8)
//   totalCompletions: 10 bits (0-1023, capped)
//   checksum: 4 bits
const ANIMALS_IDX=["rat","ox","tiger","rabbit","dragon","snake","horse","goat","monkey","rooster","dog","pig","custom"];
const CODE_CHARS="ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 31 chars, no 0/O/1/I
const encodeDuelCode=(s)=>{
  if(!s)return"";
  try{
    const aIdx=Math.max(0,ANIMALS_IDX.indexOf(s.animal||"rat"));
    const streak=Math.min(511,s.auraStreak||0);
    const days=Math.min(1023,s.startDate?getDaysBetween(s.startDate,getToday()):0);
    const goals=Math.min(7,(s.selectedHabits?.length||1)-1); // 0-7 → 1-8 goals
    const comp=Math.min(1023,Object.values(s.completionLog||{}).reduce((a,d)=>a+(d?.length||0),0));
    // Pack into bits: animal(4)+streak(9)+days(10)+goals(3)+comp(10)=36 bits
    let bits=BigInt(aIdx);
    bits=(bits<<9n)|BigInt(streak);
    bits=(bits<<10n)|BigInt(days);
    bits=(bits<<3n)|BigInt(goals);
    bits=(bits<<10n)|BigInt(comp);
    // 4-bit checksum from XOR of all nibbles
    let ck=0n;let tmp=bits;for(let i=0;i<9;i++){ck^=(tmp&0xFn);tmp>>=4n;}
    bits=(bits<<4n)|(ck&0xFn);
    // Total: 40 bits → 8 chars in base-31
    let code="";for(let i=0;i<8;i++){code=CODE_CHARS[Number(bits%31n)]+code;bits=bits/31n;}
    return code;
  }catch{return"";}
};
const decodeDuelCode=(code)=>{
  if(!code)return null;
  try{
    const clean=code.replace(/[\s-]/g,"").toUpperCase();
    if(clean.length!==8)return null;
    // Decode base-31 → bits
    let bits=0n;
    for(let i=0;i<8;i++){const idx=CODE_CHARS.indexOf(clean[i]);if(idx<0)return null;bits=bits*31n+BigInt(idx);}
    // Extract checksum and verify
    const ck=bits&0xFn;bits>>=4n;
    let vck=0n;let tmp=bits;for(let i=0;i<9;i++){vck^=(tmp&0xFn);tmp>>=4n;}
    if((vck&0xFn)!==ck)return null; // checksum fail
    // Unpack
    const comp=Number(bits&0x3FFn);bits>>=10n;
    const goals=Number(bits&0x7n)+1;bits>>=3n;
    const days=Number(bits&0x3FFn);bits>>=10n;
    const streak=Number(bits&0x1FFn);bits>>=9n;
    const aIdx=Number(bits&0xFn);
    const animal=ANIMALS_IDX[aIdx]||"rat";
    // Reconstruct start date from days ago
    const sd=new Date();sd.setDate(sd.getDate()-days);const startDate=toDateStr(sd);
    // Rebuild minimal completion log (streak consecutive days of full completion)
    const cl={};const presetIds=PRESET_HABITS.slice(0,goals).map(h=>h.id);
    const today=new Date();
    for(let i=0;i<streak;i++){const d=new Date(today);d.setDate(d.getDate()-i);cl[toDateStr(d)]=presetIds;}
    return{animal,startDate,auraStreak:streak,selectedHabits:presetIds,
      completionLog:cl,completionTimestamps:{},allHabits:[...PRESET_HABITS],
      _goals:goals,_comp:comp,_decoded:true};
  }catch{return null;}
};
// 2D6 system: roll two dice, sum them. Double 6 = critical (2.5x). No critical failure.
const calc2D6Score=(power,d1,d2)=>{
  const sum=d1+d2;const isDoubleSix=d1===6&&d2===6;
  // Power-weighted: power*1.5 + dice*25. Higher power = bigger base advantage.
  // Dice contribute 50-300 (down from 100-600), so power gap matters more.
  // Double 6 = auto-win (handled in resolveRound), score shown as power*2 + 500
  return isDoubleSix?Math.round(power*2)+500:Math.round(power*1.5)+(sum*25);
};

// Generate win reason text
const getDuelReasons=(myStats,oppPower,rounds,result)=>{
  const reasons=[];
  const myTotals=rounds.reduce((a,r)=>a+r.myD1+r.myD2,0);const oppTotals=rounds.reduce((a,r)=>a+r.oppD1+r.oppD2,0);
  const myDoubles=rounds.filter(r=>r.myCrit).length;const oppDoubles=rounds.filter(r=>r.oppCrit).length;
  if(result==="win"){
    if(myDoubles>0)reasons.push("🎯 Double sixes! Critical hit!");
    if(myTotals>oppTotals+6)reasons.push("🎲 Hot dice rolls!");
    else if(myTotals>oppTotals)reasons.push("🎲 Slightly luckier rolls");
    if(myStats.hp>=80)reasons.push("❤️ Strong HP today");
    if(myStats.streak>=7)reasons.push("🔥 Impressive streak power");
    if(myStats.goals>=4)reasons.push("🎯 Many goals boosted power");
    if(myStats.power>oppPower*1.3)reasons.push("💪 Way stronger base power");
    else if(myStats.power<oppPower*0.7)reasons.push("🍀 Won despite weaker power — pure luck!");
  } else {
    if(oppDoubles>0)reasons.push("🎯 Opponent rolled double sixes!");
    if(oppTotals>myTotals+6)reasons.push("🎲 Opponent rolled much better");
    else if(oppTotals>myTotals)reasons.push("🎲 Opponent had slightly better rolls");
    if(myStats.hp<50)reasons.push("❤️ Low HP weakened your power");
    if(myStats.streak<3)reasons.push("🔥 Build a longer streak for more power");
    if(myStats.goals<=2)reasons.push("🎯 More goals = more power next time");
    if(myStats.power<oppPower*0.7)reasons.push("💪 Opponent had much stronger base power");
    else if(myStats.power>oppPower*1.3)reasons.push("😤 Lost despite stronger power — unlucky!");
  }
  if(reasons.length===0)reasons.push("⚡ Close fight — every roll counted!");
  return reasons.slice(0,3);
};

const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
html{-webkit-text-size-adjust:100%}
body{padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom);padding-left:env(safe-area-inset-left);padding-right:env(safe-area-inset-right)}
button{-webkit-tap-highlight-color:transparent;touch-action:manipulation}
input,textarea,select{-webkit-appearance:none;border-radius:0}
::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:4px}::-webkit-scrollbar-track{background:transparent}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
@keyframes floatUp{0%,100%{transform:translateY(0);opacity:1}50%{transform:translateY(-14px);opacity:.4}}
@keyframes pulse{0%,100%{opacity:.6;transform:translate(-50%,-50%) scale(1)}50%{opacity:1;transform:translate(-50%,-50%) scale(1.1)}}
@keyframes jitter{0%,100%{transform:translate(0,0) rotate(0)}25%{transform:translate(-2px,2px) rotate(-2deg)}75%{transform:translate(2px,-2px) rotate(2deg)}}
@keyframes bounce{0%{transform:scale(0)}50%{transform:scale(1.3)}100%{transform:scale(1)}}
@keyframes spin{from{transform:translateX(-50%) rotate(0)}to{transform:translateX(-50%) rotate(360deg)}}
@keyframes flicker{0%{transform:scale(1) rotate(-5deg)}100%{transform:scale(1.2) rotate(5deg)}}
@keyframes confetti{0%{transform:translateY(-100vh) rotate(0);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes holoShift{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
@keyframes holoShimmer{0%{background-position:200% 200%}100%{background-position:-200% -200%}}
@keyframes glitchJump{0%,100%{transform:translate(0,0)}20%{transform:translate(-3px,2px)}40%{transform:translate(3px,-2px)}60%{transform:translate(-2px,-3px)}80%{transform:translate(2px,3px)}}
@keyframes floatAway{0%,100%{transform:translateY(0)}50%{transform:translateY(-20px)}}
@keyframes flashRed{0%,100%{opacity:.3}50%{opacity:.8}}
@keyframes rollDice{0%{transform:rotate(0deg) scale(1)}25%{transform:rotate(90deg) scale(1.3)}50%{transform:rotate(180deg) scale(.9)}75%{transform:rotate(270deg) scale(1.2)}100%{transform:rotate(360deg) scale(1)}}
@keyframes diceShake{0%,100%{transform:rotate(0)}25%{transform:rotate(15deg)}75%{transform:rotate(-15deg)}}
@keyframes bounceMove{0%,100%{transform:translate(-50%,-50%) translateY(0)}25%{transform:translate(-50%,-50%) translateY(-18px)}50%{transform:translate(-50%,-50%) translateY(0)}75%{transform:translate(-50%,-50%) translateY(-10px)}}
@keyframes spinMove{0%{transform:translate(-50%,-50%) rotate(0)}100%{transform:translate(-50%,-50%) rotate(360deg)}}
@keyframes wobble{0%,100%{transform:translate(-50%,-50%) rotate(0)}25%{transform:translate(-50%,-50%) rotate(12deg) translateX(6px)}75%{transform:translate(-50%,-50%) rotate(-12deg) translateX(-6px)}}
@keyframes vibrate{0%,100%{transform:translate(-50%,-50%)}10%{transform:translate(-51%,-50%)}20%{transform:translate(-49%,-51%)}30%{transform:translate(-51%,-49%)}40%{transform:translate(-49%,-50%)}50%{transform:translate(-50%,-51%)}60%{transform:translate(-51%,-50%)}70%{transform:translate(-50%,-49%)}80%{transform:translate(-49%,-51%)}90%{transform:translate(-51%,-50%)}}
@keyframes driftOff{0%,100%{transform:translate(-50%,-50%) translateX(0)}50%{transform:translate(-50%,-50%) translateX(25px) rotate(8deg)}}
@keyframes tremble{0%,100%{transform:translate(-50%,-50%) scale(1)}25%{transform:translate(-50%,-50%) scale(0.95) rotate(-3deg)}50%{transform:translate(-50%,-50%) scale(1.02)}75%{transform:translate(-50%,-50%) scale(0.97) rotate(3deg)}}
@keyframes orbit1{0%{transform:translate(-50%,-50%) rotate(0deg) translateX(75px) rotate(0deg)}100%{transform:translate(-50%,-50%) rotate(360deg) translateX(75px) rotate(-360deg)}}
@keyframes orbit2{0%{transform:translate(-50%,-50%) rotate(120deg) translateX(65px) rotate(-120deg)}100%{transform:translate(-50%,-50%) rotate(480deg) translateX(65px) rotate(-480deg)}}
@keyframes orbit3{0%{transform:translate(-50%,-50%) rotate(240deg) translateX(70px) rotate(-240deg)}100%{transform:translate(-50%,-50%) rotate(600deg) translateX(70px) rotate(-600deg)}}
@keyframes celebPop{0%,100%{transform:scale(1)}50%{transform:scale(1.3)}}
@keyframes petBounce{0%{transform:scale(1) translateY(0)}30%{transform:scale(1.15) translateY(-12px)}50%{transform:scale(0.95) translateY(0)}70%{transform:scale(1.05) translateY(-4px)}100%{transform:scale(1) translateY(0)}}
@keyframes heartFloat{0%{opacity:0;transform:translateY(0) scale(0.5)}15%{opacity:1;transform:translateY(-8px) scale(1)}100%{opacity:0;transform:translateY(-60px) scale(0.3)}}
@keyframes sparkleFloat{0%{opacity:.6;transform:translateY(0) scale(.8)}50%{opacity:1;transform:translateY(-8px) scale(1.1)}100%{opacity:.6;transform:translateY(0) scale(.8)}}
@keyframes coronaPulse{0%,100%{opacity:.5;transform:translate(-50%,-50%) scale(1)}50%{opacity:.9;transform:translate(-50%,-50%) scale(1.06)}}
input::placeholder{color:rgba(255,255,255,.25)}
`;

const HealthBar=({percent,small})=>{
  const c=percent>=80?"#43e97b":percent>=50?"#feca57":percent>=25?"#f093fb":"#f5576c";
  const h=small?4:8;
  return <div style={{height:h,borderRadius:h/2,background:"rgba(255,255,255,.08)",overflow:"hidden",width:"100%"}}><div style={{height:"100%",borderRadius:h/2,background:`linear-gradient(90deg,${c},${c}cc)`,width:`${percent}%`,transition:"width .5s",boxShadow:`0 0 6px ${c}44`}}/></div>;
};

const BuddyDisplay=({animal,state,filter="none",size=160})=>{
  const[petting,setPetting]=useState(false);
  const[hearts,setHearts]=useState([]);
  const today=getToday();const done=state.completionLog?.[today]||[];const habits=state.selectedHabits||[];
  const habitsData=[...PRESET_HABITS,...(state.allHabits||[]).filter(h=>h.id?.startsWith("custom_"))];
  const streak=state.auraStreak||0;
  const ad=getAnimalData(state);const fc=FILTERS.find(f=>f.id===filter)?.css||"";
  const allDone=habits.length>0&&done.length>=habits.length;
  const neg=[];habits.forEach(hId=>{if(!done.includes(hId)){const h=habitsData.find(x=>x.id===hId);if(h?.negVisual&&h.negVisual!=="none")neg.push(h.negVisual);}});
  const has=(e)=>neg.includes(e);
  const canPet=neg.length===0&&!state._roaming;

  const doPet=()=>{
    if(!canPet||petting)return;
    setPetting(true);
    const newHearts=Array.from({length:6},(_,i)=>({id:Date.now()+i,x:30+Math.random()*40,delay:Math.random()*0.3,dur:0.8+Math.random()*0.6,emoji:["❤️","💕","💖","💗","💓"][Math.floor(Math.random()*5)]}));
    setHearts(newHearts);
    setTimeout(()=>setPetting(false),400);
    setTimeout(()=>setHearts([]),1800);
  };
  let crown=null;if(streak>=30)crown="diamond";else if(streak>=21)crown="gold";else if(streak>=14)crown="silver";else if(streak>=7)crown="bronze";
  // Transforms: apply all, but handle priority for conflicting size effects
  const tf=[];
  // Size: deflate and shrink can coexist — deflate squashes, shrink scales down
  if(has("deflate")&&has("shrink"))tf.push("scaleX(1.1) scaleY(0.4)");
  else if(has("deflate"))tf.push("scaleX(1.3) scaleY(0.55)");
  else if(has("shrink")||has("tiny"))tf.push("scale(0.55)");
  // Orientation: upside and melts are mutually exclusive (upside wins)
  if(has("upside"))tf.push("rotate(180deg)");
  else if(has("melts"))tf.push("scaleY(0.5) translateY(18%)");
  // Movement: only first active movement effect wins (they conflict with each other)
  const movementOrder=["shiver","glitch","bounce_move","spin_move","wobble","vibrate","drift","tremble"];
  const activeMove=movementOrder.find(m=>has(m));
  const moveAnim=activeMove==="shiver"?"jitter .15s infinite":activeMove==="glitch"?"glitchJump .3s infinite":activeMove==="bounce_move"?"bounceMove .8s ease-in-out infinite":activeMove==="spin_move"?"spinMove 2s linear infinite":activeMove==="wobble"?"wobble 1.2s ease-in-out infinite":activeMove==="vibrate"?"vibrate .3s linear infinite":activeMove==="drift"?"driftOff 3s ease-in-out infinite":activeMove==="tremble"?"tremble .6s ease-in-out infinite":"";

  return(
    <div style={{position:"relative",width:size,height:size,margin:"0 auto",filter:fc}}>
      {has("storm")&&<><div style={{position:"absolute",top:-2,left:"50%",transform:"translateX(-50%)",fontSize:size*.22,zIndex:5,animation:"float 2s ease-in-out infinite"}}>⛈️</div><div style={{position:"absolute",top:"18%",left:"35%",fontSize:size*.08,zIndex:5,opacity:.7}}>⚡</div></>}
      {has("fire")&&<><div style={{position:"absolute",bottom:8,left:"28%",fontSize:size*.12,animation:"flicker .3s infinite alternate",zIndex:5}}>🔥</div><div style={{position:"absolute",bottom:4,right:"26%",fontSize:size*.1,animation:"flicker .4s infinite alternate-reverse",zIndex:5}}>🔥</div></>}
      {has("balloon")&&<div style={{position:"absolute",top:"5%",right:"10%",fontSize:size*.14,zIndex:6,animation:"floatAway 2s ease-in-out infinite"}}>🎈</div>}
      {has("cobweb")&&<><div style={{position:"absolute",top:"15%",left:"10%",fontSize:size*.11,zIndex:6,opacity:.6}}>🕸️</div><div style={{position:"absolute",bottom:"18%",right:"10%",fontSize:size*.08,zIndex:6,opacity:.4}}>🕸️</div></>}
      {has("tangled")&&<div style={{position:"absolute",top:"20%",left:"20%",fontSize:size*.12,zIndex:6,transform:"rotate(-15deg)"}}>🧶</div>}
      {has("frozen")&&<div style={{position:"absolute",inset:0,borderRadius:"50%",background:"radial-gradient(circle,rgba(150,220,255,.2) 0%,transparent 55%)",zIndex:3,pointerEvents:"none"}}/>}
      {has("cracked")&&<div style={{position:"absolute",inset:0,zIndex:7,pointerEvents:"none"}}><div style={{position:"absolute",top:"28%",left:"18%",width:"55%",height:2,background:"rgba(255,255,255,.12)",transform:"rotate(25deg)"}}/><div style={{position:"absolute",top:"42%",left:"12%",width:"35%",height:1,background:"rgba(255,255,255,.08)",transform:"rotate(-15deg)"}}/></div>}
      {has("alarm")&&<div style={{position:"absolute",top:"12%",right:"8%",fontSize:size*.14,zIndex:6,animation:"flashRed .6s infinite"}}>🚨</div>}
      {has("stars")&&<div style={{position:"absolute",top:"18%",left:"50%",transform:"translateX(-50%)",fontSize:size*.14,animation:"spin 2s linear infinite",zIndex:6}}>💫</div>}
      {has("drift")&&<div style={{position:"absolute",top:"30%",right:"5%",fontSize:size*.1,zIndex:6,opacity:.4,animation:"floatAway 3s ease-in-out infinite"}}>🍃</div>}
      {/* Streak aura glow — always visible if streak >= 3 */}
      {streak>=3&&<div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:size*(streak>=7?1.6:1.3),height:size*(streak>=7?1.6:1.3),borderRadius:"50%",background:streak>=30?"radial-gradient(circle,rgba(185,242,255,.45) 0%,rgba(103,232,249,.2) 40%,transparent 70%)":streak>=21?"radial-gradient(circle,rgba(255,215,0,.35) 0%,rgba(255,180,0,.15) 40%,transparent 70%)":streak>=14?"radial-gradient(circle,rgba(192,132,252,.35) 0%,rgba(167,139,250,.15) 40%,transparent 70%)":streak>=7?"radial-gradient(circle,rgba(96,165,250,.35) 0%,rgba(56,189,248,.15) 40%,transparent 70%)":"radial-gradient(circle,rgba(254,202,87,.25) 0%,rgba(254,202,87,0) 60%)",animation:"pulse 2s ease-in-out infinite",pointerEvents:"none"}}/>}
      {/* Soft corona haze at 7+ day streak */}
      {streak>=7&&<div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:size*1.7,height:size*1.7,borderRadius:"50%",background:streak>=30?"radial-gradient(ellipse 60% 55% at 50% 50%,transparent 45%,rgba(103,232,249,.15) 60%,rgba(103,232,249,.08) 75%,transparent 90%)":streak>=21?"radial-gradient(ellipse 60% 55% at 50% 50%,transparent 45%,rgba(255,215,0,.12) 60%,rgba(255,215,0,.06) 75%,transparent 90%)":streak>=14?"radial-gradient(ellipse 60% 55% at 50% 50%,transparent 45%,rgba(192,132,252,.12) 60%,rgba(192,132,252,.06) 75%,transparent 90%)":"radial-gradient(ellipse 60% 55% at 50% 50%,transparent 45%,rgba(96,165,250,.12) 60%,rgba(96,165,250,.06) 75%,transparent 90%)",filter:"blur(6px)",animation:"coronaPulse 3s ease-in-out infinite",pointerEvents:"none"}}/>}
      {/* Solar flare particles — random positions, travel outward and dissipate */}
      {streak>=7&&(()=>{
        const fc=streak>=30?"103,232,249":streak>=21?"255,215,0":streak>=14?"192,132,252":"96,165,250";
        const count=streak>=21?10:streak>=14?8:6;
        // Seed random from date so flares stay consistent within a session but vary day to day
        const seed=(()=>{let s=0;const d=getToday();for(let i=0;i<d.length;i++)s=((s<<5)-s)+d.charCodeAt(i);return s;})();
        const pRng=(i)=>{let x=Math.sin(seed+i*127.1+i*i*311.7)*43758.5453;return x-Math.floor(x);};
        return Array.from({length:count},(_,i)=>{
          const ang=(pRng(i)*360);
          const rad=ang*Math.PI/180;
          const r0=size*0.48;
          const startX=Math.cos(rad)*r0;
          const startY=Math.sin(rad)*r0;
          // Travel distance outward along same angle
          const travel=size*(0.35+pRng(i+50)*0.3);
          const endX=startX+Math.cos(rad)*travel;
          const endY=startY+Math.sin(rad)*travel;
          const midX=startX+Math.cos(rad)*travel*0.5;
          const midY=startY+Math.sin(rad)*travel*0.5;
          const dur=2.5+pRng(i+100)*3;
          const del=pRng(i+200)*dur;
          const sz=6+pRng(i+300)*8;
          const kfName=`sf_${i}`;
          return <div key={"fl"+i}>
            <style>{`@keyframes ${kfName}{0%,100%{left:${startX}px;top:${startY}px;width:${sz}px;height:${sz}px;opacity:0}8%{opacity:.7;left:${startX}px;top:${startY}px;width:${sz}px;height:${sz}px}45%{left:${midX}px;top:${midY}px;width:${sz*0.5}px;height:${sz*0.5}px;opacity:.25}75%{left:${endX}px;top:${endY}px;width:${sz*0.12}px;height:${sz*0.12}px;opacity:.03}85%,100%{left:${endX}px;top:${endY}px;width:0px;height:0px;opacity:0}}`}</style>
            <div style={{
              position:"absolute",top:"50%",left:"50%",
              marginLeft:-sz/2,marginTop:-sz/2,
              borderRadius:"50%",
              background:`radial-gradient(circle,rgba(${fc},.6),rgba(${fc},.15),transparent)`,
              filter:"blur(2px)",
              animation:`${kfName} ${dur}s ease-out infinite`,
              animationDelay:`${del}s`,
              pointerEvents:"none",opacity:0,
            }}/>
          </div>;
        });
      })()}
      {crown&&<div style={{position:"absolute",top:-8,left:"50%",transform:"translateX(-50%)",fontSize:size*.17,zIndex:10,filter:crown==="diamond"?"drop-shadow(0 0 6px cyan)":crown==="gold"?"drop-shadow(0 0 4px gold)":"none"}}>👑</div>}
      <div onClick={doPet} style={{position:"absolute",top:"46%",left:"50%",transform:`translate(-50%,-50%) ${tf.join(" ")}`,fontSize:size*.5,filter:has("grayscale")?"grayscale(1) brightness(.7)":has("frozen")?"brightness(1.2) saturate(.5)":"none",opacity:has("ghost")?.3:1,transition:"all .5s",userSelect:"none",cursor:canPet?"pointer":"default"}}>
        <span style={{display:"inline-block",animation:petting?"petBounce .4s ease":moveAnim||"none"}}>{state._roaming?"😶":ad.emoji}</span>
      </div>
      {/* Floating hearts from petting */}
      {hearts.map(h=>(
        <div key={h.id} style={{position:"absolute",left:`${h.x}%`,top:"35%",fontSize:size*.12,zIndex:20,pointerEvents:"none",animation:`heartFloat ${h.dur}s ease-out forwards`,animationDelay:`${h.delay}s`,opacity:0}}>{h.emoji}</div>
      ))}
      {has("dizzy")&&<div style={{position:"absolute",top:"22%",left:"50%",transform:"translateX(-50%)",fontSize:size*.15,animation:"spin 1.5s linear infinite",zIndex:6}}>😵‍💫</div>}
      {has("cry")&&<div style={{position:"absolute",top:"22%",left:"50%",transform:"translateX(-50%)",fontSize:size*.14,zIndex:6}}>😢</div>}
      {has("zzz")&&<div style={{position:"absolute",top:"14%",right:"6%",fontSize:size*.16,zIndex:6,animation:"floatUp 2s ease-in-out infinite"}}>💤</div>}
      {/* Custom emoji effects */}
      {neg.filter(n=>n==="custom_emoji").length>0&&habits.filter(hId=>!done.includes(hId)).map(hId=>{
        const h=habitsData.find(x=>x.id===hId);if(!h?.customEmoji)return null;
        return <div key={hId+"ce"} style={{position:"absolute",top:`${15+Math.random()*20}%`,left:`${10+Math.random()*30}%`,fontSize:size*.13,zIndex:6,animation:"floatUp 2.5s ease-in-out infinite",pointerEvents:"none"}}>{h.customEmoji}</div>;
      })}

      {/* Celebration when all goals done — orbit completed habit icons! */}
      {allDone&&<>
        {habits.slice(0,6).map((hId,i)=>{const h=habitsData.find(x=>x.id===hId);const angle=(360/Math.min(habits.length,6))*i;const dur=4+i*0.5;const radius=size*.42;
          return <div key={hId} style={{position:"absolute",top:"50%",left:"50%",fontSize:size*.12,zIndex:6,pointerEvents:"none",animation:`orbit${(i%3)+1} ${dur}s linear infinite`,animationDelay:`${i*0.3}s`}}>{h?.icon||"⭐"}</div>;
        })}
        <div style={{position:"absolute",top:"8%",left:"15%",fontSize:size*.09,zIndex:6,animation:"sparkleFloat 2s ease-in-out infinite",pointerEvents:"none"}}>✨</div>
        <div style={{position:"absolute",top:"12%",right:"12%",fontSize:size*.1,zIndex:6,animation:"sparkleFloat 2.5s ease-in-out infinite .5s",pointerEvents:"none"}}>🎉</div>
      </>}
    </div>
  );
};
const captureElement=async(el)=>{
  // Use the browser's built-in approach: copy to clipboard as image
  try{
    const {default:h2c}=await import("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.esm.js").catch(()=>({default:null}));
    if(h2c){const canvas=await h2c(el,{backgroundColor:"#0d0d2b",scale:2});const blob=await new Promise(r=>canvas.toBlob(r,"image/png"));
    if(blob&&navigator.clipboard?.write){await navigator.clipboard.write([new ClipboardItem({"image/png":blob})]);return true;}}
  }catch{}
  return false;
};

const ShareCard=({state,animal,filter="none",onClose,duelCode,onAddGoal})=>{
  const[copied,setCopied]=useState(false);
  const[tab,setTab]=useState("stats");
  const ad=getAnimalData(state);const stats=calcDuelStats(state);const level=getLevel(state);
  const streak=state.auraStreak||0;const hp=getHP(state);const today=getToday();
  const done=state.completionLog?.[today]||[];
  const habitsData=[...PRESET_HABITS,...(state.allHabits||[]).filter(h=>h.id?.startsWith("custom_"))];
  const rarity=RARITIES[Math.min(level.level-1,RARITIES.length-1)];const rc=RARITY_COLORS[rarity];
  const glow=streak>=30?"0 0 30px rgba(103,232,249,.6)":streak>=21?"0 0 25px rgba(251,191,36,.5)":streak>=14?"0 0 20px rgba(192,132,252,.4)":streak>=7?"0 0 15px rgba(96,165,250,.3)":"0 8px 32px rgba(0,0,0,.5)";
  const buddyLabel=state.buddyName||"Zobuddy";
  const txt=`${ad.emoji} ${buddyLabel} Stats\n⚡ Power: ${stats.power}\n❤️ HP: ${hp}%\n🔥 Streak: ${streak}d\n🏆 Lv.${level.level} ${level.name}${stats.tokens>0?`\n🎟️ ${stats.tokens} transfer token${stats.tokens>1?"s":""}`:""}
\nChallenge me! Enter my power (${stats.power}) to battle 🎲🎲\n🔑 Code: ${duelCode}`;
  const copy=()=>{navigator.clipboard?.writeText(txt);setCopied(true);setTimeout(()=>setCopied(false),2000);};
  const share=async()=>{
    if(navigator.share){
      try{await navigator.share({title:`${buddyLabel} — Zobuddy Stats`,text:txt});return;}catch{}
    }
    copy();
  };
  const canShare=typeof navigator!=="undefined"&&!!navigator.share;

  // History: recent days with completions
  const historyDays=useMemo(()=>{
    const log=state.completionLog||{};
    return Object.keys(log).sort().reverse().slice(0,14).map(date=>{
      const ids=log[date]||[];
      const goals=ids.map(id=>{
        const h=habitsData.find(x=>x.id===id);
        return h?{id:h.id,name:h.name,icon:h.icon}:{id,name:id,icon:"❓"};
      });
      return{date,goals};
    }).filter(d=>d.goals.length>0);
  },[state.completionLog]);

  const currentGoalIds=new Set(state.selectedHabits||[]);
  const canEdit=true;

  return(
    <div style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(0,0,0,.85)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{maxWidth:320,width:"100%",maxHeight:"90vh",display:"flex",flexDirection:"column"}}>
        {/* Tab bar */}
        <div style={{display:"flex",gap:4,marginBottom:6}}>
          {[{id:"stats",label:"📊 Stats"},{id:"history",label:"📅 History"}].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,background:tab===t.id?"rgba(102,126,234,.2)":"rgba(255,255,255,.04)",border:tab===t.id?"1px solid rgba(102,126,234,.3)":"1px solid rgba(255,255,255,.06)",borderRadius:10,padding:"8px 0",fontSize:15,fontWeight:700,color:tab===t.id?"#a8b4f0":"#777",cursor:"pointer"}}>{t.label}</button>
          ))}
        </div>

        {tab==="stats"&&<div style={{overflow:"auto"}}>
        <div style={{borderRadius:18,padding:3,background:`linear-gradient(135deg,${ad.color},${ad.accent},#feca57,${ad.color})`,backgroundSize:"300% 300%",animation:"holoShift 4s ease infinite",boxShadow:glow}}>
          <div style={{borderRadius:16,background:"linear-gradient(160deg,#0d0d2b 0%,#1a1040 30%,#0f1a3a 60%,#0d0d2b 100%)",padding:16,position:"relative",overflow:"hidden"}}>
            <button onClick={onClose} style={{position:"absolute",top:6,right:6,background:"rgba(0,0,0,.4)",border:"1px solid rgba(255,255,255,.15)",borderRadius:50,width:24,height:24,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#fff",fontSize:15,zIndex:10,lineHeight:1}}>✕</button>
            <div style={{position:"absolute",inset:0,borderRadius:16,background:"linear-gradient(105deg,transparent 30%,rgba(255,255,255,.03) 45%,rgba(255,255,255,.08) 50%,rgba(255,255,255,.03) 55%,transparent 70%)",backgroundSize:"200% 200%",animation:"holoShimmer 3s ease-in-out infinite",pointerEvents:"none",zIndex:1}}/>
            <div style={{position:"relative",zIndex:2}}>
              <div style={{fontSize:11,letterSpacing:3,opacity:.4,fontWeight:700}}>ZOBUDDY</div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginTop:1,paddingRight:28}}>
                <div style={{fontSize:17,fontWeight:900}}>{buddyLabel}</div>
                <div style={{fontSize:14,fontWeight:900,color:rc,textShadow:`0 0 8px ${rc}66`}}>Lv.{level.level} <span style={{fontSize:13,opacity:.6,fontWeight:600}}>{level.name}</span></div>
              </div>
            </div>
            <div style={{margin:"10px -4px",borderRadius:12,background:`linear-gradient(180deg,${ad.color}15 0%,${ad.accent}10 50%,transparent 100%)`,border:`1px solid ${ad.accent}22`,padding:"4px 0",position:"relative",zIndex:2}}>
              <BuddyDisplay animal={animal} state={state} filter={filter||"none"} size={130}/>
            </div>
            <div style={{position:"relative",zIndex:2,marginBottom:8}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:3}}><span style={{fontWeight:800,opacity:.6}}>HP</span><span style={{fontWeight:800,color:hp>=80?"#43e97b":hp>=50?"#feca57":"#f5576c"}}>{hp}%</span></div>
              <HealthBar percent={hp} small/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:10,position:"relative",zIndex:2}}>
              {[{l:"POWER",v:stats.power,c:"#feca57"},{l:"STREAK",v:`${streak}d`,c:"#f5576c"},{l:"GOALS",v:stats.goals,c:"#60a5fa"}].map(s=>(
                <div key={s.l} style={{background:"rgba(255,255,255,.04)",borderRadius:8,padding:"6px 3px",textAlign:"center",border:"1px solid rgba(255,255,255,.06)"}}>
                  <div style={{fontSize:16,fontWeight:900,color:s.c}}>{s.v}</div>
                  <div style={{fontSize:10,fontWeight:700,opacity:.3,letterSpacing:1,marginTop:1}}>{s.l}</div>
                </div>))}
            </div>
            <div style={{display:"flex",flexWrap:"wrap",gap:3,position:"relative",zIndex:2}}>
              {state.selectedHabits?.map(hId=>{const h=habitsData.find(x=>x.id===hId);const d=done.includes(hId);return <div key={hId} style={{fontSize:13,padding:"2px 6px",borderRadius:6,background:d?"rgba(67,233,123,.12)":"rgba(245,87,108,.12)",border:d?"1px solid rgba(67,233,123,.25)":"1px solid rgba(245,87,108,.25)",color:d?"#43e97b":"#f5576c",fontWeight:700}}>{h?.icon} {d?"✓":"✗"}</div>;})}
            </div>
          </div>
        </div>
        <div style={{background:"rgba(255,255,255,.04)",borderRadius:10,padding:"8px 10px",marginTop:8,border:"1px solid rgba(255,255,255,.06)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div><div style={{fontSize:13,fontWeight:700,opacity:.3}}>🔑 BATTLE CODE</div><div style={{fontSize:20,fontWeight:900,letterSpacing:3,color:"#feca57",fontFamily:"monospace",marginTop:2}}>{duelCode}</div></div>
          <div style={{fontSize:11,opacity:.3,textAlign:"right",maxWidth:120}}>Share to battle friends or restore your save</div>
        </div>
        <div style={{display:"flex",gap:6,marginTop:8}}>
          {canShare&&<button onClick={share} style={{flex:1,background:"linear-gradient(135deg,#f093fb,#f5576c)",color:"#fff",border:"none",borderRadius:12,padding:"12px 16px",fontSize:16,fontWeight:700,cursor:"pointer"}}>📤 Share</button>}
          <button onClick={copy} style={{flex:canShare?0:"1",minWidth:canShare?48:"auto",background:copied?"linear-gradient(135deg,#43e97b,#38f9d7)":"linear-gradient(135deg,#667eea,#764ba2)",color:copied?"#1a1a2e":"#fff",border:"none",borderRadius:12,padding:"12px 16px",fontSize:16,fontWeight:700,cursor:"pointer",transition:"all .3s"}}>{copied?"✓":canShare?"📋":"📋 Copy Stats"}</button>
        </div>
        <div style={{textAlign:"center",fontSize:14,opacity:.3,marginTop:6}}>📸 Take a screenshot to save your card!</div>
        </div>}

        {tab==="history"&&<div style={{overflow:"auto",flex:1}}>
          <button onClick={onClose} style={{position:"absolute",top:10,right:10,background:"rgba(0,0,0,.6)",border:"1px solid rgba(255,255,255,.15)",borderRadius:50,width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#fff",fontSize:16,zIndex:10}}>✕</button>
          {historyDays.length===0?<div style={{textAlign:"center",padding:40,opacity:.4,fontSize:16}}>No history yet — complete some goals!</div>
          :historyDays.map(day=>{
            const isToday=day.date===today;
            const dateLabel=isToday?"Today":day.date;
            return <div key={day.date} style={{background:"rgba(255,255,255,.03)",borderRadius:12,padding:10,marginBottom:6,border:"1px solid rgba(255,255,255,.06)"}}>
              <div style={{fontSize:14,fontWeight:800,opacity:.4,marginBottom:6}}>{dateLabel} — {day.goals.length} completed</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                {day.goals.map((g,i)=>{
                  const isActive=currentGoalIds.has(g.id);
                  return <div key={i} style={{display:"flex",alignItems:"center",gap:3,background:isActive?"rgba(67,233,123,.08)":"rgba(255,255,255,.04)",border:isActive?"1px solid rgba(67,233,123,.15)":"1px solid rgba(255,255,255,.06)",borderRadius:8,padding:"4px 7px",fontSize:14}}>
                    <span style={{fontSize:16}}>{g.icon}</span>
                    <span style={{opacity:.7}}>{g.name}</span>
                    {!isActive&&canEdit&&onAddGoal&&<button onClick={()=>onAddGoal(g)} style={{background:"rgba(102,126,234,.2)",border:"1px solid rgba(102,126,234,.3)",borderRadius:5,padding:"1px 5px",fontSize:13,color:"#a8b4f0",cursor:"pointer",fontWeight:700,marginLeft:2}}>+</button>}
                  </div>;
                })}
              </div>
            </div>;
          })}
        </div>}
      </div>
    </div>
  );
};

const D6_FACES=["⚀","⚁","⚂","⚃","⚄","⚅"];

const DuelPanel=({state,onClose,duelCode})=>{
  const[oppInput,setOppInput]=useState("");const[oppPower,setOppPower]=useState("");const[result,setResult]=useState(null);
  const[copied,setCopied]=useState(false);const[error,setError]=useState("");
  const[rollingFrame1,setRollingFrame1]=useState(0);const[rollingFrame2,setRollingFrame2]=useState(0);
  const[phase,setPhase]=useState("input");const[rematchCount,setRematchCount]=useState(0);
  const[oppName,setOppName]=useState("");const[oppEmoji,setOppEmoji]=useState("");

  const myStats=calcDuelStats(state);const ad=getAnimalData(state);

  // Parse input: if 8-char code, decode for opponent stats; otherwise treat as power number
  const parseOppInput=(val)=>{
    setOppInput(val);setError("");setOppName("");setOppEmoji("");
    const clean=val.replace(/[\s-]/g,"").toUpperCase();
    // Try decode as 8-char battle code
    if(clean.length===8){
      const decoded=decodeDuelCode(clean);
      if(decoded){
        const stats=calcDuelStats(decoded);
        const da=getAnimalData(decoded);
        setOppPower(String(stats.power));
        setOppName("Challenger");
        setOppEmoji(da.emoji);
        return;
      }
    }
    // Otherwise treat as raw number
    setOppPower(val.replace(/[^0-9]/g,""));
  };

  const rollDice=()=>{
    const p=parseInt(oppPower.trim());if(isNaN(p)||p<0){setError("Enter a valid power number!");return;}
    setError("");setPhase("rolling");let frames=0;
    const iv=setInterval(()=>{setRollingFrame1(Math.floor(Math.random()*6));setRollingFrame2(Math.floor(Math.random()*6));frames++;if(frames>14){clearInterval(iv);resolveRound();}},70);
  };
  const[rerollCount,setRerollCount]=useState(0);
  const resolveRound=()=>{
    const myD1=Math.floor(Math.random()*6)+1,myD2=Math.floor(Math.random()*6)+1;
    const oppD1=Math.floor(Math.random()*6)+1,oppD2=Math.floor(Math.random()*6)+1;
    const opp=parseInt(oppPower)||0;
    const myScore=calc2D6Score(myStats.power,myD1,myD2);const oppScore=calc2D6Score(opp,oppD1,oppD2);
    const myCrit=myD1===6&&myD2===6;const oppCrit=oppD1===6&&oppD2===6;
    // Double-6 by user = auto-win (even if opponent also gets double-6)
    let winner;
    if(myCrit)winner="win";
    else if(oppCrit)winner="lose";
    else if(myScore>oppScore)winner="win";
    else if(oppScore>myScore)winner="lose";
    else{
      // Tie without crits = auto-reroll with dice animation
      setRerollCount(c=>c+1);setPhase("rolling");
      let frames=0;const iv2=setInterval(()=>{setRollingFrame1(Math.floor(Math.random()*6));setRollingFrame2(Math.floor(Math.random()*6));frames++;if(frames>10){clearInterval(iv2);resolveRound();}},70);
      return;
    }
    const reasons=[];
    if(winner==="win"){
      if(myCrit)reasons.push("🎯 Double sixes! Your Zobuddy channeled pure cosmic energy!");
      else if(myD1+myD2>oppD1+oppD2)reasons.push("🎲 Higher dice roll gave you the edge");
      if(myStats.power>opp*1.2&&!myCrit)reasons.push("💪 Your stronger power made the difference");
      else if(myStats.power<opp*0.8)reasons.push("🍀 Pure luck beat a stronger opponent!");
      if(myStats.tokens>0)reasons.push("🎟️ Transfer tokens boosted your power");
    }else{
      if(oppCrit)reasons.push("🎯 Opponent rolled double sixes — unstoppable crit!");
      else if(oppD1+oppD2>myD1+myD2)reasons.push("🎲 Opponent had better dice luck");
      if(opp>myStats.power*1.2)reasons.push("💪 Opponent's higher power was decisive");
      else if(opp<myStats.power*0.8)reasons.push("😤 Lost despite stronger power — unlucky!");
      if(myStats.streak<7)reasons.push("🔥 Build a longer streak for more power & tokens");
    }
    if(reasons.length===0)reasons.push("⚡ It was a close fight!");
    setResult({myD1,myD2,oppD1,oppD2,myScore,oppScore,myCrit,oppCrit,mySum:myD1+myD2,oppSum:oppD1+oppD2,winner,reasons:reasons.slice(0,3),rerolls:rerollCount});
    setPhase("done");setRerollCount(0);
  };

  const shareResult=async()=>{
    if(!result)return;const r=result;
    const name=state.buddyName||"Zobuddy";const matchNum=rematchCount+1;
    const txt=`⚔️ Zobuddy Battle #${matchNum}\n\n${r.winner==="win"?`🏆 ${name} won this roll!`:`😤 ${name} lost this roll!`}${r.rerolls>0?` (${r.rerolls} auto-reroll${r.rerolls>1?"s":""})`:""}
\n🐾 Challenge me! My power: ⚡${myStats.power}\n🔑 Code: ${duelCode}`;
    if(navigator.share){try{await navigator.share({title:`${name} — Zobuddy Battle`,text:txt});return;}catch{}}
    navigator.clipboard?.writeText(txt);setCopied(true);setTimeout(()=>setCopied(false),2000);
  };

  const DicePair=({d1,d2,crit})=>(<div style={{display:"flex",gap:4,justifyContent:"center"}}>{[d1,d2].map((v,i)=>(<div key={i} style={{width:46,height:46,borderRadius:10,background:crit?"linear-gradient(135deg,rgba(254,202,87,.3),rgba(255,165,0,.2))":"linear-gradient(135deg,rgba(255,255,255,.06),rgba(255,255,255,.02))",border:crit?"2px solid rgba(254,202,87,.5)":"2px solid rgba(255,255,255,.1)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:crit?"0 0 12px rgba(254,202,87,.3)":"none"}}><div style={{fontSize:24}}>{D6_FACES[v-1]}</div></div>))}</div>);

  return (
    <div style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(0,0,0,.8)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:"linear-gradient(135deg,#1a0a2e,#0d1b3e)",borderRadius:20,padding:20,maxWidth:340,width:"100%",color:"#fff",textAlign:"center",boxShadow:"0 20px 60px rgba(0,0,0,.6)",border:"1px solid rgba(255,255,255,.08)",position:"relative",overflow:"hidden",maxHeight:"90vh",overflowY:"auto"}}>
        {/* Close button */}
        <button onClick={onClose} style={{position:"absolute",top:12,right:12,background:"rgba(255,255,255,.08)",border:"none",borderRadius:8,width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#fff",fontSize:15,zIndex:10}}>✕</button>
        <div style={{position:"absolute",inset:0,background:"radial-gradient(circle at 30% 20%,rgba(102,126,234,.06) 0%,transparent 50%),radial-gradient(circle at 70% 80%,rgba(245,87,108,.06) 0%,transparent 50%)",pointerEvents:"none"}}/>
        <div style={{position:"relative",zIndex:2}}>
          <div style={{fontSize:16,fontWeight:900,letterSpacing:3,opacity:.4,marginBottom:2}}>⚔️ ZOBUDDY BATTLE ⚔️</div>
          {rematchCount>0&&<div style={{fontSize:18,fontWeight:900,color:"#feca57",marginBottom:4}}>Match #{rematchCount+1}</div>}
          <div style={{fontSize:14,opacity:.3,marginBottom:14}}>Single round • Roll 2D6 • Double 6 = Instant Win!</div>

          {(phase==="input"||phase==="rolling")&&<>
            <div style={{background:"rgba(255,255,255,.05)",borderRadius:12,padding:12,marginBottom:12,border:"1px solid rgba(255,255,255,.06)"}}>
              <div style={{fontSize:13,opacity:.4,marginBottom:4,fontWeight:700}}>YOUR POWER</div>
              <div style={{fontSize:28,fontWeight:900,color:"#feca57"}}>⚡ {myStats.power}</div>
              {myStats.tokens>0&&<div style={{fontSize:14,opacity:.5,marginTop:2}}>🎟️ {myStats.tokens} token{myStats.tokens>1?"s":""}</div>}
            </div>
            <div style={{fontSize:15,fontWeight:700,opacity:.6,marginBottom:6}}>Enter opponent's code or power:</div>
            <input value={oppInput} onChange={e=>parseOppInput(e.target.value)} placeholder="Paste code or enter power" disabled={phase==="rolling"} style={{width:"100%",padding:"12px 14px",borderRadius:12,border:"1px solid rgba(255,255,255,.15)",background:"rgba(255,255,255,.05)",color:"#fff",fontSize:oppName?14:22,textAlign:"center",outline:"none",letterSpacing:oppName?0:2,marginBottom:4,opacity:phase==="rolling"?.5:1,fontFamily:oppName?"inherit":"monospace"}}/>
            {oppName&&<div style={{background:"rgba(102,126,234,.1)",border:"1px solid rgba(102,126,234,.2)",borderRadius:10,padding:"8px 12px",marginBottom:8,display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:24}}>{oppEmoji}</span>
              <div style={{flex:1,textAlign:"left"}}><div style={{fontSize:16,fontWeight:800}}>{oppName}</div><div style={{fontSize:14,opacity:.5}}>⚡ Power: {oppPower}</div></div>
              <div style={{fontSize:14,color:"#43e97b",fontWeight:700}}>✓ Valid</div>
            </div>}
            {error&&<div style={{fontSize:14,color:"#f5576c",marginBottom:6}}>{error}</div>}
            {rerollCount>0&&<div style={{fontSize:14,color:"#feca57",marginBottom:4,fontWeight:700}}>🔄 Tied! Rerolling... #{rerollCount}</div>}
            <div style={{fontSize:14,opacity:.35,marginBottom:6,lineHeight:1.5}}>🍀 Lower power can still win! Double sixes = instant victory.</div>
            {phase==="rolling"?
              <div style={{fontSize:56,margin:"8px 0",animation:"rollDice .4s linear infinite"}}>{D6_FACES[rollingFrame1]}{D6_FACES[rollingFrame2]}</div>
            :<div onClick={rollDice} style={{cursor:"pointer",fontSize:56,margin:"8px 0",animation:"diceShake 1.5s ease-in-out infinite",userSelect:"none"}}>🎲🎲</div>}
            <div style={{fontSize:15,opacity:.4,fontWeight:700}}>{phase==="rolling"?"Rolling...":"Tap dice to battle!"}</div>
          </>}

          {phase==="done"&&result&&<>
            <div style={{fontSize:15,fontWeight:800,opacity:.4,letterSpacing:2,marginBottom:4}}>MATCH #{rematchCount+1}</div>
            <div style={{fontSize:48,marginBottom:4}}>{result.winner==="win"?"🏆":"😤"}</div>
            <div style={{fontSize:22,fontWeight:900,marginBottom:2,color:result.winner==="win"?"#43e97b":"#f5576c"}}>{result.winner==="win"?`${state.buddyName||"Zobuddy"} won!`:`${state.buddyName||"Zobuddy"} lost!`}</div>
            {result.rerolls>0&&<div style={{fontSize:14,opacity:.4,marginBottom:4}}>🔄 {result.rerolls} tie-reroll{result.rerolls>1?"s":""} before deciding</div>}
            <div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:16,marginBottom:12}}>
              <div style={{textAlign:"center"}}><div style={{fontSize:13,opacity:.4,marginBottom:3}}>YOU ({result.mySum})</div><DicePair d1={result.myD1} d2={result.myD2} crit={result.myCrit}/>{result.myCrit&&<div style={{fontSize:14,fontWeight:900,color:"#feca57",marginTop:3}}>🎯 DOUBLE SIX!</div>}<div style={{fontSize:15,fontWeight:700,marginTop:3}}>{result.myScore} pts</div></div>
              <div style={{fontSize:15,fontWeight:900,opacity:.2}}>VS</div>
              <div style={{textAlign:"center"}}><div style={{fontSize:13,opacity:.4,marginBottom:3}}>{oppName||"OPP"} ({result.oppSum})</div><DicePair d1={result.oppD1} d2={result.oppD2} crit={result.oppCrit}/>{result.oppCrit&&<div style={{fontSize:14,fontWeight:900,color:"#feca57",marginTop:3}}>🎯 DOUBLE SIX!</div>}<div style={{fontSize:15,fontWeight:700,marginTop:3}}>{result.oppScore} pts</div></div>
            </div>
            {/* Reasons */}
            <div style={{background:result.winner==="win"?"rgba(67,233,123,.08)":result.winner==="lose"?"rgba(245,87,108,.08)":"rgba(254,202,87,.08)",borderRadius:10,padding:"8px 12px",marginBottom:12,border:result.winner==="win"?"1px solid rgba(67,233,123,.15)":result.winner==="lose"?"1px solid rgba(245,87,108,.15)":"1px solid rgba(254,202,87,.15)"}}>
              {result.reasons.map((r,i)=> <div key={i} style={{fontSize:15,opacity:.8,lineHeight:1.6}}>{r}</div>)}
            </div>
            <div style={{display:"flex",gap:6,marginBottom:6}}>
              <button onClick={shareResult} style={{flex:1,background:copied?"linear-gradient(135deg,#43e97b,#38f9d7)":"linear-gradient(135deg,#667eea,#764ba2)",color:copied?"#1a1a2e":"#fff",border:"none",borderRadius:10,padding:"10px 14px",fontSize:16,fontWeight:700,cursor:"pointer"}}>{copied?"✓ Copied!":"📤 Share"}</button>
              <button onClick={()=>{setPhase("input");setResult(null);setRematchCount(c=>c+1);}} style={{flex:1,background:"rgba(255,255,255,.08)",color:"#ccc",border:"1px solid rgba(255,255,255,.1)",borderRadius:10,padding:"10px 14px",fontSize:16,fontWeight:700,cursor:"pointer"}}>🔄 Rematch</button>
            </div>
          </>}
        </div>
      </div>
    </div>
  );
};

// ─── MINI GAMES ──────────────────────────────────────────────────────────────
const MiniGames=({onClose,goalsToday,totalGoals})=>{
  const[game,setGame]=useState(null);
  const[gameKey,setGameKey]=useState(0);
  const bonus=totalGoals>0?Math.min(3,Math.floor((goalsToday/totalGoals)*3)):0;

  // ═══ BUBBLE POP (with trap shapes) ═══
  const BubblePop=()=>{
    const[slots,setSlots]=useState(Array(9).fill(null)); // 3x3 grid
    const[score,setScore]=useState(0);
    const[lives,setLives]=useState(3);
    const[gameOver,setGameOver]=useState(false);
    const[best,setBest]=useState(()=>{try{return Number(localStorage.getItem("zo_best_bubbles"))||0;}catch{return 0;}});
    const[flash,setFlash]=useState(null); // {idx,ok} for tap feedback
    const GOOD=["🥦","🥕","🌽","🥬","🫑","🥒","🧅","🥑","🍆","🍅"];
    const TRAPS=["🍄","☠️"];
    const spawnMs=Math.max(350,900-score*8);
    const showMs=Math.max(400,900-score*7);

    useEffect(()=>{
      if(gameOver)return;
      const iv=setInterval(()=>{
        // Pick a random empty slot (or any slot)
        const idx=Math.floor(Math.random()*9);
        const isGood=Math.random()>0.22;
        const emoji=isGood?GOOD[Math.floor(Math.random()*GOOD.length)]:TRAPS[Math.floor(Math.random()*TRAPS.length)];
        const id=Date.now()+Math.random();
        setSlots(prev=>{const n=[...prev];n[idx]={id,emoji,good:isGood,born:Date.now()};return n;});
        // Auto-expire: good items disappearing = lose life
        setTimeout(()=>{
          setSlots(prev=>{
            const n=[...prev];
            if(n[idx]&&n[idx].id===id){
              if(isGood){setLives(l=>{const nl=l-1;if(nl<=0)setGameOver(true);return Math.max(0,nl);});}
              n[idx]=null;
            }
            return n;
          });
        },showMs);
      },spawnMs);
      return()=>clearInterval(iv);
    },[gameOver,spawnMs,showMs]);

    useEffect(()=>{if(gameOver&&score>best){setBest(score);try{localStorage.setItem("zo_best_bubbles",String(score));}catch{}}},[gameOver]);

    const tapSlot=(idx)=>{
      const item=slots[idx];if(!item)return;
      if(item.good){
        setScore(s=>s+1);setFlash({idx,ok:true});
      } else {
        setLives(l=>{const nl=l-1;if(nl<=0)setGameOver(true);return Math.max(0,nl);});
        setFlash({idx,ok:false});
      }
      setSlots(prev=>{const n=[...prev];n[idx]=null;return n;});
      setTimeout(()=>setFlash(null),200);
    };

    if(gameOver)return(<div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{fontSize:48,marginBottom:10}}>🥦</div><div style={{fontSize:22,fontWeight:900,color:"#e8e0f0"}}>Game Over!</div>
      <div style={{fontSize:18,fontWeight:800,color:"#feca57",marginTop:4}}>Score: {score}</div>
      {score>=best&&score>0&&<div style={{fontSize:14,color:"#43e97b",fontWeight:700,marginTop:4}}>🏆 New Personal Best!</div>}
      <div style={{fontSize:13,opacity:.4,marginTop:2}}>Best: {Math.max(score,best)}</div>
      <div style={{display:"flex",gap:8,marginTop:16}}>
        <button onClick={()=>{setGameKey(k=>k+1);}} style={{background:"linear-gradient(135deg,#667eea,#764ba2)",color:"#fff",border:"none",borderRadius:12,padding:"10px 24px",fontSize:15,fontWeight:700,cursor:"pointer"}}>Play Again</button>
        <button onClick={()=>setGame(null)} style={{background:"rgba(255,255,255,.08)",color:"#ccc",border:"1px solid rgba(255,255,255,.1)",borderRadius:12,padding:"10px 20px",fontSize:15,fontWeight:700,cursor:"pointer"}}>Exit to Menu</button>
      </div></div>);

    return(<div style={{flex:1,display:"flex",flexDirection:"column",touchAction:"none",padding:"0 16px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0"}}>
        <span style={{fontSize:16,fontWeight:800,color:"#feca57"}}>Score: {score}</span>
        <span style={{fontSize:12,opacity:.4}}>Tap 🥦 Avoid 🍄</span>
        <span style={{fontSize:14,fontWeight:800,color:"#f5576c"}}>{"❤️".repeat(Math.min(lives,7))}</span>
      </div>
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,width:"100%",maxWidth:300}}>
          {slots.map((slot,idx)=>{
            const isFlash=flash&&flash.idx===idx;
            return(
              <div key={idx} onClick={()=>slot&&tapSlot(idx)}
                style={{aspectRatio:"1",borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center",
                  cursor:slot?"pointer":"default",userSelect:"none",
                  background:isFlash?(flash.ok?"rgba(67,233,123,.25)":"rgba(245,87,108,.25)"):slot?"rgba(255,255,255,.06)":"rgba(255,255,255,.02)",
                  border:isFlash?(flash.ok?"2px solid rgba(67,233,123,.5)":"2px solid rgba(245,87,108,.5)"):slot?"2px solid rgba(255,255,255,.12)":"2px solid rgba(255,255,255,.04)",
                  transition:"all .08s"}}>
                {slot&&<span style={{fontSize:48,animation:"popIn .15s ease"}}>{slot.emoji}</span>}
              </div>);
          })}
        </div>
      </div>
      <style>{`@keyframes popIn{0%{transform:scale(0)}100%{transform:scale(1)}}`}</style>
    </div>);
  };

  // ═══ BREAKOUT (Fruit Blocks — with ice blocks, prizes, extra balls) ═══
  const Breakout=()=>{
    const canvasRef=React.useRef(null);
    const[gameOver,setGameOver]=useState(false);const[score,setScore]=useState(0);const[livesDisplay,setLivesDisplay]=useState(3+bonus);
    const[best,setBest]=useState(()=>{try{return Number(localStorage.getItem("zo_best_breakout"))||0;}catch{return 0;}});
    const[bestTime,setBestTime]=useState(()=>{try{return Number(localStorage.getItem("zo_best_breakout_time"))||0;}catch{return 0;}});
    const[won,setWon]=useState(false);
    const[elapsed,setElapsed]=useState(0);
    const startRef=React.useRef(Date.now());
    const W=320,H=420,BD=4;
    const FRUITS=["🍎","🍊","🍋","🍇","🫐","🥝","🍓","🍑","🍌","🍐","🍒","🥭","🍉","🍈","🍍"];
    useEffect(()=>{
      const canvas=canvasRef.current;if(!canvas)return;const ctx=canvas.getContext("2d");
      if(!ctx)return;
      if(!ctx.roundRect){ctx.roundRect=function(x,y,w,h,r){r=Math.min(r||0,w/2,h/2);this.beginPath();this.moveTo(x+r,y);this.lineTo(x+w-r,y);this.quadraticCurveTo(x+w,y,x+w,y+r);this.lineTo(x+w,y+h-r);this.quadraticCurveTo(x+w,y+h,x+w-r,y+h);this.lineTo(x+r,y+h);this.quadraticCurveTo(x,y+h,x,y+h-r);this.lineTo(x,y+r);this.quadraticCurveTo(x,y,x+r,y);this.closePath();return this;};}
      const cols=7,rows=6,gap=4;
      const cellW=(W-BD*2-gap*(cols+1))/cols,cellH=24;
      const topMargin=18; // reduced from 36
      const blocks=[];
      const iceOpening=Math.floor(Math.random()*cols);
      const extraIce=new Set();
      const checkReachable=(iceSet)=>{
        const grid=Array(3).fill(null).map(()=>Array(cols).fill(false));
        for(const pos of iceSet){const lr=Math.floor(pos/cols),lc=pos%cols;grid[lr][lc]=true;}
        const visited=Array(3).fill(null).map(()=>Array(cols).fill(false));const queue=[];
        for(let c=0;c<cols;c++){if(!grid[2][c]){visited[2][c]=true;queue.push([2,c]);}}
        while(queue.length){const[qr,qc]=queue.shift();for(const[dr,dc] of [[0,1],[0,-1],[-1,0],[1,0]]){
          const nr=qr+dr,nc=qc+dc;if(nr>=0&&nr<3&&nc>=0&&nc<cols&&!visited[nr][nc]&&!grid[nr][nc]){visited[nr][nc]=true;queue.push([nr,nc]);}}}
        if(!visited[0][iceOpening])return false;
        for(let r=0;r<3;r++)for(let c=0;c<cols;c++){if(!grid[r][c]&&!visited[r][c])return false;}return true;};
      let attempts=0;while(extraIce.size<5&&attempts<200){const pos=Math.floor(Math.random()*cols*3);
        if(pos===iceOpening||extraIce.has(pos)){attempts++;continue;}extraIce.add(pos);if(!checkReachable(extraIce)){extraIce.delete(pos);}attempts++;}
      for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){let ice=false;
        if(r===2&&c!==iceOpening)ice=true;else if(r>=3&&extraIce.has((r-3)*cols+c))ice=true;
        blocks.push({x:BD+gap+(cellW+gap)*c,y:topMargin+r*(cellH+gap),w:cellW,h:cellH,alive:true,unbreakable:ice,
          emoji:ice?"🧊":FRUITS[Math.floor(Math.random()*FRUITS.length)]});}
      const pw=60+bonus*8;
      const paddleY=H-36;
      // Prize system
      const prizes=[];// {x,y,vy,type,emoji} falling prizes
      const PRIZE_TYPES=[{emoji:"🌟",pts:3,prob:.15},{emoji:"⭐",pts:2,prob:.25},{emoji:"✨",mult:3,prob:.08}];
      // Extra ball from ice
      let iceHits=0;const extraBalls=[]; // {x,y,dx,dy}
      const s={px:W/2-pw/2,pw,bx:W/2,by:H-50,bdx:3,bdy:-4,speed:6,blocks,score:0,lives:3+bonus,running:true,
        frozen:0,frozenUntil:0}; // frozen=timestamp when freeze ends
      let touchX=null;
      const onTouch=(e)=>{e.preventDefault();const rect=canvas.getBoundingClientRect();const sc=W/rect.width;touchX=((e.touches?e.touches[0].clientX:e.clientX)-rect.left)*sc;};
      const onMouse=(e)=>{const rect=canvas.getBoundingClientRect();touchX=(e.clientX-rect.left)*(W/rect.width);};
      canvas.addEventListener("touchmove",onTouch,{passive:false});canvas.addEventListener("touchstart",onTouch,{passive:false});
      canvas.addEventListener("mousemove",onMouse);canvas.addEventListener("touchend",()=>{touchX=null;});
      let raf;const ballR=5;let cancelled=false;
      const now=()=>Date.now();
      const processBall=(bx,by,bdx,bdy,isExtra)=>{
        const spd=Math.sqrt(bdx*bdx+bdy*bdy)||s.speed;
        bx+=(bdx/spd)*s.speed;by+=(bdy/spd)*s.speed;
        if(bx<=BD+ballR){bx=BD+ballR;bdx=Math.abs(bdx);}
        if(bx>=W-BD-ballR){bx=W-BD-ballR;bdx=-Math.abs(bdx);}
        if(by<=BD+ballR){by=BD+ballR;bdy=Math.abs(bdy);}
        // Paddle hit
        if(by>=paddleY-6&&by<=paddleY+4&&bx>=s.px-3&&bx<=s.px+s.pw+3){
          const hit=(bx-s.px)/s.pw;const angle=(hit-0.5)*140*(Math.PI/180);
          s.speed=Math.min(14,s.speed+0.06);bdx=Math.sin(angle)*s.speed;bdy=-Math.cos(angle)*s.speed;by=paddleY-7;}
        // Miss
        if(by>H+10){if(!isExtra){
          if(extraBalls.length>0){// Promote an extra ball to main ball
            const eb=extraBalls.pop();return{bx:eb.x,by:eb.y,bdx:eb.dx,bdy:eb.dy};}
          s.lives--;s.speed=Math.max(6,s.speed*0.7);setLivesDisplay(s.lives);
          if(s.lives<=0){s.running=false;setGameOver(true);setScore(s.score);return null;}
          return{bx:W/2,by:H-50,bdx:3*(Math.random()>.5?1:-1),bdy:-s.speed*0.8};}
          return null;} // extra ball just disappears
        // Block collisions
        for(let i=0;i<s.blocks.length;i++){const bl=s.blocks[i];if(!bl.alive)continue;
          const cx=Math.max(bl.x,Math.min(bx,bl.x+bl.w)),cy=Math.max(bl.y,Math.min(by,bl.y+bl.h));
          const dx=bx-cx,dy=by-cy;
          if(dx*dx+dy*dy<ballR*ballR){
            const oL=bx+ballR-bl.x,oR=bl.x+bl.w-(bx-ballR),oT=by+ballR-bl.y,oB=bl.y+bl.h-(by-ballR);
            const mX=Math.min(oL,oR),mY=Math.min(oT,oB);
            if(mX<mY){bdx*=-1;bx+=(oL<oR?-mX:mX);}else{bdy*=-1;by+=(oT<oB?-mY:mY);}
            if(!bl.unbreakable){bl.alive=false;s.score++;setScore(s.score);
              // Random prize drop
              const roll=Math.random();let cum=0;
              for(const pt of PRIZE_TYPES){cum+=pt.prob;if(roll<cum){prizes.push({x:bl.x+bl.w/2,y:bl.y+bl.h,vy:2,type:pt,emoji:pt.emoji});break;}}
            }else{
              // Ice hit
              iceHits++;
              if(iceHits%20===0){prizes.push({x:bl.x+bl.w/2,y:bl.y+bl.h,vy:2,type:{emoji:"❄️",ice:true},emoji:"❄️"});}
            }
            break;}}
        return{bx,by,bdx,bdy};
      };
      const loop=()=>{
        if(!s.running||cancelled)return;
        const isFrozen=now()<s.frozenUntil;
        if(touchX!==null&&!isFrozen)s.px=Math.max(BD,Math.min(W-BD-s.pw,touchX-s.pw/2));
        // Process main ball
        const main=processBall(s.bx,s.by,s.bdx,s.bdy,false);
        if(!main){raf=requestAnimationFrame(loop);return;}
        s.bx=main.bx;s.by=main.by;s.bdx=main.bdx;s.bdy=main.bdy;
        // Process extra balls
        for(let i=extraBalls.length-1;i>=0;i--){
          const eb=extraBalls[i];const r=processBall(eb.x,eb.y,eb.dx,eb.dy,true);
          if(!r){extraBalls.splice(i,1);}else{eb.x=r.bx;eb.y=r.by;eb.dx=r.bdx;eb.dy=r.bdy;}}
        // Process falling prizes
        for(let i=prizes.length-1;i>=0;i--){
          prizes[i].y+=prizes[i].vy;
          // Catch by paddle
          if(prizes[i].y>=paddleY-4&&prizes[i].y<=paddleY+12&&prizes[i].x>=s.px&&prizes[i].x<=s.px+s.pw){
            const p=prizes[i];
            if(p.type.pts){s.score+=p.type.pts;setScore(s.score);}
            if(p.type.mult){s.score=s.score*p.type.mult;setScore(s.score);}
            if(p.type.ice){// Extra ball + freeze
              extraBalls.push({x:W/2,y:H-60,dx:4*(Math.random()>.5?1:-1),dy:-6});
              s.frozenUntil=now()+1000;s.frozen=1;}
            prizes.splice(i,1);
          }else if(prizes[i].y>H+20){prizes.splice(i,1);}
        }
        // Win check
        if(s.blocks.every(b=>!b.alive||b.unbreakable)){s.running=false;setWon(true);setScore(s.score);}
        // ─── DRAW ─────────────────────────────────
        ctx.fillStyle="#0a0a1a";ctx.fillRect(0,0,W,H);
        // Side borders
        ctx.fillStyle="#334";ctx.fillRect(0,0,BD,H);ctx.fillRect(W-BD,0,BD,H);ctx.fillRect(0,0,W,BD);
        // Bottom border - blue glow
        const grad=ctx.createLinearGradient(0,H-6,0,H);
        grad.addColorStop(0,"rgba(96,165,250,0)");grad.addColorStop(1,"rgba(96,165,250,.4)");
        ctx.fillStyle=grad;ctx.fillRect(0,H-6,W,6);
        ctx.fillStyle="rgba(96,165,250,.6)";ctx.fillRect(0,H-2,W,2);
        // Blocks
        s.blocks.forEach(bl=>{if(!bl.alive)return;
          ctx.fillStyle=bl.unbreakable?"rgba(150,200,255,.1)":"rgba(255,255,255,.04)";ctx.beginPath();ctx.roundRect(bl.x,bl.y,bl.w,bl.h,6);ctx.fill();
          ctx.strokeStyle=bl.unbreakable?"rgba(150,200,255,.25)":"rgba(255,255,255,.08)";ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(bl.x,bl.y,bl.w,bl.h,6);ctx.stroke();
          ctx.font=`${Math.min(bl.h-4,bl.w-4)}px sans-serif`;ctx.textAlign="center";ctx.textBaseline="middle";
          ctx.fillText(bl.emoji,bl.x+bl.w/2,bl.y+bl.h/2+1);});
        // Paddle
        if(isFrozen){
          // Outer aura glow layers
          ctx.save();
          ctx.shadowColor="rgba(80,160,255,.9)";ctx.shadowBlur=30;
          ctx.fillStyle="rgba(80,160,255,.15)";ctx.beginPath();ctx.roundRect(s.px-8,paddleY-8,s.pw+16,26,12);ctx.fill();
          ctx.shadowBlur=20;
          ctx.fillStyle="rgba(100,180,255,.2)";ctx.beginPath();ctx.roundRect(s.px-4,paddleY-4,s.pw+8,18,8);ctx.fill();
          ctx.shadowBlur=0;ctx.restore();
          // Paddle body
          ctx.fillStyle="rgba(120,200,255,.85)";ctx.beginPath();ctx.roundRect(s.px,paddleY,s.pw,10,5);ctx.fill();
          // Inner bright highlight
          ctx.fillStyle="rgba(200,230,255,.4)";ctx.beginPath();ctx.roundRect(s.px+4,paddleY+2,s.pw-8,4,3);ctx.fill();
          // Pulsing outline
          const pulse=0.5+0.5*Math.sin(Date.now()/100);
          ctx.strokeStyle=`rgba(150,220,255,${0.4+pulse*0.4})`;ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(s.px-1,paddleY-1,s.pw+2,12,6);ctx.stroke();
        }else{
          ctx.fillStyle="#667eea";ctx.beginPath();ctx.roundRect(s.px,paddleY,s.pw,10,5);ctx.fill();
          ctx.strokeStyle="rgba(255,255,255,.2)";ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(s.px,paddleY,s.pw,10,5);ctx.stroke();
        }
        // Main ball
        ctx.fillStyle="#feca57";ctx.beginPath();ctx.arc(s.bx,s.by,ballR,0,Math.PI*2);ctx.fill();
        ctx.fillStyle="rgba(255,255,255,.4)";ctx.beginPath();ctx.arc(s.bx-1.5,s.by-1.5,1.5,0,Math.PI*2);ctx.fill();
        // Extra balls
        extraBalls.forEach(eb=>{ctx.fillStyle="#60a5fa";ctx.beginPath();ctx.arc(eb.x,eb.y,ballR,0,Math.PI*2);ctx.fill();});
        // Falling prizes
        prizes.forEach(p=>{ctx.font="16px sans-serif";ctx.textAlign="center";ctx.fillText(p.emoji,p.x,p.y);});
        raf=requestAnimationFrame(loop);};
      raf=requestAnimationFrame(loop);
      return()=>{cancelled=true;cancelAnimationFrame(raf);};
    },[]);
    useEffect(()=>{if(gameOver||won)return;const iv=setInterval(()=>setElapsed(Math.floor((Date.now()-startRef.current)/1000)),1000);return()=>clearInterval(iv);},[gameOver,won]);
    useEffect(()=>{if((gameOver||won)&&score>best){setBest(score);try{localStorage.setItem("zo_best_breakout",String(score));}catch{}}},[gameOver,won]);
    useEffect(()=>{if(won){const t=Math.floor((Date.now()-startRef.current)/1000);setElapsed(t);if(bestTime===0||t<bestTime){setBestTime(t);try{localStorage.setItem("zo_best_breakout_time",String(t));}catch{}}}},[won]);
    if(gameOver||won)return(<div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{fontSize:48,marginBottom:10}}>{won?"🎉":"🍎"}</div><div style={{fontSize:22,fontWeight:900,color:"#e8e0f0"}}>{won?"All Smashed!":"Game Over!"}</div>
      <div style={{fontSize:18,fontWeight:800,color:"#feca57",marginTop:4}}>Score: {score} · {elapsed}s</div>
      {won&&(bestTime===0||elapsed<=bestTime)&&<div style={{fontSize:14,color:"#43e97b",fontWeight:700,marginTop:4}}>🏆 Best Time!</div>}
      {score>=best&&score>0&&<div style={{fontSize:14,color:"#43e97b",fontWeight:700,marginTop:2}}>🏆 High Score!</div>}
      <div style={{fontSize:13,opacity:.4,marginTop:2}}>Best: {Math.max(score,best)} pts{bestTime>0?` · ${bestTime}s`:""}</div>
      <div style={{fontSize:11,opacity:.3,marginTop:4}}>🌟=3pts ⭐=2pts ✨=3× score ❄️=extra ball</div>
      <div style={{display:"flex",gap:8,marginTop:16}}>
        <button onClick={()=>{setGameKey(k=>k+1);}} style={{background:"linear-gradient(135deg,#667eea,#764ba2)",color:"#fff",border:"none",borderRadius:12,padding:"10px 24px",fontSize:15,fontWeight:700,cursor:"pointer"}}>Play Again</button>
        <button onClick={()=>setGame(null)} style={{background:"rgba(255,255,255,.08)",color:"#ccc",border:"1px solid rgba(255,255,255,.1)",borderRadius:12,padding:"10px 20px",fontSize:15,fontWeight:700,cursor:"pointer"}}>Exit to Menu</button>
      </div></div>);
    return(<div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6}}>
      <div style={{display:"flex",justifyContent:"space-between",width:"100%",maxWidth:320,padding:"0 4px"}}>
        <span style={{fontSize:14,fontWeight:800,color:"#feca57"}}>Score: {score}</span>
        <span style={{fontSize:14,fontWeight:800,color:"#60a5fa"}}>⏱ {elapsed}s</span>
        <span style={{fontSize:14,fontWeight:800,color:"#f5576c"}}>{"❤️".repeat(livesDisplay)}</span>
      </div>
      <canvas ref={canvasRef} width={W} height={H} style={{borderRadius:12,touchAction:"none",maxWidth:"100%"}}/>
    </div>);
  };

  // ═══ MEMORY MATCH (animal pairs) ═══
  const MemoryMatch=()=>{
    const ANIMALS=["🐶","🐱","🐰","🦊","🐻","🐼","🐨","🦁","🐯","🐸","🐵","🦄","🐙","🦋","🐢","🐬","🦉","🐘","🦩","🐝","🐞","🦎","🦈","🐳","🦀","🐧","🦜","🐫","🦒","🦔"];
    const SIZES=[
      {id:"3x2",label:"Tiny (3×2)",cols:3,rows:2,pairs:3},
      {id:"4x3",label:"Easy (4×3)",cols:4,rows:3,pairs:6},
      {id:"4x4",label:"Medium (4×4)",cols:4,rows:4,pairs:8},
      {id:"5x4",label:"Hard (5×4)",cols:5,rows:4,pairs:10},
      {id:"6x4",label:"Expert (6×4)",cols:6,rows:4,pairs:12},
      {id:"6x5",label:"Master (6×5)",cols:6,rows:5,pairs:15},
      {id:"6x6",label:"Insane (6×6)",cols:6,rows:6,pairs:18},
    ];
    const[size,setSize]=useState(null);
    const[cards,setCards]=useState([]);
    const[flipped,setFlipped]=useState([]);
    const[matched,setMatched]=useState([]);
    const[moves,setMoves]=useState(0);
    const[gameOver,setGameOver]=useState(false);
    const[startTime,setStartTime]=useState(null);
    const[elapsed,setElapsed]=useState(0);
    const[best,setBest]=useState(()=>{try{return JSON.parse(localStorage.getItem("zo_best_memory"))||{};}catch{return{};}});
    const[busy,setBusy]=useState(false);

    useEffect(()=>{
      if(!startTime||gameOver)return;
      const iv=setInterval(()=>setElapsed(Math.floor((Date.now()-startTime)/1000)),1000);
      return()=>clearInterval(iv);
    },[startTime,gameOver]);

    const startGame=(s)=>{
      const picked=[];const pool=[...ANIMALS];
      for(let i=0;i<s.pairs;i++){const idx=Math.floor(Math.random()*pool.length);picked.push(pool.splice(idx,1)[0]);}
      const deck=[...picked,...picked].map((emoji,i)=>({id:i,emoji}));
      for(let i=deck.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}
      setCards(deck);setFlipped([]);setMatched([]);setMoves(0);setGameOver(false);setStartTime(Date.now());setElapsed(0);setSize(s);setBusy(false);
    };

    const[floatingHearts,setFloatingHearts]=useState([]); // {id,x,y,emoji}

    const flipCard=(idx)=>{
      if(busy||flipped.includes(idx)||matched.includes(idx))return;
      const newFlipped=[...flipped,idx];
      setFlipped(newFlipped);
      if(newFlipped.length===2){
        setMoves(m=>m+1);
        setBusy(true);
        if(cards[newFlipped[0]].emoji===cards[newFlipped[1]].emoji){
          const newMatched=[...matched,...newFlipped];
          // Spawn floating hearts from both matched card positions
          const hearts=["💕","💖","💗","❤️","💘","💝"];
          const newHearts=newFlipped.map(fi=>({id:Date.now()+fi,cardIdx:fi,emoji:hearts[Math.floor(Math.random()*hearts.length)],born:Date.now()}));
          setFloatingHearts(prev=>[...prev,...newHearts]);
          setTimeout(()=>setFloatingHearts(prev=>prev.filter(h=>!newHearts.find(n=>n.id===h.id))),1200);
          setTimeout(()=>{setMatched(newMatched);setFlipped([]);setBusy(false);
            if(newMatched.length===cards.length){setGameOver(true);
              const sc=moves+1;const key=size.id;
              if(!best[key]||sc<best[key]){const nb={...best,[key]:sc};setBest(nb);try{localStorage.setItem("zo_best_memory",JSON.stringify(nb));}catch{}}}
          },400);
        } else {
          setTimeout(()=>{setFlipped([]);setBusy(false);},800);
        }
      }
    };

    // Size select
    if(!size)return(
      <div style={{flex:1,display:"flex",flexDirection:"column",padding:"16px 20px",overflowY:"auto"}}>
        <div style={{fontSize:16,fontWeight:900,color:"#feca57",marginBottom:4}}>Memory Matchmaker</div>
        <div style={{fontSize:13,opacity:.4,marginBottom:14}}>Flip cards and find all matching animal pairs!</div>
        {SIZES.map(s=>{const b=best[s.id]||0;return(
          <div key={s.id} onClick={()=>startGame(s)}
            style={{background:"rgba(254,202,87,.06)",border:"1px solid rgba(254,202,87,.15)",borderRadius:14,padding:"14px 16px",marginBottom:8,cursor:"pointer",display:"flex",alignItems:"center",gap:12}}>
            <div style={{fontSize:28}}>💕</div>
            <div style={{flex:1}}>
              <div style={{fontSize:15,fontWeight:800,color:"#e8e0f0"}}>{s.label}</div>
              <div style={{fontSize:12,opacity:.4}}>{s.pairs} pairs · {s.cols*s.rows} cards</div>
              {b>0&&<div style={{fontSize:11,color:"#feca57",fontWeight:700,marginTop:2}}>🏆 Best: {b} moves</div>}
            </div><span style={{fontSize:16,opacity:.3}}>▶</span></div>);})}
      </div>);

    // Game over
    if(gameOver)return(
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20}}>
        <div style={{fontSize:48,marginBottom:10}}>🎉</div>
        <div style={{fontSize:22,fontWeight:900,color:"#e8e0f0"}}>All Matched!</div>
        <div style={{fontSize:18,fontWeight:800,color:"#feca57",marginTop:4}}>{moves} moves · {elapsed}s</div>
        {moves<=(best[size.id]||999)&&<div style={{fontSize:14,color:"#43e97b",fontWeight:700,marginTop:4}}>🏆 New Personal Best!</div>}
        <div style={{display:"flex",gap:8,marginTop:16}}>
          <button onClick={()=>{setGameKey(k=>k+1);}} style={{background:"linear-gradient(135deg,#667eea,#764ba2)",color:"#fff",border:"none",borderRadius:12,padding:"10px 24px",fontSize:15,fontWeight:700,cursor:"pointer"}}>Play Again</button>
          <button onClick={()=>setSize(null)} style={{background:"rgba(255,255,255,.08)",color:"#ccc",border:"1px solid rgba(255,255,255,.1)",borderRadius:12,padding:"10px 20px",fontSize:15,fontWeight:700,cursor:"pointer"}}>Sizes</button>
          <button onClick={()=>setGame(null)} style={{background:"rgba(255,255,255,.06)",color:"#888",border:"1px solid rgba(255,255,255,.06)",borderRadius:12,padding:"10px 16px",fontSize:15,fontWeight:700,cursor:"pointer"}}>Exit to Menu</button>
        </div></div>);

    // Playing
    return(
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",padding:"0 12px"}}>
        <style>{`@keyframes floatHeart{0%{opacity:1;transform:translateY(0) scale(1)}50%{opacity:1;transform:translateY(-40px) scale(1.3)}100%{opacity:0;transform:translateY(-80px) scale(0.8)}}`}</style>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 4px",flexShrink:0}}>
          <span style={{fontSize:14,fontWeight:800,color:"#feca57"}}>Moves: {moves}</span>
          <span style={{fontSize:14,fontWeight:800,color:"#60a5fa"}}>⏱ {elapsed}s</span>
          <span style={{fontSize:13,fontWeight:700,color:"#43e97b"}}>{matched.length/2}/{size.pairs} pairs</span>
        </div>
        <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{position:"relative",display:"grid",gridTemplateColumns:`repeat(${size.cols},1fr)`,gap:6,width:"100%",maxWidth:340}}>
            {cards.map((card,idx)=>{
              const isFlipped=flipped.includes(idx);
              const isMatched=matched.includes(idx);
              const showFace=isFlipped||isMatched;
              return(
                <div key={idx} onClick={()=>flipCard(idx)}
                  style={{aspectRatio:"1",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",position:"relative",
                    cursor:showFace?"default":"pointer",userSelect:"none",
                    background:isMatched?"rgba(67,233,123,.12)":showFace?"rgba(102,126,234,.15)":"linear-gradient(135deg,#1e1e40,#2a2a50)",
                    border:isMatched?"2px solid rgba(67,233,123,.3)":showFace?"2px solid rgba(102,126,234,.4)":"2px solid rgba(255,255,255,.08)",
                    transition:"all .15s"}}>
                  {showFace?<span style={{fontSize:size.cols>=6?22:size.cols>=5?26:32}}>{card.emoji}</span>
                  :<span style={{fontSize:size.cols>=6?16:size.cols>=5?18:22,opacity:.15}}>?</span>}
                  {floatingHearts.filter(h=>h.cardIdx===idx).map(h=>(
                    <span key={h.id} style={{position:"absolute",top:"20%",left:"50%",transform:"translateX(-50%)",fontSize:size.cols>=6?18:24,pointerEvents:"none",
                      animation:"floatHeart 1.2s ease-out forwards",zIndex:10}}>{h.emoji}</span>
                  ))}
                </div>);
            })}
          </div>
        </div>
      </div>);
  };

  // ═══ MINESWEEPER (clover field, bombs) ═══
  const Minesweeper=()=>{
    const ROWS=10,COLS=8,MINES=10;
    const[board,setBoard]=useState(null);const[revealed,setRevealed]=useState(null);const[flagged,setFlagged]=useState(null);
    const[gameOver,setGameOver]=useState(false);const[won,setWon]=useState(false);const[flagMode,setFlagMode]=useState(false);
    const[best,setBest]=useState(()=>{try{return Number(localStorage.getItem("zo_best_mines"))||0;}catch{return 0;}});
    const[startTime,setStartTime]=useState(null);const[elapsed,setElapsed]=useState(0);
    const initBoard=()=>{const b=Array(ROWS).fill(null).map(()=>Array(COLS).fill(0));let placed=0;
      while(placed<MINES){const r=Math.floor(Math.random()*ROWS),c=Math.floor(Math.random()*COLS);if(b[r][c]!==-1){b[r][c]=-1;placed++;}}
      for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){if(b[r][c]===-1)continue;let ct=0;
        for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){const nr=r+dr,nc=c+dc;if(nr>=0&&nr<ROWS&&nc>=0&&nc<COLS&&b[nr][nc]===-1)ct++;}b[r][c]=ct;}
      setBoard(b);setRevealed(Array(ROWS).fill(null).map(()=>Array(COLS).fill(false)));
      setFlagged(Array(ROWS).fill(null).map(()=>Array(COLS).fill(false)));setGameOver(false);setWon(false);setStartTime(Date.now());setElapsed(0);};
    useEffect(()=>{initBoard();},[]);
    useEffect(()=>{if(!startTime||gameOver||won)return;const iv=setInterval(()=>setElapsed(Math.floor((Date.now()-startTime)/1000)),1000);return()=>clearInterval(iv);},[startTime,gameOver,won]);
    const[firstClick,setFirstClick]=useState(true);
    const reveal=(r,c)=>{if(!board||gameOver||won||revealed[r][c]||flagged[r][c])return;
      // First click protection - if it's a bomb, move it elsewhere
      if(firstClick){setFirstClick(false);
        if(board[r][c]===-1){const b=board.map(row=>[...row]);b[r][c]=0;
          let placed=false;for(let i=0;i<ROWS&&!placed;i++)for(let j=0;j<COLS&&!placed;j++){if(b[i][j]!==-1&&!(i===r&&j===c)){b[i][j]=-1;placed=true;}}
          // Recalculate numbers
          for(let i=0;i<ROWS;i++)for(let j=0;j<COLS;j++){if(b[i][j]===-1)continue;let ct=0;
            for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){const nr=i+dr,nc=j+dc;if(nr>=0&&nr<ROWS&&nc>=0&&nc<COLS&&b[nr][nc]===-1)ct++;}b[i][j]=ct;}
          setBoard(b);
          // Now reveal from the safe cell
          const rv=revealed.map(r=>[...r]);const stack=[[r,c]];
          while(stack.length){const[cr,cc]=stack.pop();if(cr<0||cr>=ROWS||cc<0||cc>=COLS||rv[cr][cc]||flagged[cr][cc])continue;
            rv[cr][cc]=true;if(b[cr][cc]===0){for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++)stack.push([cr+dr,cc+dc]);}}
          setRevealed(rv);let unrevealed=0;for(let i=0;i<ROWS;i++)for(let j=0;j<COLS;j++)if(!rv[i][j])unrevealed++;
          if(unrevealed===MINES){setWon(true);}return;
        }
      }
      if(board[r][c]===-1){setGameOver(true);setRevealed(prev=>{const n=prev.map(r=>[...r]);for(let i=0;i<ROWS;i++)for(let j=0;j<COLS;j++)if(board[i][j]===-1)n[i][j]=true;return n;});return;}
      const rv=revealed.map(r=>[...r]);const stack=[[r,c]];
      while(stack.length){const[cr,cc]=stack.pop();if(cr<0||cr>=ROWS||cc<0||cc>=COLS||rv[cr][cc]||flagged[cr][cc])continue;
        rv[cr][cc]=true;if(board[cr][cc]===0){for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++)stack.push([cr+dr,cc+dc]);}}
      setRevealed(rv);let unrevealed=0;for(let i=0;i<ROWS;i++)for(let j=0;j<COLS;j++)if(!rv[i][j])unrevealed++;
      if(unrevealed===MINES){setWon(true);if(best===0||elapsed<best){setBest(elapsed);try{localStorage.setItem("zo_best_mines",String(elapsed));}catch{}}}};
    const toggleFlag=(r,c)=>{if(!board||gameOver||won||revealed[r][c])return;setFlagged(prev=>{const n=prev.map(r=>[...r]);n[r][c]=!n[r][c];return n;});};
    const handleCell=(r,c)=>{if(flagMode)toggleFlag(r,c);else reveal(r,c);};
    const flagCount=flagged?flagged.flat().filter(Boolean).length:0;
    const COLORS=["","#60a5fa","#43e97b","#f5576c","#a78bfa","#feca57","#22d3ee","#f093fb","#888"];
    if(!board)return null;
    return(<div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",padding:"8px 12px",overflow:"auto"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%",maxWidth:320,marginBottom:6}}>
        <span style={{fontSize:14,fontWeight:800,color:"#f5576c"}}>💣 {MINES-flagCount}</span>
        <span style={{fontSize:14,fontWeight:800,color:"#feca57"}}>⏱ {elapsed}s</span>
        <button onClick={()=>setFlagMode(!flagMode)} style={{background:flagMode?"rgba(245,87,108,.25)":"rgba(102,126,234,.15)",border:flagMode?"2px solid rgba(245,87,108,.5)":"2px solid rgba(102,126,234,.3)",borderRadius:10,padding:"6px 16px",fontSize:14,fontWeight:800,color:flagMode?"#f5576c":"#a8b4f0",cursor:"pointer"}}>{flagMode?"🚩 Flagging":"👆 Picking"}</button>
      </div>
      <div style={{textAlign:"center",fontSize:11,opacity:.3,marginBottom:6}}>{flagMode?"Tap a cell to flag/unflag it":"Tap a clover to pick · Switch to 🚩 to flag"}</div>
      {/* Grid - stays in place always */}
      <div style={{position:"relative",width:"100%",maxWidth:320}}>
        <div style={{display:"grid",gridTemplateColumns:`repeat(${COLS},1fr)`,gap:2}}>
          {board.map((row,r)=>row.map((cell,c)=>{const isRev=revealed[r][c];const isFlag=flagged[r][c];
            return(<div key={`${r}-${c}`} onClick={()=>handleCell(r,c)}
              style={{aspectRatio:"1",borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center",
                cursor:(gameOver||won)?"default":"pointer",userSelect:"none",overflow:"hidden",
                background:isRev?(cell===-1?"rgba(245,87,108,.15)":"rgba(0,0,0,.3)"):"linear-gradient(135deg,#1a3a1a,#224422)",
                border:isRev?"1px solid rgba(255,255,255,.03)":"1px solid rgba(67,233,123,.15)"}}>
              {isRev
                ?(cell===-1?<span style={{fontSize:18}}>💣</span>:cell>0?<span style={{fontSize:14,fontWeight:800,color:COLORS[cell]}}>{cell}</span>:null)
                :(isFlag?<span style={{fontSize:18}}>🚩</span>:<span style={{fontSize:20}}>🍀</span>)}
            </div>);}))}
        </div>
        {/* Game end overlay - positioned over the grid */}
        {(gameOver||won)&&<div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,.7)",borderRadius:8}}>
          <div style={{fontSize:28,fontWeight:900,color:won?"#43e97b":"#f5576c",textShadow:"0 2px 8px rgba(0,0,0,.5)"}}>{won?"🎉 You Win!":"💥 Boom!"}</div>
          {won&&<div style={{fontSize:16,color:"#feca57",fontWeight:800,marginTop:4}}>Time: {elapsed}s</div>}
          {won&&best>0&&elapsed<=best&&<div style={{fontSize:13,color:"#43e97b",fontWeight:700}}>🏆 Best!</div>}
          {won&&best>0&&elapsed>best&&<div style={{fontSize:12,opacity:.5}}>Best: {best}s</div>}
          <div style={{display:"flex",gap:8,marginTop:12}}>
            <button onClick={()=>setGameKey(k=>k+1)} style={{background:"linear-gradient(135deg,#667eea,#764ba2)",color:"#fff",border:"none",borderRadius:10,padding:"8px 18px",fontSize:14,fontWeight:700,cursor:"pointer"}}>New Game</button>
            <button onClick={()=>setGame(null)} style={{background:"rgba(255,255,255,.15)",color:"#fff",border:"none",borderRadius:10,padding:"8px 14px",fontSize:14,fontWeight:700,cursor:"pointer"}}>Exit to Menu</button>
          </div>
        </div>}
      </div>
    </div>);
  };

  // ═══ GAME MENU ═══
  if(!game)return(
    <div style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(0,0,0,.92)",display:"flex",flexDirection:"column"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{flex:1,display:"flex",flexDirection:"column",maxWidth:420,width:"100%",margin:"0 auto",overflow:"hidden"}}>
        <div style={{padding:"12px 16px 6px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{fontSize:18,fontWeight:900,background:"linear-gradient(135deg,#f093fb,#f5576c,#feca57)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>🎮 Mini Games</div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,.08)",border:"none",borderRadius:8,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#fff",fontSize:16}}>✕</button>
        </div>
        {bonus>0&&<div style={{padding:"0 16px 8px",fontSize:13,color:"#43e97b",opacity:.7}}>🎯 {bonus} bonus {bonus===1?"life":"lives"} from today's goals!</div>}
        <div style={{flex:1,padding:"0 16px 16px",overflowY:"auto"}}>
          {[
            {id:"bubbles",icon:"🥦",name:"Veggie Garden",desc:"Harvest veggies fast! Avoid mushrooms & poison.",color:"#43e97b",best:"zo_best_bubbles"},
            {id:"breakout",icon:"🍎",name:"Fruit Blocks",desc:"Smash fruits, dodge ice blocks!",color:"#f5576c",best:"zo_best_breakout"},
            {id:"rhythm",icon:"💕",name:"Memory Matchmaker",desc:"Flip cards and pair up the animals!",color:"#feca57",best:"zo_best_memory",bestLabel:" moves"},
            {id:"mines",icon:"🍀",name:"Lucky Clovers",desc:"Pick clovers without finding a bomb!",color:"#43e97b",best:"zo_best_mines",bestLabel:"s"},
          ].map(g=>{
            const b=(()=>{try{return Number(localStorage.getItem(g.best))||0;}catch{return 0;}})();
            return(<div key={g.id} onClick={()=>setGame(g.id)}
              style={{background:`${g.color}10`,border:`1px solid ${g.color}25`,borderRadius:16,padding:"16px",marginBottom:8,cursor:"pointer",display:"flex",alignItems:"center",gap:14}}>
              <div style={{fontSize:36}}>{g.icon}</div>
              <div style={{flex:1}}><div style={{fontSize:16,fontWeight:800,color:"#e8e0f0"}}>{g.name}</div>
                <div style={{fontSize:13,opacity:.5,marginTop:2}}>{g.desc}</div>
                {b>0&&<div style={{fontSize:12,color:g.color,fontWeight:700,marginTop:3}}>🏆 Best: {b}{g.bestLabel||""}</div>}</div>
              <span style={{fontSize:18,opacity:.3}}>▶</span></div>);})}
        </div></div></div>);

  // ═══ GAME WRAPPER ═══
  return(
    <div style={{position:"fixed",inset:0,zIndex:1000,background:"#0a0a1a",display:"flex",flexDirection:"column"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 16px",flexShrink:0}}>
        <button onClick={()=>setGame(null)} style={{background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.1)",borderRadius:8,padding:"5px 12px",color:"#ccc",fontSize:13,cursor:"pointer",fontWeight:700}}>← Exit to Menu</button>
        <div style={{fontSize:15,fontWeight:800,color:"#e8e0f0"}}>{({bubbles:"🥦 Veggie Garden",breakout:"🍎 Fruit Blocks",rhythm:"💕 Memory Matchmaker",mines:"🍀 Lucky Clovers"})[game]||""}</div>
        <button onClick={onClose} style={{background:"rgba(255,255,255,.08)",border:"none",borderRadius:8,width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#fff",fontSize:13}}>✕</button>
      </div>
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {game==="bubbles"&&<BubblePop key={gameKey}/>}{game==="breakout"&&<Breakout key={gameKey}/>}{game==="rhythm"&&<MemoryMatch key={gameKey}/>}{game==="mines"&&<Minesweeper key={gameKey}/>}
      </div></div>);
};
const DAILY_GREETINGS=[
  "Zobuddy ain't worried about you. You got this. 💪",
  "You woke up today. That's already winning. 🏆",
  "Zobuddy believes in you more than you believe in WiFi. 📶",
  "Today's vibe: unstoppable (with snack breaks). 🍪",
  "Plot twist: you're the main character. 🎬",
  "Zobuddy checked — today's a good day to be alive. ✨",
  "You didn't come this far to only come this far. 🚀",
  "Zobuddy's not saying you're a legend, but... yeah, you're a legend. 👑",
  "Small steps still move you forward. Even tiny ones. Like ant-sized. 🐜",
  "The only bad day is one where you didn't try. So... try! 🌟",
  "Fun fact: Zobuddy has never seen anyone cooler than you. Ever. 😎",
  "Be the energy you want to attract. Or just drink coffee. ☕",
  "Zobuddy would never ghost you. Unlike some people. 👻",
  "You're doing better than you think. Seriously. 💛",
  "Your future self is high-fiving you right now. 🙌",
  "Remember: even diamonds started as coal under pressure. 💎",
  "Zobuddy looked it up — you're officially awesome today. 📋",
  "The comeback is always stronger than the setback. 🔥",
  "Breathe in confidence. Breathe out doubt. Repeat. 🌬️",
  "Zobuddy's forecast: 100% chance of you being great. ☀️",
  "Every expert was once a beginner. Even Zobuddy. 🐣",
  "You're not behind. You're on your own timeline. ⏰",
  "Zobuddy knows a secret: consistency beats perfection. 🎯",
  "Hey, you showed up. That's like 90% of the battle. 🛡️",
  "Drink water. Be kind. Crush it. In that order. 💧",
  "Zobuddy has zero doubts about you. Zero. Literally none. 0️⃣",
  "Today's the day yesterday's you was hoping for. 🌅",
  "You're one good habit away from a glow-up. ✨",
  "Zobuddy thinks you should smile more. Not for anyone else — just because. 😊",
  "Reminder: you survived 100% of your worst days. You're undefeated. 🏅",
];
const getDailyGreeting=()=>{const d=getToday();let h=0;for(let i=0;i<d.length;i++)h=((h<<5)-h)+d.charCodeAt(i)+1;return DAILY_GREETINGS[Math.abs(h)%DAILY_GREETINGS.length];};

const BUDDY_NAMES_1=["Captain","Sir","Lady","Professor","Baron","Duke","Agent","Chef","Dr.","King","Lord","Princess","Tiny","Mega","Ultra","Lil","Big","Baby","Old","Cosmic","Shadow","Lucky"];
const BUDDY_NAMES_2=["Floof","Noodle","Biscuit","Muffin","Pickle","Nugget","Waffle","Sprout","Beans","Taco","Pepper","Cookie","Dumpling","Pancake","Churro","Truffle","Pretzel","Nacho","Tofu","Mochi","Ramen","S'more"];
const genName=()=>BUDDY_NAMES_1[Math.floor(Math.random()*BUDDY_NAMES_1.length)]+" "+BUDDY_NAMES_2[Math.floor(Math.random()*BUDDY_NAMES_2.length)];

// ─── LEARN PANEL ─────────────────────────────────────────────────

// Daily seed for rotating content
const dailySeed=(offset=0)=>{const d=getToday();let h=offset;for(let i=0;i<d.length;i++)h=((h<<5)-h)+d.charCodeAt(i);return Math.abs(h);};
const pick=(arr,offset=0)=>arr[dailySeed(offset)%arr.length];

// ── CURATED CONTENT ──
const BRAIN_TEASERS=[
  {q:"I have cities but no houses, forests but no trees, and water but no fish. What am I?",a:"A map"},
  {q:"What has keys but no locks, space but no room, and you can enter but can't go inside?",a:"A keyboard"},
  {q:"The more you take, the more you leave behind. What am I?",a:"Footsteps"},
  {q:"I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?",a:"An echo"},
  {q:"What can travel around the world while staying in a corner?",a:"A stamp"},
  {q:"I have hands but can't clap. What am I?",a:"A clock"},
  {q:"What gets wetter the more it dries?",a:"A towel"},
  {q:"What has a head and a tail but no body?",a:"A coin"},
  {q:"What can you break without touching it?",a:"A promise"},
  {q:"What goes up but never comes down?",a:"Your age"},
  {q:"I'm tall when I'm young and short when I'm old. What am I?",a:"A candle"},
  {q:"What has many teeth but can't bite?",a:"A comb"},
  {q:"What month of the year has 28 days?",a:"All of them"},
  {q:"What is full of holes but still holds water?",a:"A sponge"},
  {q:"What question can you never answer yes to?",a:"Are you asleep yet?"},
  {q:"If you have me, you want to share me. If you share me, you haven't got me. What am I?",a:"A secret"},
  {q:"What has one eye but can't see?",a:"A needle"},
  {q:"What can fill a room but takes up no space?",a:"Light"},
  {q:"What has legs but doesn't walk?",a:"A table"},
  {q:"What invention lets you look right through a wall?",a:"A window"},
  {q:"What can you catch but not throw?",a:"A cold"},
  {q:"What is always in front of you but can't be seen?",a:"The future"},
  {q:"What has words but never speaks?",a:"A book"},
  {q:"What runs but never walks?",a:"Water"},
  {q:"What has a neck but no head?",a:"A bottle"},
  {q:"I follow you everywhere but can't be caught. What am I?",a:"Your shadow"},
  {q:"What comes once in a minute, twice in a moment, but never in a thousand years?",a:"The letter M"},
  {q:"What has ears but cannot hear?",a:"A cornfield"},
  {q:"What building has the most stories?",a:"A library"},
  {q:"What tastes better than it smells?",a:"Your tongue"},
];

const FIN_TIPS=[
  {tip:"Pay yourself first — automate savings before spending.",icon:"🏦"},
  {tip:"The 50/30/20 rule: 50% needs, 30% wants, 20% savings.",icon:"📊"},
  {tip:"An emergency fund should cover 3-6 months of expenses.",icon:"🛟"},
  {tip:"Compound interest is the 8th wonder of the world. Start investing early.",icon:"📈"},
  {tip:"Track every dollar for one month. You'll be shocked where it goes.",icon:"🔍"},
  {tip:"High-interest debt first: pay off credit cards before investing.",icon:"🎯"},
  {tip:"Don't invest money you'll need within 5 years.",icon:"⏳"},
  {tip:"Your largest expense is usually housing. Keep it under 30% of income.",icon:"🏠"},
  {tip:"Index funds beat 90% of actively managed funds over 20 years.",icon:"💹"},
  {tip:"Lifestyle inflation is the silent wealth killer. Live below your means.",icon:"⚖️"},
  {tip:"Always negotiate your salary. The worst they can say is no.",icon:"🤝"},
  {tip:"A budget isn't a restriction — it's a plan for your money.",icon:"📋"},
  {tip:"Avoid buying new cars. They lose 20% value in year one.",icon:"🚗"},
  {tip:"Credit score matters: pay bills on time, keep utilization under 30%.",icon:"💳"},
  {tip:"Multiple income streams = financial security. Start a side project.",icon:"🌊"},
  {tip:"The best time to start investing was yesterday. The second best is today.",icon:"🌱"},
  {tip:"Insurance isn't optional: health, auto, renter's/homeowner's at minimum.",icon:"🛡️"},
  {tip:"Retirement accounts (401k, IRA) are free tax advantages. Max them out.",icon:"🎁"},
  {tip:"Subscriptions add up. Audit them quarterly and cut what you don't use.",icon:"✂️"},
  {tip:"Net worth = assets minus liabilities. Track it monthly.",icon:"📐"},
  {tip:"Don't compare your finances to others. Everyone's path is different.",icon:"🛤️"},
  {tip:"Before a big purchase, wait 48 hours. If you still want it, buy it.",icon:"⏰"},
  {tip:"Learning one new money skill per month compounds like interest.",icon:"📚"},
  {tip:"Generosity and wealth aren't opposites. Give while you grow.",icon:"💝"},
  {tip:"Tax-loss harvesting: sell losing investments to offset gains legally.",icon:"📑"},
  {tip:"Dollar-cost averaging: invest the same amount regularly regardless of price.",icon:"📆"},
  {tip:"Your health is your biggest asset. Medical bills are the #1 cause of bankruptcy.",icon:"❤️"},
  {tip:"Learn the difference between assets (make money) and liabilities (cost money).",icon:"⚡"},
  {tip:"Financial literacy isn't taught in school. Teach yourself — and teach others.",icon:"🎓"},
  {tip:"Every financial guru has a different strategy. Find what works for YOUR life.",icon:"🧭"},
];

const MINDFULNESS=[
  {practice:"4-7-8 Breathing: Inhale 4 sec, hold 7 sec, exhale 8 sec. Repeat 3x.",icon:"🌬️",type:"Breathing"},
  {practice:"Write down 3 things you're grateful for right now.",icon:"📝",type:"Gratitude"},
  {practice:"Body scan: Close eyes, notice tension from toes to head. Just observe, don't fix.",icon:"🧘",type:"Body Scan"},
  {practice:"Name 5 things you see, 4 you hear, 3 you touch, 2 you smell, 1 you taste.",icon:"🌿",type:"Grounding"},
  {practice:"Set a 2-minute timer. Focus only on your breath. When your mind wanders, gently return.",icon:"⏱️",type:"Meditation"},
  {practice:"Write a letter to your future self. What do you hope for them?",icon:"✉️",type:"Journaling"},
  {practice:"Take a slow walk and notice 3 beautiful things you'd normally miss.",icon:"🚶",type:"Mindful Walk"},
  {practice:"Put your phone down for 30 minutes. Notice how it feels.",icon:"📱",type:"Digital Detox"},
  {practice:"Stretch for 5 minutes. Focus on how each stretch feels, not how far you go.",icon:"🤸",type:"Movement"},
  {practice:"Before bed, mentally replay 3 good moments from today.",icon:"🌙",type:"Reflection"},
  {practice:"Box breathing: Inhale 4 sec, hold 4 sec, exhale 4 sec, hold 4 sec. Repeat 4x.",icon:"🗃️",type:"Breathing"},
  {practice:"Think of someone who helped you recently. Send them a thank-you message.",icon:"💌",type:"Connection"},
  {practice:"Close your eyes and listen to the farthest sound you can hear for 1 minute.",icon:"👂",type:"Awareness"},
  {practice:"Eat your next meal slowly. Notice every texture and flavor.",icon:"🍽️",type:"Mindful Eating"},
  {practice:"Write down one worry. Ask: Can I control this? If yes, plan. If no, release.",icon:"🎈",type:"Journaling"},
  {practice:"Hug someone for 20 seconds. It releases oxytocin and reduces stress.",icon:"🤗",type:"Connection"},
  {practice:"Look at the sky for 60 seconds. Just look. Nothing else.",icon:"🌤️",type:"Presence"},
  {practice:"Progressive relaxation: Tense each muscle group for 5 sec, then release.",icon:"💆",type:"Relaxation"},
  {practice:"Set an intention for tomorrow in one sentence.",icon:"🎯",type:"Intention"},
  {practice:"Smile at 3 strangers today. Notice how it changes your energy.",icon:"😊",type:"Kindness"},
  {practice:"Place hand on heart. Feel it beat. Whisper: I am here. I am enough.",icon:"❤️",type:"Self-compassion"},
  {practice:"Drink a full glass of water mindfully. Feel the temperature, the swallowing.",icon:"💧",type:"Mindful Moment"},
  {practice:"Forgiveness exercise: Think of one grudge. Imagine setting it down gently.",icon:"🕊️",type:"Release"},
  {practice:"Stand tall, arms wide for 2 minutes. Power poses reduce cortisol by 25%.",icon:"🦸",type:"Embodiment"},
  {practice:"Write 'I am...' and list 5 positive truths about yourself.",icon:"✨",type:"Affirmation"},
  {practice:"Take 3 deep breaths before responding to anything stressful today.",icon:"🫁",type:"Pause"},
  {practice:"Notice one thing you usually autopilot through. Do it with full attention.",icon:"👁️",type:"Awareness"},
  {practice:"Before sleep: inhale peace, exhale tension. 10 slow breaths.",icon:"😴",type:"Sleep"},
  {practice:"Call or text someone you haven't talked to in a while. Just to say hi.",icon:"📞",type:"Connection"},
  {practice:"Sit quietly for 1 minute doing absolutely nothing. Not even thinking on purpose.",icon:"🪷",type:"Stillness"},
];

const BOOKS=[
  {title:"Atomic Habits",author:"James Clear",why:"Tiny changes → remarkable results",cat:"Habits"},
  {title:"Thinking, Fast and Slow",author:"Daniel Kahneman",why:"How your brain actually makes decisions",cat:"Psychology"},
  {title:"The Psychology of Money",author:"Morgan Housel",why:"Wealth is what you don't see",cat:"Finance"},
  {title:"Sapiens",author:"Yuval Noah Harari",why:"The full story of humanity in one book",cat:"History"},
  {title:"Deep Work",author:"Cal Newport",why:"Focus is the new superpower",cat:"Productivity"},
  {title:"Man's Search for Meaning",author:"Viktor Frankl",why:"Finding purpose in the darkest times",cat:"Philosophy"},
  {title:"The Subtle Art of Not Giving a F*ck",author:"Mark Manson",why:"Choose your struggles wisely",cat:"Self-help"},
  {title:"Educated",author:"Tara Westover",why:"The power of learning against all odds",cat:"Memoir"},
  {title:"Range",author:"David Epstein",why:"Why generalists triumph in a specialized world",cat:"Learning"},
  {title:"The 7 Habits of Highly Effective People",author:"Stephen Covey",why:"Timeless principles for personal growth",cat:"Leadership"},
  {title:"Meditations",author:"Marcus Aurelius",why:"2000-year-old wisdom that still hits hard",cat:"Philosophy"},
  {title:"The Alchemist",author:"Paulo Coelho",why:"Follow your personal legend",cat:"Fiction"},
  {title:"Ikigai",author:"Héctor García",why:"The Japanese secret to a long, happy life",cat:"Wellness"},
  {title:"Never Split the Difference",author:"Chris Voss",why:"FBI negotiation tactics for everyday life",cat:"Communication"},
  {title:"Why We Sleep",author:"Matthew Walker",why:"Sleep is the most underrated health tool",cat:"Science"},
  {title:"The Power of Now",author:"Eckhart Tolle",why:"Stop living in your head",cat:"Mindfulness"},
  {title:"Outliers",author:"Malcolm Gladwell",why:"Success isn't just talent — it's timing and practice",cat:"Psychology"},
  {title:"Dune",author:"Frank Herbert",why:"Sci-fi masterpiece about power, ecology, and destiny",cat:"Fiction"},
  {title:"Rich Dad Poor Dad",author:"Robert Kiyosaki",why:"Assets vs liabilities — the basics of wealth",cat:"Finance"},
  {title:"The Body Keeps the Score",author:"Bessel van der Kolk",why:"How trauma shapes us and how to heal",cat:"Health"},
  {title:"Shoe Dog",author:"Phil Knight",why:"Nike's wild origin story",cat:"Memoir"},
  {title:"Digital Minimalism",author:"Cal Newport",why:"Reclaim your attention from your phone",cat:"Tech"},
  {title:"Influence",author:"Robert Cialdini",why:"The psychology of persuasion",cat:"Psychology"},
  {title:"The Richest Man in Babylon",author:"George S. Clason",why:"Ancient money wisdom told as stories",cat:"Finance"},
  {title:"Breath",author:"James Nestor",why:"You're probably breathing wrong. Seriously.",cat:"Health"},
  {title:"Start with Why",author:"Simon Sinek",why:"Great leaders inspire action, not just compliance",cat:"Leadership"},
  {title:"The War of Art",author:"Steven Pressfield",why:"Beating procrastination and doing creative work",cat:"Creativity"},
  {title:"Quiet",author:"Susan Cain",why:"Introverts have superpowers too",cat:"Psychology"},
  {title:"Four Thousand Weeks",author:"Oliver Burkeman",why:"Time management for mortals",cat:"Philosophy"},
  {title:"Born a Crime",author:"Trevor Noah",why:"Hilarious, heartbreaking memoir of growing up in apartheid",cat:"Memoir"},
];

const COURSES=[
  {name:"CS50: Intro to Computer Science",source:"Harvard / edX",url:"https://cs50.harvard.edu/x/",cat:"Tech",icon:"💻"},
  {name:"Learning How to Learn",source:"Coursera",url:"https://www.coursera.org/learn/learning-how-to-learn",cat:"Meta",icon:"🧠"},
  {name:"The Science of Well-Being",source:"Yale / Coursera",url:"https://www.coursera.org/learn/the-science-of-well-being",cat:"Health",icon:"😊"},
  {name:"Khan Academy — Personal Finance",source:"Khan Academy",url:"https://www.khanacademy.org/college-careers-more/personal-finance",cat:"Finance",icon:"💰"},
  {name:"MIT OpenCourseWare — Math",source:"MIT",url:"https://ocw.mit.edu/courses/mathematics/",cat:"Math",icon:"📐"},
  {name:"Introduction to Psychology",source:"Yale / Coursera",url:"https://www.coursera.org/learn/introduction-psychology",cat:"Science",icon:"🔬"},
  {name:"Khan Academy — World History",source:"Khan Academy",url:"https://www.khanacademy.org/humanities/world-history",cat:"History",icon:"🌍"},
  {name:"Google Data Analytics Certificate",source:"Google / Coursera",url:"https://www.coursera.org/professional-certificates/google-data-analytics",cat:"Tech",icon:"📊"},
  {name:"Nutrition and Health",source:"Wageningen / edX",url:"https://www.edx.org/learn/nutrition",cat:"Health",icon:"🥗"},
  {name:"Financial Markets",source:"Yale / Coursera",url:"https://www.coursera.org/learn/financial-markets-global",cat:"Finance",icon:"📈"},
  {name:"Philosophy & Critical Thinking",source:"Duke / Coursera",url:"https://www.coursera.org/learn/understanding-arguments",cat:"Mind",icon:"🤔"},
  {name:"Creative Writing Specialization",source:"Wesleyan / Coursera",url:"https://www.coursera.org/specializations/creative-writing",cat:"Creative",icon:"✍️"},
];

const TED_TALKS=[
  {title:"The power of vulnerability",speaker:"Brené Brown",url:"https://www.ted.com/talks/brene_brown_the_power_of_vulnerability",cat:"Growth"},
  {title:"How great leaders inspire action",speaker:"Simon Sinek",url:"https://www.ted.com/talks/simon_sinek_how_great_leaders_inspire_action",cat:"Leadership"},
  {title:"Your body language may shape who you are",speaker:"Amy Cuddy",url:"https://www.ted.com/talks/amy_cuddy_your_body_language_may_shape_who_you_are",cat:"Psychology"},
  {title:"Do schools kill creativity?",speaker:"Ken Robinson",url:"https://www.ted.com/talks/sir_ken_robinson_do_schools_kill_creativity",cat:"Education"},
  {title:"The puzzle of motivation",speaker:"Dan Pink",url:"https://www.ted.com/talks/dan_pink_the_puzzle_of_motivation",cat:"Work"},
  {title:"The happy secret to better work",speaker:"Shawn Achor",url:"https://www.ted.com/talks/shawn_achor_the_happy_secret_to_better_work",cat:"Happiness"},
  {title:"Grit: the power of passion and perseverance",speaker:"Angela Lee Duckworth",url:"https://www.ted.com/talks/angela_lee_duckworth_grit_the_power_of_passion_and_perseverance",cat:"Growth"},
  {title:"The art of asking",speaker:"Amanda Palmer",url:"https://www.ted.com/talks/amanda_palmer_the_art_of_asking",cat:"Connection"},
  {title:"How to speak so that people want to listen",speaker:"Julian Treasure",url:"https://www.ted.com/talks/julian_treasure_how_to_speak_so_that_people_want_to_listen",cat:"Communication"},
  {title:"The power of introverts",speaker:"Susan Cain",url:"https://www.ted.com/talks/susan_cain_the_power_of_introverts",cat:"Psychology"},
  {title:"What makes a good life?",speaker:"Robert Waldinger",url:"https://www.ted.com/talks/robert_waldinger_what_makes_a_good_life_lessons_from_the_longest_study_on_happiness",cat:"Happiness"},
  {title:"How to make stress your friend",speaker:"Kelly McGonigal",url:"https://www.ted.com/talks/kelly_mcgonigal_how_to_make_stress_your_friend",cat:"Health"},
  {title:"Inside the mind of a master procrastinator",speaker:"Tim Urban",url:"https://www.ted.com/talks/tim_urban_inside_the_mind_of_a_master_procrastinator",cat:"Productivity"},
  {title:"Try something new for 30 days",speaker:"Matt Cutts",url:"https://www.ted.com/talks/matt_cutts_try_something_new_for_30_days",cat:"Habits"},
  {title:"The skill of self-confidence",speaker:"Ivan Joseph",url:"https://www.youtube.com/watch?v=w-HYZv6HzAs",cat:"Growth"},
  {title:"Sleep is your superpower",speaker:"Matt Walker",url:"https://www.ted.com/talks/matt_walker_sleep_is_your_superpower",cat:"Health"},
  {title:"How to stop screwing yourself over",speaker:"Mel Robbins",url:"https://www.youtube.com/watch?v=Lp7E973zozc",cat:"Motivation"},
  {title:"The danger of a single story",speaker:"Chimamanda Adichie",url:"https://www.ted.com/talks/chimamanda_ngozi_adichie_the_danger_of_a_single_story",cat:"Perspective"},
  {title:"Your elusive creative genius",speaker:"Elizabeth Gilbert",url:"https://www.ted.com/talks/elizabeth_gilbert_your_elusive_creative_genius",cat:"Creativity"},
  {title:"10 ways to have a better conversation",speaker:"Celeste Headlee",url:"https://www.ted.com/talks/celeste_headlee_10_ways_to_have_a_better_conversation",cat:"Communication"},
];

const FUN_FACTS=[
  "Honey never spoils. Archaeologists found 3,000-year-old honey in Egyptian tombs — still edible.",
  "Octopuses have three hearts and blue blood.",
  "A group of flamingos is called a 'flamboyance.'",
  "Bananas are berries, but strawberries aren't.",
  "The shortest war in history lasted 38 minutes (Britain vs Zanzibar, 1896).",
  "Your brain uses 20% of your body's oxygen and calories despite being only 2% of your weight.",
  "There are more possible games of chess than atoms in the observable universe.",
  "Cows have best friends and get stressed when separated.",
  "The inventor of the Pringles can is buried in one.",
  "A day on Venus is longer than a year on Venus.",
  "Sea otters hold hands while sleeping so they don't drift apart.",
  "The total weight of all ants on Earth roughly equals the total weight of all humans.",
  "Humans share 60% of their DNA with bananas.",
  "The world's oldest known joke is a fart joke from 1900 BC Sumeria.",
  "Trees can communicate and share nutrients through underground fungal networks.",
  "Cleopatra lived closer in time to the Moon landing than to the building of the Great Pyramids.",
  "Wombat poop is cube-shaped.",
  "Your body produces about 25 million new cells per second.",
  "The heart of a blue whale is so big that a small child could swim through its arteries.",
  "Butterflies taste with their feet.",
  "There's a species of jellyfish that is biologically immortal.",
  "More people have been to the Moon than have scored 50+ goals in a Premier League season.",
  "The average cloud weighs about 1.1 million pounds.",
  "Sharks are older than trees. Sharks: ~450M years. Trees: ~350M years.",
  "A single bolt of lightning contains enough energy to toast 100,000 slices of bread.",
  "Dolphins have names for each other and respond when called.",
  "Scotland's national animal is the unicorn.",
  "The longest hiccuping spree lasted 68 years.",
  "There are more stars in the universe than grains of sand on all of Earth's beaches.",
  "Your nose can detect over 1 trillion different scents.",
];

const DAILY_QUOTES=[
  {q:"The only way to do great work is to love what you do.",a:"Steve Jobs"},
  {q:"In the middle of difficulty lies opportunity.",a:"Albert Einstein"},
  {q:"It does not matter how slowly you go as long as you do not stop.",a:"Confucius"},
  {q:"What you get by achieving your goals is not as important as what you become.",a:"Zig Ziglar"},
  {q:"The best time to plant a tree was 20 years ago. The second best time is now.",a:"Chinese Proverb"},
  {q:"Your limitation — it's only your imagination.",a:"Unknown"},
  {q:"The mind is everything. What you think you become.",a:"Buddha"},
  {q:"Strive not to be a success, but rather to be of value.",a:"Albert Einstein"},
  {q:"The way to get started is to quit talking and begin doing.",a:"Walt Disney"},
  {q:"Don't watch the clock; do what it does. Keep going.",a:"Sam Levenson"},
  {q:"Everything you've ever wanted is on the other side of fear.",a:"George Addair"},
  {q:"Believe you can and you're halfway there.",a:"Theodore Roosevelt"},
  {q:"The future belongs to those who believe in the beauty of their dreams.",a:"Eleanor Roosevelt"},
  {q:"Act as if what you do makes a difference. It does.",a:"William James"},
  {q:"Success is not final, failure is not fatal: it is the courage to continue that counts.",a:"Winston Churchill"},
  {q:"Happiness is not something ready-made. It comes from your own actions.",a:"Dalai Lama"},
  {q:"We suffer more often in imagination than in reality.",a:"Seneca"},
  {q:"Be yourself; everyone else is already taken.",a:"Oscar Wilde"},
  {q:"You are never too old to set another goal or to dream a new dream.",a:"C.S. Lewis"},
  {q:"The only impossible journey is the one you never begin.",a:"Tony Robbins"},
  {q:"What lies behind us and what lies before us are tiny matters compared to what lies within us.",a:"Ralph Waldo Emerson"},
  {q:"I have not failed. I've just found 10,000 ways that won't work.",a:"Thomas Edison"},
  {q:"The greatest glory in living lies not in never falling, but in rising every time we fall.",a:"Nelson Mandela"},
  {q:"Life is what happens when you're busy making other plans.",a:"John Lennon"},
  {q:"You miss 100% of the shots you don't take.",a:"Wayne Gretzky"},
  {q:"Whether you think you can or you think you can't, you're right.",a:"Henry Ford"},
  {q:"The purpose of life is not to be happy. It is to be useful.",a:"Ralph Waldo Emerson"},
  {q:"Do what you can, with what you have, where you are.",a:"Theodore Roosevelt"},
  {q:"It always seems impossible until it's done.",a:"Nelson Mandela"},
  {q:"The secret of getting ahead is getting started.",a:"Mark Twain"},
];

const DAILY_WORDS=[
  {word:"Sonder",def:"The realization that each passerby has a life as vivid and complex as your own."},
  {word:"Eudaimonia",def:"A Greek concept of human flourishing — living well and doing well."},
  {word:"Kaizen",def:"Japanese philosophy of continuous small improvements over time."},
  {word:"Ikigai",def:"A Japanese reason for being — the intersection of passion, mission, vocation, and profession."},
  {word:"Resilience",def:"The capacity to recover quickly from difficulties; mental toughness."},
  {word:"Serendipity",def:"The occurrence of events by chance in a happy or beneficial way."},
  {word:"Equanimity",def:"Mental calmness and composure, especially in difficult situations."},
  {word:"Ephemeral",def:"Lasting for a very short time — a reminder to appreciate the moment."},
  {word:"Perspicacity",def:"The quality of having keen mental perception and understanding; shrewdness."},
  {word:"Kintsukuroi",def:"The Japanese art of repairing broken pottery with gold — beauty in imperfection."},
  {word:"Ubuntu",def:"South African philosophy: 'I am because we are.' Humanity toward others."},
  {word:"Meraki",def:"Greek: doing something with soul, creativity, and love — putting yourself into your work."},
  {word:"Hygge",def:"Danish concept of cozy contentment and well-being through simple pleasures."},
  {word:"Autodidact",def:"A self-taught person who learns without formal education."},
  {word:"Petrichor",def:"The pleasant earthy smell after rain falls on dry ground."},
  {word:"Sisu",def:"Finnish concept of extraordinary determination and courage in the face of adversity."},
  {word:"Wabi-sabi",def:"Japanese aesthetic of finding beauty in imperfection and transience."},
  {word:"Komorebi",def:"Japanese: sunlight filtering through the leaves of trees."},
  {word:"Grit",def:"Passion and perseverance for long-term goals — sustained effort over time."},
  {word:"Zeitgeist",def:"The defining spirit or mood of a particular period of history."},
  {word:"Eloquence",def:"Fluent or persuasive speaking or writing — the art of powerful expression."},
  {word:"Metamorphosis",def:"A complete transformation in form, structure, or character."},
  {word:"Wanderlust",def:"A strong desire to travel and explore the world."},
  {word:"Luminous",def:"Full of or shedding light; bright or shining, especially in the dark."},
  {word:"Crescendo",def:"A gradual increase in intensity — building toward a peak moment."},
  {word:"Reverie",def:"A state of being pleasantly lost in one's thoughts; a daydream."},
  {word:"Catalyst",def:"A person or thing that precipitates an event or change."},
  {word:"Sagacity",def:"The quality of being wise; having good judgment and keen discernment."},
  {word:"Effervescent",def:"Vivacious and enthusiastic — bubbly in personality or spirit."},
  {word:"Halcyon",def:"Denoting a period of time that was idyllically happy and peaceful."},
];

// ─── NOTEBOOK PANEL (standalone tab) ──────────────────────────────────────
const NotebookPanel=()=>{
  const NB_KEY="zodibuddy_notebook_v1";
  const readNb=()=>{try{return JSON.parse(localStorage.getItem(NB_KEY))||{pages:[],archive:[],pwHash:null};}catch{return{pages:[],archive:[],pwHash:null};}};
  const writeNb=(d)=>{try{localStorage.setItem(NB_KEY,JSON.stringify(d));}catch{}};

  const[nbData,setNbData]=useState(readNb);
  const[nbUnlocked,setNbUnlocked]=useState(false);
  const[nbPwInput,setNbPwInput]=useState("");
  const[nbView,setNbView]=useState("toc");
  const[nbPageIdx,setNbPageIdx]=useState(0);
  const[nbNewTitle,setNbNewTitle]=useState("");
  const[nbNewType,setNbNewType]=useState("lined");
  const[nbPixelSize,setNbPixelSize]=useState("32x32");
  const[nbSetPw,setNbSetPw]=useState("");
  const[nbSetPw2,setNbSetPw2]=useState("");
  const[pageZoom,setPageZoom]=useState(1);
  const[pageDrawMode,setPageDrawMode]=useState(false);
  const[drawColor,setDrawColor]=useState("#fff");
  const[drawSize,setDrawSize]=useState(3);
  const[drawEraser,setDrawEraser]=useState(false);
  const[pixelColor,setPixelColor]=useState("#f5576c");
  const[saved,setSaved]=useState(false);
  const[renaming,setRenaming]=useState(false);
  const[renameVal,setRenameVal]=useState("");
  const startRename=()=>{const d=readNb();const page=d.pages?.[pageIdxRef.current];setRenameVal(page?.title||"");setRenaming(true);};
  const doRename=()=>{if(!renameVal.trim())return;save("title",renameVal.trim());setRenaming(false);syncState();};

  const drawCanvasRef=React.useRef(null);
  const isDrawingRef=React.useRef(false);
  const saveTimerRef=React.useRef(null);
  const drawImgRef=React.useRef(null);
  const colorRef=React.useRef(drawColor);colorRef.current=drawColor;
  const sizeRef=React.useRef(drawSize);sizeRef.current=drawSize;
  const eraserRef=React.useRef(drawEraser);eraserRef.current=drawEraser;
  const textareaRef=React.useRef(null);
  const textRef=React.useRef(""); // current text content
  const pageIdxRef=React.useRef(0);
  const undoRef=React.useRef([]);
  const redoRef=React.useRef([]);

  const simpleHash=(s)=>{let h=0;for(let i=0;i<s.length;i++){h=((h<<5)-h)+s.charCodeAt(i);h|=0;}return h.toString(36);};

  // ─── SINGLE SAVE FUNCTION ──────────────────────────────────────
  // All saves go through here. Reads current localStorage, patches it, writes back.
  const save=(field,value)=>{
    const pi=pageIdxRef.current;
    const d=readNb();
    if(!d.pages||!d.pages[pi])return;
    d.pages[pi][field]=value;
    writeNb(d);
  };
  const saveText=()=>{
    const el=textareaRef.current;
    if(el)textRef.current=el.value;
    save("content",textRef.current||"");
  };
  const saveCanvas=()=>{
    const c=drawCanvasRef.current;if(!c)return;
    try{const url=c.toDataURL("image/png");drawImgRef.current=url;save("drawData",url);}catch{}
  };
  const saveAll=()=>{saveText();saveCanvas();};
  const doSave=()=>{saveAll();setSaved(true);setTimeout(()=>setSaved(false),1500);};
  const syncState=()=>setNbData(readNb());

  // Full save: saves to localStorage and syncs React state
  const saveNb=(d)=>{writeNb(d);setNbData(d);};

  // ─── DRAW CANVAS ────────────────────────────────────────────────
  const getDrawData=()=>{
    const d=readNb();return d.pages?.[pageIdxRef.current]?.drawData||null;
  };
  const loadCanvas=()=>{const c=drawCanvasRef.current;if(!c)return;const ctx=c.getContext("2d");
    ctx.clearRect(0,0,c.width,c.height);drawImgRef.current=null;
    const d=readNb();const src=d.pages?.[pageIdxRef.current]?.drawData||null;
    if(src){drawImgRef.current=src;const img=new Image();img.onload=()=>ctx.drawImage(img,0,0);img.src=src;}};
  const onDown=React.useCallback((e)=>{e.preventDefault();const c=drawCanvasRef.current;if(!c)return;const ctx=c.getContext("2d");
    const r=c.getBoundingClientRect(),sx=c.width/r.width,sy=c.height/r.height;const t=e.touches?e.touches[0]:e;
    const x=(t.clientX-r.left)*sx,y=(t.clientY-r.top)*sy;
    if(eraserRef.current){ctx.globalCompositeOperation="destination-out";ctx.lineWidth=20;}
    else{ctx.globalCompositeOperation="source-over";ctx.strokeStyle=colorRef.current;ctx.fillStyle=colorRef.current;ctx.lineWidth=sizeRef.current;}
    ctx.lineCap="round";ctx.lineJoin="round";
    // Draw a dot at tap point
    ctx.beginPath();ctx.arc(x,y,eraserRef.current?10:sizeRef.current/2,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.moveTo(x,y);
    isDrawingRef.current=true;},[]);
  const onMove=React.useCallback((e)=>{if(!isDrawingRef.current)return;e.preventDefault();const c=drawCanvasRef.current;if(!c)return;const ctx=c.getContext("2d");
    const r=c.getBoundingClientRect(),sx=c.width/r.width,sy=c.height/r.height;const t=e.touches?e.touches[0]:e;
    ctx.lineTo((t.clientX-r.left)*sx,(t.clientY-r.top)*sy);ctx.stroke();},[]);
  const onUp=React.useCallback(()=>{if(!isDrawingRef.current)return;isDrawingRef.current=false;
    const c=drawCanvasRef.current;if(c)c.getContext("2d").globalCompositeOperation="source-over";saveCanvas();},[]);
  const canvasCallbackRef=React.useCallback((node)=>{if(node){drawCanvasRef.current=node;
    node.addEventListener("touchstart",onDown,{passive:false});node.addEventListener("touchmove",onMove,{passive:false});
    node.addEventListener("touchend",onUp);node.addEventListener("mousedown",onDown);
    node.addEventListener("mousemove",onMove);node.addEventListener("mouseup",onUp);node.addEventListener("mouseleave",onUp);
    setTimeout(loadCanvas,50);}},[nbPageIdx,pageDrawMode]);

  // ─── PIXEL ART ──────────────────────────────────────────────────
  const pixCanvasRef=React.useRef(null);const pixIsPainting=React.useRef(false);const pixelUndoRef=React.useRef([]);
  const PIXEL_COLORS=["#f5576c","#feca57","#43e97b","#60a5fa","#f093fb","#fb923c","#22d3ee","#fff","#888","#333"];
  const PIXEL_SIZES=[{id:"16x16",label:"16×16",desc:"Icon",c:16,r:16},{id:"32x32",label:"32×32",desc:"Sprite",c:32,r:32},{id:"48x48",label:"48×48",desc:"Detailed",c:48,r:48},{id:"64x64",label:"64×64",desc:"Large",c:64,r:64},{id:"128x128",label:"128×128",desc:"HD",c:128,r:128},{id:"256x256",label:"256×256",desc:"Full",c:256,r:256}];
  const getPixels=()=>{const d=readNb();return d.pages?.[nbPageIdx]?.pixels||{};};
  const getPixelDims=()=>{const d=readNb();const page=d.pages?.[nbPageIdx];return PIXEL_SIZES.find(s=>s.id===(page?.pixelSize||"32x32"))||PIXEL_SIZES[1];};
  const getPixelCellSize=()=>{const dims=getPixelDims();return Math.max(4,Math.min(20,Math.floor(400/dims.c)));};
  const drawPixelGrid=()=>{const c=pixCanvasRef.current;if(!c)return;const ctx=c.getContext("2d");
    const dims=getPixelDims();const cs=getPixelCellSize();const pixels=getPixels();
    ctx.fillStyle="#111";ctx.fillRect(0,0,c.width,c.height);
    ctx.strokeStyle="rgba(255,255,255,.06)";ctx.lineWidth=0.5;
    for(let x=0;x<=dims.c;x++){ctx.beginPath();ctx.moveTo(x*cs,0);ctx.lineTo(x*cs,dims.r*cs);ctx.stroke();}
    for(let y=0;y<=dims.r;y++){ctx.beginPath();ctx.moveTo(0,y*cs);ctx.lineTo(dims.c*cs,y*cs);ctx.stroke();}
    Object.entries(pixels).forEach(([key,color])=>{const[r,cl]=key.split("-").map(Number);if(r<dims.r&&cl<dims.c){ctx.fillStyle=color;ctx.fillRect(cl*cs,r*cs,cs,cs);}});};
  const setPixel=(row,col,color)=>{const dims=getPixelDims();if(row<0||row>=dims.r||col<0||col>=dims.c)return;
    const key=`${row}-${col}`;const d=readNb();if(!d.pages?.[nbPageIdx])return;
    const pixels=d.pages[nbPageIdx].pixels||{};const old=pixels[key]||null;
    if(pixels[key]===color)delete pixels[key];else pixels[key]=color;
    pixelUndoRef.current.push({key,old});d.pages[nbPageIdx].pixels=pixels;writeNb(d);
    const c=pixCanvasRef.current;if(c){const ctx=c.getContext("2d");const cs=getPixelCellSize();
      ctx.fillStyle=pixels[key]||"#111";ctx.fillRect(col*cs,row*cs,cs,cs);
      ctx.strokeStyle="rgba(255,255,255,.06)";ctx.lineWidth=0.5;ctx.strokeRect(col*cs,row*cs,cs,cs);}};
  const undoPixel=()=>{if(!pixelUndoRef.current.length)return;const{key,old}=pixelUndoRef.current.pop();
    const d=readNb();if(!d.pages?.[nbPageIdx])return;const pixels=d.pages[nbPageIdx].pixels||{};
    if(old)pixels[key]=old;else delete pixels[key];d.pages[nbPageIdx].pixels=pixels;writeNb(d);
    const c=pixCanvasRef.current;if(c){const ctx=c.getContext("2d");const cs=getPixelCellSize();const[r,cl]=key.split("-").map(Number);
      ctx.fillStyle=old||"#111";ctx.fillRect(cl*cs,r*cs,cs,cs);ctx.strokeStyle="rgba(255,255,255,.06)";ctx.lineWidth=0.5;ctx.strokeRect(cl*cs,r*cs,cs,cs);}};
  const pixColorRef=React.useRef(pixelColor);pixColorRef.current=pixelColor;
  const handlePixEvent=(e,isStart)=>{if(e.touches&&e.touches.length>1)return;
    if(isStart)e.preventDefault();else if(!pixIsPainting.current)return;else e.preventDefault();
    if(isStart)pixIsPainting.current=true;const c=pixCanvasRef.current;if(!c)return;
    const r=c.getBoundingClientRect();const sx=c.width/r.width,sy=c.height/r.height;const t=e.touches?e.touches[0]:e;
    const dims=getPixelDims();const cs=getPixelCellSize();
    const col=Math.floor(((t.clientX-r.left)*sx)/cs);const row=Math.floor(((t.clientY-r.top)*sy)/cs);
    if(row>=0&&row<dims.r&&col>=0&&col<dims.c)setPixel(row,col,pixColorRef.current);};
  const pixCanvasCallbackRef=React.useCallback((node)=>{if(node){pixCanvasRef.current=node;
    node.addEventListener("touchstart",(e)=>handlePixEvent(e,true),{passive:false});
    node.addEventListener("touchmove",(e)=>handlePixEvent(e,false),{passive:false});
    node.addEventListener("touchend",()=>{pixIsPainting.current=false;});
    node.addEventListener("mousedown",(e)=>handlePixEvent(e,true));node.addEventListener("mousemove",(e)=>handlePixEvent(e,false));
    node.addEventListener("mouseup",()=>{pixIsPainting.current=false;});node.addEventListener("mouseleave",()=>{pixIsPainting.current=false;});
    setTimeout(drawPixelGrid,50);}},[nbPageIdx]);

  // ─── PAGE CHANGE ────────────────────────────────────────────────
  useEffect(()=>{
    pageIdxRef.current=nbPageIdx;
    const d=readNb();const page=d.pages?.[nbPageIdx];
    textRef.current=page?.content||"";
    if(textareaRef.current)textareaRef.current.value=textRef.current;
    drawImgRef.current=null;drawCanvasRef.current=null;
    setPageDrawMode(false);setPageZoom(1);setRenaming(false);undoRef.current=[textRef.current];redoRef.current=[];pixelUndoRef.current=[];
  },[nbPageIdx]);

  // Auto-save every 5s
  useEffect(()=>{if(nbView!=="page")return;const iv=setInterval(saveAll,5000);return()=>clearInterval(iv);},[nbView,nbPageIdx]);

  // ─── TEXT INPUT ─────────────────────────────────────────────────
  const onTextInput=()=>{const el=textareaRef.current;if(!el)return;textRef.current=el.value;
    clearTimeout(saveTimerRef.current);saveTimerRef.current=setTimeout(()=>{
      saveText();undoRef.current=[...undoRef.current.slice(-49),textRef.current];redoRef.current=[];},1500);};
  const undo=()=>{if(undoRef.current.length<2)return;const cur=undoRef.current.pop();redoRef.current.push(cur);const prev=undoRef.current[undoRef.current.length-1];
    textRef.current=prev;if(textareaRef.current)textareaRef.current.value=prev;saveText();};
  const redo=()=>{if(!redoRef.current.length)return;const next=redoRef.current.pop();undoRef.current.push(next);
    textRef.current=next;if(textareaRef.current)textareaRef.current.value=next;saveText();};

  // ─── NAVIGATION ─────────────────────────────────────────────────
  const goToc=()=>{saveAll();syncState();setPageDrawMode(false);setPageZoom(1);setNbView("toc");};
  const goPrev=()=>{saveAll();drawImgRef.current=null;drawCanvasRef.current=null;pageIdxRef.current=pageIdxRef.current-1;setNbPageIdx(i=>i-1);};
  const goNext=()=>{saveAll();drawImgRef.current=null;drawCanvasRef.current=null;pageIdxRef.current=pageIdxRef.current+1;setNbPageIdx(i=>i+1);};

  // ─── STYLES ─────────────────────────────────────────────────────
  const hs=20,hcol=hs*1.5,hrow=Math.round(hs*Math.sqrt(3)),hoff=Math.round(hrow/2);
  const PageBg=({type,children})=>(
    <div style={{position:"relative",background:"rgba(255,255,255,.02)",borderRadius:8,border:"1px solid rgba(255,255,255,.06)",minWidth:500,minHeight:800}}>
      {type==="lined"&&<svg style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none"}}>
        {Array.from({length:50},(_,i)=><line key={i} x1="0" y1={28+i*28} x2="100%" y2={28+i*28} stroke="rgba(255,255,255,.06)" strokeWidth="1"/>)}</svg>}
      {type==="square"&&<svg style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none"}}>
        <defs><pattern id="sq8" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="0" cy="0" r="1" fill="rgba(255,255,255,.08)"/><circle cx="24" cy="0" r="1" fill="rgba(255,255,255,.08)"/><circle cx="0" cy="24" r="1" fill="rgba(255,255,255,.08)"/><circle cx="24" cy="24" r="1" fill="rgba(255,255,255,.08)"/></pattern></defs>
        <rect width="100%" height="100%" fill="url(#sq8)"/></svg>}
      {type==="hex"&&<svg style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none"}}>
        <defs><pattern id="hx8" width={hcol*2} height={hrow} patternUnits="userSpaceOnUse">
          <circle cx="0" cy="0" r="1.2" fill="rgba(255,255,255,.08)"/><circle cx={hcol} cy="0" r="1.2" fill="rgba(255,255,255,.08)"/>
          <circle cx={hcol*2} cy="0" r="1.2" fill="rgba(255,255,255,.08)"/><circle cx={hcol*0.5} cy={hoff} r="1.2" fill="rgba(255,255,255,.08)"/>
          <circle cx={hcol*1.5} cy={hoff} r="1.2" fill="rgba(255,255,255,.08)"/></pattern></defs>
        <rect width="100%" height="100%" fill="url(#hx8)"/></svg>}
      {children}</div>);
  const ts=(type)=>({width:"100%",minHeight:800,padding:type==="lined"?"6px 14px":type==="square"?"2px 14px":type==="hex"?"13px 14px":"14px",
    background:"transparent",border:"none",color:"#e8e0f0",fontSize:15,
    lineHeight:type==="lined"?"28px":type==="square"?"24px":type==="hex"?"35px":"1.6",
    outline:"none",resize:"none",fontFamily:"'Nunito',sans-serif"});
  const btn=(extra)=>({background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.1)",borderRadius:10,padding:"6px 12px",fontSize:13,color:"#ccc",cursor:"pointer",fontWeight:700,...extra});

  // ─── PASSWORD / ARCHIVE ─────────────────────────────────────────
  if(nbData.pwHash&&!nbUnlocked)return(
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{fontSize:36,marginBottom:8}}>🔒</div><div style={{fontSize:16,fontWeight:800,color:"#e8e0f0",marginBottom:12}}>Notebook Locked</div>
      <input type="password" value={nbPwInput} onChange={e=>setNbPwInput(e.target.value)} placeholder="Enter password" style={{width:"80%",maxWidth:200,padding:"10px 14px",borderRadius:10,border:"1px solid rgba(255,255,255,.1)",background:"rgba(255,255,255,.04)",color:"#e8e0f0",fontSize:15,outline:"none",textAlign:"center",marginBottom:8}}/>
      <button onClick={()=>{if(simpleHash(nbPwInput)===nbData.pwHash){setNbUnlocked(true);setNbPwInput("");}else alert("Wrong password");}} style={btn({background:"linear-gradient(135deg,#667eea,#764ba2)",color:"#fff",padding:"8px 24px"})}>Unlock</button>
      <button onClick={()=>{if(confirm("Remove password?")){const d=readNb();d.pwHash=null;saveNb(d);setNbUnlocked(true);}}} style={{background:"none",border:"none",color:"rgba(255,255,255,.3)",fontSize:12,cursor:"pointer",marginTop:8}}>Forgot password?</button>
    </div>);
  if(nbView==="newpw")return(
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{fontSize:28,marginBottom:8}}>{nbData.pwHash?"🔐":"🔓"}</div><div style={{fontSize:16,fontWeight:800,color:"#e8e0f0",marginBottom:12}}>{nbData.pwHash?"Change":"Set"} Password</div>
      <input type="password" value={nbSetPw} onChange={e=>setNbSetPw(e.target.value)} placeholder="New password" style={{width:"80%",maxWidth:200,padding:"10px 14px",borderRadius:10,border:"1px solid rgba(255,255,255,.1)",background:"rgba(255,255,255,.04)",color:"#e8e0f0",fontSize:15,outline:"none",textAlign:"center",marginBottom:6}}/>
      <input type="password" value={nbSetPw2} onChange={e=>setNbSetPw2(e.target.value)} placeholder="Confirm" style={{width:"80%",maxWidth:200,padding:"10px 14px",borderRadius:10,border:"1px solid rgba(255,255,255,.1)",background:"rgba(255,255,255,.04)",color:"#e8e0f0",fontSize:15,outline:"none",textAlign:"center",marginBottom:10}}/>
      <div style={{display:"flex",gap:8}}>
        <button onClick={()=>{if(!nbSetPw||nbSetPw!==nbSetPw2){alert("Passwords don't match");return;}const d=readNb();d.pwHash=simpleHash(nbSetPw);saveNb(d);setNbUnlocked(true);setNbSetPw("");setNbSetPw2("");setNbView("toc");}} style={btn({background:"linear-gradient(135deg,#667eea,#764ba2)",color:"#fff"})}>Save</button>
        <button onClick={()=>{setNbView("toc");setNbSetPw("");setNbSetPw2("");}} style={btn({color:"#888"})}>Cancel</button>
      </div></div>);
  if(nbView==="archive")return(
    <div style={{flex:1,overflowY:"auto",padding:"8px 12px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <button onClick={()=>{syncState();setNbView("toc");}} style={btn()}>← Back</button>
        <span style={{fontSize:15,fontWeight:800,color:"#e8e0f0"}}>🗃️ Archive ({nbData.archive.length})</span></div>
      {nbData.archive.length===0&&<div style={{textAlign:"center",opacity:.3,padding:20}}>No archived pages</div>}
      {nbData.archive.map((p,i)=>(<div key={i} style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.06)",borderRadius:10,padding:"10px 14px",marginBottom:6}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:14,fontWeight:800,color:"#e8e0f0"}}>{p.title||"Untitled"}</span>
          <div style={{display:"flex",gap:4}}>
            <button onClick={()=>{const d=readNb();d.pages.push(p);d.archive.splice(i,1);saveNb(d);}} style={btn({background:"rgba(67,233,123,.1)",border:"1px solid rgba(67,233,123,.2)",color:"#43e97b",fontSize:11,padding:"3px 8px"})}>Restore</button>
            <button onClick={()=>{if(!confirm("Delete permanently?"))return;const d=readNb();d.archive.splice(i,1);saveNb(d);}} style={btn({background:"rgba(245,87,108,.1)",border:"1px solid rgba(245,87,108,.2)",color:"#f5576c",fontSize:11,padding:"3px 8px"})}>Delete</button>
          </div></div></div>))}
    </div>);

  // ═══ PIXEL PAGE ═══
  if(nbView==="page"&&nbData.pages[nbPageIdx]?.type==="pixel"){
    const page=nbData.pages[nbPageIdx];const dims=getPixelDims();const cs=getPixelCellSize();
    const cW=dims.c*cs,cH=dims.r*cs,hasPrev=nbPageIdx>0,hasNext=nbPageIdx<nbData.pages.length-1;
    return(<div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{display:"flex",alignItems:"center",gap:6,padding:"8px 10px 4px",flexShrink:0}}>
        <button onClick={goToc} style={btn()}>←</button>
        <button onClick={undoPixel} style={btn({color:"#aaa"})}>↩</button>
        <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,minWidth:0}}>
            <button onClick={()=>hasPrev&&goPrev()} style={{background:"none",border:"none",fontSize:16,color:hasPrev?"#a8b4f0":"#333",cursor:hasPrev?"pointer":"default",padding:"4px"}}>◀</button>
            {renaming?<div style={{display:"flex",gap:4,alignItems:"center"}}><input value={renameVal} onChange={e=>setRenameVal(e.target.value)} autoFocus
              style={{padding:"3px 8px",borderRadius:6,border:"1px solid rgba(102,126,234,.4)",background:"rgba(102,126,234,.1)",color:"#e8e0f0",fontSize:12,fontWeight:700,outline:"none",width:100}}/>
              <button onClick={doRename} style={{background:"none",border:"none",color:"#43e97b",fontSize:13,cursor:"pointer",fontWeight:700}}>✓</button>
              <button onClick={()=>setRenaming(false)} style={{background:"none",border:"none",color:"#888",fontSize:13,cursor:"pointer"}}>✕</button></div>
            :<span onClick={startRename} style={{fontSize:11,fontWeight:800,color:"#e8e0f0",cursor:"pointer",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:120}}>{nbPageIdx+1}. {page.title||"Untitled"}</span>}
            <button onClick={()=>hasNext&&goNext()} style={{background:"none",border:"none",fontSize:16,color:hasNext?"#a8b4f0":"#333",cursor:hasNext?"pointer":"default",padding:"4px"}}>▶</button>
          </div>
        <button onClick={doSave} style={btn(saved?{background:"rgba(67,233,123,.15)",border:"1px solid rgba(67,233,123,.3)",color:"#43e97b"}:{color:"#aaa"})}>{saved?"Saved ✓":"Save"}</button>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:4,padding:"2px 10px 6px",flexShrink:0,flexWrap:"wrap"}}>
        <button onClick={()=>setPageZoom(z=>Math.max(0.3,z-0.2))} style={btn({padding:"4px 8px"})}>−</button>
        <span style={{fontSize:11,opacity:.4,minWidth:32,textAlign:"center"}}>{Math.round(pageZoom*100)}%</span>
        <button onClick={()=>setPageZoom(z=>Math.min(6,z+0.2))} style={btn({padding:"4px 8px"})}>+</button>
        <div style={{width:1,height:20,background:"rgba(255,255,255,.1)",margin:"0 2px"}}/>
        {PIXEL_COLORS.map(c=>(<div key={c} onClick={()=>setPixelColor(c)} style={{width:24,height:24,borderRadius:5,background:c,border:pixelColor===c?"2px solid #feca57":"1px solid rgba(255,255,255,.15)",cursor:"pointer"}}/>))}
        <button onClick={()=>{if(!confirm("Clear all?"))return;const d=readNb();if(d.pages?.[nbPageIdx]){d.pages[nbPageIdx].pixels={};writeNb(d);drawPixelGrid();}}}
          style={btn({background:"rgba(245,87,108,.1)",border:"1px solid rgba(245,87,108,.2)",color:"#f5576c",fontSize:11,padding:"4px 10px"})}>Clear</button>
      </div>
      <div style={{flex:1,overflow:"auto",WebkitOverflowScrolling:"touch"}}>
        <div style={{transform:`scale(${pageZoom})`,transformOrigin:"top left",width:cW/pageZoom,height:cH/pageZoom,minWidth:cW,minHeight:cH}}>
          <canvas ref={pixCanvasCallbackRef} width={cW} height={cH} style={{width:cW,height:cH,touchAction:"pan-x pan-y",cursor:"crosshair",display:"block"}}/>
        </div></div></div>);
  }

  // ═══ TEXT PAGE ═══
  if(nbView==="page"&&nbData.pages[nbPageIdx]&&nbData.pages[nbPageIdx].type!=="pixel"){
    const page=nbData.pages[nbPageIdx];const existingDraw=getDrawData();
    const hasPrev=nbPageIdx>0,hasNext=nbPageIdx<nbData.pages.length-1;
    return(<div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{display:"flex",alignItems:"center",gap:6,padding:"8px 10px 4px",flexShrink:0}}>
        <button onClick={goToc} style={btn()}>←</button>
        {!pageDrawMode&&<><button onClick={undo} style={btn({color:"#aaa"})}>↩</button><button onClick={redo} style={btn({color:"#aaa"})}>↪</button></>}
        <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,minWidth:0}}>
          <button onClick={()=>hasPrev&&goPrev()} style={{background:"none",border:"none",fontSize:16,color:hasPrev?"#a8b4f0":"#333",cursor:hasPrev?"pointer":"default",padding:"4px"}}>◀</button>
          {renaming?<div style={{display:"flex",gap:4,alignItems:"center"}}><input value={renameVal} onChange={e=>setRenameVal(e.target.value)} autoFocus
            style={{padding:"3px 8px",borderRadius:6,border:"1px solid rgba(102,126,234,.4)",background:"rgba(102,126,234,.1)",color:"#e8e0f0",fontSize:12,fontWeight:700,outline:"none",width:100}}/>
            <button onClick={doRename} style={{background:"none",border:"none",color:"#43e97b",fontSize:13,cursor:"pointer",fontWeight:700}}>✓</button>
            <button onClick={()=>setRenaming(false)} style={{background:"none",border:"none",color:"#888",fontSize:13,cursor:"pointer"}}>✕</button></div>
          :<span onClick={startRename} style={{fontSize:11,fontWeight:800,color:"#e8e0f0",cursor:"pointer",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:120}}>{nbPageIdx+1}. {page.title||"Untitled"}</span>}
          <button onClick={()=>hasNext&&goNext()} style={{background:"none",border:"none",fontSize:16,color:hasNext?"#a8b4f0":"#333",cursor:hasNext?"pointer":"default",padding:"4px"}}>▶</button>
        </div>
        <button onClick={()=>{saveAll();setPageDrawMode(m=>!m);}} style={btn(pageDrawMode?{background:"rgba(240,147,251,.2)",border:"1px solid rgba(240,147,251,.4)",color:"#f093fb"}:{color:"#aaa"})}>🎨</button>
        <button onClick={doSave} style={btn(saved?{background:"rgba(67,233,123,.15)",border:"1px solid rgba(67,233,123,.3)",color:"#43e97b"}:{color:"#aaa"})}>{saved?"Saved ✓":"Save"}</button>
      </div>
      {pageDrawMode&&<div style={{display:"flex",flexDirection:"column",gap:4,padding:"2px 10px 6px",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:5}}>
          <button onClick={()=>setDrawEraser(e=>!e)} style={btn(drawEraser?{background:"rgba(245,87,108,.2)",color:"#f5576c"}:{color:"#ccc"})}>
            {drawEraser?"🧽":"✏️"}</button>
          {!drawEraser&&["#fff","#f5576c","#feca57","#43e97b","#60a5fa","#f093fb","#fb923c"].map(c=>(
            <div key={c} onClick={()=>setDrawColor(c)} style={{width:24,height:24,borderRadius:6,background:c,border:drawColor===c?"2px solid #fff":"2px solid rgba(255,255,255,.1)",cursor:"pointer"}}/>))}
        </div>
        {!drawEraser&&<div style={{display:"flex",alignItems:"center",gap:4}}>
          {[1,2,3,4,6,8,10,12].map(s=>(<div key={s} onClick={()=>setDrawSize(s)}
            style={{width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:8,
              background:drawSize===s?"rgba(255,255,255,.12)":"transparent",border:drawSize===s?`1px solid ${drawColor}`:"1px solid transparent",cursor:"pointer"}}>
            <div style={{width:Math.max(s,2),height:Math.max(s,2),borderRadius:"50%",background:drawColor}}/></div>))}
        </div>}
      </div>}
      {!pageDrawMode&&<div style={{display:"flex",alignItems:"center",gap:4,padding:"2px 10px 6px",flexShrink:0}}>
        <button onClick={()=>setPageZoom(z=>Math.max(0.3,z-0.2))} style={btn({padding:"4px 8px"})}>−</button>
        <span style={{fontSize:11,opacity:.4}}>{Math.round(pageZoom*100)}%</span>
        <button onClick={()=>setPageZoom(z=>Math.min(4,z+0.2))} style={btn({padding:"4px 8px"})}>+</button>
      </div>}
      <div style={{flex:1,overflow:"auto",WebkitOverflowScrolling:"touch"}}>
        <div style={{transform:`scale(${pageZoom})`,transformOrigin:"top left",width:`${100/pageZoom}%`}}>
          <PageBg type={page.type}>
            {!pageDrawMode&&<div>
              {existingDraw&&<img src={existingDraw} style={{position:"absolute",top:0,left:0,width:"100%",height:800,pointerEvents:"none",opacity:.7,zIndex:2}}/>}
              <textarea ref={(el)=>{if(el){
                const curIdx=String(pageIdxRef.current);
                if(el.dataset.loadedIdx!==curIdx){
                  const d=readNb();const content=d.pages?.[pageIdxRef.current]?.content||"";
                  textRef.current=content;el.value=content;el.dataset.loadedIdx=curIdx;
                }
                textareaRef.current=el;}}
              } onInput={onTextInput} onBlur={()=>saveText()} placeholder="Start writing..." style={{...ts(page.type),position:"relative",zIndex:1}}/>
            </div>}
            {pageDrawMode&&<div style={{position:"relative"}}>
              <div style={{position:"absolute",top:0,left:0,width:"100%",minHeight:800,...ts(page.type),
                color:"rgba(232,224,240,.4)",whiteSpace:"pre-wrap",wordBreak:"break-word",pointerEvents:"none",zIndex:0}}>{textRef.current}</div>
              <canvas ref={canvasCallbackRef} width={500} height={800}
                style={{width:500,height:800,touchAction:"none",background:"transparent",display:"block",position:"relative",zIndex:1}}/>
            </div>}
          </PageBg>
        </div></div></div>);
  }

  // ═══ TABLE OF CONTENTS ═══
  return(<div style={{flex:1,overflowY:"auto",padding:"8px 12px"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
      <span style={{fontSize:16,fontWeight:900,color:"#e8e0f0"}}>📓 Notebook</span>
      <div style={{display:"flex",gap:4}}>
        <button onClick={()=>setNbView("archive")} style={btn({fontSize:11,padding:"4px 8px",color:"#888"})}>🗃️ {nbData.archive.length}</button>
        <button onClick={()=>setNbView("newpw")} style={btn({fontSize:11,padding:"4px 8px",color:"#888"})}>{nbData.pwHash?"🔐":"🔓"}</button>
      </div></div>
    <div style={{background:"rgba(102,126,234,.06)",border:"1px solid rgba(102,126,234,.15)",borderRadius:12,padding:"10px 12px",marginBottom:10}}>
      <input value={nbNewTitle} onChange={e=>setNbNewTitle(e.target.value)} placeholder="Page title" style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid rgba(255,255,255,.08)",background:"rgba(255,255,255,.04)",color:"#e8e0f0",fontSize:14,outline:"none",marginBottom:6}}/>
      <div style={{display:"flex",gap:4,marginBottom:6}}>
        {[{id:"lined",label:"📝 Lined"},{id:"blank",label:"📄 Blank"},{id:"square",label:"🔲 Grid"},{id:"hex",label:"⬡ Hex"},{id:"pixel",label:"🟨 Pixel"}].map(t=>(
          <button key={t.id} onClick={()=>setNbNewType(t.id)}
            style={{flex:1,padding:"7px 2px",borderRadius:8,border:nbNewType===t.id?"1px solid rgba(102,126,234,.5)":"1px solid rgba(255,255,255,.08)",
              background:nbNewType===t.id?"rgba(102,126,234,.15)":"rgba(255,255,255,.03)",color:nbNewType===t.id?"#a8b4f0":"#888",fontSize:11,fontWeight:700,cursor:"pointer"}}>{t.label}</button>))}
      </div>
      {nbNewType==="pixel"&&<div style={{marginBottom:6}}>
        <div style={{fontSize:11,opacity:.4,marginBottom:4}}>Grid size:</div>
        <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
          {PIXEL_SIZES.map(s=>(<button key={s.id} onClick={()=>setNbPixelSize(s.id)}
            style={{padding:"4px 8px",borderRadius:6,border:nbPixelSize===s.id?"1px solid rgba(254,202,87,.5)":"1px solid rgba(255,255,255,.08)",
              background:nbPixelSize===s.id?"rgba(254,202,87,.12)":"rgba(255,255,255,.03)",color:nbPixelSize===s.id?"#feca57":"#888",fontSize:10,fontWeight:700,cursor:"pointer"}}>{s.label}<div style={{fontSize:9,opacity:.5}}>{s.desc}</div></button>))}
        </div></div>}
      <button onClick={()=>{const title=nbNewTitle.trim()||`Page ${nbData.pages.length+1}`;
        const np={title,type:nbNewType,content:"",drawData:null,pixels:{},created:Date.now()};
        if(nbNewType==="pixel")np.pixelSize=nbPixelSize;
        const d=readNb();d.pages.push(np);saveNb(d);setNbNewTitle("");
        const newIdx=d.pages.length-1;pageIdxRef.current=newIdx;
        drawImgRef.current=null;drawCanvasRef.current=null;textRef.current="";
        setNbPageIdx(newIdx);setNbView("page");}}
        style={{width:"100%",background:"linear-gradient(135deg,#667eea,#764ba2)",color:"#fff",border:"none",borderRadius:10,padding:"8px",fontSize:14,fontWeight:700,cursor:"pointer"}}>+ Add Page</button>
    </div>
    {nbData.pages.length===0&&<div style={{textAlign:"center",opacity:.3,padding:20}}>No pages yet</div>}
    {nbData.pages.map((p,i)=>(
      <div key={i} onClick={()=>{drawImgRef.current=null;drawCanvasRef.current=null;pageIdxRef.current=i;setNbPageIdx(i);setNbView("page");}}
        style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",marginBottom:4,borderRadius:10,background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.06)",cursor:"pointer"}}>
        <span style={{fontSize:13,fontWeight:800,color:"rgba(102,126,234,.6)",minWidth:28}}>{i+1}.</span>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:14,fontWeight:700,color:"#e8e0f0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.title||"Untitled"}</div>
          <div style={{fontSize:11,opacity:.3}}>{p.type==="pixel"?"🟨 "+(p.pixelSize||"32x32"):`📝 ${p.type}`}{p.drawData?" + 🎨":""}</div></div>
        <div style={{display:"flex",gap:3,flexShrink:0}} onClick={e=>e.stopPropagation()}>
          <button onClick={()=>{const d=readNb();d.archive.push(d.pages[i]);d.pages.splice(i,1);saveNb(d);}} style={btn({background:"rgba(254,202,87,.08)",border:"1px solid rgba(254,202,87,.15)",color:"#feca57",fontSize:10,padding:"3px 6px"})}>🗃️</button>
          <button onClick={()=>{if(!confirm(`Delete "${p.title}"?`))return;const d=readNb();d.pages.splice(i,1);saveNb(d);}} style={btn({background:"rgba(245,87,108,.08)",border:"1px solid rgba(245,87,108,.15)",color:"#f5576c",fontSize:10,padding:"3px 6px"})}>🗑</button>
        </div></div>))}
  </div>);
};

// ─── LEARN PANEL (inline tab — no notebook) ──────────────────────────────
const LearnPanel=()=>{
  const[learnTab,setLearnTab]=useState("picks");
  const[expanded,setExpanded]=useState(null);
  const[teaserRevealed,setTeaserRevealed]=useState(false);
  const[apiTrivia,setApiTrivia]=useState(null);
  const[apiFact,setApiFact]=useState(null);
  const[apiLoading,setApiLoading]=useState(true);
  const[learnFavs,setLearnFavs]=useState(()=>{try{return JSON.parse(localStorage.getItem("zodibuddy_learnfavs_v1"))||{teds:[],books:[],courses:[],quotes:[],facts:[],words:[],tips:[],mindful:[],news:[]};}catch{return{teds:[],books:[],courses:[],quotes:[],facts:[],words:[],tips:[],mindful:[],news:[]};}});
  const[showFavs,setShowFavs]=useState(false);
  const saveLearnFavs=(f)=>{setLearnFavs(f);try{localStorage.setItem("zodibuddy_learnfavs_v1",JSON.stringify(f));}catch{}};
  const toggleTedFav=(t)=>{const f={...learnFavs};const idx=f.teds.findIndex(x=>x.title===t.title);if(idx>=0)f.teds.splice(idx,1);else f.teds.push({title:t.title,speaker:t.speaker,url:t.url,cat:t.cat});saveLearnFavs(f);};
  const toggleBookFav=(b)=>{const f={...learnFavs};const idx=f.books.findIndex(x=>x.title===b.title);if(idx>=0)f.books.splice(idx,1);else f.books.push({title:b.title,author:b.author,why:b.why,cat:b.cat});saveLearnFavs(f);};
  const toggleCourseFav=(c)=>{const f={...learnFavs};const idx=f.courses.findIndex(x=>x.name===c.name);if(idx>=0)f.courses.splice(idx,1);else f.courses.push({name:c.name,source:c.source,url:c.url,cat:c.cat,icon:c.icon});saveLearnFavs(f);};
  const toggleSimpleFav=(key,item,matchFn)=>{const f={...learnFavs};if(!f[key])f[key]=[];const idx=f[key].findIndex(matchFn);if(idx>=0)f[key].splice(idx,1);else f[key].push(item);saveLearnFavs(f);};
  const isSimpleFav=(key,matchFn)=>(learnFavs[key]||[]).some(matchFn);
  const isTedFav=(t)=>learnFavs.teds.some(x=>x.title===t.title);
  const isBookFav=(b)=>learnFavs.books.some(x=>x.title===b.title);
  const isCourseFav=(c)=>learnFavs.courses.some(x=>x.name===c.name);
  const totalFavs=Object.values(learnFavs).reduce((s,a)=>s+(Array.isArray(a)?a.length:0),0);

  // News sources - custom + default
  const DEFAULT_NEWS=[{name:"AP News",url:"https://apnews.com",icon:"🔵",color:"#60a5fa"},{name:"Reuters",url:"https://reuters.com",icon:"🟠",color:"#fb923c"},{name:"NPR",url:"https://npr.org/sections/news",icon:"🔴",color:"#f5576c"},{name:"BBC News",url:"https://bbc.com/news",icon:"⚪",color:"#e8e0f0"},{name:"The Guardian",url:"https://theguardian.com/international",icon:"🔵",color:"#38bdf8"},{name:"PBS NewsHour",url:"https://pbs.org/newshour",icon:"🟣",color:"#a78bfa"}];
  const[newsSources,setNewsSources]=useState(()=>{try{return JSON.parse(localStorage.getItem("zodibuddy_news_v1"))||DEFAULT_NEWS;}catch{return DEFAULT_NEWS;}});
  const[showAddNews,setShowAddNews]=useState(false);
  const[newNewsName,setNewNewsName]=useState("");
  const[newNewsUrl,setNewNewsUrl]=useState("");
  const saveNewsSources=(s)=>{setNewsSources(s);try{localStorage.setItem("zodibuddy_news_v1",JSON.stringify(s));}catch{}};
  const addNewsSource=()=>{if(!newNewsName.trim()||!newNewsUrl.trim())return;
    const url=newNewsUrl.trim().startsWith("http")?newNewsUrl.trim():"https://"+newNewsUrl.trim();
    saveNewsSources([...newsSources,{name:newNewsName.trim(),url,icon:"🌐",color:"#a8b4f0",custom:true}]);setNewNewsName("");setNewNewsUrl("");setShowAddNews(false);};
  const deleteNewsSource=(i)=>{if(!confirm(`Remove "${newsSources[i].name}"?`))return;saveNewsSources(newsSources.filter((_,j)=>j!==i));};

  // Flashcard state
  const[fcCards,setFcCards]=useState(()=>{try{return JSON.parse(localStorage.getItem("zodibuddy_flashcards_v1"))||[];}catch{return[];}});
  const[fcArchive,setFcArchive]=useState(()=>{try{return JSON.parse(localStorage.getItem("zodibuddy_fc_archive_v1"))||[];}catch{return[];}});
  const[fcFlipped,setFcFlipped]=useState(null);
  const[fcNewTerm,setFcNewTerm]=useState("");const[fcNewDef,setFcNewDef]=useState("");const[fcNewCat,setFcNewCat]=useState("");
  const[fcMode,setFcMode]=useState("browse");
  const[fcQuizIdx,setFcQuizIdx]=useState(0);const[fcQuizFlipped,setFcQuizFlipped]=useState(false);
  const[fcEditId,setFcEditId]=useState(null);const[fcEditTerm,setFcEditTerm]=useState("");const[fcEditDef,setFcEditDef]=useState("");const[fcEditCat,setFcEditCat]=useState("");
  const[fcCatFilter,setFcCatFilter]=useState("all");
  const saveFc=(cards)=>{setFcCards(cards);try{localStorage.setItem("zodibuddy_flashcards_v1",JSON.stringify(cards));}catch{}};
  const saveFcArchive=(arch)=>{setFcArchive(arch);try{localStorage.setItem("zodibuddy_fc_archive_v1",JSON.stringify(arch));}catch{}};
  const archiveCard=(id)=>{const card=fcCards.find(c=>c.id===id);if(card){saveFcArchive([...fcArchive,{...card,archivedAt:Date.now()}]);saveFc(fcCards.filter(c=>c.id!==id));}};
  const restoreCard=(id)=>{const card=fcArchive.find(c=>c.id===id);if(card){const{archivedAt,...rest}=card;saveFc([...fcCards,rest]);saveFcArchive(fcArchive.filter(c=>c.id!==id));}};
  const fcCategories=useMemo(()=>{const cats=new Set();fcCards.forEach(c=>{if(c.cat)cats.add(c.cat);});return["all",...Array.from(cats).sort()];},[fcCards]);
  const filteredCards=useMemo(()=>fcCatFilter==="all"?fcCards:fcCards.filter(c=>c.cat===fcCatFilter),[fcCards,fcCatFilter]);
  const addCard=()=>{if(!fcNewTerm.trim()||!fcNewDef.trim())return;const cat=fcNewCat.trim()||"General";saveFc([...fcCards,{id:`fc_${Date.now()}`,term:fcNewTerm.trim(),def:fcNewDef.trim(),cat}]);setFcNewTerm("");setFcNewDef("");};
  const deleteCard=(id)=>{if(!confirm("Delete this card permanently?"))return;saveFc(fcCards.filter(c=>c.id!==id));};
  const saveEdit=()=>{if(!fcEditTerm.trim()||!fcEditDef.trim())return;saveFc(fcCards.map(c=>c.id===fcEditId?{...c,term:fcEditTerm.trim(),def:fcEditDef.trim(),cat:fcEditCat.trim()||"General"}:c));setFcEditId(null);};
  const shuffled=useMemo(()=>{const a=[...filteredCards];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;},[filteredCards,fcMode]);

  useEffect(()=>{let c=false;(async()=>{setApiLoading(true);try{const[tr,fr]=await Promise.allSettled([
    fetch("https://opentdb.com/api.php?amount=3&type=multiple&encode=url3986").then(r=>r.json()),
    fetch("https://uselessfacts.jsph.pl/api/v2/facts/random?language=en").then(r=>r.json())]);
    if(!c){if(tr.status==="fulfilled"&&tr.value?.results?.length>0)setApiTrivia(tr.value.results.map(q=>({question:decodeURIComponent(q.question),answer:decodeURIComponent(q.correct_answer),category:decodeURIComponent(q.category)})));
    if(fr.status==="fulfilled"&&fr.value?.text)setApiFact(fr.value.text);}}catch{}if(!c)setApiLoading(false);})();return()=>{c=true;};},[]);

  const today=dailySeed();
  const finTip=FIN_TIPS[today%FIN_TIPS.length];const mindful=MINDFULNESS[today%MINDFULNESS.length];
  const book=BOOKS[today%BOOKS.length];const course=COURSES[today%COURSES.length];const ted=TED_TALKS[today%TED_TALKS.length];
  const quote=DAILY_QUOTES[today%DAILY_QUOTES.length];const word=DAILY_WORDS[today%DAILY_WORDS.length];
  const fallbackTeaser=BRAIN_TEASERS[today%BRAIN_TEASERS.length];const fallbackFact=FUN_FACTS[today%FUN_FACTS.length];
  const displayFact=apiFact||fallbackFact;
  const displayTrivia=apiTrivia?apiTrivia[0]:{question:fallbackTeaser.q,answer:fallbackTeaser.a};

  const Card=({icon,title,color,children,id,link,onFav,isFav})=>(
    <div onClick={()=>{if(link)window.open(link,"_blank");else setExpanded(expanded===id?null:id);}}
      style={{background:`linear-gradient(135deg,${color}12,${color}06)`,border:`1px solid ${color}25`,borderRadius:14,padding:"12px 14px",marginBottom:6,cursor:"pointer"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,flex:1,minWidth:0}}>
          <span style={{fontSize:20}}>{icon}</span>
          <div style={{flex:1,minWidth:0}}><div style={{fontSize:16,fontWeight:800,color:"#fff"}}>{title}</div></div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
          {onFav&&<button onClick={e=>{e.stopPropagation();onFav();}} style={{background:"none",border:"none",fontSize:18,cursor:"pointer",padding:"2px 4px",opacity:isFav?1:.3}}>{isFav?"⭐":"☆"}</button>}
          {link?<span style={{fontSize:14,opacity:.3}}>↗</span>:<span style={{fontSize:14,opacity:.3}}>{expanded===id?"▲":"▼"}</span>}
        </div>
      </div>
      {(expanded===id||!id)&&<div style={{marginTop:8}}>{children}</div>}
    </div>
  );

  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      {totalFavs>0&&<div style={{padding:"8px 14px 0",flexShrink:0}}>
        <button onClick={()=>setShowFavs(!showFavs)} style={{background:showFavs?"rgba(254,202,87,.15)":"rgba(255,255,255,.06)",border:showFavs?"1px solid rgba(254,202,87,.3)":"1px solid rgba(255,255,255,.06)",borderRadius:8,padding:"4px 10px",fontSize:13,fontWeight:700,color:showFavs?"#feca57":"#888",cursor:"pointer"}}>⭐ {totalFavs} Favorites {showFavs?"▲":"▼"}</button>
      </div>}
      {showFavs&&<div style={{padding:"6px 14px",maxHeight:240,overflowY:"auto",flexShrink:0}}>
        <div style={{background:"rgba(254,202,87,.06)",border:"1px solid rgba(254,202,87,.15)",borderRadius:12,padding:8}}>
          {(learnFavs.quotes||[]).map((q,i)=>(<div key={"fq"+i} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 0",borderBottom:"1px solid rgba(255,255,255,.04)"}}><span style={{fontSize:12}}>💬</span><span style={{flex:1,fontSize:12,fontStyle:"italic",opacity:.7}}>"{q.q}" — {q.a}</span><button onClick={()=>toggleSimpleFav("quotes",q,x=>x.q===q.q)} style={{background:"none",border:"none",color:"#f5576c",fontSize:11,cursor:"pointer"}}>✕</button></div>))}
          {(learnFavs.facts||[]).map((f,i)=>(<div key={"ff"+i} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 0",borderBottom:"1px solid rgba(255,255,255,.04)"}}><span style={{fontSize:12}}>🧠</span><span style={{flex:1,fontSize:12,opacity:.7}}>{f.text}</span><button onClick={()=>toggleSimpleFav("facts",f,x=>x.text===f.text)} style={{background:"none",border:"none",color:"#f5576c",fontSize:11,cursor:"pointer"}}>✕</button></div>))}
          {(learnFavs.words||[]).map((w,i)=>(<div key={"fw"+i} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 0",borderBottom:"1px solid rgba(255,255,255,.04)"}}><span style={{fontSize:12}}>📖</span><span style={{flex:1,fontSize:12}}><strong style={{color:"#60a5fa"}}>{w.word}</strong> — <span style={{opacity:.5}}>{w.def}</span></span><button onClick={()=>toggleSimpleFav("words",w,x=>x.word===w.word)} style={{background:"none",border:"none",color:"#f5576c",fontSize:11,cursor:"pointer"}}>✕</button></div>))}
          {(learnFavs.mindful||[]).map((m,i)=>(<div key={"fm"+i} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 0",borderBottom:"1px solid rgba(255,255,255,.04)"}}><span style={{fontSize:12}}>{m.icon}</span><span style={{flex:1,fontSize:12,opacity:.7}}>{m.practice}</span><button onClick={()=>toggleSimpleFav("mindful",m,x=>x.practice===m.practice)} style={{background:"none",border:"none",color:"#f5576c",fontSize:11,cursor:"pointer"}}>✕</button></div>))}
          {(learnFavs.tips||[]).map((t,i)=>(<div key={"fti"+i} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 0",borderBottom:"1px solid rgba(255,255,255,.04)"}}><span style={{fontSize:12}}>{t.icon}</span><span style={{flex:1,fontSize:12,opacity:.7}}>{t.tip}</span><button onClick={()=>toggleSimpleFav("tips",t,x=>x.tip===t.tip)} style={{background:"none",border:"none",color:"#f5576c",fontSize:11,cursor:"pointer"}}>✕</button></div>))}
          {learnFavs.teds.map((t,i)=>(<div key={"ft"+i} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 0",borderBottom:"1px solid rgba(255,255,255,.04)"}}><span style={{fontSize:12}}>🎤</span><a href={t.url} target="_blank" rel="noopener noreferrer" style={{flex:1,color:"#f093fb",fontSize:12,fontWeight:700,textDecoration:"none"}}>{t.title}</a><button onClick={()=>toggleTedFav(t)} style={{background:"none",border:"none",color:"#f5576c",fontSize:11,cursor:"pointer"}}>✕</button></div>))}
          {learnFavs.books.map((b,i)=>(<div key={"fb"+i} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 0",borderBottom:"1px solid rgba(255,255,255,.04)"}}><span style={{fontSize:12}}>📚</span><span style={{flex:1,fontSize:12}}><span style={{color:"#fbbf24",fontWeight:700}}>{b.title}</span><span style={{opacity:.4}}> — {b.author}</span></span><button onClick={()=>toggleBookFav(b)} style={{background:"none",border:"none",color:"#f5576c",fontSize:11,cursor:"pointer"}}>✕</button></div>))}
          {learnFavs.courses.map((c,i)=>(<div key={"fc"+i} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 0",borderBottom:"1px solid rgba(255,255,255,.04)"}}><span style={{fontSize:12}}>{c.icon||"📖"}</span><a href={c.url} target="_blank" rel="noopener noreferrer" style={{flex:1,color:"#22d3ee",fontSize:12,fontWeight:700,textDecoration:"none"}}>{c.name}</a><button onClick={()=>toggleCourseFav(c)} style={{background:"none",border:"none",color:"#f5576c",fontSize:11,cursor:"pointer"}}>✕</button></div>))}
          {(learnFavs.news||[]).map((n,i)=>(<div key={"fn"+i} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 0",borderBottom:"1px solid rgba(255,255,255,.04)"}}><span style={{fontSize:12}}>{n.icon}</span><a href={n.url} target="_blank" rel="noopener noreferrer" style={{flex:1,color:"#a8b4f0",fontSize:12,fontWeight:700,textDecoration:"none"}}>{n.name}</a><button onClick={()=>toggleSimpleFav("news",n,x=>x.name===n.name)} style={{background:"none",border:"none",color:"#f5576c",fontSize:11,cursor:"pointer"}}>✕</button></div>))}
        </div>
      </div>}
      <div style={{display:"flex",gap:3,padding:"8px 12px 8px",flexShrink:0}}>
        {[{id:"picks",label:"🌱 Picks"},{id:"news",label:"📰 Events"},{id:"flash",label:"📒 Flashcards"}].map(t=>(
          <button key={t.id} onClick={()=>setLearnTab(t.id)}
            style={{flex:1,padding:"7px 2px",borderRadius:10,border:learnTab===t.id?"1px solid rgba(102,126,234,.4)":"1px solid rgba(255,255,255,.06)",
              background:learnTab===t.id?"rgba(102,126,234,.12)":"rgba(255,255,255,.03)",
              color:learnTab===t.id?"#a8b4f0":"#777",fontSize:12,fontWeight:700,cursor:"pointer"}}>{t.label}</button>
        ))}
      </div>
      {learnTab==="picks"&&<div style={{flex:1,overflowY:"auto",padding:"0 14px 14px"}}>
        <Card icon="💬" title="Daily Quote" color="rgba(254,202,87)" id="quote" onFav={()=>toggleSimpleFav("quotes",{q:quote.q,a:quote.a},x=>x.q===quote.q)} isFav={isSimpleFav("quotes",x=>x.q===quote.q)}><div style={{fontSize:16,fontStyle:"italic",lineHeight:1.5,opacity:.8}}>"{quote.q}"</div><div style={{fontSize:14,opacity:.4,marginTop:4}}>— {quote.a}</div></Card>
        <Card icon="🧠" title={apiFact?"Random Fact":"Fun Fact"} color="rgba(67,233,123)" id="fact" onFav={()=>toggleSimpleFav("facts",{text:displayFact},x=>x.text===displayFact)} isFav={isSimpleFav("facts",x=>x.text===displayFact)}>{apiLoading&&!apiFact?<div style={{fontSize:14,opacity:.4}}>Loading...</div>:<div style={{fontSize:16,lineHeight:1.5,opacity:.75}}>{displayFact}</div>}</Card>
        <Card icon="🧩" title={apiTrivia?"Trivia: "+apiTrivia[0].category:"Brain Teaser"} color="rgba(192,132,252)" id="teaser">
          <div style={{fontSize:16,lineHeight:1.5,opacity:.8,marginBottom:6}}>{displayTrivia.question}</div>
          {teaserRevealed?<div style={{fontSize:16,fontWeight:700,color:"#a78bfa"}}>💡 {displayTrivia.answer}</div>
          :<button onClick={e=>{e.stopPropagation();setTeaserRevealed(true);}} style={{background:"rgba(167,139,250,.15)",border:"1px solid rgba(167,139,250,.3)",borderRadius:8,padding:"6px 14px",fontSize:15,color:"#a78bfa",cursor:"pointer",fontWeight:700}}>Reveal Answer</button>}
          {apiTrivia&&apiTrivia.length>1&&teaserRevealed&&<div style={{marginTop:10,borderTop:"1px solid rgba(255,255,255,.06)",paddingTop:8}}>{apiTrivia.slice(1).map((q,i)=>(<div key={i} style={{marginBottom:8}}><div style={{fontSize:14,opacity:.7,marginBottom:2}}>{q.question}</div><div style={{fontSize:13,color:"#a78bfa",fontWeight:700}}>→ {q.answer}</div></div>))}</div>}
        </Card>
        <Card icon="📖" title="Word of the Day" color="rgba(96,165,250)" id="word" onFav={()=>toggleSimpleFav("words",{word:word.word,def:word.def},x=>x.word===word.word)} isFav={isSimpleFav("words",x=>x.word===word.word)}><div style={{fontSize:18,fontWeight:900,color:"#60a5fa"}}>{word.word}</div><div style={{fontSize:15,opacity:.6,marginTop:3,lineHeight:1.4}}>{word.def}</div></Card>
        <Card icon={mindful.icon} title={`${mindful.type} — Mindfulness`} color="rgba(56,189,248)" id="mind" onFav={()=>toggleSimpleFav("mindful",{type:mindful.type,practice:mindful.practice,icon:mindful.icon},x=>x.practice===mindful.practice)} isFav={isSimpleFav("mindful",x=>x.practice===mindful.practice)}><div style={{fontSize:16,lineHeight:1.6,opacity:.8}}>{mindful.practice}</div></Card>
        <Card icon={finTip.icon} title="Money Tip" color="rgba(245,87,108)" id="fin" onFav={()=>toggleSimpleFav("tips",{tip:finTip.tip,icon:finTip.icon},x=>x.tip===finTip.tip)} isFav={isSimpleFav("tips",x=>x.tip===finTip.tip)}><div style={{fontSize:16,lineHeight:1.5,opacity:.8}}>{finTip.tip}</div></Card>
        <Card icon="🎤" title="TED Talk" color="rgba(240,147,251)" link={ted.url} onFav={()=>toggleTedFav(ted)} isFav={isTedFav(ted)}><div style={{fontSize:16,fontWeight:700,lineHeight:1.3}}>{ted.title}</div><div style={{fontSize:14,opacity:.5,marginTop:2}}>{ted.speaker} • {ted.cat}</div></Card>
        <Card icon="📚" title="Book Pick" color="rgba(251,191,36)" link={`https://openlibrary.org/search?q=${encodeURIComponent(book.title+" "+book.author)}`} onFav={()=>toggleBookFav(book)} isFav={isBookFav(book)}><div style={{fontSize:16,fontWeight:700}}>{book.title}</div><div style={{fontSize:14,opacity:.5}}>{book.author} • {book.cat}</div><div style={{fontSize:14,opacity:.4,fontStyle:"italic",marginTop:2}}>"{book.why}"</div></Card>
        <Card icon={course.icon} title="Free Course" color="rgba(34,211,238)" link={course.url} onFav={()=>toggleCourseFav(course)} isFav={isCourseFav(course)}><div style={{fontSize:16,fontWeight:700}}>{course.name}</div><div style={{fontSize:14,opacity:.5}}>{course.source} • {course.cat}</div></Card>
      </div>}
      {learnTab==="news"&&<div style={{flex:1,overflowY:"auto",padding:"0 14px 14px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{fontSize:14,opacity:.4}}>Tap any source to read</div>
          <button onClick={()=>setShowAddNews(!showAddNews)} style={{background:showAddNews?"rgba(102,126,234,.15)":"rgba(255,255,255,.06)",border:showAddNews?"1px solid rgba(102,126,234,.3)":"1px solid rgba(255,255,255,.08)",borderRadius:8,padding:"4px 10px",fontSize:12,color:showAddNews?"#a8b4f0":"#888",cursor:"pointer",fontWeight:700}}>{showAddNews?"Cancel":"+ Add Source"}</button>
        </div>
        {showAddNews&&<div style={{background:"rgba(102,126,234,.06)",border:"1px solid rgba(102,126,234,.15)",borderRadius:12,padding:"10px 12px",marginBottom:10}}>
          <input value={newNewsName} onChange={e=>setNewNewsName(e.target.value)} placeholder="Source name (e.g. CNN)" style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid rgba(255,255,255,.08)",background:"rgba(255,255,255,.04)",color:"#e8e0f0",fontSize:14,outline:"none",marginBottom:6}}/>
          <input value={newNewsUrl} onChange={e=>setNewNewsUrl(e.target.value)} placeholder="URL (e.g. cnn.com)" style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid rgba(255,255,255,.08)",background:"rgba(255,255,255,.04)",color:"#e8e0f0",fontSize:14,outline:"none",marginBottom:8}}/>
          <button onClick={addNewsSource} style={{width:"100%",background:"linear-gradient(135deg,#667eea,#764ba2)",color:"#fff",border:"none",borderRadius:10,padding:"8px",fontSize:14,fontWeight:700,cursor:"pointer"}}>Add Source</button>
        </div>}
        {newsSources.map((s,i)=>{
          const isFav=isSimpleFav("news",x=>x.name===s.name);
          return(<div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
            <a href={s.url} target="_blank" rel="noopener noreferrer"
              style={{flex:1,display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:14,
                background:`${s.color}08`,border:`1px solid ${s.color}20`,textDecoration:"none",color:"#fff",cursor:"pointer"}}>
              <span style={{fontSize:22}}>{s.icon}</span>
              <div style={{flex:1}}><div style={{fontSize:15,fontWeight:800}}>{s.name}</div></div>
              <span style={{fontSize:14,opacity:.3}}>↗</span>
            </a>
            <button onClick={(e)=>{e.stopPropagation();toggleSimpleFav("news",{name:s.name,url:s.url,icon:s.icon},x=>x.name===s.name);}}
              style={{background:"none",border:"none",fontSize:18,cursor:"pointer",padding:"4px",opacity:isFav?1:.3}}>{isFav?"⭐":"☆"}</button>
            <button onClick={(e)=>{e.stopPropagation();deleteNewsSource(i);}}
              style={{background:"none",border:"none",fontSize:14,cursor:"pointer",padding:"4px",color:"#f5576c",opacity:.4}}>✕</button>
          </div>);
        })}
        {newsSources.length===0&&<div style={{textAlign:"center",opacity:.3,padding:20}}>No sources. Add one above!</div>}
      </div>}
      {learnTab==="flash"&&<div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{display:"flex",gap:4,padding:"0 14px 6px",flexShrink:0}}>
          {[{id:"browse",label:`📋 Browse (${filteredCards.length})`},{id:"quiz",label:"🧠 Quiz"},{id:"add",label:"＋ Add"},{id:"archive",label:`🗃️ ${fcArchive.length}`}].map(m=>(
            <button key={m.id} onClick={()=>{setFcMode(m.id);setFcQuizIdx(0);setFcQuizFlipped(false);setFcEditId(null);}}
              style={{flex:m.id==="archive"?"none":1,padding:"7px 4px",borderRadius:8,border:fcMode===m.id?"1px solid rgba(67,233,123,.4)":"1px solid rgba(255,255,255,.06)",background:fcMode===m.id?"rgba(67,233,123,.1)":"rgba(255,255,255,.03)",color:fcMode===m.id?"#43e97b":"#777",fontSize:12,fontWeight:700,cursor:"pointer",minWidth:m.id==="archive"?40:0}}>{m.label}</button>))}
        </div>
        {fcCategories.length>1&&<div style={{display:"flex",gap:3,padding:"0 14px 8px",flexShrink:0,overflowX:"auto"}}>
          {fcCategories.map(cat=>(<button key={cat} onClick={()=>{setFcCatFilter(cat);setFcQuizIdx(0);}} style={{padding:"4px 10px",borderRadius:6,border:fcCatFilter===cat?"1px solid rgba(102,126,234,.4)":"1px solid rgba(255,255,255,.06)",background:fcCatFilter===cat?"rgba(102,126,234,.12)":"rgba(255,255,255,.02)",color:fcCatFilter===cat?"#a8b4f0":"#666",fontSize:11,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>{cat==="all"?"All":cat}</button>))}
        </div>}
        <div style={{flex:1,overflowY:"auto",padding:"0 14px 14px"}}>
          {fcMode==="add"&&<div>
            <input value={fcNewTerm} onChange={e=>setFcNewTerm(e.target.value)} placeholder="Question / Term" style={{width:"100%",padding:"12px 14px",borderRadius:10,border:"1px solid rgba(255,255,255,.1)",background:"rgba(255,255,255,.04)",color:"#e8e0f0",fontSize:16,outline:"none",marginBottom:8,fontFamily:"'Nunito',sans-serif"}}/>
            <textarea value={fcNewDef} onChange={e=>setFcNewDef(e.target.value)} placeholder="Answer / Definition" rows={3} style={{width:"100%",padding:"12px 14px",borderRadius:10,border:"1px solid rgba(255,255,255,.1)",background:"rgba(255,255,255,.04)",color:"#e8e0f0",fontSize:15,outline:"none",resize:"none",marginBottom:8,fontFamily:"'Nunito',sans-serif",lineHeight:1.5}}/>
            <div style={{display:"flex",gap:6,marginBottom:10,alignItems:"center"}}><span style={{fontSize:12,opacity:.4}}>Category:</span>
              <input value={fcNewCat} onChange={e=>setFcNewCat(e.target.value)} placeholder="e.g. Math, Science" list="fc-cats" style={{flex:1,padding:"8px 10px",borderRadius:8,border:"1px solid rgba(255,255,255,.08)",background:"rgba(255,255,255,.04)",color:"#e8e0f0",fontSize:14,outline:"none"}}/>
              <datalist id="fc-cats">{fcCategories.filter(c=>c!=="all").map(c=><option key={c} value={c}/>)}</datalist></div>
            <button onClick={addCard} style={{width:"100%",padding:"12px",borderRadius:12,background:"linear-gradient(135deg,#43e97b,#38f9d7)",border:"none",fontSize:16,fontWeight:800,color:"#1a1a2e",cursor:"pointer"}}>Add Question</button>
          </div>}
          {fcMode==="browse"&&<div>
            {filteredCards.length===0&&<div style={{textAlign:"center",padding:20}}><div style={{fontSize:16,fontWeight:800,color:"#e8e0f0",marginBottom:6}}>No Cards Yet</div></div>}
            {filteredCards.map(c=>(<div key={c.id} style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.06)",borderRadius:12,padding:"12px 14px",marginBottom:6}}>
              {fcEditId===c.id?<div>
                <input value={fcEditTerm} onChange={e=>setFcEditTerm(e.target.value)} placeholder="Question / Term" style={{width:"100%",padding:"10px 12px",borderRadius:10,border:"1px solid rgba(255,255,255,.12)",background:"rgba(255,255,255,.05)",color:"#e8e0f0",fontSize:15,outline:"none",marginBottom:6}}/>
                <textarea value={fcEditDef} onChange={e=>setFcEditDef(e.target.value)} placeholder="Answer / Definition" rows={4} style={{width:"100%",padding:"10px 12px",borderRadius:10,border:"1px solid rgba(255,255,255,.12)",background:"rgba(255,255,255,.05)",color:"#e8e0f0",fontSize:14,outline:"none",resize:"vertical",marginBottom:6,lineHeight:1.5,minHeight:80}}/>
                <input value={fcEditCat} onChange={e=>setFcEditCat(e.target.value)} placeholder="Category" list="fc-cats" style={{width:"100%",padding:"8px 12px",borderRadius:10,border:"1px solid rgba(255,255,255,.08)",background:"rgba(255,255,255,.04)",color:"#e8e0f0",fontSize:13,outline:"none",marginBottom:8}}/>
                <div style={{display:"flex",gap:8}}><button onClick={saveEdit} style={{flex:1,padding:"8px 12px",borderRadius:10,background:"rgba(67,233,123,.15)",border:"1px solid rgba(67,233,123,.3)",color:"#43e97b",fontSize:14,fontWeight:700,cursor:"pointer"}}>Save</button><button onClick={()=>setFcEditId(null)} style={{flex:1,padding:"8px 12px",borderRadius:10,background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.06)",color:"#888",fontSize:14,fontWeight:700,cursor:"pointer"}}>Cancel</button></div>
              </div>:<div>
                <div onClick={()=>setFcFlipped(fcFlipped===c.id?null:c.id)}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{fontSize:15,fontWeight:700,color:"#e8e0f0",flex:1}}>{c.term}</div>{c.cat&&<span style={{fontSize:10,padding:"2px 6px",borderRadius:4,background:"rgba(102,126,234,.1)",color:"#a8b4f0",fontWeight:700}}>{c.cat}</span>}</div>
                  {fcFlipped===c.id?<div style={{fontSize:14,opacity:.6,marginTop:4,lineHeight:1.4}}>{c.def}</div>:<div style={{fontSize:12,opacity:.3,marginTop:2}}>Tap to reveal</div>}
                </div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:8}}>
                  <button onClick={()=>{setFcEditId(c.id);setFcEditTerm(c.term);setFcEditDef(c.def);setFcEditCat(c.cat||"");}} style={{padding:"5px 14px",borderRadius:8,background:"rgba(102,126,234,.1)",border:"1px solid rgba(102,126,234,.2)",color:"#a8b4f0",fontSize:12,fontWeight:700,cursor:"pointer"}}>Edit</button>
                  <button onClick={()=>archiveCard(c.id)} style={{padding:"5px 14px",borderRadius:8,background:"rgba(254,202,87,.08)",border:"1px solid rgba(254,202,87,.15)",color:"#feca57",fontSize:12,fontWeight:700,cursor:"pointer"}}>🗃️ Archive</button>
                  <button onClick={()=>deleteCard(c.id)} style={{padding:"5px 14px",borderRadius:8,background:"rgba(245,87,108,.08)",border:"1px solid rgba(245,87,108,.15)",color:"#f5576c",fontSize:12,fontWeight:700,cursor:"pointer"}}>Delete</button>
                </div>
              </div>}
            </div>))}
          </div>}
          {fcMode==="quiz"&&<div>
            {shuffled.length===0&&<div style={{textAlign:"center",padding:20}}><div style={{fontSize:16,fontWeight:800,color:"#e8e0f0"}}>No questions to test</div></div>}
            {shuffled.length>0&&<div>
              {shuffled[fcQuizIdx]?.cat&&<div style={{textAlign:"center",marginBottom:6}}><span style={{fontSize:11,padding:"2px 8px",borderRadius:4,background:"rgba(102,126,234,.1)",color:"#a8b4f0",fontWeight:700}}>{shuffled[fcQuizIdx].cat}</span></div>}
              <div onClick={()=>setFcQuizFlipped(!fcQuizFlipped)} style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:16,padding:20,textAlign:"center",minHeight:120,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",marginBottom:12}}>
                <div><div style={{fontSize:18,fontWeight:800,color:"#e8e0f0"}}>{fcQuizFlipped?shuffled[fcQuizIdx]?.def:shuffled[fcQuizIdx]?.term}</div><div style={{fontSize:12,opacity:.3,marginTop:6}}>{fcQuizFlipped?"(answer)":"Tap to flip"}</div></div></div>
              <div style={{display:"flex",justifyContent:"center",gap:12}}>
                <button onClick={()=>{setFcQuizIdx(Math.max(0,fcQuizIdx-1));setFcQuizFlipped(false);}} style={{padding:"10px 20px",borderRadius:12,background:fcQuizIdx>0?"rgba(255,255,255,.06)":"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.06)",color:fcQuizIdx>0?"#ccc":"#444",fontSize:15,fontWeight:700,cursor:fcQuizIdx>0?"pointer":"default"}}>Prev</button>
                <div style={{padding:"10px 0",fontSize:14,opacity:.4}}>{fcQuizIdx+1}/{shuffled.length}</div>
                <button onClick={()=>{setFcQuizIdx(Math.min(shuffled.length-1,fcQuizIdx+1));setFcQuizFlipped(false);}} style={{padding:"10px 20px",borderRadius:12,background:fcQuizIdx<shuffled.length-1?"rgba(255,255,255,.06)":"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.06)",color:fcQuizIdx<shuffled.length-1?"#ccc":"#444",fontSize:15,fontWeight:700,cursor:fcQuizIdx<shuffled.length-1?"pointer":"default"}}>Next</button>
              </div>
            </div>}
          </div>}
          {fcMode==="archive"&&<div>
            {fcArchive.length===0&&<div style={{textAlign:"center",padding:20}}><div style={{fontSize:16,fontWeight:800,color:"#e8e0f0",marginBottom:6}}>No Archived Cards</div><div style={{fontSize:13,opacity:.4}}>Cards you archive will appear here</div></div>}
            {fcArchive.map(c=>(<div key={c.id} style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.06)",borderRadius:12,padding:"12px 14px",marginBottom:6}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                <div style={{fontSize:15,fontWeight:700,color:"#e8e0f0",flex:1}}>{c.term}</div>
                {c.cat&&<span style={{fontSize:10,padding:"2px 6px",borderRadius:4,background:"rgba(102,126,234,.1)",color:"#a8b4f0",fontWeight:700}}>{c.cat}</span>}
              </div>
              <div style={{fontSize:13,opacity:.5,lineHeight:1.4,marginBottom:8}}>{c.def}</div>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <button onClick={()=>restoreCard(c.id)} style={{padding:"5px 14px",borderRadius:8,background:"rgba(67,233,123,.1)",border:"1px solid rgba(67,233,123,.2)",color:"#43e97b",fontSize:12,fontWeight:700,cursor:"pointer"}}>Restore</button>
                <button onClick={()=>{if(!confirm("Delete permanently?"))return;saveFcArchive(fcArchive.filter(x=>x.id!==c.id));}} style={{padding:"5px 14px",borderRadius:8,background:"rgba(245,87,108,.08)",border:"1px solid rgba(245,87,108,.15)",color:"#f5576c",fontSize:12,fontWeight:700,cursor:"pointer"}}>Delete</button>
              </div>
            </div>))}
          </div>}
        </div>
      </div>}
    </div>
  );
};

// ─── CLEANING CHECKLIST DATA ──────────────────────────────────────────────────
const DAILY_TASKS=[
  {id:"laundry",label:"One load of laundry"},
  {id:"dishes",label:"Dishes"},
  {id:"beds",label:"Make beds"},
  {id:"counters",label:"Spray countertops"},
  {id:"clutter",label:"Pick up clutter"},
  {id:"mail",label:"Sort mail"},
  {id:"trash",label:"Trash"},
];
const WEEKLY_ROOMS=[
  {day:"Mon",room:"Kitchen",   tasks:["Clean kitchen table","Wipe down sink & counters","Vacuum and/or mop","Wipe down appliances"]},
  {day:"Tue",room:"Living Room",tasks:["Pick up clutter","Dust surfaces","Vacuum and/or mop","Wash blankets"]},
  {day:"Wed",room:"Bed Room",  tasks:["Put away clothes / pick up clutter","Dust surfaces","Wash bedding","Vacuum and/or mop"]},
  {day:"Thu",room:"Bath Room", tasks:["Sanitize toilet","Vacuum and/or mop","Wash shower, sink & mirrors","Wash towels and mats"]},
  {day:"Fri",room:"Dining",    tasks:["Clean off table","Vacuum and/or mop","Dust surfaces","Pick up clutter"]},
  {day:"Sat",room:"Entry",     tasks:["Sanitize door knobs","Dust surfaces","Vacuum and/or mop","Put away shoes/coats/hats"]},
  {day:"Sun",room:"Grocery",   tasks:["Clean out fridge","Meal plan","Grocery shop & fill gas tank","Meal prep"]},
];
const MONTHLY_TASKS=[
  {id:"m_fans",   label:"Dust ceiling fans"},
  {id:"m_oven",   label:"Clean oven"},
  {id:"m_fridge", label:"Clean inside of fridge"},
  {id:"m_windows",label:"Wash windows"},
  {id:"m_garage", label:"Pick up garage"},
  {id:"m_basement",label:"Pick up basement"},
  {id:"m_baseboards",label:"Dust/clean baseboards"},
  {id:"m_furniture",label:"Vacuum inside furniture"},
  {id:"m_vents",  label:"Dust air vents"},
  {id:"m_lights", label:"Clean light fixtures"},
];

// ─── WORKOUT DATA (science-based for healthy aging) ───────────────────────────
const WO_DAILY=[
  {id:"w_burpees",   label:"Burpees",            sets:"3×10",   note:"Full-body power + cardio"},
  {id:"w_pushups",   label:"Push-ups",            sets:"3×15",   note:"Chest, shoulders, triceps"},
  {id:"w_crunches",  label:"Crunches",            sets:"3×20",   note:"Core stability"},
  {id:"w_walkstand", label:"Walk or stand 30 min",sets:"1×",     note:"Reduces sedentary risk"},
  {id:"w_breathe",   label:"Diaphragmatic breathing",sets:"5 min",note:"Nervous system reset"},
];
const WO_WEEKLY=[
  {day:"Mon",focus:"Upper Push",color:"#f093fb",exercises:[
    {name:"Pike push-ups",sets:"3×10",note:"Shoulder strength & stability"},
    {name:"Diamond push-ups",sets:"3×10",note:"Tricep isolation"},
    {name:"Decline push-ups",sets:"3×12",note:"Upper chest activation"},
    {name:"Shoulder circles",sets:"2×20",note:"Rotator cuff health"},
  ]},
  {day:"Tue",focus:"Lower Body",color:"#43e97b",exercises:[
    {name:"Bodyweight squats",sets:"3×20",note:"Quad & glute strength"},
    {name:"Reverse lunges",sets:"3×12 each",note:"Balance + knee-friendly"},
    {name:"Glute bridges",sets:"3×15",note:"Posterior chain, low-back support"},
    {name:"Calf raises",sets:"3×20",note:"Ankle stability, circulation"},
    {name:"Wall sit",sets:"2×45s",note:"Isometric leg endurance"},
  ]},
  {day:"Wed",focus:"Mobility & Flexibility",color:"#60a5fa",exercises:[
    {name:"Cat-cow stretch",sets:"2×10",note:"Spinal mobility (evidence-based)"},
    {name:"90/90 hip stretch",sets:"2×60s each",note:"Hip flexor & rotator health"},
    {name:"Thoracic spine rotation",sets:"2×10 each",note:"Upper back mobility"},
    {name:"World's greatest stretch",sets:"3 each side",note:"Full-body mobility"},
    {name:"Standing quad stretch",sets:"60s each",note:"Knee & hip flexor relief"},
  ]},
  {day:"Thu",focus:"Pull & Back",color:"#feca57",exercises:[
    {name:"Pull-ups or band-assisted pull-ups",sets:"3×max",note:"Lat & bicep strength"},
    {name:"Australian rows (under table)",sets:"3×12",note:"Mid-back & rear delts"},
    {name:"Dead hangs",sets:"3×20-30s",note:"Spinal decompression, grip"},
    {name:"Superman hold",sets:"3×10",note:"Erector spinae endurance"},
    {name:"Doorframe bicep curl stretch",sets:"60s each",note:"Bicep & shoulder capsule"},
  ]},
  {day:"Fri",focus:"Core & Balance",color:"#f5576c",exercises:[
    {name:"Plank",sets:"3×30-60s",note:"Deep core stabilization"},
    {name:"Side plank",sets:"2×30s each",note:"Lateral core, hip abductors"},
    {name:"Bird-dog",sets:"3×10 each",note:"Spine stability, coordination"},
    {name:"Dead bug",sets:"3×8 each",note:"Anti-rotation core control"},
    {name:"Single-leg balance",sets:"2×30s each",note:"Fall prevention (critical for aging)"},
  ]},
  {day:"Sat",focus:"Full Body + Dumbbell",color:"#38bdf8",exercises:[
    {name:"Dumbbell Romanian deadlift",sets:"3×12",note:"Hamstrings, glutes, posture"},
    {name:"Dumbbell bent-over row",sets:"3×12",note:"Upper back & biceps"},
    {name:"Dumbbell overhead press",sets:"3×10",note:"Shoulder strength"},
    {name:"Goblet squat",sets:"3×12",note:"Hip mobility + leg strength"},
    {name:"Farmer's carry",sets:"3×30m",note:"Grip, core, posture"},
  ]},
  {day:"Sun",focus:"Active Recovery",color:"#a78bfa",exercises:[
    {name:"Gentle walk 20–30 min",sets:"1×",note:"Aerobic base, mood boost"},
    {name:"Child's pose",sets:"3×60s",note:"Spine & hip decompression"},
    {name:"Pigeon pose or figure-4",sets:"2×60s each",note:"Glute & piriformis release"},
    {name:"Neck rolls & shoulder shrugs",sets:"2×10",note:"Upper trap tension release"},
    {name:"Legs-up-the-wall",sets:"5 min",note:"Circulation & recovery"},
  ]},
];
const WO_MONTHLY=[
  {id:"wm_assess",  label:"Body movement assessment — note any pain/tightness"},
  {id:"wm_maxtest", label:"Max rep test: push-ups, pull-ups, plank hold"},
  {id:"wm_newstretch",label:"Try one new stretch or mobility drill"},
  {id:"wm_foam",    label:"Foam roll or deep tissue release (full body)"},
  {id:"wm_balance", label:"Balance challenge: eyes-closed single-leg 30s each"},
  {id:"wm_breathwork",label:"10-min breathwork session (box breathing or Wim Hof)"},
  {id:"wm_posture", label:"Posture photo check — compare month to month"},
  {id:"wm_sleep",   label:"Review sleep quality & adjust bedtime routine"},
];
function DayPlanner({plannerData,plannerViewDate,setPlannerViewDate,MOODS,getPlannerDay,setMood,setSlotText,setDayNote,TIME_SLOTS,plannerHistory,editingSlot,setEditingSlot,editingText,setEditingText,historyOpen,setHistoryOpen,cleanData,setCleanData,workoutData,setWorkoutData,journalData,setJournalData}){
  const today=getToday();
  const dayData=getPlannerDay(plannerViewDate);
  const activeMood=MOODS.find(m=>m.id===dayData.mood);
  const isToday=plannerViewDate===today;
  const[plannerTab,setPlannerTab]=useState("schedule");
  const[calOpen,setCalOpen]=useState(false);
  const[calMonth,setCalMonth]=useState(()=>{const d=new Date(plannerViewDate+"T12:00:00");return{y:d.getFullYear(),m:d.getMonth()};});

  // ─── SECRET JOURNAL ────────────────────────────────────────────────
  // Data structure: { journals: [ { id, pwHash, entries: {date:text} } ], activeIdx: 0 }
  // Old journals are archived and locked — only accessible with their original password.
  const[journalOpen,setJournalOpen]=useState(false);
  const[journalAuth,setJournalAuth]=useState(false);
  const[journalPwInput,setJournalPwInput]=useState("");
  const[journalPwError,setJournalPwError]=useState("");
  const[journalSetup,setJournalSetup]=useState(false);
  const[journalNewPw,setJournalNewPw]=useState("");
  const[journalConfirmPw,setJournalConfirmPw]=useState("");
  const[journalText,setJournalText]=useState("");
  const[journalViewDate,setJournalViewDate]=useState(today);
  const[journalSaved,setJournalSaved]=useState(false);
  const[journalBrowse,setJournalBrowse]=useState(false);
  const[journalShowFresh,setJournalShowFresh]=useState(false);
  const[journalViewArchive,setJournalViewArchive]=useState(null); // index of archived journal being viewed
  const[archivePwInput,setArchivePwInput]=useState("");
  const[archivePwError,setArchivePwError]=useState("");
  const[archiveUnlocked,setArchiveUnlocked]=useState(null); // index of unlocked archive
  const[archiveViewDate,setArchiveViewDate]=useState(null);
  const[showBackup,setShowBackup]=useState(false);
  const[restoreText,setRestoreText]=useState("");
  const[restoreError,setRestoreError]=useState("");
  const[restoreSuccess,setRestoreSuccess]=useState(false);

  const simpleHash=(str)=>{let h=0;for(let i=0;i<str.length;i++){h=((h<<5)-h)+str.charCodeAt(i);h|=0;}return String(h);};

  // Migrate old flat format to multi-journal format
  const migrateJournalData=(data)=>{
    if(data?.journals)return data; // already migrated
    // Old format: { entries: {...}, pwHash: "..." }
    const j={id:`j_${Date.now()}`,pwHash:data?.pwHash||null,entries:data?.entries||{}};
    return{journals:[j],activeIdx:0};
  };
  const jData=useMemo(()=>migrateJournalData(journalData),[journalData]);
  const activeJournal=jData.journals[jData.activeIdx]||{id:"j_0",pwHash:null,entries:{}};
  const hasPassword=!!activeJournal.pwHash;
  const hasEntries=Object.keys(activeJournal.entries||{}).length>0;
  const archivedJournals=jData.journals.filter((_,i)=>i!==jData.activeIdx);

  const updateActiveJournal=(updater)=>{
    setJournalData(p=>{
      const d=migrateJournalData(p);
      const journals=[...d.journals];
      journals[d.activeIdx]={...journals[d.activeIdx],...updater(journals[d.activeIdx])};
      return{...d,journals};
    });
  };

  const openJournal=()=>{
    setJournalOpen(true);
    setJournalPwInput("");setJournalPwError("");setJournalShowFresh(false);
    setJournalViewDate(today);setJournalViewArchive(null);setArchiveUnlocked(null);
    setArchivePwInput("");setArchivePwError("");setShowBackup(false);
    setRestoreText("");setRestoreError("");setRestoreSuccess(false);
    if(!hasPassword&&!hasEntries){
      setJournalSetup(true);setJournalAuth(true);setJournalText("");
    } else if(!hasPassword){
      setJournalAuth(true);setJournalSetup(false);
      setJournalText(activeJournal.entries?.[today]||"");
    } else {
      setJournalAuth(false);setJournalSetup(false);
    }
  };
  const unlockJournal=()=>{
    if(simpleHash(journalPwInput)===activeJournal.pwHash){
      setJournalAuth(true);setJournalPwError("");
      setJournalText(activeJournal.entries?.[today]||"");
      setJournalViewDate(today);setJournalShowFresh(false);
    } else {
      setJournalPwError("Wrong password.");
    }
  };
  const setPasswordFn=()=>{
    if(journalNewPw.length<1){setJournalPwError("Enter a password.");return;}
    if(journalNewPw!==journalConfirmPw){setJournalPwError("Passwords don't match.");return;}
    updateActiveJournal(j=>({pwHash:simpleHash(journalNewPw)}));
    setJournalSetup(false);setJournalAuth(true);setJournalPwError("");
    setJournalText(activeJournal.entries?.[today]||"");
    setJournalNewPw("");setJournalConfirmPw("");
  };
  const skipPassword=()=>{
    setJournalSetup(false);setJournalAuth(true);
    setJournalText(activeJournal.entries?.[today]||"");
  };
  // Start fresh: archive current journal, create new blank one
  const startFreshJournal=()=>{
    setJournalData(p=>{
      const d=migrateJournalData(p);
      const newJ={id:`j_${Date.now()}`,pwHash:null,entries:{}};
      return{journals:[...d.journals,newJ],activeIdx:d.journals.length};
    });
    setJournalShowFresh(false);setJournalAuth(false);setJournalSetup(true);
    setJournalText("");setJournalPwInput("");setJournalPwError("");
    // After creating, it will re-open to setup since no pw and no entries
    setJournalAuth(true);
  };
  const saveJournalEntry=()=>{
    updateActiveJournal(j=>{
      const entries={...(j.entries||{})};
      if(journalText.trim())entries[journalViewDate]=journalText;
      else delete entries[journalViewDate];
      return{entries};
    });
    setJournalSaved(true);setTimeout(()=>setJournalSaved(false),1500);
  };
  const navigateJournal=(date)=>{
    if(journalText.trim()!==((activeJournal.entries||{})[journalViewDate]||"")){
      updateActiveJournal(j=>{const entries={...(j.entries||{})};if(journalText.trim())entries[journalViewDate]=journalText;else delete entries[journalViewDate];return{entries};});
    }
    setJournalViewDate(date);
    setJournalText(activeJournal.entries?.[date]||"");
    setJournalBrowse(false);
  };
  const closeJournal=()=>{
    if(journalAuth&&!journalSetup&&journalText.trim()!==((activeJournal.entries||{})[journalViewDate]||"")){
      updateActiveJournal(j=>{const entries={...(j.entries||{})};if(journalText.trim())entries[journalViewDate]=journalText;else delete entries[journalViewDate];return{entries};});
    }
    setJournalOpen(false);setJournalAuth(false);setJournalBrowse(false);
    setJournalPwInput("");setJournalPwError("");setJournalText("");
    setJournalNewPw("");setJournalConfirmPw("");setJournalShowFresh(false);
    setJournalViewArchive(null);setArchiveUnlocked(null);setShowBackup(false);
    setJournalManagePw(false);setJournalCurrentPw("");
  };
  // Password management
  const[journalManagePw,setJournalManagePw]=useState(false);
  const[journalCurrentPw,setJournalCurrentPw]=useState("");
  const removePassword=()=>{
    if(!hasPassword){setJournalPwError("No password set.");return;}
    if(simpleHash(journalCurrentPw)!==activeJournal.pwHash){setJournalPwError("Current password is incorrect.");return;}
    updateActiveJournal(()=>({pwHash:null}));
    setJournalManagePw(false);setJournalCurrentPw("");setJournalPwError("");
  };
  const changePassword=()=>{
    if(hasPassword&&simpleHash(journalCurrentPw)!==activeJournal.pwHash){setJournalPwError("Current password is incorrect.");return;}
    if(journalNewPw.length<1){setJournalPwError("Enter a new password.");return;}
    if(journalNewPw!==journalConfirmPw){setJournalPwError("New passwords don't match.");return;}
    updateActiveJournal(()=>({pwHash:simpleHash(journalNewPw)}));
    setJournalManagePw(false);setJournalCurrentPw("");setJournalNewPw("");setJournalConfirmPw("");setJournalPwError("");
  };
  // Favorites
  const toggleFavorite=(date)=>{
    setJournalData(p=>{
      const d=migrateJournalData(p);
      const journals=[...d.journals];
      const j={...journals[d.activeIdx]};
      const favs=new Set(j.favorites||[]);
      if(favs.has(date))favs.delete(date);else favs.add(date);
      j.favorites=[...favs];
      journals[d.activeIdx]=j;
      return{...d,journals};
    });
  };
  const isFavorite=(date)=>(activeJournal.favorites||[]).includes(date);
  // Archive access
  const unlockArchive=(idx)=>{
    const arch=jData.journals[idx];
    if(!arch)return;
    if(!arch.pwHash){setArchiveUnlocked(idx);setArchiveViewDate(Object.keys(arch.entries||{}).sort((a,b)=>b.localeCompare(a))[0]||null);return;}
    if(simpleHash(archivePwInput)===arch.pwHash){
      setArchiveUnlocked(idx);setArchivePwError("");
      setArchiveViewDate(Object.keys(arch.entries||{}).sort((a,b)=>b.localeCompare(a))[0]||null);
    } else {
      setArchivePwError("Wrong password for this journal.");
    }
  };
  // Backup: export all app data as JSON
  const exportBackup=()=>{
    const backup={_zobuddy_backup:true,_version:14,_date:new Date().toISOString()};
    const keys=["zodibuddies_v1","zodibuddy_planner_v1","zodibuddy_clean_v1","zodibuddy_workout_v1","zodibuddy_budget_v1","zodibuddy_journal_v1","zodibuddy_notebook_v1","zodibuddy_flashcards_v1","zodibuddy_fc_archive_v1","zodibuddy_learnfavs_v1","zodibuddy_news_v1","zo_best_bubbles","zo_best_breakout","zo_best_breakout_time","zo_best_memory","zo_best_mines"];
    keys.forEach(k=>{try{const v=localStorage.getItem(k);if(v)backup[k]=JSON.parse(v);}catch{try{backup[k]=localStorage.getItem(k);}catch{}}});
    const blob=new Blob([JSON.stringify(backup,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);const a=document.createElement("a");
    a.href=url;a.download=`zobuddy_backup_${today}.json`;document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);
  };
  const importBackup=()=>{
    setRestoreError("");setRestoreSuccess(false);
    try{
      const data=JSON.parse(restoreText);
      if(!data?._zobuddy_backup){setRestoreError("Not a valid Zobuddy backup file.");return;}
      const keyMap={"app":"zodibuddies_v1","planner":"zodibuddy_planner_v1","clean":"zodibuddy_clean_v1","workout":"zodibuddy_workout_v1","budget":"zodibuddy_budget_v1","journal":"zodibuddy_journal_v1"};
      Object.entries(keyMap).forEach(([field,key])=>{if(data[field])localStorage.setItem(key,JSON.stringify(data[field]));});
      const allKeys=["zodibuddies_v1","zodibuddy_planner_v1","zodibuddy_clean_v1","zodibuddy_workout_v1","zodibuddy_budget_v1","zodibuddy_journal_v1","zodibuddy_notebook_v1","zodibuddy_flashcards_v1","zodibuddy_fc_archive_v1","zodibuddy_learnfavs_v1","zodibuddy_news_v1","zo_best_bubbles","zo_best_breakout","zo_best_breakout_time","zo_best_memory","zo_best_mines"];
      allKeys.forEach(k=>{if(data[k]!=null)localStorage.setItem(k,typeof data[k]==="string"?data[k]:JSON.stringify(data[k]));});
      setRestoreSuccess(true);
      setTimeout(()=>window.location.reload(),1500);
    }catch(e){setRestoreError("Invalid JSON. Paste the full backup file contents.");}
  };
  const importBackupFile=()=>{
    const input=document.createElement("input");
    input.type="file";input.accept=".json";
    input.onchange=(e)=>{
      const file=e.target.files[0];if(!file)return;
      const reader=new FileReader();
      reader.onload=(ev)=>{setRestoreText(ev.target.result);};
      reader.readAsText(file);
    };
    input.click();
  };

  const journalDates=useMemo(()=>Object.keys(activeJournal.entries||{}).sort((a,b)=>b.localeCompare(a)),[activeJournal]);
  const fmtJDate=(d)=>{if(d===today)return"Today";const dt=new Date(d+"T12:00:00");return dt.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});};
  const isJournalToday=journalViewDate===today;

  // ── Cleaning checklist state helpers ──
  const nowD=new Date();
  const[cleanMonth,setCleanMonth]=useState(()=>({y:nowD.getFullYear(),m:nowD.getMonth()})); // 0-indexed month
  const monthKey=`${cleanMonth.y}-${String(cleanMonth.m+1).padStart(2,"0")}`;
  const getCleanMonth=()=>({daily:{},weekly:{},monthly:{},customMonthly:[],...(cleanData[monthKey]||{})});

  const toggleDaily=(weekKey,taskId,day)=>{
    setCleanData(p=>{
      const mo={...getCleanMonth(),...p[monthKey]};
      const wk={...(mo.daily[weekKey]||{})};
      if(day){
        // New per-day format: wk[taskId] = {Mon:true, Tue:false, ...}
        const taskDays=typeof wk[taskId]==="object"&&wk[taskId]!==null&&wk[taskId]!==true?{...wk[taskId]}:{};
        taskDays[day]=!taskDays[day];
        wk[taskId]=taskDays;
      } else {
        // Legacy single toggle
        wk[taskId]=!wk[taskId];
      }
      return{...p,[monthKey]:{...mo,daily:{...mo.daily,[weekKey]:wk}}};
    });
  };
  const isDailyDone=(wData,taskId,day)=>{
    const v=wData[taskId];
    if(!v)return false;
    if(typeof v==="object"&&v!==null)return !!v[day];
    return !!v; // legacy boolean
  };
  const dailyDoneCount=(wData,taskId)=>{
    const v=wData[taskId];
    if(!v)return 0;
    if(typeof v==="object"&&v!==null)return Object.values(v).filter(Boolean).length;
    return v?7:0;
  };
  const DAYS_SHORT=["M","T","W","T","F","S","S"];
  const DAYS_FULL=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const toggleWeekly=(weekKey,roomDay,taskIdx)=>{
    setCleanData(p=>{
      const mo={...getCleanMonth(),...p[monthKey]};
      const key=`${weekKey}_${roomDay}`;
      const wk={...(mo.weekly[key]||{})};
      wk[taskIdx]=!wk[taskIdx];
      return{...p,[monthKey]:{...mo,weekly:{...mo.weekly,[key]:wk}}};
    });
  };
  const toggleMonthly=(taskId)=>{
    setCleanData(p=>{
      const mo={...getCleanMonth(),...p[monthKey]};
      const mt={...mo.monthly};
      mt[taskId]=!mt[taskId];
      return{...p,[monthKey]:{...mo,monthly:mt}};
    });
  };
  const toggleCustomMonthly=(idx)=>{
    setCleanData(p=>{
      const mo={...getCleanMonth(),...p[monthKey]};
      const list=[...(mo.customMonthly||[])];
      list[idx]={...list[idx],done:!list[idx].done};
      return{...p,[monthKey]:{...mo,customMonthly:list}};
    });
  };
  const addCustomMonthly=(text)=>{
    if(!text.trim())return;
    setCleanData(p=>{
      const mo={...getCleanMonth(),...p[monthKey]};
      return{...p,[monthKey]:{...mo,customMonthly:[...(mo.customMonthly||[]),{text:text.trim(),done:false}]}};
    });
  };
  const clearCustomMonthly=(idx)=>{
    setCleanData(p=>{
      const mo={...getCleanMonth(),...p[monthKey]};
      const list=[...(mo.customMonthly||[])];
      list.splice(idx,1);
      return{...p,[monthKey]:{...mo,customMonthly:list}};
    });
  };

  // Carry undone custom monthly tasks forward to next month
  const carryForward=()=>{
    const mo=getCleanMonth();
    const undone=(mo.customMonthly||[]).filter(t=>!t.done).map(t=>({...t,done:false}));
    if(!undone.length)return;
    const next=new Date(cleanMonth.y,cleanMonth.m+1,1);
    const nk=`${next.getFullYear()}-${String(next.getMonth()+1).padStart(2,"0")}`;
    setCleanData(p=>{
      const nmo={daily:{},weekly:{},monthly:{},customMonthly:[],...(p[nk]||{})};
      const existing=nmo.customMonthly||[];
      const merged=[...existing,...undone.filter(u=>!existing.some(e=>e.text===u.text))];
      return{...p,[nk]:{...nmo,customMonthly:merged}};
    });
    alert(`✅ ${undone.length} unfinished task${undone.length>1?"s":""} carried to next month!`);
  };

  // Build week list for current month view
  const weeksInMonth=useMemo(()=>{
    const weeks=[];
    const first=new Date(cleanMonth.y,cleanMonth.m,1);
    const last=new Date(cleanMonth.y,cleanMonth.m+1,0);
    // Advance to the Monday on or before the first of the month
    const cur=new Date(first);
    const dow=cur.getDay(); // 0=Sun,1=Mon,...
    cur.setDate(cur.getDate() - (dow===0?6:dow-1));
    while(cur<=last){
      const wStart=new Date(cur);
      const label=`Week of ${wStart.toLocaleDateString("en-US",{month:"short",day:"numeric"})}`;
      const key=toDateStr(wStart);
      weeks.push({label,key,start:new Date(wStart)});
      cur.setDate(cur.getDate()+7);
    }
    return weeks;
  },[cleanMonth]);

  const[openWeek,setOpenWeek]=useState(()=>toDateStr(new Date(new Date().getFullYear(),new Date().getMonth(),1)));
  const[newCustom,setNewCustom]=useState("");
  const[showCarryConfirm,setShowCarryConfirm]=useState(false);

  const MONTH_NAMES=["January","February","March","April","May","June","July","August","September","October","November","December"];
  const moData=getCleanMonth();
  const monthlyDone=MONTHLY_TASKS.filter(t=>moData.monthly[t.id]).length+((moData.customMonthly||[]).filter(t=>t.done).length);
  const monthlyTotal=MONTHLY_TASKS.length+(moData.customMonthly||[]).length;

  const fmtDisplayDate=(d)=>{
    const dt=new Date(d+"T12:00:00");
    return dt.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});
  };
  const fmtHistoryLabel=(d)=>{
    if(d===today)return"Today";
    const dt=new Date(d+"T12:00:00"),now=new Date();
    const diff=Math.round((now-dt)/86400000);
    if(diff===1)return"Yesterday";
    return fmtDisplayDate(d);
  };

  const commitEdit=()=>{
    if(editingSlot){setSlotText(editingSlot.date,editingSlot.slot,editingText);setEditingSlot(null);setEditingText("");}
  };
  const openSlot=(slot)=>{
    if(editingSlot)commitEdit();
    setEditingSlot({date:plannerViewDate,slot});
    setEditingText(dayData.slots?.[slot]||"");
  };

  const listRef=React.useRef(null);
  useEffect(()=>{
    if(!isToday||!listRef.current||plannerTab!=="schedule")return;
    const now=new Date();const h=now.getHours(),m=now.getMinutes();
    const idx=(h*2)+(m>=30?1:0);const el=listRef.current.children[idx];
    if(el)el.scrollIntoView({block:"center",behavior:"instant"});
  },[plannerViewDate,plannerTab]);

  const currentSlotKey=(()=>{const now=new Date();const h=String(now.getHours()).padStart(2,"0"),m=now.getMinutes()>=30?"30":"00";return`${h}:${m}`;})();

  // shared style helpers
  const checkBox=(done,color="#667eea")=>(
    <div style={{width:18,height:18,borderRadius:5,flexShrink:0,
      border:`2px solid ${done?color:"rgba(255,255,255,.15)"}`,
      background:done?color:"transparent",
      display:"flex",alignItems:"center",justifyContent:"center",
      fontSize:15,color:"#fff",transition:"all .15s"}}>{done&&"✓"}</div>
  );

  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",background:"linear-gradient(180deg,#0a0a1a 0%,#121228 40%,#1a1040 100%)"}}>
      <style>{`
        @keyframes slotPulse{0%,100%{box-shadow:0 0 0 0 rgba(102,126,234,.4)}50%{box-shadow:0 0 0 4px rgba(102,126,234,.1)}}
        @keyframes moodPop{0%{transform:scale(.8);opacity:0}60%{transform:scale(1.15)}100%{transform:scale(1);opacity:1}}
        .mood-swatch{transition:transform .15s,box-shadow .15s;}
        .mood-swatch:hover{transform:scale(1.12);}
        .slot-row{transition:background .15s;}
        .slot-row:hover{background:rgba(255,255,255,.04)!important;}
        textarea:focus{outline:none;}
        .hist-row{transition:background .15s;}
        .hist-row:hover{background:rgba(255,255,255,.05)!important;}
        .clean-item{transition:background .12s;}
        .clean-item:hover{background:rgba(255,255,255,.04)!important;}
        .week-header{transition:background .12s;}
        .week-header:hover{background:rgba(255,255,255,.04)!important;}
      `}</style>

      {/* ── Inner tab bar: Schedule | Clean | Workout ── */}
      <div style={{display:"flex",gap:0,borderBottom:"1px solid rgba(255,255,255,.06)",flexShrink:0,background:"rgba(0,0,0,.2)"}}>
        {[{id:"schedule",label:"📅 Schedule"},{id:"clean",label:"🧹 Cleaning"},{id:"workout",label:"💪 Workout"}].map(t=>{
          const a=plannerTab===t.id;
          return <button key={t.id} onClick={()=>setPlannerTab(t.id)}
            style={{flex:1,padding:"9px 0",background:"none",border:"none",cursor:"pointer",
              fontSize:14,fontWeight:800,color:a?"#e8e0f0":"rgba(255,255,255,.3)",
              borderBottom:a?"2px solid #667eea":"2px solid transparent",transition:"all .15s"}}>
            {t.label}
          </button>;
        })}
      </div>

      {/* ════════════════════════════════════════════
          SCHEDULE TAB
      ════════════════════════════════════════════ */}
      {plannerTab==="schedule"&&<>
        {/* Date nav */}
        <div style={{padding:"10px 16px 8px",display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
          <button onClick={()=>{const d=new Date(plannerViewDate+"T12:00:00");d.setDate(d.getDate()-1);setPlannerViewDate(toDateStr(d));setCalOpen(false);}}
            style={{background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.1)",borderRadius:8,padding:"5px 10px",color:"#ccc",fontSize:16,cursor:"pointer",fontWeight:700}}>‹</button>
          <div onClick={()=>{setCalOpen(!calOpen);setCalMonth({y:new Date(plannerViewDate+"T12:00:00").getFullYear(),m:new Date(plannerViewDate+"T12:00:00").getMonth()});}} style={{flex:1,textAlign:"center",cursor:"pointer"}}>
            <div style={{fontSize:16,fontWeight:800,color:calOpen?"#a8b4f0":"#e8e0f0"}}>{isToday?"Today — ":""}{fmtDisplayDate(plannerViewDate)} {calOpen?"▲":"▼"}</div>
            {!isToday&&!calOpen&&<button onClick={e=>{e.stopPropagation();setPlannerViewDate(today);}} style={{background:"none",border:"none",color:"rgba(102,126,234,.8)",fontSize:13,cursor:"pointer",fontWeight:700,padding:0,marginTop:1}}>↩ Back to today</button>}
          </div>
          <button onClick={()=>{const d=new Date(plannerViewDate+"T12:00:00");d.setDate(d.getDate()+1);setPlannerViewDate(toDateStr(d));setCalOpen(false);}}
            style={{background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.1)",borderRadius:8,padding:"5px 10px",color:"#ccc",fontSize:16,cursor:"pointer",fontWeight:700}}>›</button>
          <button onClick={()=>setHistoryOpen(h=>!h)}
            style={{background:historyOpen?"rgba(102,126,234,.2)":"rgba(255,255,255,.07)",border:`1px solid ${historyOpen?"rgba(102,126,234,.4)":"rgba(255,255,255,.1)"}`,borderRadius:8,padding:"5px 9px",color:"#ccc",fontSize:15,cursor:"pointer",fontWeight:700}}>📋</button>
        </div>

        {/* Mini calendar */}
        {calOpen&&<div style={{padding:"0 16px 10px",flexShrink:0}}>
          <div style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.06)",borderRadius:14,padding:"10px 8px"}}>
            {/* Month nav */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
              <button onClick={()=>setCalMonth(p=>({y:p.m===0?p.y-1:p.y,m:p.m===0?11:p.m-1}))} style={{background:"none",border:"none",color:"#a8b4f0",fontSize:18,cursor:"pointer",padding:"2px 8px"}}>‹</button>
              <div style={{fontSize:14,fontWeight:800,color:"#e8e0f0"}}>{["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][calMonth.m]} {calMonth.y}</div>
              <button onClick={()=>setCalMonth(p=>({y:p.m===11?p.y+1:p.y,m:p.m===11?0:p.m+1}))} style={{background:"none",border:"none",color:"#a8b4f0",fontSize:18,cursor:"pointer",padding:"2px 8px"}}>›</button>
            </div>
            {/* Day headers */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:4}}>
              {["M","T","W","T","F","S","S"].map((d,i)=>(
                <div key={i} style={{textAlign:"center",fontSize:10,fontWeight:800,opacity:.3,padding:"2px 0"}}>{d}</div>
              ))}
            </div>
            {/* Days grid */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
              {(()=>{
                const first=new Date(calMonth.y,calMonth.m,1);
                const lastDay=new Date(calMonth.y,calMonth.m+1,0).getDate();
                let startDow=first.getDay();startDow=startDow===0?6:startDow-1; // Mon=0
                const cells=[];
                for(let i=0;i<startDow;i++)cells.push(<div key={"e"+i}/>);
                for(let d=1;d<=lastDay;d++){
                  const ds=`${calMonth.y}-${String(calMonth.m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
                  const isSel=ds===plannerViewDate;
                  const isTod=ds===today;
                  const hasData=plannerData[ds]&&(plannerData[ds].mood||plannerData[ds].note||(plannerData[ds].slots&&Object.keys(plannerData[ds].slots).length>0));
                  cells.push(
                    <button key={d} onClick={()=>{setPlannerViewDate(ds);setCalOpen(false);}}
                      style={{background:isSel?"linear-gradient(135deg,#667eea,#764ba2)":hasData?"rgba(102,126,234,.12)":"transparent",
                        border:isTod&&!isSel?"2px solid rgba(254,202,87,.5)":"1px solid transparent",
                        borderRadius:8,padding:"6px 0",fontSize:13,fontWeight:isSel?800:hasData?700:400,
                        color:isSel?"#fff":isTod?"#feca57":hasData?"#a8b4f0":"rgba(255,255,255,.4)",
                        cursor:"pointer",textAlign:"center",position:"relative"}}>
                      {d}
                      {hasData&&!isSel&&<div style={{position:"absolute",bottom:2,left:"50%",transform:"translateX(-50%)",width:4,height:4,borderRadius:2,background:"#667eea"}}/>}
                    </button>
                  );
                }
                return cells;
              })()}
            </div>
            {/* Quick jumps */}
            <div style={{display:"flex",gap:6,marginTop:8,justifyContent:"center"}}>
              <button onClick={()=>{setPlannerViewDate(today);setCalOpen(false);}} style={{background:"rgba(254,202,87,.1)",border:"1px solid rgba(254,202,87,.2)",borderRadius:8,padding:"5px 12px",fontSize:12,fontWeight:700,color:"#feca57",cursor:"pointer"}}>Today</button>
            </div>
          </div>
        </div>}

        {/* Mood */}
        <div style={{padding:"0 16px 8px",flexShrink:0}}>
          <div style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.06)",borderRadius:14,padding:"10px 14px"}}>
            <div style={{fontSize:13,fontWeight:800,opacity:.35,letterSpacing:1,marginBottom:8}}>TODAY'S MOOD</div>
            <div style={{display:"flex",gap:6,justifyContent:"space-between"}}>
              {MOODS.map(m=>{const active=dayData.mood===m.id;return(
                <button key={m.id} className="mood-swatch" onClick={()=>setMood(plannerViewDate,m.id)}
                  style={{flex:1,minHeight:42,borderRadius:10,border:`2px solid ${active?m.color:"rgba(255,255,255,.08)"}`,
                    background:active?`rgba(${m.glow},.22)`:"rgba(255,255,255,.03)",cursor:"pointer",
                    display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2,padding:"6px 2px",
                    boxShadow:active?`0 0 10px rgba(${m.glow},.35)`:"none",animation:active?"moodPop .3s ease":"none"}}>
                  <div style={{width:14,height:14,borderRadius:"50%",background:m.color,opacity:active?1:.45,boxShadow:active?`0 0 6px ${m.color}`:"none",transition:"all .2s",flexShrink:0}}/>
                  <div style={{fontSize:10,fontWeight:800,color:active?m.color:"rgba(255,255,255,.3)",letterSpacing:.3}}>{m.label}</div>
                </button>);
              })}
            </div>
            {activeMood&&<div style={{marginTop:7,fontSize:14,color:activeMood.color,fontWeight:700,textAlign:"center",opacity:.8}}>Feeling {activeMood.label.toLowerCase()} today ●</div>}
          </div>
        </div>

        {/* Day note */}
        <div style={{padding:"0 16px 8px",flexShrink:0}}>
          <textarea value={dayData.note||""} onChange={e=>setDayNote(plannerViewDate,e.target.value)}
            placeholder="✏️  Day note — intentions, reflections, anything…" rows={2}
            style={{width:"100%",background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.07)",borderRadius:12,
              padding:"9px 12px",color:"#e8e0f0",fontSize:15,resize:"none",fontFamily:"'Nunito','Segoe UI',sans-serif",lineHeight:1.5,outline:"none"}}/>
        </div>

        {/* Timeline */}
        <div ref={listRef} style={{flex:1,overflowY:"auto",padding:"0 16px 8px"}}>
          {TIME_SLOTS.map(({key,label})=>{
            const hasText=!!(dayData.slots?.[key]);
            const isEditing=editingSlot?.slot===key&&editingSlot?.date===plannerViewDate;
            const isCurrent=isToday&&key===currentSlotKey;
            return(
              <div key={key} className="slot-row" onClick={()=>!isEditing&&openSlot(key)}
                style={{display:"flex",alignItems:"flex-start",gap:8,minHeight:36,padding:"4px 0",
                  borderBottom:"1px solid rgba(255,255,255,.035)",cursor:"text",
                  background:isCurrent?"rgba(102,126,234,.06)":"transparent",
                  animation:isCurrent?"slotPulse 2s ease-in-out infinite":"none",borderRadius:4}}>
                <div style={{width:38,flexShrink:0,paddingTop:2,textAlign:"right"}}>
                  <span style={{fontSize:14,fontWeight:isCurrent?800:600,
                    color:isCurrent?"#667eea":key.endsWith(":00")?"rgba(255,255,255,.45)":"rgba(255,255,255,.18)",
                    fontFamily:"monospace"}}>{label}</span>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  {isEditing?(
                    <textarea autoFocus value={editingText} onChange={e=>setEditingText(e.target.value)}
                      onBlur={commitEdit} onKeyDown={e=>{if(e.key==="Escape"){setEditingSlot(null);setEditingText("");}}}
                      placeholder="What's happening…"
                      style={{width:"100%",background:"rgba(102,126,234,.1)",border:"1px solid rgba(102,126,234,.35)",
                        borderRadius:8,padding:"5px 8px",color:"#e8e0f0",fontSize:15,resize:"none",
                        fontFamily:"'Nunito','Segoe UI',sans-serif",lineHeight:1.5,minHeight:52,outline:"none"}}/>
                  ):(
                    hasText
                      ?<div style={{fontSize:15,color:"#e8e0f0",lineHeight:1.5,padding:"2px 8px",background:"rgba(102,126,234,.09)",
                          borderRadius:8,border:"1px solid rgba(102,126,234,.15)",whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{dayData.slots[key]}</div>
                      :isCurrent?<div style={{fontSize:13,color:"rgba(102,126,234,.5)",padding:"2px 0",fontStyle:"italic"}}>← now</div>
                      :<div style={{height:20}}/>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* History overlay */}
        {historyOpen&&<div style={{position:"absolute",top:0,left:0,right:0,bottom:60,zIndex:50,
            background:"linear-gradient(180deg,#0d0d20,#12122a)",overflowY:"auto",padding:"14px 16px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <div onClick={openJournal} style={{fontSize:15,fontWeight:900,background:"linear-gradient(135deg,#667eea,#f093fb)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",cursor:"pointer",userSelect:"none"}}>📋 History</div>
            <button onClick={()=>setHistoryOpen(false)} style={{background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.1)",borderRadius:8,padding:"4px 10px",color:"#ccc",fontSize:15,cursor:"pointer",fontWeight:700}}>✕ Close</button>
          </div>
          {plannerHistory.length===0&&<div style={{textAlign:"center",opacity:.3,fontSize:16,marginTop:40}}>No planner entries yet.<br/>Start planning to build your history!</div>}
          {plannerHistory.map(date=>{
            const d=plannerData[date]||{};
            const mood=MOODS.find(m=>m.id===d.mood);
            const slotCount=Object.keys(d.slots||{}).length;
            const firstEntry=Object.entries(d.slots||{}).sort((a,b)=>a[0].localeCompare(b[0]))[0];
            return(
              <div key={date} className="hist-row" onClick={()=>{setPlannerViewDate(date);setHistoryOpen(false);}}
                style={{padding:"10px 12px",borderRadius:12,marginBottom:6,cursor:"pointer",background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.06)"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                  <div style={{fontSize:16,fontWeight:800,color:"#e8e0f0"}}>{fmtHistoryLabel(date)}</div>
                  {mood&&<div style={{width:10,height:10,borderRadius:"50%",background:mood.color,boxShadow:`0 0 5px ${mood.color}`,flexShrink:0}}/>}
                  {mood&&<div style={{fontSize:13,color:mood.color,fontWeight:700}}>{mood.label}</div>}
                  <div style={{marginLeft:"auto",fontSize:13,opacity:.3,fontFamily:"monospace"}}>{date}</div>
                </div>
                {d.note&&<div style={{fontSize:14,opacity:.5,marginBottom:3,fontStyle:"italic",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>"{d.note}"</div>}
                {slotCount>0&&<div style={{fontSize:13,opacity:.35}}>{slotCount} time slot{slotCount!==1?"s":""} planned{firstEntry?` · starts ${firstEntry[0]}`:""}</div>}
              </div>
            );
          })}
        </div>}

        {/* ═══ SECRET JOURNAL OVERLAY ═══ */}
        {journalOpen&&<div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,.95)",display:"flex",flexDirection:"column"}} onClick={closeJournal}>
          <div onClick={e=>e.stopPropagation()} style={{flex:1,display:"flex",flexDirection:"column",maxWidth:420,width:"100%",margin:"0 auto",overflow:"hidden"}}>

            {/* ── PASSWORD GATE ── */}
            {!journalAuth&&hasPassword&&!journalSetup&&(
              <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"0 32px"}}>
                <div style={{fontSize:32,marginBottom:12}}>🔒</div>
                <div style={{fontSize:16,fontWeight:900,color:"#e8e0f0",marginBottom:4}}>Private Journal</div>
                <div style={{fontSize:15,opacity:.4,marginBottom:20}}>Enter your password to continue</div>
                <input autoFocus type="password" value={journalPwInput} onChange={e=>{setJournalPwInput(e.target.value);setJournalPwError("");}}
                  onKeyDown={e=>{if(e.key==="Enter")unlockJournal();}}
                  placeholder="Password"
                  style={{width:"100%",maxWidth:240,padding:"12px 16px",borderRadius:12,border:"1px solid rgba(102,126,234,.3)",background:"rgba(255,255,255,.04)",color:"#e8e0f0",fontSize:15,outline:"none",textAlign:"center",fontFamily:"'Nunito',sans-serif",letterSpacing:2}}/>
                {journalPwError&&<div style={{fontSize:15,color:"#f5576c",marginTop:8,fontWeight:700}}>{journalPwError}</div>}
                <button onClick={unlockJournal} style={{marginTop:14,background:"linear-gradient(135deg,#667eea,#764ba2)",color:"#fff",border:"none",borderRadius:12,padding:"10px 32px",fontSize:16,fontWeight:700,cursor:"pointer"}}>Unlock</button>

                {/* Forgot password / Start fresh */}
                {!journalShowFresh?
                  <button onClick={()=>setJournalShowFresh(true)} style={{marginTop:16,background:"none",border:"none",color:"rgba(255,255,255,.2)",fontSize:14,cursor:"pointer"}}>Forgot password?</button>
                :<div style={{marginTop:16,background:"rgba(245,87,108,.06)",border:"1px solid rgba(245,87,108,.12)",borderRadius:14,padding:14,width:"100%",maxWidth:280,textAlign:"center"}}>
                  <div style={{fontSize:15,opacity:.6,lineHeight:1.6,marginBottom:10}}>You can start a new journal. Your old entries stay archived — you'll only be able to read them if you remember the password.</div>
                  <div style={{display:"flex",gap:6,justifyContent:"center"}}>
                    <button onClick={()=>setJournalShowFresh(false)} style={{background:"rgba(255,255,255,.06)",color:"#999",border:"1px solid rgba(255,255,255,.08)",borderRadius:10,padding:"8px 16px",fontSize:15,fontWeight:600,cursor:"pointer"}}>Cancel</button>
                    <button onClick={startFreshJournal} style={{background:"linear-gradient(135deg,#f5576c,#ff8a65)",color:"#fff",border:"none",borderRadius:10,padding:"8px 16px",fontSize:15,fontWeight:700,cursor:"pointer"}}>Start Fresh</button>
                  </div>
                </div>}

                <button onClick={closeJournal} style={{marginTop:12,background:"none",border:"none",color:"rgba(255,255,255,.2)",fontSize:14,cursor:"pointer"}}>Cancel</button>
              </div>
            )}

            {/* ── PASSWORD SETUP ── */}
            {journalAuth&&journalSetup&&(
              <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"0 32px"}}>
                <div style={{fontSize:32,marginBottom:12}}>✍️</div>
                <div style={{fontSize:16,fontWeight:900,color:"#e8e0f0",marginBottom:4}}>Set Up Your Journal</div>
                <div style={{fontSize:15,opacity:.4,marginBottom:20,textAlign:"center",lineHeight:1.5}}>Protect your entries with a password?<br/>You can skip this and add one later.</div>
                <input autoFocus type="password" value={journalNewPw} onChange={e=>{setJournalNewPw(e.target.value);setJournalPwError("");}}
                  placeholder="Create password"
                  style={{width:"100%",maxWidth:240,padding:"12px 16px",borderRadius:12,border:"1px solid rgba(102,126,234,.3)",background:"rgba(255,255,255,.04)",color:"#e8e0f0",fontSize:15,outline:"none",textAlign:"center",fontFamily:"'Nunito',sans-serif",letterSpacing:2,marginBottom:8}}/>
                <input type="password" value={journalConfirmPw} onChange={e=>{setJournalConfirmPw(e.target.value);setJournalPwError("");}}
                  onKeyDown={e=>{if(e.key==="Enter")setPasswordFn();}}
                  placeholder="Confirm password"
                  style={{width:"100%",maxWidth:240,padding:"12px 16px",borderRadius:12,border:"1px solid rgba(102,126,234,.3)",background:"rgba(255,255,255,.04)",color:"#e8e0f0",fontSize:15,outline:"none",textAlign:"center",fontFamily:"'Nunito',sans-serif",letterSpacing:2}}/>
                {journalPwError&&<div style={{fontSize:15,color:"#f5576c",marginTop:8,fontWeight:700}}>{journalPwError}</div>}
                <div style={{display:"flex",gap:8,marginTop:16}}>
                  <button onClick={skipPassword} style={{background:"rgba(255,255,255,.06)",color:"#999",border:"1px solid rgba(255,255,255,.08)",borderRadius:12,padding:"10px 20px",fontSize:16,fontWeight:600,cursor:"pointer"}}>Skip</button>
                  <button onClick={setPasswordFn} style={{background:"linear-gradient(135deg,#667eea,#764ba2)",color:"#fff",border:"none",borderRadius:12,padding:"10px 24px",fontSize:16,fontWeight:700,cursor:"pointer"}}>Set Password</button>
                </div>
              </div>
            )}

            {/* ── ARCHIVE VIEWER (reading old locked journals) ── */}
            {journalViewArchive!==null&&(()=>{
              const arch=jData.journals[journalViewArchive];
              if(!arch)return null;
              const needsPw=!!arch.pwHash&&archiveUnlocked!==journalViewArchive;
              const archDates=Object.keys(arch.entries||{}).sort((a,b)=>b.localeCompare(a));
              const archEntry=archiveViewDate?(arch.entries||{})[archiveViewDate]||"":"";
              return(
                <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
                  <div style={{padding:"12px 16px 6px",display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                    <button onClick={()=>{setJournalViewArchive(null);setArchiveUnlocked(null);setArchivePwInput("");setArchivePwError("");}} style={{background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.1)",borderRadius:8,padding:"5px 10px",color:"#ccc",fontSize:16,cursor:"pointer",fontWeight:700}}>← Back</button>
                    <div style={{fontSize:16,fontWeight:900,color:"#e8e0f0"}}>🗃️ Archived Journal</div>
                    <div style={{marginLeft:"auto",fontSize:13,opacity:.3}}>{archDates.length} entries</div>
                  </div>
                  {needsPw?(
                    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"0 32px"}}>
                      <div style={{fontSize:28,marginBottom:10}}>🔐</div>
                      <div style={{fontSize:16,fontWeight:800,color:"#e8e0f0",marginBottom:4}}>This journal is locked</div>
                      <div style={{fontSize:14,opacity:.4,marginBottom:16}}>Enter the original password to read these entries</div>
                      <input autoFocus type="password" value={archivePwInput} onChange={e=>{setArchivePwInput(e.target.value);setArchivePwError("");}}
                        onKeyDown={e=>{if(e.key==="Enter")unlockArchive(journalViewArchive);}}
                        placeholder="Password"
                        style={{width:"100%",maxWidth:220,padding:"10px 14px",borderRadius:12,border:"1px solid rgba(254,202,87,.3)",background:"rgba(255,255,255,.04)",color:"#feca57",fontSize:16,outline:"none",textAlign:"center",letterSpacing:2}}/>
                      {archivePwError&&<div style={{fontSize:15,color:"#f5576c",marginTop:6,fontWeight:700}}>{archivePwError}</div>}
                      <button onClick={()=>unlockArchive(journalViewArchive)} style={{marginTop:10,background:"linear-gradient(135deg,#feca57,#ff8a65)",color:"#1a1a2e",border:"none",borderRadius:10,padding:"8px 24px",fontSize:16,fontWeight:700,cursor:"pointer"}}>Unlock</button>
                    </div>
                  ):(
                    <div style={{flex:1,overflowY:"auto",padding:"0 16px 16px"}}>
                      {archDates.length===0?<div style={{textAlign:"center",opacity:.3,fontSize:16,marginTop:40}}>This journal is empty.</div>
                      :archDates.map(d=>{
                        const txt=(arch.entries||{})[d]||"";
                        const isActive=d===archiveViewDate;
                        return(
                          <div key={d} onClick={()=>setArchiveViewDate(isActive?null:d)}
                            style={{marginBottom:6,borderRadius:12,border:isActive?"1px solid rgba(254,202,87,.25)":"1px solid rgba(255,255,255,.06)",background:isActive?"rgba(254,202,87,.06)":"rgba(255,255,255,.02)",overflow:"hidden",cursor:"pointer"}}>
                            <div style={{padding:"10px 12px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                              <span style={{fontSize:15,fontWeight:700,color:isActive?"#feca57":"#e8e0f0"}}>{fmtJDate(d)}</span>
                              <span style={{fontSize:13,opacity:.3,fontFamily:"monospace"}}>{d}</span>
                            </div>
                            {isActive&&<div style={{padding:"0 12px 12px",fontSize:16,color:"#e8e0f0",opacity:.7,lineHeight:1.7,whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{txt}</div>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ── BACKUP/RESTORE PANEL ── */}
            {showBackup&&!journalViewArchive&&journalAuth&&!journalSetup&&(
              <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
                <div style={{padding:"12px 16px 6px",display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                  <button onClick={()=>setShowBackup(false)} style={{background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.1)",borderRadius:8,padding:"5px 10px",color:"#ccc",fontSize:16,cursor:"pointer",fontWeight:700}}>← Back</button>
                  <div style={{fontSize:16,fontWeight:900,color:"#e8e0f0"}}>💾 Backup & Restore</div>
                </div>
                <div style={{flex:1,overflowY:"auto",padding:"0 16px 16px"}}>
                  {/* Export */}
                  <div style={{background:"rgba(67,233,123,.06)",border:"1px solid rgba(67,233,123,.15)",borderRadius:14,padding:14,marginBottom:12}}>
                    <div style={{fontSize:16,fontWeight:800,color:"#43e97b",marginBottom:4}}>📤 Export Backup</div>
                    <div style={{fontSize:14,opacity:.5,lineHeight:1.5,marginBottom:10}}>Downloads a JSON file with all your Zobuddy data — buddy, planner, cleaning, workout, budget, and all journal entries. Save this file somewhere safe.</div>
                    <button onClick={exportBackup} style={{width:"100%",background:"linear-gradient(135deg,#43e97b,#38f9d7)",color:"#1a1a2e",border:"none",borderRadius:10,padding:"10px",fontSize:16,fontWeight:700,cursor:"pointer"}}>Download Backup File</button>
                  </div>
                  {/* Import */}
                  <div style={{background:"rgba(96,165,250,.06)",border:"1px solid rgba(96,165,250,.15)",borderRadius:14,padding:14}}>
                    <div style={{fontSize:16,fontWeight:800,color:"#60a5fa",marginBottom:4}}>📥 Restore from Backup</div>
                    <div style={{fontSize:14,opacity:.5,lineHeight:1.5,marginBottom:10}}>Upload a previously exported backup file, or paste its contents below. This will replace all current data.</div>
                    <button onClick={importBackupFile} style={{width:"100%",background:"rgba(96,165,250,.12)",border:"1px solid rgba(96,165,250,.25)",borderRadius:10,padding:"10px",fontSize:16,fontWeight:700,color:"#60a5fa",cursor:"pointer",marginBottom:8}}>Choose Backup File</button>
                    <textarea value={restoreText} onChange={e=>{setRestoreText(e.target.value);setRestoreError("");setRestoreSuccess(false);}}
                      placeholder="Or paste backup JSON here…" rows={4}
                      style={{width:"100%",padding:"10px 12px",borderRadius:10,border:"1px solid rgba(255,255,255,.1)",background:"rgba(255,255,255,.03)",color:"#e8e0f0",fontSize:14,resize:"none",fontFamily:"monospace",outline:"none",marginBottom:8}}/>
                    {restoreError&&<div style={{fontSize:14,color:"#f5576c",marginBottom:6,fontWeight:700}}>{restoreError}</div>}
                    {restoreSuccess&&<div style={{fontSize:14,color:"#43e97b",marginBottom:6,fontWeight:700}}>✓ Restored! Reloading…</div>}
                    <button onClick={importBackup} disabled={!restoreText.trim()}
                      style={{width:"100%",background:restoreText.trim()?"linear-gradient(135deg,#60a5fa,#38bdf8)":"rgba(255,255,255,.04)",color:restoreText.trim()?"#1a1a2e":"#555",border:"none",borderRadius:10,padding:"10px",fontSize:16,fontWeight:700,cursor:restoreText.trim()?"pointer":"default"}}>Restore Data</button>
                  </div>
                </div>
              </div>
            )}

            {/* ── JOURNAL EDITOR ── */}
            {journalAuth&&!journalSetup&&!showBackup&&journalViewArchive===null&&(
              <>
                {/* Header */}
                <div style={{padding:"12px 16px 6px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <button onClick={closeJournal} style={{background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.1)",borderRadius:8,padding:"5px 10px",color:"#ccc",fontSize:16,cursor:"pointer",fontWeight:700}}>✕</button>
                    <div>
                      <div style={{fontSize:15,fontWeight:900,background:"linear-gradient(135deg,#a78bfa,#f093fb)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>✍️ Journal</div>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:4}}>
                    <button onClick={()=>setJournalBrowse(!journalBrowse)} style={{background:journalBrowse?"rgba(167,139,250,.2)":"rgba(255,255,255,.06)",border:journalBrowse?"1px solid rgba(167,139,250,.4)":"1px solid rgba(255,255,255,.08)",borderRadius:8,padding:"6px 10px",color:journalBrowse?"#a78bfa":"#ccc",fontSize:14,fontWeight:700,cursor:"pointer"}}>📖 {journalDates.length}</button>
                    <button onClick={()=>{setJournalManagePw(!journalManagePw);setJournalPwError("");setJournalCurrentPw("");setJournalNewPw("");setJournalConfirmPw("");}} style={{background:journalManagePw?"rgba(167,139,250,.2)":"rgba(255,255,255,.06)",border:journalManagePw?"1px solid rgba(167,139,250,.4)":"1px solid rgba(255,255,255,.08)",borderRadius:8,padding:"6px 10px",color:journalManagePw?"#a78bfa":"#ccc",fontSize:14,fontWeight:700,cursor:"pointer"}}>{hasPassword?"🔒":"🔓"}</button>
                  </div>
                </div>

                {/* Password management panel */}
                {journalManagePw&&<div style={{padding:"0 16px 8px",flexShrink:0}}>
                  <div style={{background:"rgba(167,139,250,.06)",border:"1px solid rgba(167,139,250,.15)",borderRadius:12,padding:12}}>
                    <div style={{fontSize:14,fontWeight:800,opacity:.5,marginBottom:8}}>{hasPassword?"PASSWORD SETTINGS":"PROTECT YOUR JOURNAL"}</div>
                    {hasPassword&&<input type="password" value={journalCurrentPw} onChange={e=>{setJournalCurrentPw(e.target.value);setJournalPwError("");}} placeholder="Current password" style={{width:"100%",padding:"8px 12px",borderRadius:8,border:"1px solid rgba(255,255,255,.1)",background:"rgba(255,255,255,.04)",color:"#e8e0f0",fontSize:16,outline:"none",marginBottom:6}}/>}
                    <input type="password" value={journalNewPw} onChange={e=>{setJournalNewPw(e.target.value);setJournalPwError("");}} placeholder={hasPassword?"New password":"Create password"} style={{width:"100%",padding:"8px 12px",borderRadius:8,border:"1px solid rgba(255,255,255,.1)",background:"rgba(255,255,255,.04)",color:"#e8e0f0",fontSize:16,outline:"none",marginBottom:6}}/>
                    <input type="password" value={journalConfirmPw} onChange={e=>{setJournalConfirmPw(e.target.value);setJournalPwError("");}} placeholder="Confirm new password" style={{width:"100%",padding:"8px 12px",borderRadius:8,border:"1px solid rgba(255,255,255,.1)",background:"rgba(255,255,255,.04)",color:"#e8e0f0",fontSize:16,outline:"none",marginBottom:6}}/>
                    {journalPwError&&<div style={{fontSize:14,color:"#f5576c",marginBottom:6,fontWeight:700}}>{journalPwError}</div>}
                    <div style={{display:"flex",gap:6}}>
                      <button onClick={changePassword} style={{flex:1,background:"linear-gradient(135deg,#667eea,#764ba2)",color:"#fff",border:"none",borderRadius:8,padding:"8px",fontSize:15,fontWeight:700,cursor:"pointer"}}>{hasPassword?"Change":"Set"} Password</button>
                      {hasPassword&&<button onClick={removePassword} style={{background:"rgba(245,87,108,.1)",border:"1px solid rgba(245,87,108,.2)",borderRadius:8,padding:"8px 12px",fontSize:15,fontWeight:700,color:"#f5576c",cursor:"pointer"}}>Remove</button>}
                    </div>
                  </div>
                </div>}

                {/* Date nav + favorite */}
                <div style={{padding:"0 16px 8px",display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                  <button onClick={()=>{const d=new Date(journalViewDate+"T12:00:00");d.setDate(d.getDate()-1);navigateJournal(toDateStr(d));}}
                    style={{background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.1)",borderRadius:8,padding:"4px 8px",color:"#ccc",fontSize:16,cursor:"pointer",fontWeight:700}}>‹</button>
                  <div style={{flex:1,textAlign:"center"}}>
                    <div style={{fontSize:16,fontWeight:800,color:isJournalToday?"#a78bfa":"#e8e0f0"}}>{isJournalToday?"Today":"" } {fmtJDate(journalViewDate)}</div>
                    <div style={{fontSize:13,opacity:.3,fontFamily:"monospace"}}>{journalViewDate}</div>
                  </div>
                  <button onClick={()=>toggleFavorite(journalViewDate)} style={{background:"none",border:"none",fontSize:16,cursor:"pointer",padding:"2px 4px",opacity:isFavorite(journalViewDate)?1:.3}}>{isFavorite(journalViewDate)?"⭐":"☆"}</button>
                  <button onClick={()=>{const d=new Date(journalViewDate+"T12:00:00");d.setDate(d.getDate()+1);const t=toDateStr(d);if(t<=today)navigateJournal(t);}}
                    style={{background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.1)",borderRadius:8,padding:"4px 8px",color:journalViewDate<today?"#ccc":"rgba(255,255,255,.2)",fontSize:16,cursor:journalViewDate<today?"pointer":"default",fontWeight:700}}>›</button>
                  {!isJournalToday&&<button onClick={()=>navigateJournal(today)} style={{background:"none",border:"none",color:"rgba(167,139,250,.7)",fontSize:13,cursor:"pointer",fontWeight:700}}>↩ Today</button>}
                </div>

                {/* Browse previous entries + archived journals */}
                {journalBrowse&&<div style={{padding:"0 16px 8px",maxHeight:240,overflowY:"auto",flexShrink:0}}>
                  <div style={{background:"rgba(167,139,250,.06)",border:"1px solid rgba(167,139,250,.15)",borderRadius:12,padding:8}}>
                    {/* Favorites section */}
                    {(activeJournal.favorites||[]).length>0&&<>
                      <div style={{fontSize:13,fontWeight:800,opacity:.4,letterSpacing:1,marginBottom:6}}>⭐ FAVORITES</div>
                      {(activeJournal.favorites||[]).sort((a,b)=>b.localeCompare(a)).map(d=>{
                        const txt=(activeJournal.entries||{})[d]||"";
                        if(!txt)return null;
                        const preview=txt.length>50?txt.slice(0,50)+"…":txt;
                        const isActive=d===journalViewDate;
                        return(
                          <div key={"fav_"+d} onClick={()=>navigateJournal(d)} style={{padding:"6px 10px",borderRadius:8,marginBottom:3,cursor:"pointer",background:isActive?"rgba(254,202,87,.12)":"rgba(254,202,87,.04)",border:isActive?"1px solid rgba(254,202,87,.3)":"1px solid rgba(254,202,87,.1)"}}>
                            <div style={{display:"flex",alignItems:"center",gap:4}}><span style={{fontSize:14}}>⭐</span><span style={{fontSize:15,fontWeight:700,color:"#feca57"}}>{fmtJDate(d)}</span><span style={{fontSize:13,opacity:.3,fontFamily:"monospace",marginLeft:"auto"}}>{d}</span></div>
                            <div style={{fontSize:14,opacity:.4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{preview}</div>
                          </div>);
                      })}
                      <div style={{height:6}}/>
                    </>}
                    <div style={{fontSize:13,fontWeight:800,opacity:.4,letterSpacing:1,marginBottom:6}}>ALL ENTRIES</div>
                    {journalDates.length===0?<div style={{fontSize:15,opacity:.3,textAlign:"center",padding:12}}>No entries yet.</div>
                    :journalDates.map(d=>{
                      const txt=activeJournal.entries[d]||"";
                      const preview=txt.length>60?txt.slice(0,60)+"…":txt;
                      const isActive=d===journalViewDate;
                      const fav=isFavorite(d);
                      return(
                        <div key={d} onClick={()=>navigateJournal(d)}
                          style={{padding:"8px 10px",borderRadius:8,marginBottom:3,cursor:"pointer",
                            background:isActive?"rgba(167,139,250,.12)":"rgba(255,255,255,.02)",
                            border:isActive?"1px solid rgba(167,139,250,.3)":"1px solid transparent"}}>
                          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:2}}>
                            <span style={{fontSize:15,fontWeight:700,color:isActive?"#a78bfa":"#e8e0f0"}}>{fav?"⭐ ":""}{fmtJDate(d)}</span>
                            <span style={{fontSize:13,opacity:.3,fontFamily:"monospace"}}>{d}</span>
                          </div>
                          <div style={{fontSize:14,opacity:.4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{preview}</div>
                        </div>
                      );
                    })}

                    {/* Archived journals */}
                    {archivedJournals.length>0&&<>
                      <div style={{fontSize:13,fontWeight:800,opacity:.4,letterSpacing:1,marginTop:10,marginBottom:6}}>🗃️ ARCHIVED JOURNALS ({archivedJournals.length})</div>
                      {jData.journals.map((j,i)=>{
                        if(i===jData.activeIdx)return null;
                        const count=Object.keys(j.entries||{}).length;
                        const dates=Object.keys(j.entries||{}).sort();
                        const range=dates.length>0?`${dates[0]} → ${dates[dates.length-1]}`:"Empty";
                        return(
                          <div key={j.id||i} onClick={()=>{setJournalViewArchive(i);setArchivePwInput("");setArchivePwError("");setJournalBrowse(false);}}
                            style={{padding:"8px 10px",borderRadius:8,marginBottom:3,cursor:"pointer",background:"rgba(254,202,87,.06)",border:"1px solid rgba(254,202,87,.12)"}}>
                            <div style={{display:"flex",alignItems:"center",gap:6}}>
                              <span style={{fontSize:16}}>{j.pwHash?"🔐":"📓"}</span>
                              <div style={{flex:1}}>
                                <div style={{fontSize:15,fontWeight:700,color:"#feca57"}}>{count} entries {j.pwHash?"(locked)":"(open)"}</div>
                                <div style={{fontSize:13,opacity:.35}}>{range}</div>
                              </div>
                              <span style={{fontSize:14,opacity:.3}}>→</span>
                            </div>
                          </div>
                        );
                      })}
                    </>}
                  </div>
                </div>}

                {/* Text area */}
                <div style={{flex:1,padding:"0 16px 12px",display:"flex",flexDirection:"column",minHeight:0}}>
                  <textarea value={journalText} onChange={e=>setJournalText(e.target.value)}
                    placeholder={isJournalToday?"What's on your mind today?":"Write about this day…"}
                    style={{flex:1,width:"100%",background:"rgba(167,139,250,.04)",border:"1px solid rgba(167,139,250,.12)",
                      borderRadius:14,padding:"14px 16px",color:"#e8e0f0",fontSize:16,resize:"none",
                      fontFamily:"'Nunito','Segoe UI',sans-serif",lineHeight:1.7,outline:"none",minHeight:200}}/>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:8}}>
                    <div style={{fontSize:13,opacity:.3}}>{journalText.length} chars</div>
                    <div style={{display:"flex",gap:6,alignItems:"center"}}>
                      {journalSaved&&<span style={{fontSize:14,color:"#43e97b",fontWeight:700}}>✓ Saved</span>}
                      <button onClick={saveJournalEntry}
                        style={{background:"linear-gradient(135deg,#a78bfa,#f093fb)",color:"#fff",border:"none",borderRadius:10,padding:"8px 20px",fontSize:16,fontWeight:700,cursor:"pointer"}}>Save</button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>}
      </>}

      {/* ════════════════════════════════════════════
          CLEANING TAB
      ════════════════════════════════════════════ */}
      {plannerTab==="clean"&&<div style={{flex:1,overflowY:"auto",padding:"12px 16px 16px"}}>

        {/* Month nav */}
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
          <button onClick={()=>setCleanMonth(p=>{const d=new Date(p.y,p.m-1,1);return{y:d.getFullYear(),m:d.getMonth()};})}
            style={{background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.1)",borderRadius:8,padding:"5px 10px",color:"#ccc",fontSize:16,cursor:"pointer",fontWeight:700}}>‹</button>
          <div style={{flex:1,textAlign:"center",fontSize:15,fontWeight:900,color:"#e8e0f0"}}>{MONTH_NAMES[cleanMonth.m]} {cleanMonth.y}</div>
          <button onClick={()=>setCleanMonth(p=>{const d=new Date(p.y,p.m+1,1);return{y:d.getFullYear(),m:d.getMonth()};})}
            style={{background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.1)",borderRadius:8,padding:"5px 10px",color:"#ccc",fontSize:16,cursor:"pointer",fontWeight:700}}>›</button>
        </div>

        {/* ── DAILY section with day-of-week columns ── */}
        <div style={{marginBottom:14}}>
          <div style={{fontSize:14,fontWeight:900,opacity:.4,letterSpacing:1,marginBottom:8}}>EVERYDAY</div>
          {weeksInMonth.map(week=>{
            const wData=moData.daily[week.key]||{};
            const totalChecks=DAILY_TASKS.reduce((s,t)=>s+dailyDoneCount(wData,t.id),0);
            const totalPossible=DAILY_TASKS.length*7;
            const isOpen=openWeek===week.key;
            return(
              <div key={week.key} style={{marginBottom:6,borderRadius:12,border:"1px solid rgba(255,255,255,.07)",overflow:"hidden"}}>
                <div className="week-header" onClick={()=>setOpenWeek(isOpen?null:week.key)}
                  style={{display:"flex",alignItems:"center",gap:8,padding:"9px 12px",cursor:"pointer",background:"rgba(255,255,255,.03)"}}>
                  <span style={{fontSize:15,fontWeight:800,color:"#e8e0f0",flex:1}}>{week.label}</span>
                  <span style={{fontSize:14,color:totalChecks===totalPossible?"#43e97b":"rgba(255,255,255,.35)",fontWeight:700}}>{totalChecks}/{totalPossible}</span>
                  <span style={{fontSize:14,opacity:.4}}>{isOpen?"▲":"▼"}</span>
                </div>
                {isOpen&&<div style={{padding:"6px 6px 10px",background:"rgba(0,0,0,.15)",overflowX:"auto"}}>
                  {/* Day headers */}
                  <div style={{display:"flex",alignItems:"center",marginBottom:4,minWidth:0}}>
                    <div style={{flex:1,minWidth:80}}/>
                    {DAYS_SHORT.map((d,i)=>(
                      <div key={i} style={{width:28,textAlign:"center",fontSize:11,fontWeight:800,opacity:.35,flexShrink:0}}>{d}</div>
                    ))}
                  </div>
                  {/* Task rows */}
                  {DAILY_TASKS.map(t=>{
                    const doneCount=dailyDoneCount(wData,t.id);
                    return(
                      <div key={t.id} style={{display:"flex",alignItems:"center",padding:"5px 0",borderBottom:"1px solid rgba(255,255,255,.03)",minWidth:0}}>
                        <div style={{flex:1,minWidth:80,fontSize:15,color:doneCount>=7?"rgba(255,255,255,.35)":"#e8e0f0",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",paddingRight:6}}>{t.label}</div>
                        {DAYS_FULL.map((day,i)=>{
                          const done=isDailyDone(wData,t.id,day);
                          return(
                            <div key={day} onClick={()=>toggleDaily(week.key,t.id,day)}
                              style={{width:28,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,cursor:"pointer",padding:"2px 0"}}>
                              <div style={{width:20,height:20,borderRadius:"50%",border:`2px solid ${done?"#43e97b":"rgba(255,255,255,.12)"}`,background:done?"#43e97b":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:"#fff",transition:"all .15s"}}>{done&&"✓"}</div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>}
              </div>
            );
          })}
        </div>

        {/* ── WEEKLY (by room/day) ── */}
        <div style={{marginBottom:14}}>
          <div style={{fontSize:14,fontWeight:900,opacity:.4,letterSpacing:1,marginBottom:8}}>WEEKLY — BY ROOM</div>
          {weeksInMonth.map(week=>{
            const isOpen=openWeek===`w_${week.key}`;
            const totalDone=WEEKLY_ROOMS.reduce((acc,r)=>{const key=`${week.key}_${r.day}`;const d=moData.weekly[key]||{};return acc+r.tasks.filter((_,i)=>d[i]).length;},0);
            const totalTasks=WEEKLY_ROOMS.reduce((a,r)=>a+r.tasks.length,0);
            return(
              <div key={week.key} style={{marginBottom:6,borderRadius:12,border:"1px solid rgba(255,255,255,.07)",overflow:"hidden"}}>
                <div className="week-header" onClick={()=>setOpenWeek(isOpen?null:`w_${week.key}`)}
                  style={{display:"flex",alignItems:"center",gap:8,padding:"9px 12px",cursor:"pointer",background:"rgba(255,255,255,.03)"}}>
                  <span style={{fontSize:15,fontWeight:800,color:"#e8e0f0",flex:1}}>{week.label}</span>
                  <span style={{fontSize:14,color:totalDone===totalTasks?"#43e97b":"rgba(255,255,255,.35)",fontWeight:700}}>{totalDone}/{totalTasks}</span>
                  <span style={{fontSize:14,opacity:.4}}>{isOpen?"▲":"▼"}</span>
                </div>
                {isOpen&&<div style={{padding:"6px 12px 10px",background:"rgba(0,0,0,.15)"}}>
                  {WEEKLY_ROOMS.map(room=>{
                    const key=`${week.key}_${room.day}`;
                    const d=moData.weekly[key]||{};
                    const roomDone=room.tasks.filter((_,i)=>d[i]).length;
                    return(
                      <div key={room.day} style={{marginBottom:10}}>
                        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
                          <span style={{fontSize:13,fontWeight:900,color:"#667eea",letterSpacing:.5,opacity:.8}}>{room.day.toUpperCase()}</span>
                          <span style={{fontSize:15,fontWeight:800,color:"#e8e0f0"}}>{room.room}</span>
                          <span style={{marginLeft:"auto",fontSize:13,color:roomDone===room.tasks.length?"#43e97b":"rgba(255,255,255,.3)",fontWeight:700}}>{roomDone}/{room.tasks.length}</span>
                        </div>
                        {room.tasks.map((task,i)=>(
                          <div key={i} className="clean-item" onClick={()=>toggleWeekly(week.key,room.day,i)}
                            style={{display:"flex",alignItems:"center",gap:10,padding:"6px 4px",borderBottom:"1px solid rgba(255,255,255,.03)",cursor:"pointer"}}>
                            {checkBox(!!d[i],"#60a5fa")}
                            <span style={{fontSize:15,color:d[i]?"rgba(255,255,255,.35)":"#e8e0f0",textDecoration:d[i]?"line-through":"none",transition:"all .15s"}}>{task}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>}
              </div>
            );
          })}
        </div>

        {/* ── MONTHLY tasks ── */}
        <div style={{marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",marginBottom:8}}>
            <div style={{fontSize:14,fontWeight:900,opacity:.4,letterSpacing:1,flex:1}}>MONTHLY</div>
            <span style={{fontSize:14,color:monthlyDone===monthlyTotal?"#43e97b":"rgba(255,255,255,.35)",fontWeight:700}}>{monthlyDone}/{monthlyTotal}</span>
          </div>
          <div style={{background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.07)",borderRadius:12,overflow:"hidden"}}>
            <div style={{padding:"4px 12px 8px"}}>
              {MONTHLY_TASKS.map(t=>{
                const done=!!moData.monthly[t.id];
                return(
                  <div key={t.id} className="clean-item" onClick={()=>toggleMonthly(t.id)}
                    style={{display:"flex",alignItems:"center",gap:10,padding:"7px 4px",borderBottom:"1px solid rgba(255,255,255,.04)",cursor:"pointer"}}>
                    {checkBox(done,"#f093fb")}
                    <span style={{fontSize:16,color:done?"rgba(255,255,255,.35)":"#e8e0f0",textDecoration:done?"line-through":"none",transition:"all .15s"}}>{t.label}</span>
                  </div>
                );
              })}

              {/* Custom monthly tasks */}
              {(moData.customMonthly||[]).map((t,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 4px",borderBottom:"1px solid rgba(255,255,255,.04)"}}>
                  <div onClick={()=>toggleCustomMonthly(i)} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:10,flex:1}}>
                    {checkBox(t.done,"#f093fb")}
                    <span style={{fontSize:16,color:t.done?"rgba(255,255,255,.35)":"#e8e0f0",textDecoration:t.done?"line-through":"none",transition:"all .15s"}}>{t.text}</span>
                  </div>
                  <button onClick={()=>clearCustomMonthly(i)}
                    style={{background:"rgba(245,87,108,.12)",border:"1px solid rgba(245,87,108,.2)",borderRadius:6,padding:"2px 7px",fontSize:14,color:"#f5576c",cursor:"pointer",flexShrink:0}}>✕</button>
                </div>
              ))}

              {/* Add custom task */}
              <div style={{display:"flex",gap:6,padding:"8px 4px 2px"}}>
                <input value={newCustom} onChange={e=>setNewCustom(e.target.value)}
                  onKeyDown={e=>{if(e.key==="Enter"&&newCustom.trim()){addCustomMonthly(newCustom);setNewCustom("");}}}
                  placeholder="+ Add custom task…"
                  style={{flex:1,background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",borderRadius:8,
                    padding:"7px 10px",color:"#e8e0f0",fontSize:15,outline:"none",fontFamily:"'Nunito','Segoe UI',sans-serif"}}/>
                <button onClick={()=>{if(newCustom.trim()){addCustomMonthly(newCustom);setNewCustom("");}}}
                  style={{background:"linear-gradient(135deg,#667eea,#764ba2)",border:"none",borderRadius:8,padding:"7px 12px",
                    fontSize:16,color:"#fff",cursor:"pointer",fontWeight:800,flexShrink:0}}>+</button>
              </div>
            </div>
          </div>

          {/* Carry forward button */}
          {(moData.customMonthly||[]).some(t=>!t.done)&&(
            <div style={{marginTop:8}}>
              {!showCarryConfirm
                ?<button onClick={()=>setShowCarryConfirm(true)}
                    style={{width:"100%",background:"rgba(254,202,87,.06)",border:"1px solid rgba(254,202,87,.2)",
                      borderRadius:10,padding:"8px 12px",color:"#feca57",fontSize:15,cursor:"pointer",fontWeight:700}}>
                    🗃️ Carry unfinished tasks → next month
                  </button>
                :<div style={{background:"rgba(254,202,87,.06)",border:"1px solid rgba(254,202,87,.2)",borderRadius:10,padding:"10px 12px"}}>
                    <div style={{fontSize:15,color:"#feca57",fontWeight:700,marginBottom:8}}>Carry {(moData.customMonthly||[]).filter(t=>!t.done).length} unfinished task{(moData.customMonthly||[]).filter(t=>!t.done).length>1?"s":""} to {MONTH_NAMES[cleanMonth.m===11?0:cleanMonth.m+1]}?</div>
                    <div style={{display:"flex",gap:6}}>
                      <button onClick={()=>{carryForward();setShowCarryConfirm(false);}}
                        style={{flex:1,background:"linear-gradient(135deg,#feca57,#f39c12)",border:"none",borderRadius:8,padding:"7px 0",fontSize:15,color:"#1a1a2e",cursor:"pointer",fontWeight:800}}>✓ Yes, carry over</button>
                      <button onClick={()=>setShowCarryConfirm(false)}
                        style={{flex:1,background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:8,padding:"7px 0",fontSize:15,color:"#aaa",cursor:"pointer",fontWeight:700}}>Cancel</button>
                    </div>
                  </div>
              }
            </div>
          )}
        </div>

      </div>}

      {/* ════════════════════════════════════════════
          WORKOUT TAB
      ════════════════════════════════════════════ */}
      {plannerTab==="workout"&&<WorkoutTab workoutData={workoutData} setWorkoutData={setWorkoutData} checkBox={checkBox} MONTH_NAMES={MONTH_NAMES}/>}
    </div>
  );
}

// ─── BUDGET TRACKER (Envelope Method) ────────────────────────────────────────
const ENVELOPE_PRESETS=[
  {name:"Rent/Housing",icon:"🏠",color:"#f5576c"},{name:"Groceries",icon:"🛒",color:"#43e97b"},
  {name:"Transport",icon:"🚗",color:"#60a5fa"},{name:"Dining Out",icon:"🍔",color:"#feca57"},
  {name:"Entertainment",icon:"🎮",color:"#f093fb"},{name:"Subscriptions",icon:"📺",color:"#38bdf8"},
  {name:"Savings",icon:"🏦",color:"#a78bfa"},{name:"Health",icon:"💊",color:"#34d399"},
  {name:"Shopping",icon:"🛍️",color:"#fb923c"},{name:"Utilities",icon:"💡",color:"#22d3ee"},
  {name:"Personal",icon:"✨",color:"#e879f9"},{name:"Emergency",icon:"🚨",color:"#ef4444"},
];
const ENVELOPE_COLORS=["#f5576c","#43e97b","#60a5fa","#feca57","#f093fb","#38bdf8","#a78bfa","#34d399","#fb923c","#22d3ee","#e879f9","#ef4444","#6366f1","#14b8a6","#f97316","#ec4899"];

function BudgetTracker({budgetData,setBudgetData}){
  const{envelopes,transactions,monthlyIncome}=budgetData;
  const[view,setView]=useState("overview"); // overview | add | history | settings
  const[addAmt,setAddAmt]=useState("");
  const[addNote,setAddNote]=useState("");
  const[addEnv,setAddEnv]=useState(null);
  const[newEnvName,setNewEnvName]=useState("");
  const[newEnvBudget,setNewEnvBudget]=useState("");
  const[newEnvIcon,setNewEnvIcon]=useState("💰");
  const[newEnvColor,setNewEnvColor]=useState("#667eea");
  const[editIncome,setEditIncome]=useState(false);
  const[incomeInput,setIncomeInput]=useState(String(monthlyIncome||0));
  const[showPresets,setShowPresets]=useState(false);
  const[histFilter,setHistFilter]=useState("all");
  const[confirmDelete,setConfirmDelete]=useState(null);
  const[editEnvId,setEditEnvId]=useState(null);
  const[editEnvBudget,setEditEnvBudget]=useState("");

  // Current month key
  const now=new Date();
  const monthKey=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
  const monthLabel=now.toLocaleDateString("en-US",{month:"long",year:"numeric"});

  // Get this month's transactions
  const monthTx=useMemo(()=>(transactions||[]).filter(t=>t.date?.startsWith(monthKey)),[transactions,monthKey]);

  // Calculate spent per envelope this month
  const spentByEnv=useMemo(()=>{
    const map={};monthTx.forEach(t=>{map[t.envId]=(map[t.envId]||0)+t.amount;});return map;
  },[monthTx]);

  const totalBudgeted=envelopes.reduce((s,e)=>s+(e.budget||0),0);
  const totalSpent=Object.values(spentByEnv).reduce((s,v)=>s+v,0);
  const totalRemaining=totalBudgeted-totalSpent;

  const addEnvelope=(name,budget,icon,color)=>{
    const id=`env_${Date.now()}`;
    setBudgetData(p=>({...p,envelopes:[...p.envelopes,{id,name,budget:Number(budget)||0,icon:icon||"💰",color:color||"#667eea"}]}));
  };
  const removeEnvelope=(id)=>{
    setBudgetData(p=>({...p,envelopes:p.envelopes.filter(e=>e.id!==id),transactions:p.transactions.filter(t=>t.envId!==id)}));
    setConfirmDelete(null);
  };
  const updateEnvBudget=(id,newBudget)=>{
    setBudgetData(p=>({...p,envelopes:p.envelopes.map(e=>e.id===id?{...e,budget:Number(newBudget)||0}:e)}));
    setEditEnvId(null);setEditEnvBudget("");
  };
  const addTransaction=(envId,amount,note)=>{
    const tx={id:`tx_${Date.now()}`,envId,amount:Number(amount),note:note||"",date:new Date().toISOString().slice(0,10),time:new Date().toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"})};
    setBudgetData(p=>({...p,transactions:[tx,...p.transactions]}));
    setAddAmt("");setAddNote("");setView("overview");
  };
  const deleteTransaction=(txId)=>{
    setBudgetData(p=>({...p,transactions:p.transactions.filter(t=>t.id!==txId)}));
  };
  const setIncome=(val)=>{
    setBudgetData(p=>({...p,monthlyIncome:Number(val)||0}));
    setEditIncome(false);
  };

  const pct=(spent,budget)=>budget>0?Math.min(100,Math.round((spent/budget)*100)):0;
  const fmt=(n)=>"$"+Number(n||0).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});

  // Quick-add flow
  if(view==="add"&&addEnv){
    const env=envelopes.find(e=>e.id===addEnv);
    const spent=spentByEnv[addEnv]||0;
    const remaining=(env?.budget||0)-spent;
    return(
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",background:"linear-gradient(180deg,#0a0a1a 0%,#121228 40%,#1a1040 100%)"}}>
        <div style={{padding:"14px 16px 8px",display:"flex",alignItems:"center",gap:8}}>
          <button onClick={()=>{setAddEnv(null);setView("overview");}} style={{background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.1)",borderRadius:8,padding:"5px 10px",color:"#ccc",fontSize:16,cursor:"pointer",fontWeight:700}}>← Back</button>
          <div style={{flex:1,textAlign:"center",fontSize:15,fontWeight:900,color:"#e8e0f0"}}>Log Expense</div>
        </div>

        <div style={{flex:1,padding:"0 16px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16}}>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:36}}>{env?.icon}</div>
            <div style={{fontSize:16,fontWeight:800,color:"#e8e0f0",marginTop:4}}>{env?.name}</div>
            <div style={{fontSize:15,opacity:.5}}>{fmt(remaining)} remaining of {fmt(env?.budget)}</div>
          </div>

          <div style={{width:"100%",maxWidth:280}}>
            <div style={{position:"relative",marginBottom:12}}>
              <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:22,fontWeight:900,color:"rgba(255,255,255,.3)"}}>$</span>
              <input autoFocus type="number" inputMode="decimal" step="0.01" value={addAmt} onChange={e=>setAddAmt(e.target.value)}
                placeholder="0.00"
                style={{width:"100%",padding:"16px 16px 16px 36px",borderRadius:16,border:`2px solid ${env?.color||"#667eea"}44`,background:"rgba(255,255,255,.04)",color:"#fff",fontSize:28,fontWeight:900,outline:"none",textAlign:"left",fontFamily:"'Nunito',sans-serif"}}/>
            </div>
            <input value={addNote} onChange={e=>setAddNote(e.target.value)}
              placeholder="What was it for? (optional)"
              style={{width:"100%",padding:"12px 14px",borderRadius:12,border:"1px solid rgba(255,255,255,.08)",background:"rgba(255,255,255,.03)",color:"#e8e0f0",fontSize:16,outline:"none",marginBottom:16,fontFamily:"'Nunito',sans-serif"}}/>
            <button onClick={()=>{if(addAmt&&Number(addAmt)>0)addTransaction(addEnv,Number(addAmt),addNote);}}
              disabled={!addAmt||Number(addAmt)<=0}
              style={{width:"100%",padding:"14px",borderRadius:14,border:"none",background:addAmt&&Number(addAmt)>0?`linear-gradient(135deg,${env?.color||"#667eea"},${env?.color||"#667eea"}88)`:"rgba(255,255,255,.06)",color:addAmt&&Number(addAmt)>0?"#fff":"rgba(255,255,255,.25)",fontSize:16,fontWeight:800,cursor:addAmt&&Number(addAmt)>0?"pointer":"default",transition:"all .2s"}}>
              Log {addAmt?fmt(addAmt):"$0.00"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // History view
  if(view==="history"){
    const filtered=histFilter==="all"?monthTx:monthTx.filter(t=>t.envId===histFilter);
    return(
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",background:"linear-gradient(180deg,#0a0a1a 0%,#121228 40%,#1a1040 100%)"}}>
        <div style={{padding:"14px 16px 8px",display:"flex",alignItems:"center",gap:8}}>
          <button onClick={()=>setView("overview")} style={{background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.1)",borderRadius:8,padding:"5px 10px",color:"#ccc",fontSize:16,cursor:"pointer",fontWeight:700}}>← Back</button>
          <div style={{flex:1,textAlign:"center",fontSize:15,fontWeight:900,color:"#e8e0f0"}}>Spending History</div>
        </div>
        <div style={{padding:"0 16px 8px",display:"flex",gap:4,flexWrap:"wrap"}}>
          <button onClick={()=>setHistFilter("all")} style={{padding:"4px 10px",borderRadius:8,border:histFilter==="all"?"1px solid rgba(102,126,234,.4)":"1px solid rgba(255,255,255,.08)",background:histFilter==="all"?"rgba(102,126,234,.15)":"rgba(255,255,255,.03)",color:histFilter==="all"?"#a8b4f0":"#888",fontSize:14,fontWeight:700,cursor:"pointer"}}>All</button>
          {envelopes.map(e=>(
            <button key={e.id} onClick={()=>setHistFilter(e.id)} style={{padding:"4px 10px",borderRadius:8,border:histFilter===e.id?`1px solid ${e.color}44`:"1px solid rgba(255,255,255,.08)",background:histFilter===e.id?`${e.color}20`:"rgba(255,255,255,.03)",color:histFilter===e.id?e.color:"#888",fontSize:14,fontWeight:700,cursor:"pointer"}}>{e.icon} {e.name}</button>
          ))}
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"0 16px 16px"}}>
          {filtered.length===0?<div style={{textAlign:"center",opacity:.3,fontSize:16,marginTop:40}}>No transactions this month.</div>
          :filtered.map(tx=>{
            const env=envelopes.find(e=>e.id===tx.envId);
            return(
              <div key={tx.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,.04)"}}>
                <div style={{width:32,height:32,borderRadius:10,background:`${env?.color||"#667eea"}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{env?.icon||"💰"}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:16,fontWeight:700,color:"#e8e0f0"}}>{tx.note||env?.name||"Expense"}</div>
                  <div style={{fontSize:13,opacity:.4}}>{env?.name} · {tx.date} {tx.time||""}</div>
                </div>
                <div style={{fontSize:15,fontWeight:800,color:env?.color||"#f5576c"}}>-{fmt(tx.amount)}</div>
                <button onClick={()=>deleteTransaction(tx.id)} style={{background:"none",border:"none",color:"rgba(255,255,255,.2)",fontSize:16,cursor:"pointer",padding:"4px"}}>✕</button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Settings view (manage envelopes)
  if(view==="settings"){
    return(
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",background:"linear-gradient(180deg,#0a0a1a 0%,#121228 40%,#1a1040 100%)"}}>
        <div style={{padding:"14px 16px 8px",display:"flex",alignItems:"center",gap:8}}>
          <button onClick={()=>{setView("overview");setShowPresets(false);}} style={{background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.1)",borderRadius:8,padding:"5px 10px",color:"#ccc",fontSize:16,cursor:"pointer",fontWeight:700}}>← Back</button>
          <div style={{flex:1,textAlign:"center",fontSize:15,fontWeight:900,color:"#e8e0f0"}}>Manage Envelopes</div>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"0 16px 16px"}}>
          {/* Income */}
          <div style={{background:"rgba(254,202,87,.06)",border:"1px solid rgba(254,202,87,.15)",borderRadius:14,padding:"12px 14px",marginBottom:14}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div><div style={{fontSize:13,fontWeight:800,opacity:.4,letterSpacing:1}}>MONTHLY INCOME</div>
              {editIncome?<div style={{display:"flex",gap:4,marginTop:4}}>
                <input autoFocus type="number" value={incomeInput} onChange={e=>setIncomeInput(e.target.value)} style={{width:120,padding:"6px 10px",borderRadius:8,border:"1px solid rgba(254,202,87,.3)",background:"rgba(255,255,255,.04)",color:"#feca57",fontSize:16,fontWeight:800,outline:"none"}}/>
                <button onClick={()=>setIncome(incomeInput)} style={{background:"rgba(254,202,87,.2)",border:"1px solid rgba(254,202,87,.3)",borderRadius:8,padding:"6px 12px",color:"#feca57",fontSize:15,fontWeight:700,cursor:"pointer"}}>Save</button>
              </div>
              :<div style={{fontSize:20,fontWeight:900,color:"#feca57",marginTop:2}}>{fmt(monthlyIncome)}</div>}
              </div>
              {!editIncome&&<button onClick={()=>{setEditIncome(true);setIncomeInput(String(monthlyIncome||0));}} style={{background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.08)",borderRadius:8,padding:"6px 10px",color:"#ccc",fontSize:14,cursor:"pointer",fontWeight:700}}>✏️ Edit</button>}
            </div>
            {monthlyIncome>0&&<div style={{fontSize:14,opacity:.5,marginTop:6}}>Unallocated: {fmt(monthlyIncome-totalBudgeted)} ({totalBudgeted>monthlyIncome?"⚠️ Over-allocated!":"✓ Within budget"})</div>}
          </div>

          {/* Existing envelopes */}
          <div style={{fontSize:14,fontWeight:900,opacity:.4,letterSpacing:1,marginBottom:8}}>YOUR ENVELOPES ({envelopes.length})</div>
          {envelopes.map(e=>{
            const spent=spentByEnv[e.id]||0;
            return(
              <div key={e.id} style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.06)",borderRadius:12,padding:"10px 12px",marginBottom:6,display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:34,height:34,borderRadius:10,background:`${e.color}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{e.icon}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:16,fontWeight:800,color:"#e8e0f0"}}>{e.name}</div>
                  {editEnvId===e.id?<div style={{display:"flex",gap:4,marginTop:3}}>
                    <input autoFocus type="number" value={editEnvBudget} onChange={ev=>setEditEnvBudget(ev.target.value)} style={{width:80,padding:"4px 8px",borderRadius:6,border:`1px solid ${e.color}44`,background:"rgba(255,255,255,.04)",color:e.color,fontSize:16,fontWeight:700,outline:"none"}}/>
                    <button onClick={()=>updateEnvBudget(e.id,editEnvBudget)} style={{background:`${e.color}20`,border:`1px solid ${e.color}44`,borderRadius:6,padding:"4px 8px",color:e.color,fontSize:14,fontWeight:700,cursor:"pointer"}}>✓</button>
                    <button onClick={()=>{setEditEnvId(null);}} style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:6,padding:"4px 8px",color:"#888",fontSize:14,cursor:"pointer"}}>✕</button>
                  </div>
                  :<div style={{fontSize:14,opacity:.5,marginTop:1}}>{fmt(e.budget)}/mo · {fmt(spent)} spent</div>}
                </div>
                {editEnvId!==e.id&&<>
                  <button onClick={()=>{setEditEnvId(e.id);setEditEnvBudget(String(e.budget||0));}} style={{background:"none",border:"none",color:"rgba(255,255,255,.3)",fontSize:15,cursor:"pointer",padding:"4px"}}>✏️</button>
                  {confirmDelete===e.id?<div style={{display:"flex",gap:2}}>
                    <button onClick={()=>removeEnvelope(e.id)} style={{background:"rgba(245,87,108,.15)",border:"1px solid rgba(245,87,108,.3)",borderRadius:6,padding:"4px 8px",color:"#f5576c",fontSize:13,fontWeight:700,cursor:"pointer"}}>Delete</button>
                    <button onClick={()=>setConfirmDelete(null)} style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:6,padding:"4px 8px",color:"#888",fontSize:13,cursor:"pointer"}}>No</button>
                  </div>
                  :<button onClick={()=>setConfirmDelete(e.id)} style={{background:"none",border:"none",color:"rgba(255,255,255,.2)",fontSize:15,cursor:"pointer",padding:"4px"}}>🗑️</button>}
                </>}
              </div>
            );
          })}

          {/* Quick presets */}
          <button onClick={()=>setShowPresets(!showPresets)} style={{width:"100%",background:"rgba(102,126,234,.08)",border:"1px solid rgba(102,126,234,.2)",borderRadius:12,padding:"10px",fontSize:15,fontWeight:700,color:"#a8b4f0",cursor:"pointer",marginTop:8,marginBottom:8}}>
            {showPresets?"▲ Hide":"＋ Quick Add from Presets"}
          </button>
          {showPresets&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:12}}>
            {ENVELOPE_PRESETS.filter(p=>!envelopes.some(e=>e.name===p.name)).map(p=>(
              <button key={p.name} onClick={()=>{addEnvelope(p.name,0,p.icon,p.color);}} style={{background:`${p.color}10`,border:`1px solid ${p.color}25`,borderRadius:10,padding:"8px 10px",display:"flex",alignItems:"center",gap:6,cursor:"pointer",textAlign:"left"}}>
                <span style={{fontSize:16}}>{p.icon}</span>
                <span style={{fontSize:15,fontWeight:700,color:p.color}}>{p.name}</span>
              </button>
            ))}
          </div>}

          {/* Custom envelope */}
          <div style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.08)",borderRadius:14,padding:14,marginTop:4}}>
            <div style={{fontSize:14,fontWeight:800,opacity:.4,letterSpacing:1,marginBottom:8}}>CREATE CUSTOM</div>
            <div style={{display:"flex",gap:6,marginBottom:8}}>
              <div style={{display:"flex",flexWrap:"wrap",gap:3}}>
                {ENVELOPE_COLORS.slice(0,8).map(c=>(
                  <div key={c} onClick={()=>setNewEnvColor(c)} style={{width:20,height:20,borderRadius:6,background:c,cursor:"pointer",border:newEnvColor===c?"2px solid #fff":`2px solid transparent`,opacity:newEnvColor===c?1:.5}}/>
                ))}
              </div>
            </div>
            <div style={{display:"flex",gap:6,marginBottom:8}}>
              <input value={newEnvIcon} onChange={e=>setNewEnvIcon(e.target.value)} style={{width:40,padding:"8px 4px",borderRadius:8,border:"1px solid rgba(255,255,255,.1)",background:"rgba(255,255,255,.04)",color:"#fff",fontSize:18,textAlign:"center",outline:"none"}} maxLength={2}/>
              <input value={newEnvName} onChange={e=>setNewEnvName(e.target.value)} placeholder="Envelope name" style={{flex:1,padding:"8px 12px",borderRadius:8,border:"1px solid rgba(255,255,255,.1)",background:"rgba(255,255,255,.04)",color:"#fff",fontSize:16,outline:"none"}}/>
            </div>
            <div style={{display:"flex",gap:6}}>
              <input type="number" value={newEnvBudget} onChange={e=>setNewEnvBudget(e.target.value)} placeholder="Monthly budget" style={{flex:1,padding:"8px 12px",borderRadius:8,border:"1px solid rgba(255,255,255,.1)",background:"rgba(255,255,255,.04)",color:"#fff",fontSize:16,outline:"none"}}/>
              <button onClick={()=>{if(newEnvName.trim()){addEnvelope(newEnvName.trim(),newEnvBudget,newEnvIcon,newEnvColor);setNewEnvName("");setNewEnvBudget("");setNewEnvIcon("💰");}}}
                disabled={!newEnvName.trim()}
                style={{background:newEnvName.trim()?`linear-gradient(135deg,${newEnvColor},${newEnvColor}88)`:"rgba(255,255,255,.04)",border:"none",borderRadius:8,padding:"8px 16px",color:newEnvName.trim()?"#fff":"#555",fontSize:16,fontWeight:700,cursor:newEnvName.trim()?"pointer":"default"}}>Add</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── OVERVIEW (main budget view) ──
  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",background:"linear-gradient(180deg,#0a0a1a 0%,#121228 40%,#1a1040 100%)"}}>

      {/* Header */}
      <div style={{padding:"14px 16px 6px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <div>
          <div style={{fontSize:16,fontWeight:900,background:"linear-gradient(135deg,#43e97b,#38f9d7)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>💰 Budget</div>
          <div style={{fontSize:13,opacity:.35}}>{monthLabel}</div>
        </div>
        <div style={{display:"flex",gap:4}}>
          <button onClick={()=>setView("history")} style={{background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.08)",borderRadius:8,padding:"6px 10px",color:"#ccc",fontSize:14,fontWeight:700,cursor:"pointer"}}>📋</button>
          <button onClick={()=>setView("settings")} style={{background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.08)",borderRadius:8,padding:"6px 10px",color:"#ccc",fontSize:14,fontWeight:700,cursor:"pointer"}}>⚙️</button>
        </div>
      </div>

      {/* Summary bar */}
      <div style={{padding:"0 16px 10px",flexShrink:0}}>
        <div style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.06)",borderRadius:14,padding:"12px 14px"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
            <div style={{textAlign:"center",flex:1}}><div style={{fontSize:16,fontWeight:900,color:"#43e97b"}}>{fmt(totalBudgeted)}</div><div style={{fontSize:11,opacity:.35,fontWeight:700}}>BUDGETED</div></div>
            <div style={{textAlign:"center",flex:1}}><div style={{fontSize:16,fontWeight:900,color:"#f5576c"}}>{fmt(totalSpent)}</div><div style={{fontSize:11,opacity:.35,fontWeight:700}}>SPENT</div></div>
            <div style={{textAlign:"center",flex:1}}><div style={{fontSize:16,fontWeight:900,color:totalRemaining>=0?"#43e97b":"#f5576c"}}>{fmt(totalRemaining)}</div><div style={{fontSize:11,opacity:.35,fontWeight:700}}>LEFT</div></div>
          </div>
          {totalBudgeted>0&&<div style={{height:6,borderRadius:3,background:"rgba(255,255,255,.06)",overflow:"hidden"}}>
            <div style={{height:"100%",borderRadius:3,background:totalSpent>totalBudgeted?"linear-gradient(90deg,#f5576c,#ff8a65)":`linear-gradient(90deg,#43e97b,#38f9d7)`,width:`${pct(totalSpent,totalBudgeted)}%`,transition:"width .5s"}}/>
          </div>}
          {monthlyIncome>0&&<div style={{fontSize:13,opacity:.4,marginTop:6,textAlign:"center"}}>Income: {fmt(monthlyIncome)} · Unallocated: {fmt(monthlyIncome-totalBudgeted)}</div>}
        </div>
      </div>

      {/* Envelopes grid / empty state */}
      <div style={{flex:1,overflowY:"auto",padding:"0 16px 16px"}}>
        {envelopes.length===0?(
          <div style={{textAlign:"center",padding:"40px 20px"}}>
            <div style={{fontSize:48,marginBottom:12}}>💰</div>
            <div style={{fontSize:16,fontWeight:900,color:"#e8e0f0",marginBottom:6}}>No Envelopes Yet</div>
            <div style={{fontSize:16,opacity:.5,lineHeight:1.5,marginBottom:16}}>The envelope method helps you budget by dividing your money into categories. Tap below to set up your envelopes!</div>
            <button onClick={()=>setView("settings")} style={{background:"linear-gradient(135deg,#43e97b,#38f9d7)",color:"#1a1a2e",border:"none",borderRadius:14,padding:"12px 24px",fontSize:15,fontWeight:800,cursor:"pointer"}}>⚙️ Set Up Envelopes</button>
          </div>
        ):(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {envelopes.map(e=>{
              const spent=spentByEnv[e.id]||0;
              const remaining=(e.budget||0)-spent;
              const p=pct(spent,e.budget);
              const isOver=spent>e.budget&&e.budget>0;
              return(
                <div key={e.id} onClick={()=>{setAddEnv(e.id);setView("add");}}
                  style={{background:`${e.color}08`,border:`1px solid ${e.color}20`,borderRadius:14,padding:"12px",cursor:"pointer",transition:"all .15s",position:"relative",overflow:"hidden"}}>
                  {/* Progress bg */}
                  {e.budget>0&&<div style={{position:"absolute",bottom:0,left:0,right:0,height:`${p}%`,background:`${e.color}08`,transition:"height .5s",borderRadius:14}}/>}
                  <div style={{position:"relative",zIndex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                      <span style={{fontSize:20}}>{e.icon}</span>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:15,fontWeight:800,color:"#e8e0f0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.name}</div>
                        <div style={{fontSize:13,opacity:.4}}>{fmt(e.budget)}/mo</div>
                      </div>
                    </div>
                    {e.budget>0&&<div style={{height:4,borderRadius:2,background:"rgba(255,255,255,.06)",overflow:"hidden",marginBottom:4}}>
                      <div style={{height:"100%",borderRadius:2,background:isOver?`linear-gradient(90deg,#f5576c,#ff8a65)`:e.color,width:`${p}%`,transition:"width .4s"}}/>
                    </div>}
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
                      <span style={{fontSize:16,fontWeight:900,color:isOver?"#f5576c":e.color}}>{fmt(remaining)}</span>
                      <span style={{fontSize:13,opacity:.4}}>left</span>
                    </div>
                    {isOver&&<div style={{fontSize:11,color:"#f5576c",fontWeight:700,marginTop:2}}>⚠️ Over by {fmt(spent-e.budget)}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Recent transactions */}
        {monthTx.length>0&&<div style={{marginTop:14}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
            <span style={{fontSize:14,fontWeight:900,opacity:.4,letterSpacing:1}}>RECENT</span>
            <button onClick={()=>setView("history")} style={{background:"none",border:"none",color:"rgba(102,126,234,.7)",fontSize:14,fontWeight:700,cursor:"pointer"}}>See all →</button>
          </div>
          {monthTx.slice(0,5).map(tx=>{
            const env=envelopes.find(e=>e.id===tx.envId);
            return(
              <div key={tx.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,.03)"}}>
                <span style={{fontSize:15}}>{env?.icon||"💰"}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:15,fontWeight:700,color:"#e8e0f0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{tx.note||env?.name}</div>
                  <div style={{fontSize:13,opacity:.35}}>{tx.date} {tx.time||""}</div>
                </div>
                <span style={{fontSize:16,fontWeight:800,color:env?.color||"#f5576c"}}>-{fmt(tx.amount)}</span>
              </div>
            );
          })}
        </div>}
      </div>
    </div>
  );
}

// ─── WORKOUT TAB COMPONENT ───────────────────────────────────────────────────
function WorkoutTab({workoutData,setWorkoutData,checkBox,MONTH_NAMES}){
  const nowW=new Date();
  const[woMonth,setWoMonth]=useState(()=>({y:nowW.getFullYear(),m:nowW.getMonth()}));
  const woMonthKey=`${woMonth.y}-${String(woMonth.m+1).padStart(2,"0")}`;
  const getWoMonth=()=>({daily:{},weekly:{},monthly:{},customMonthly:[],...(workoutData[woMonthKey]||{})});
  const woData=getWoMonth();

  const toggleWoDaily=(weekKey,taskId,day)=>{
    setWorkoutData(p=>{const mo={...getWoMonth(),...p[woMonthKey]};const wk={...(mo.daily[weekKey]||{})};
      if(day){const taskDays=typeof wk[taskId]==="object"&&wk[taskId]!==null&&wk[taskId]!==true?{...wk[taskId]}:{};taskDays[day]=!taskDays[day];wk[taskId]=taskDays;}
      else{wk[taskId]=!wk[taskId];}
      return{...p,[woMonthKey]:{...mo,daily:{...mo.daily,[weekKey]:wk}}};});
  };
  const isWoDailyDone=(wData,taskId,day)=>{const v=wData[taskId];if(!v)return false;if(typeof v==="object"&&v!==null)return !!v[day];return !!v;};
  const woDailyDoneCount=(wData,taskId)=>{const v=wData[taskId];if(!v)return 0;if(typeof v==="object"&&v!==null)return Object.values(v).filter(Boolean).length;return v?7:0;};
  const WO_DAYS_SHORT=["M","T","W","T","F","S","S"];
  const WO_DAYS_FULL=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const toggleWoWeekly=(weekKey,day,idx)=>{
    setWorkoutData(p=>{const mo={...getWoMonth(),...p[woMonthKey]};const key=`${weekKey}_${day}`;const wk={...(mo.weekly[key]||{})};wk[idx]=!wk[idx];return{...p,[woMonthKey]:{...mo,weekly:{...mo.weekly,[key]:wk}}};});
  };
  const toggleWoMonthly=(taskId)=>{
    setWorkoutData(p=>{const mo={...getWoMonth(),...p[woMonthKey]};const mt={...mo.monthly};mt[taskId]=!mt[taskId];return{...p,[woMonthKey]:{...mo,monthly:mt}};});
  };
  const toggleWoCustom=(idx)=>{
    setWorkoutData(p=>{const mo={...getWoMonth(),...p[woMonthKey]};const list=[...(mo.customMonthly||[])];list[idx]={...list[idx],done:!list[idx].done};return{...p,[woMonthKey]:{...mo,customMonthly:list}};});
  };
  const addWoCustom=(text)=>{
    if(!text.trim())return;
    setWorkoutData(p=>{const mo={...getWoMonth(),...p[woMonthKey]};return{...p,[woMonthKey]:{...mo,customMonthly:[...(mo.customMonthly||[]),{text:text.trim(),done:false}]}};});
  };
  const clearWoCustom=(idx)=>{
    setWorkoutData(p=>{const mo={...getWoMonth(),...p[woMonthKey]};const list=[...(mo.customMonthly||[])];list.splice(idx,1);return{...p,[woMonthKey]:{...mo,customMonthly:list}};});
  };
  const carryWoForward=()=>{
    const mo=getWoMonth();const undone=(mo.customMonthly||[]).filter(t=>!t.done).map(t=>({...t,done:false}));
    if(!undone.length)return;
    const next=new Date(woMonth.y,woMonth.m+1,1);
    const nk=`${next.getFullYear()}-${String(next.getMonth()+1).padStart(2,"0")}`;
    setWorkoutData(p=>{const nmo={daily:{},weekly:{},monthly:{},customMonthly:[],...(p[nk]||{})};const merged=[...(nmo.customMonthly||[]),...undone.filter(u=>!(nmo.customMonthly||[]).some(e=>e.text===u.text))];return{...p,[nk]:{...nmo,customMonthly:merged}};});
    alert(`✅ ${undone.length} goal${undone.length>1?"s":""} carried to next month!`);
  };

  const woWeeks=useMemo(()=>{
    const weeks=[];const first=new Date(woMonth.y,woMonth.m,1);const last=new Date(woMonth.y,woMonth.m+1,0);
    const cur=new Date(first);const dow=cur.getDay();cur.setDate(cur.getDate()-(dow===0?6:dow-1));
    while(cur<=last){const wStart=new Date(cur);const label=`Week of ${wStart.toLocaleDateString("en-US",{month:"short",day:"numeric"})}`;const key=toDateStr(wStart);weeks.push({label,key});cur.setDate(cur.getDate()+7);}
    return weeks;
  },[woMonth]);

  const[woOpenWeek,setWoOpenWeek]=useState(()=>toDateStr(new Date(new Date().getFullYear(),new Date().getMonth(),1)));
  const[woNewCustom,setWoNewCustom]=useState("");
  const[woCarryConfirm,setWoCarryConfirm]=useState(false);
  const woMonthlyDone=WO_MONTHLY.filter(t=>woData.monthly[t.id]).length+((woData.customMonthly||[]).filter(t=>t.done).length);
  const woMonthlyTotal=WO_MONTHLY.length+(woData.customMonthly||[]).length;

  return <div style={{flex:1,overflowY:"auto",padding:"12px 16px 16px"}}>
    {/* Month nav */}
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
      <button onClick={()=>setWoMonth(p=>{const d=new Date(p.y,p.m-1,1);return{y:d.getFullYear(),m:d.getMonth()};})}
        style={{background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.1)",borderRadius:8,padding:"5px 10px",color:"#ccc",fontSize:16,cursor:"pointer",fontWeight:700}}>‹</button>
      <div style={{flex:1,textAlign:"center",fontSize:15,fontWeight:900,color:"#e8e0f0"}}>{MONTH_NAMES[woMonth.m]} {woMonth.y}</div>
      <button onClick={()=>setWoMonth(p=>{const d=new Date(p.y,p.m+1,1);return{y:d.getFullYear(),m:d.getMonth()};})}
        style={{background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.1)",borderRadius:8,padding:"5px 10px",color:"#ccc",fontSize:16,cursor:"pointer",fontWeight:700}}>›</button>
    </div>

    {/* Science note */}
    <div style={{background:"rgba(67,233,123,.06)",border:"1px solid rgba(67,233,123,.15)",borderRadius:12,padding:"8px 12px",marginBottom:14,fontSize:14,color:"rgba(67,233,123,.8)",lineHeight:1.5}}>
      💡 Based on ACSM & WHO guidelines for healthy aging: strength 2–3×/wk, mobility daily, balance weekly, 150 min moderate cardio/wk.
    </div>

    {/* ── DAILY FOUNDATION with day-of-week columns ── */}
    <div style={{marginBottom:14}}>
      <div style={{fontSize:14,fontWeight:900,opacity:.4,letterSpacing:1,marginBottom:8}}>DAILY FOUNDATION</div>
      {woWeeks.map(week=>{
        const wData=woData.daily[week.key]||{};
        const totalChecks=WO_DAILY.reduce((s,t)=>s+woDailyDoneCount(wData,t.id),0);
        const totalPossible=WO_DAILY.length*7;
        const isOpen=woOpenWeek===week.key;
        return(
          <div key={week.key} style={{marginBottom:6,borderRadius:12,border:"1px solid rgba(255,255,255,.07)",overflow:"hidden"}}>
            <div className="week-header" onClick={()=>setWoOpenWeek(isOpen?null:week.key)}
              style={{display:"flex",alignItems:"center",gap:8,padding:"9px 12px",cursor:"pointer",background:"rgba(255,255,255,.03)"}}>
              <span style={{fontSize:15,fontWeight:800,color:"#e8e0f0",flex:1}}>{week.label}</span>
              <span style={{fontSize:14,color:totalChecks===totalPossible?"#43e97b":"rgba(255,255,255,.35)",fontWeight:700}}>{totalChecks}/{totalPossible}</span>
              <span style={{fontSize:14,opacity:.4}}>{isOpen?"▲":"▼"}</span>
            </div>
            {isOpen&&<div style={{padding:"6px 6px 10px",background:"rgba(0,0,0,.15)",overflowX:"auto"}}>
              {/* Day headers */}
              <div style={{display:"flex",alignItems:"center",marginBottom:4,minWidth:0}}>
                <div style={{flex:1,minWidth:80}}/>
                {WO_DAYS_SHORT.map((d,i)=>(
                  <div key={i} style={{width:28,textAlign:"center",fontSize:10,fontWeight:800,opacity:.35,flexShrink:0}}>{d}</div>
                ))}
              </div>
              {/* Task rows */}
              {WO_DAILY.map(t=>{
                const doneCount=woDailyDoneCount(wData,t.id);
                return(
                  <div key={t.id} style={{display:"flex",alignItems:"center",padding:"5px 0",borderBottom:"1px solid rgba(255,255,255,.03)",minWidth:0}}>
                    <div style={{flex:1,minWidth:80,paddingRight:6}}>
                      <div style={{fontSize:13,color:doneCount>=7?"rgba(255,255,255,.35)":"#e8e0f0",fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.label}</div>
                      <div style={{fontSize:11,opacity:.3}}>{t.sets} · {t.note}</div>
                    </div>
                    {WO_DAYS_FULL.map((day)=>{
                      const done=isWoDailyDone(wData,t.id,day);
                      return(
                        <div key={day} onClick={()=>toggleWoDaily(week.key,t.id,day)}
                          style={{width:28,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,cursor:"pointer",padding:"2px 0"}}>
                          <div style={{width:20,height:20,borderRadius:"50%",border:`2px solid ${done?"#43e97b":"rgba(255,255,255,.12)"}`,background:done?"#43e97b":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff",transition:"all .15s"}}>{done&&"✓"}</div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>}
          </div>
        );
      })}
    </div>

    {/* ── WEEKLY TRAINING SPLIT ── */}
    <div style={{marginBottom:14}}>
      <div style={{fontSize:14,fontWeight:900,opacity:.4,letterSpacing:1,marginBottom:8}}>WEEKLY TRAINING SPLIT</div>
      {woWeeks.map(week=>{
        const isOpen=woOpenWeek===`wo_${week.key}`;
        const totalDone=WO_WEEKLY.reduce((acc,r)=>{const key=`${week.key}_${r.day}`;const d=woData.weekly[key]||{};return acc+r.exercises.filter((_,i)=>d[i]).length;},0);
        const totalEx=WO_WEEKLY.reduce((a,r)=>a+r.exercises.length,0);
        return(
          <div key={week.key} style={{marginBottom:6,borderRadius:12,border:"1px solid rgba(255,255,255,.07)",overflow:"hidden"}}>
            <div className="week-header" onClick={()=>setWoOpenWeek(isOpen?null:`wo_${week.key}`)}
              style={{display:"flex",alignItems:"center",gap:8,padding:"9px 12px",cursor:"pointer",background:"rgba(255,255,255,.03)"}}>
              <span style={{fontSize:15,fontWeight:800,color:"#e8e0f0",flex:1}}>{week.label}</span>
              <span style={{fontSize:14,color:totalDone===totalEx?"#43e97b":"rgba(255,255,255,.35)",fontWeight:700}}>{totalDone}/{totalEx}</span>
              <span style={{fontSize:14,opacity:.4}}>{isOpen?"▲":"▼"}</span>
            </div>
            {isOpen&&<div style={{padding:"6px 12px 10px",background:"rgba(0,0,0,.15)"}}>
              {WO_WEEKLY.map(day=>{
                const key=`${week.key}_${day.day}`;
                const d=woData.weekly[key]||{};
                const dayDone=day.exercises.filter((_,i)=>d[i]).length;
                return(
                  <div key={day.day} style={{marginBottom:12}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6,paddingBottom:4,borderBottom:`1px solid ${day.color}22`}}>
                      <span style={{fontSize:13,fontWeight:900,color:day.color,letterSpacing:.5}}>{day.day.toUpperCase()}</span>
                      <span style={{fontSize:16,fontWeight:800,color:"#e8e0f0"}}>{day.focus}</span>
                      <div style={{marginLeft:4,height:6,width:6,borderRadius:"50%",background:day.color,boxShadow:`0 0 5px ${day.color}`}}/>
                      <span style={{marginLeft:"auto",fontSize:13,color:dayDone===day.exercises.length?"#43e97b":"rgba(255,255,255,.3)",fontWeight:700}}>{dayDone}/{day.exercises.length}</span>
                    </div>
                    {day.exercises.map((ex,i)=>(
                      <div key={i} className="clean-item" onClick={()=>toggleWoWeekly(week.key,day.day,i)}
                        style={{display:"flex",alignItems:"flex-start",gap:10,padding:"7px 4px",borderBottom:"1px solid rgba(255,255,255,.03)",cursor:"pointer"}}>
                        <div style={{marginTop:2}}>{checkBox(!!d[i],day.color)}</div>
                        <div style={{flex:1}}>
                          <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                            <span style={{fontSize:15,color:d[i]?"rgba(255,255,255,.3)":"#e8e0f0",textDecoration:d[i]?"line-through":"none",fontWeight:600}}>{ex.name}</span>
                            <span style={{fontSize:13,color:"rgba(255,255,255,.3)",background:"rgba(255,255,255,.06)",borderRadius:4,padding:"1px 5px",flexShrink:0}}>{ex.sets}</span>
                          </div>
                          <div style={{fontSize:13,opacity:.3,marginTop:1}}>{ex.note}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>}
          </div>
        );
      })}
    </div>

    {/* ── MONTHLY GOALS ── */}
    <div style={{marginBottom:14}}>
      <div style={{display:"flex",alignItems:"center",marginBottom:8}}>
        <div style={{fontSize:14,fontWeight:900,opacity:.4,letterSpacing:1,flex:1}}>MONTHLY GOALS</div>
        <span style={{fontSize:14,color:woMonthlyDone===woMonthlyTotal?"#43e97b":"rgba(255,255,255,.35)",fontWeight:700}}>{woMonthlyDone}/{woMonthlyTotal}</span>
      </div>
      <div style={{background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.07)",borderRadius:12,overflow:"hidden"}}>
        <div style={{padding:"4px 12px 8px"}}>
          {WO_MONTHLY.map(t=>{const done=!!woData.monthly[t.id];return(
            <div key={t.id} className="clean-item" onClick={()=>toggleWoMonthly(t.id)}
              style={{display:"flex",alignItems:"center",gap:10,padding:"8px 4px",borderBottom:"1px solid rgba(255,255,255,.04)",cursor:"pointer"}}>
              {checkBox(done,"#a78bfa")}
              <span style={{fontSize:15,color:done?"rgba(255,255,255,.35)":"#e8e0f0",textDecoration:done?"line-through":"none"}}>{t.label}</span>
            </div>
          );})}
          {(woData.customMonthly||[]).map((t,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 4px",borderBottom:"1px solid rgba(255,255,255,.04)"}}>
              <div onClick={()=>toggleWoCustom(i)} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:10,flex:1}}>
                {checkBox(t.done,"#a78bfa")}
                <span style={{fontSize:15,color:t.done?"rgba(255,255,255,.35)":"#e8e0f0",textDecoration:t.done?"line-through":"none"}}>{t.text}</span>
              </div>
              <button onClick={()=>clearWoCustom(i)} style={{background:"rgba(245,87,108,.12)",border:"1px solid rgba(245,87,108,.2)",borderRadius:6,padding:"2px 7px",fontSize:14,color:"#f5576c",cursor:"pointer",flexShrink:0}}>✕</button>
            </div>
          ))}
          <div style={{display:"flex",gap:6,padding:"8px 4px 2px"}}>
            <input value={woNewCustom} onChange={e=>setWoNewCustom(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter"&&woNewCustom.trim()){addWoCustom(woNewCustom);setWoNewCustom("");}}}
              placeholder="+ Add personal goal…"
              style={{flex:1,background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",borderRadius:8,
                padding:"7px 10px",color:"#e8e0f0",fontSize:15,outline:"none",fontFamily:"'Nunito','Segoe UI',sans-serif"}}/>
            <button onClick={()=>{if(woNewCustom.trim()){addWoCustom(woNewCustom);setWoNewCustom("");}}}
              style={{background:"linear-gradient(135deg,#a78bfa,#667eea)",border:"none",borderRadius:8,padding:"7px 12px",fontSize:16,color:"#fff",cursor:"pointer",fontWeight:800,flexShrink:0}}>+</button>
          </div>
        </div>
      </div>
      {(woData.customMonthly||[]).some(t=>!t.done)&&(
        <div style={{marginTop:8}}>
          {!woCarryConfirm
            ?<button onClick={()=>setWoCarryConfirm(true)}
                style={{width:"100%",background:"rgba(167,139,250,.06)",border:"1px solid rgba(167,139,250,.2)",
                  borderRadius:10,padding:"8px 12px",color:"#a78bfa",fontSize:15,cursor:"pointer",fontWeight:700}}>
                🗃️ Carry unfinished goals → next month
              </button>
            :<div style={{background:"rgba(167,139,250,.06)",border:"1px solid rgba(167,139,250,.2)",borderRadius:10,padding:"10px 12px"}}>
                <div style={{fontSize:15,color:"#a78bfa",fontWeight:700,marginBottom:8}}>
                  Carry {(woData.customMonthly||[]).filter(t=>!t.done).length} goal{(woData.customMonthly||[]).filter(t=>!t.done).length>1?"s":""} to {MONTH_NAMES[woMonth.m===11?0:woMonth.m+1]}?
                </div>
                <div style={{display:"flex",gap:6}}>
                  <button onClick={()=>{carryWoForward();setWoCarryConfirm(false);}}
                    style={{flex:1,background:"linear-gradient(135deg,#a78bfa,#667eea)",border:"none",borderRadius:8,padding:"7px 0",fontSize:15,color:"#fff",cursor:"pointer",fontWeight:800}}>✓ Yes, carry over</button>
                  <button onClick={()=>setWoCarryConfirm(false)}
                    style={{flex:1,background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:8,padding:"7px 0",fontSize:15,color:"#aaa",cursor:"pointer",fontWeight:700}}>Cancel</button>
                </div>
              </div>
          }
        </div>
      )}
    </div>
  </div>;
}

function SpiritAnimals(){
  const[appState,setAppState]=useState(()=>loadState());
  const[screen,setScreen]=useState(appState?"home":"welcome");
  const[showShare,setShowShare]=useState(false);const[showDuel,setShowDuel]=useState(false);const[showMiniGames,setShowMiniGames]=useState(false);
  const[showMore,setShowMore]=useState(false);
  const[editingGoals,setEditingGoals]=useState(false);
  const[customHabitName,setCustomHabitName]=useState("");const[customHabitIcon,setCustomHabitIcon]=useState("⭐");
  const[customNegEffect,setCustomNegEffect]=useState(null);const[pendingEffect,setPendingEffect]=useState(null);
  const[buddyName,setBuddyName]=useState("");const[tempAnimal,setTempAnimal]=useState(null);
  const[nameHistory,setNameHistory]=useState([]);const[nameIdx,setNameIdx]=useState(-1);
  const[customEmoji,setCustomEmoji]=useState("");
  const[tempHabits,setTempHabits]=useState(()=>PRESET_HABITS.map(h=>h.id));const[customHabits,setCustomHabits]=useState([]);
  const[confetti,setConfetti]=useState(false);
  
  const[usedEffects,setUsedEffects]=useState([]);
  const[previousGoals,setPreviousGoals]=useState(()=>{try{const p=localStorage.getItem("zodibuddies_prev_goals");return p?JSON.parse(p):[];}catch{return[];}});
  const[restoreCode,setRestoreCode]=useState("");const[restoreError,setRestoreError]=useState("");const[showRestore,setShowRestore]=useState(false);
  const[restoreAnimal,setRestoreAnimal]=useState("");const[restoreName,setRestoreName]=useState("");

  // ─── PLANNER STATE ────────────────────────────────────────────────
  const[activeTab,setActiveTab]=useState("buddy");
  const[showSettings,setShowSettings]=useState(false);
  const[plannerViewDate,setPlannerViewDate]=useState(getToday());
  const[plannerData,setPlannerData]=useState(()=>{try{const p=localStorage.getItem("zodibuddy_planner_v1");return p?JSON.parse(p):{};} catch{return {};}});
  const[editingSlot,setEditingSlot]=useState(null);
  const[editingText,setEditingText]=useState("");
  const[historyOpen,setHistoryOpen]=useState(false);
  useEffect(()=>{try{localStorage.setItem("zodibuddy_planner_v1",JSON.stringify(plannerData));}catch{}},[plannerData]);

  const MOODS=[
    {id:"rad",   label:"Rad",   color:"#ffd700",glow:"255,215,0"},
    {id:"good",  label:"Good",  color:"#43e97b",glow:"67,233,123"},
    {id:"meh",   label:"Meh",   color:"#60a5fa",glow:"96,165,250"},
    {id:"low",   label:"Low",   color:"#f093fb",glow:"240,147,251"},
    {id:"rough", label:"Rough", color:"#f5576c",glow:"245,87,108"},
  ];
  const getPlannerDay=(date)=>({slots:{},mood:null,note:"",...(plannerData[date]||{})});
  const setMood=(date,moodId)=>{
    setPlannerData(p=>{const d=getPlannerDay(date);return{...p,[date]:{...d,mood:d.mood===moodId?null:moodId}};});
  };
  const setSlotText=(date,slot,text)=>{
    setPlannerData(p=>{const d=getPlannerDay(date);const slots={...d.slots};
      if(text.trim()==="")delete slots[slot]; else slots[slot]=text;
      return{...p,[date]:{...d,slots}};});
  };
  const setDayNote=(date,note)=>{
    setPlannerData(p=>{const d=getPlannerDay(date);return{...p,[date]:{...d,note}};});
  };
  // Generate 30-min slots for 24hr day
  const TIME_SLOTS=Array.from({length:48},(_,i)=>{
    const h=Math.floor(i/2),m=i%2===0?"00":"30";
    const hh=String(h).padStart(2,"0");
    return{key:`${hh}:${m}`,label:`${hh}:${m}`};
  });
  // History: dates that have any planner data
  const plannerHistory=useMemo(()=>Object.keys(plannerData).filter(d=>{
    const day=plannerData[d];
    return day.mood||day.note||(day.slots&&Object.keys(day.slots).length>0);
  }).sort((a,b)=>b.localeCompare(a)),[plannerData]);
  const[cleanData,setCleanData]=useState(()=>{try{const p=localStorage.getItem("zodibuddy_clean_v1");return p?JSON.parse(p):{};} catch{return {};}});
  useEffect(()=>{try{localStorage.setItem("zodibuddy_clean_v1",JSON.stringify(cleanData));}catch{}},[cleanData]);
  const[workoutData,setWorkoutData]=useState(()=>{try{const p=localStorage.getItem("zodibuddy_workout_v1");return p?JSON.parse(p):{};} catch{return {};}});
  useEffect(()=>{try{localStorage.setItem("zodibuddy_workout_v1",JSON.stringify(workoutData));}catch{}},[workoutData]);

  // ─── BUDGET STATE ──────────────────────────────────────────────────
  const[budgetData,setBudgetData]=useState(()=>{try{const p=localStorage.getItem("zodibuddy_budget_v1");return p?JSON.parse(p):{envelopes:[],transactions:[],monthlyIncome:0};} catch{return {envelopes:[],transactions:[],monthlyIncome:0};}});
  useEffect(()=>{try{localStorage.setItem("zodibuddy_budget_v1",JSON.stringify(budgetData));}catch{}},[budgetData]);

  // ─── SECRET JOURNAL STATE ─────────────────────────────────────────
  const[journalData,setJournalData]=useState(()=>{try{const p=localStorage.getItem("zodibuddy_journal_v1");return p?JSON.parse(p):{entries:{},pwHash:null};} catch{return {entries:{},pwHash:null};}});
  useEffect(()=>{try{localStorage.setItem("zodibuddy_journal_v1",JSON.stringify(journalData));}catch{}},[journalData]);

  const duelStats=appState?calcDuelStats(appState):{power:0};
  const duelCode=useMemo(()=>encodeDuelCode(appState),[appState]);

  // Midnight reset: re-render when day changes so goals reset to unchecked
  const[currentDay,setCurrentDay]=useState(getToday);
  useEffect(()=>{
    const iv=setInterval(()=>{
      const now=getToday();
      if(now!==currentDay){setCurrentDay(now);}
      
    },15000);
    return()=>clearInterval(iv);
  },[currentDay,activeTab]);

  // Save state + update streak
  useEffect(()=>{
    if(appState){
      saveState(appState);
      const s=getAuraStreak(appState);if(s!==appState.auraStreak)setAppState(p=>({...p,auraStreak:s}));
    }
  },[appState]);
  useEffect(()=>{try{localStorage.setItem("zodibuddies_prev_goals",JSON.stringify(previousGoals));}catch{}},[previousGoals]);

  const addDailyQuest=()=>{
    if(!dailyQuestInfo)return;
    const q=dailyQuestInfo;
    const usedV=(appState?.allHabits||[]).filter(h=>h.negVisual).map(h=>h.negVisual);
    const avail=CUSTOM_EFFECTS.filter(ef=>!usedV.includes(ef.visual));
    const hints=getHintedEffects(q.name).map(h=>avail.find(ef=>ef.visual===h||ef.id===h)).filter(Boolean);
    const eff=hints[0]||avail[0]||CUSTOM_EFFECTS[0];
    const nd=NEGATIVE_EFFECTS.find(ef=>ef.id===eff?.id);
    const hId=`custom_${q.id}`;
    const h={id:hId,name:q.name,icon:q.icon,negVisual:nd?.visual||"cry",negEffect:nd?.name||"Buddy looks sad"};
    setAppState(prev=>({
      ...prev,
      allHabits:[...(prev.allHabits||[]).filter(x=>x.id!==hId),h],
      selectedHabits:[...(prev.selectedHabits||[]).filter(x=>x!==hId),hId]
    }));
    setShowMore(true);
  };

  const startNew=()=>{
    const isCustom=tempAnimal==="custom";
    const newState={animal:tempAnimal,buddyName:buddyName||(isCustom?"Buddy":(ZODIAC_ANIMALS.find(a=>a.id===tempAnimal)?.emoji||"Buddy")),selectedHabits:tempHabits,allHabits:[...PRESET_HABITS,...customHabits],completionLog:{},completionTimestamps:{},startDate:getToday(),auraStreak:0};
    if(isCustom)newState.customAnimal={emoji:customEmoji||"🐾"};
    // Apply transfer stats if token was used
    try{const tr=localStorage.getItem("zodibuddies_transfer");if(tr){const carry=JSON.parse(tr);
      newState.completionLog=carry.completionLog||{};newState.completionTimestamps=carry.completionTimestamps||{};
      newState.auraStreak=carry.auraStreak||0;newState.startDate=carry.startDate||getToday();
      localStorage.removeItem("zodibuddies_transfer");
    }}catch{}
    setAppState(newState);setScreen("home");
  };

  // Edit goals: navigate to pick_habits with current state
  const openEditGoals=()=>{
    setTempHabits([...(appState?.selectedHabits||[])]);
    setCustomHabits((appState?.allHabits||[]).filter(h=>h.id?.startsWith("custom_")));
    setUsedEffects([]);
    setEditingGoals(true);
    setScreen("pick_habits");
  };
  const saveEditGoals=()=>{
    setAppState(prev=>({
      ...prev,
      selectedHabits:tempHabits,
      allHabits:[...PRESET_HABITS,...customHabits],
    }));
    setEditingGoals(false);
    setScreen("home");
  };
  const toggleHabit=(id)=>{
    const today=getToday();setAppState(prev=>{const log={...(prev.completionLog||{})};const tl=[...(log[today]||[])];
    const ts={...(prev.completionTimestamps||{})};const tts=[...(ts[today]||[])];
    const idx=tl.indexOf(id);if(idx>=0){tl.splice(idx,1);}else{tl.push(id);tts.push(Date.now());}
    log[today]=tl;ts[today]=tts;
    if(tl.length>=prev.selectedHabits.length&&idx<0){setConfetti(true);setTimeout(()=>setConfetti(false),2000);}
    return{...prev,completionLog:log,completionTimestamps:ts};});
  };

  // Auto-suggest effect based on habit name, or pick random available
  const autoSuggestEffect=(name)=>{
    const hints=getHintedEffects(name);const avail=CUSTOM_EFFECTS.filter(e=>!usedEffects.includes(e.id));
    const hinted=hints.map(h=>avail.find(e=>e.visual===h||e.id===h)).filter(Boolean);
    return hinted[0]||avail[Math.floor(Math.random()*avail.length)]||CUSTOM_EFFECTS[0];
  };
  const[autoEffect,setAutoEffect]=useState(null);
  // Effect confirm adds the habit immediately
  const confirmEffect=(effId)=>{
    if(!customHabitName.trim())return;
    const nd=NEGATIVE_EFFECTS.find(e=>e.id===effId);
    const h={id:`custom_${Date.now()}`,name:customHabitName.trim(),icon:customHabitIcon||"⭐",negVisual:nd?.visual||"cry",negEffect:nd?.name||"Buddy looks sad"};
    setCustomHabits(p=>[...p,h]);setTempHabits(p=>[...p,h.id]);setUsedEffects(p=>[...p,effId]);
    setCustomHabitName("");setCustomHabitIcon("⭐");setCustomNegEffect(null);setPendingEffect(null);setAutoEffect(null);
  };

  const deleteCustomHabit=(hId)=>{
    const h=customHabits.find(x=>x.id===hId);
    if(h){
      const effId=NEGATIVE_EFFECTS.find(e=>e.visual===h.negVisual)?.id;if(effId)setUsedEffects(p=>p.filter(x=>x!==effId));
      // Move to previously used (if not already there)
      setPreviousGoals(p=>{
        if(p.some(x=>x.name===h.name))return p;
        return[...p,{name:h.name,icon:h.icon,negVisual:h.negVisual,negEffect:h.negEffect}];
      });
    }
    setCustomHabits(p=>p.filter(x=>x.id!==hId));setTempHabits(p=>p.filter(x=>x!==hId));
  };
  const deletePreviousGoal=(name)=>{
    setPreviousGoals(p=>p.filter(x=>x.name!==name));
  };
  const restorePreviousGoal=(pg)=>{
    const h={id:`custom_${Date.now()}`,name:pg.name,icon:pg.icon,negVisual:pg.negVisual||"cry",negEffect:pg.negEffect||"Buddy looks sad"};
    setCustomHabits(p=>[...p,h]);setTempHabits(p=>[...p,h.id]);
    setPreviousGoals(p=>p.filter(x=>x.name!==pg.name));
  };

  const[showResetConfirm,setShowResetConfirm]=useState(false);
  const[devTaps,setDevTaps]=useState(0);const[devStreak,setDevStreak]=useState(null);const devTimer=useMemo(()=>({t:null}),[]);
  const transferAndReset=()=>{
    const carry={completionLog:appState.completionLog,completionTimestamps:appState.completionTimestamps,auraStreak:appState.auraStreak,startDate:appState.startDate,allHabits:appState.allHabits,selectedHabits:appState.selectedHabits};
    localStorage.setItem("zodibuddies_transfer",JSON.stringify(carry));
    localStorage.removeItem("zodibuddies_v1");
    setTimeout(()=>window.location.reload(),200);
  };
  const reset=()=>{localStorage.removeItem("zodibuddies_v1");setTimeout(()=>window.location.reload(),200);};

  const today=getToday();const doneToday=appState?.completionLog?.[today]||[];
  const habitsData=appState?[...PRESET_HABITS,...(appState.allHabits||[]).filter(h=>h.id?.startsWith("custom_"))]:PRESET_HABITS;
  const level=appState?getLevel(appState):LEVEL_REQUIREMENTS[0];
  const _realStreak=appState?.auraStreak||0;const streak=devStreak!==null?devStreak:_realStreak;const days=appState?.startDate?getDaysBetween(appState.startDate,getToday())+1:0;
  const allDoneToday=appState?getAllDone(appState):false;const nextLv=LEVEL_REQUIREMENTS.find(l=>l.level===level.level+1);
  const hp=appState?getHP(appState):100;const canEditHabits=true;
  const hinted=getHintedEffects(customHabitName);
  // Filter out suggestions that have already been added as habits
  const usedHabitNames=new Set([...PRESET_HABITS.map(h=>h.name),...customHabits.map(h=>h.name),...(appState?.allHabits||[]).filter(h=>h.id?.startsWith("custom_")).map(h=>h.name),...previousGoals.map(h=>h.name)]);
  const availableSuggestions=CUSTOM_EXAMPLES.filter(s=>!usedHabitNames.has(s.name));

  const S={
    app:{height:"100vh",maxHeight:"100dvh",background:"linear-gradient(180deg,#0a0a1a 0%,#121228 40%,#1a1040 100%)",color:"#e8e0f0",fontFamily:"'Nunito','Segoe UI',sans-serif",maxWidth:430,margin:"0 auto",position:"relative",overflow:"hidden",display:"flex",flexDirection:"column"},
    btn:{background:"linear-gradient(135deg,#667eea,#764ba2)",color:"#fff",border:"none",borderRadius:14,padding:"11px 20px",fontSize:16,fontWeight:700,cursor:"pointer",minHeight:42},
    btnS:{background:"rgba(255,255,255,.08)",color:"#ccc",border:"1px solid rgba(255,255,255,.1)",borderRadius:10,padding:"8px 14px",fontSize:15,fontWeight:600,cursor:"pointer",minHeight:38},
    ad:{height:60,minHeight:60,background:"rgba(10,10,26,.95)",borderTop:"1px solid rgba(255,255,255,.05)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,color:"rgba(255,255,255,.2)"},
  };
  const Confetti=()=>confetti?<div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:999}}>{Array.from({length:20}).map((_,i)=><div key={i} style={{position:"absolute",left:`${Math.random()*100}%`,top:-20,fontSize:18,animation:`confetti ${1.5+Math.random()*1.5}s linear forwards`,animationDelay:`${Math.random()*.5}s`}}>{["🎉","⭐","✨","🌟","💫"][Math.floor(Math.random()*5)]}</div>)}</div>:null;

  // ─── WELCOME ──────────────────────────────────────────────────────
  if(screen==="welcome")return(
    <div style={S.app}><style>{CSS}</style>
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"0 24px",textAlign:"center"}}>
        <div style={{fontSize:64,marginBottom:12,animation:"float 3s ease-in-out infinite"}}>🐾</div>
        <h1 style={{fontSize:32,fontWeight:900,background:"linear-gradient(135deg,#f093fb,#f5576c,#feca57)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:8}}>Zobuddy</h1>
        <p style={{fontSize:16,opacity:.55,lineHeight:1.6,maxWidth:310,marginBottom:8}}>Your Zobuddy has been cheering for you since day one — like, literally the day you showed up on this planet. Time to return the favor! 🐾</p>
        <p style={{fontSize:16,opacity:.4,lineHeight:1.5,maxWidth:310,marginBottom:20}}>Complete daily goals to keep your buddy happy (skip them and they get dramatic 😤). Build streaks, grow your power, and battle friends with a lucky dice roll! 🎲</p>
        <button style={S.btn} onClick={()=>setScreen("pick_animal")}>Meet Your Buddy 🐾</button>
        <button onClick={()=>setShowRestore(true)} style={{background:"none",border:"none",color:"rgba(255,255,255,.35)",fontSize:15,marginTop:12,cursor:"pointer",textDecoration:"underline"}}>🔑 Restore from battle code</button>
        {showRestore&&<div style={{marginTop:12,background:"rgba(255,255,255,.05)",borderRadius:14,padding:14,border:"1px solid rgba(255,255,255,.1)",width:"100%",maxWidth:310}}>
          <div style={{fontSize:15,fontWeight:700,opacity:.6,marginBottom:6}}>Paste your battle code:</div>
          <textarea value={restoreCode} onChange={e=>{setRestoreCode(e.target.value);setRestoreError("");}} placeholder="Paste your 🔑 battle code here..." rows={2} style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid rgba(255,255,255,.1)",background:"rgba(255,255,255,.05)",color:"#feca57",fontSize:14,outline:"none",resize:"none",fontFamily:"monospace"}}/>
          <div style={{fontSize:15,fontWeight:700,opacity:.6,marginTop:8,marginBottom:4}}>Verify your identity:</div>
          <div style={{display:"flex",gap:6,marginBottom:6}}>
            <select value={restoreAnimal||""} onChange={e=>setRestoreAnimal(e.target.value)} style={{flex:1,padding:"8px 10px",borderRadius:8,border:"1px solid rgba(255,255,255,.1)",background:"rgba(255,255,255,.08)",color:"#fff",fontSize:16,outline:"none"}}>
              <option value="" disabled>Animal type...</option>
              {ZODIAC_ANIMALS.map(a=><option key={a.id} value={a.id}>{a.face||a.emoji} {a.id}</option>)}
              <option value="custom">➕ Custom</option>
            </select>
          </div>
          <input value={restoreName} onChange={e=>{setRestoreName(e.target.value);setRestoreError("");}} placeholder="Enter buddy name..." style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid rgba(255,255,255,.1)",background:"rgba(255,255,255,.05)",color:"#fff",fontSize:16,outline:"none",marginBottom:4}}/>
          {restoreError&&<div style={{fontSize:14,color:"#f5576c",marginTop:4}}>{restoreError}</div>}
          <button onClick={()=>{
            const clean=restoreCode.replace(/[\s-]/g,"").toUpperCase();
            if(clean.length!==8){setRestoreError("Code must be 8 characters.");return;}
            const decoded=decodeDuelCode(clean);
            if(!decoded){setRestoreError("Invalid code. Check and try again.");return;}
            if(!restoreAnimal){setRestoreError("Please select your animal type.");return;}
            if(!restoreName.trim()){setRestoreError("Please enter your buddy name.");return;}
            if(restoreAnimal!==decoded.animal){setRestoreError("❌ Animal type doesn't match this code.");return;}
            // Build a complete state with all required fields
            const fullState={
              animal:decoded.animal||restoreAnimal,
              buddyName:restoreName.trim(),
              selectedHabits:decoded.selectedHabits||PRESET_HABITS.slice(0,decoded._goals||3).map(h=>h.id),
              allHabits:decoded.allHabits||[...PRESET_HABITS],
              completionLog:decoded.completionLog||{},
              completionTimestamps:decoded.completionTimestamps||{},
              startDate:decoded.startDate||getToday(),
              auraStreak:decoded.auraStreak||0,
              _decoded:true
            };
            if(decoded.animal==="custom")fullState.customAnimal={emoji:"🐾"};
            try{saveState(fullState);setTimeout(()=>window.location.reload(),200);}catch(e){setRestoreError("Error restoring: "+e.message);return;}
          }} style={{...S.btn,width:"100%",marginTop:8,fontSize:16}}>Restore Game 🔄</button>
          <button onClick={()=>{setShowRestore(false);setRestoreCode("");setRestoreError("");setRestoreName("");setRestoreAnimal("");}} style={{background:"none",border:"none",color:"rgba(255,255,255,.3)",fontSize:14,marginTop:6,cursor:"pointer"}}>Cancel</button>
        </div>}
      </div>
      <div style={S.ad}/>
    </div>
  );

  // ─── PICK ANIMAL (no bonus) ───────────────────────────────────────
  const isCustomSelected=tempAnimal==="custom";
  const canProceed=tempAnimal&&(!isCustomSelected||customEmoji);

  if(screen==="pick_animal")return(
    <div style={S.app}><style>{CSS}</style>
      <div style={{flex:1,overflow:"auto",padding:"16px 16px 0"}}>
        <div style={{textAlign:"center",marginBottom:8}}><div style={{fontSize:18,fontWeight:900,background:"linear-gradient(135deg,#f093fb,#f5576c,#feca57)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Choose Your Zobuddy</div></div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:8}}>
          {ZODIAC_ANIMALS.map(a=>(
            <div key={a.id} onClick={()=>{setTempAnimal(a.id);setCustomEmoji("");}} style={{background:tempAnimal===a.id?`linear-gradient(135deg,${a.color}44,${a.accent}44)`:"rgba(255,255,255,.03)",border:tempAnimal===a.id?`2px solid ${a.accent}`:"1px solid rgba(255,255,255,.06)",borderRadius:14,padding:"10px 2px",textAlign:"center",cursor:"pointer"}}>
              <div style={{fontSize:28,marginBottom:2}}>{a.face||a.emoji}</div><div style={{fontSize:13,fontWeight:700,opacity:.6}}>{a.id}</div>
            </div>))}
          <div onClick={()=>setTempAnimal("custom")} style={{background:isCustomSelected?"linear-gradient(135deg,rgba(139,92,246,.3),rgba(167,139,250,.3))":"rgba(255,255,255,.03)",border:isCustomSelected?"2px solid #a78bfa":"1px dashed rgba(255,255,255,.15)",borderRadius:14,padding:"10px 2px",textAlign:"center",cursor:"pointer"}}>
            <div style={{fontSize:28,marginBottom:2}}>{customEmoji||"➕"}</div><div style={{fontSize:13,fontWeight:700,opacity:.6}}>Custom</div>
          </div>
        </div>
        {isCustomSelected&&<div style={{background:"rgba(255,255,255,.04)",borderRadius:14,padding:14,marginBottom:8,border:"1px solid rgba(139,92,246,.2)"}}>
          <div style={{fontSize:15,fontWeight:800,opacity:.6,marginBottom:6}}>Pick any animal</div>
          <div style={{maxHeight:120,overflowY:"auto",display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:6,padding:2}}>
            {EXTRA_ANIMALS.map(em=>(
              <div key={em} onClick={()=>setCustomEmoji(em)} style={{width:"100%",aspectRatio:"1",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,cursor:"pointer",background:customEmoji===em?"rgba(139,92,246,.3)":"rgba(255,255,255,.02)",border:customEmoji===em?"2px solid #a78bfa":"1px solid rgba(255,255,255,.04)"}}>{em}</div>))}
          </div>
        </div>}
        <button onClick={()=>{const all=[...ZODIAC_ANIMALS.map(a=>a.id),"custom"];const pick=all[Math.floor(Math.random()*all.length)];if(pick==="custom"){setTempAnimal("custom");setCustomEmoji(EXTRA_ANIMALS[Math.floor(Math.random()*EXTRA_ANIMALS.length)]);}else{setTempAnimal(pick);setCustomEmoji("");}const n=genName();setNameHistory(p=>[...p,n]);setNameIdx(nameHistory.length);setBuddyName(n);}} style={{width:"100%",background:"linear-gradient(135deg,rgba(254,202,87,.15),rgba(245,87,108,.15))",border:"1px solid rgba(254,202,87,.25)",borderRadius:12,padding:"8px 14px",fontSize:16,fontWeight:700,color:"#feca57",cursor:"pointer",marginBottom:8,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>🎲 Pick a Random Buddy</button>
        <div style={{display:"flex",gap:4,marginBottom:8}}>
          <input value={buddyName} onChange={e=>setBuddyName(e.target.value)} placeholder="Name your buddy (optional)" style={{flex:1,padding:"10px 14px",borderRadius:12,border:"1px solid rgba(255,255,255,.1)",background:"rgba(255,255,255,.05)",color:"#fff",fontSize:15,outline:"none"}}/>
          <button onClick={()=>{if(nameIdx>0){setNameIdx(i=>i-1);setBuddyName(nameHistory[nameIdx-1]);}}} disabled={nameIdx<=0} style={{background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.12)",borderRadius:10,padding:"8px 10px",fontSize:16,cursor:nameIdx>0?"pointer":"default",color:"#fff",opacity:nameIdx>0?1:.3,flexShrink:0}}>◀</button>
          <button onClick={()=>{const n=genName();if(nameIdx<nameHistory.length-1){setNameIdx(i=>i+1);setBuddyName(nameHistory[nameIdx+1]);}else{setNameHistory(p=>[...p,n]);setNameIdx(nameHistory.length);setBuddyName(n);}}} style={{background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.12)",borderRadius:10,padding:"8px 10px",fontSize:16,cursor:"pointer",color:"#fff",flexShrink:0}}>▶</button>
        </div>
      </div>
      <div style={{padding:"8px 20px 0",display:"flex",gap:8}}><button style={S.btnS} onClick={()=>setScreen("welcome")}>← Back</button><button style={{...S.btn,flex:1,opacity:canProceed?1:.4}} onClick={()=>canProceed&&setScreen("pick_habits")}>Next: Goals →</button></div>
      <div style={S.ad}/>
    </div>
  );

  // ─── PICK HABITS ──────────────────────────────────────────────────
  if(screen==="pick_habits"){
    const all=[...PRESET_HABITS,...customHabits];
    return(
      <div style={S.app}><style>{CSS}</style>
        <div style={{flex:1,overflow:"auto",padding:"16px 16px 0"}}>
          <div style={{textAlign:"center",marginBottom:10}}><div style={{fontSize:18,fontWeight:900,background:"linear-gradient(135deg,#f093fb,#f5576c,#feca57)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{editingGoals?"Edit Goals":"Set Your Goals"}</div><p style={{fontSize:15,opacity:.4,marginTop:2}}>{editingGoals?"Toggle, add, or remove goals":"Even 1 goal is powerful!"}</p></div>
          {all.map(h=>{
            const isCust=h.id.startsWith("custom_");
            return(
              <div key={h.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:12,background:tempHabits.includes(h.id)?"rgba(102,126,234,.15)":"rgba(255,255,255,.03)",border:tempHabits.includes(h.id)?"1px solid rgba(102,126,234,.3)":"1px solid rgba(255,255,255,.05)",marginBottom:6}}>
                <div onClick={()=>setTempHabits(p=>p.includes(h.id)?p.filter(x=>x!==h.id):[...p,h.id])} style={{display:"flex",alignItems:"center",gap:10,flex:1,cursor:"pointer"}}>
                  <span style={{fontSize:20}}>{h.icon}</span>
                  <div style={{flex:1}}><div style={{fontSize:16,fontWeight:700}}>{h.name}</div><div style={{fontSize:14,opacity:.35}}>If skipped: {h.negEffect}</div></div>
                  <div style={{width:22,height:22,borderRadius:7,border:tempHabits.includes(h.id)?"2px solid #667eea":"2px solid rgba(255,255,255,.15)",background:tempHabits.includes(h.id)?"#667eea":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,color:"#fff"}}>{tempHabits.includes(h.id)&&"●"}</div>
                </div>
                {isCust&&<button onClick={()=>deleteCustomHabit(h.id)} style={{background:"rgba(245,87,108,.15)",border:"1px solid rgba(245,87,108,.3)",borderRadius:6,padding:"2px 6px",fontSize:14,color:"#f5576c",cursor:"pointer",flexShrink:0}}>✕</button>}
              </div>);})}

          {/* Previously used goals */}
          {previousGoals.length>0&&<div style={{marginTop:8,marginBottom:4}}>
            <div style={{fontSize:13,fontWeight:700,opacity:.3,marginBottom:4}}>PREVIOUSLY USED</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
              {previousGoals.map((pg,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:2,background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:8,padding:"5px 6px",fontSize:14,color:"#ccc"}}>
                  <span onClick={()=>restorePreviousGoal(pg)} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:3}}><span style={{fontSize:16}}>{pg.icon}</span> {pg.name}</span>
                  <button onClick={()=>deletePreviousGoal(pg.name)} style={{background:"none",border:"none",color:"rgba(245,87,108,.5)",fontSize:14,cursor:"pointer",padding:"0 2px",lineHeight:1}}>✕</button>
                </div>
              ))}
            </div>
          </div>}

          {/* Custom habit: suggestion + effect = auto-add */}
          <div style={{background:"rgba(255,255,255,.03)",borderRadius:14,padding:14,marginTop:8,border:"1px dashed rgba(255,255,255,.12)"}}>
            <div style={{fontSize:16,fontWeight:800,opacity:.6,marginBottom:4}}>✨ Add Custom Goal</div>
            <div style={{fontSize:14,opacity:.35,marginBottom:4}}>Type a task or pick below:</div>
            <div style={{display:"flex",gap:4,marginBottom:4}}>
              <input value={customHabitIcon} onChange={e=>setCustomHabitIcon(e.target.value)} placeholder="🎯" style={{width:38,padding:"8px 2px",borderRadius:8,textAlign:"center",border:"1px solid rgba(255,255,255,.1)",background:"rgba(255,255,255,.05)",color:"#fff",fontSize:16,outline:"none"}}/>
              <input value={customHabitName} onChange={e=>{const v=e.target.value;setCustomHabitName(v);if(v.trim()){const sug=autoSuggestEffect(v);setAutoEffect(sug);setPendingEffect(sug?.id||null);const ic=suggestIcon(v);if(ic)setCustomHabitIcon(ic);}else{setAutoEffect(null);setPendingEffect(null);setCustomHabitIcon("⭐");}}} placeholder={availableSuggestions.length>0?`${availableSuggestions[0].name}`:"Type a goal..."} style={{flex:1,padding:"8px 10px",borderRadius:8,border:"1px solid rgba(255,255,255,.1)",background:"rgba(255,255,255,.05)",color:"#fff",fontSize:16,outline:"none"}}/>
              <div onClick={()=>{const eid=pendingEffect||autoEffect?.id;if(eid&&customHabitName.trim())confirmEffect(eid);}} style={{width:38,padding:"8px 2px",borderRadius:8,textAlign:"center",border:(pendingEffect||autoEffect)?"1px solid rgba(67,233,123,.3)":"1px solid rgba(255,255,255,.1)",background:(pendingEffect||autoEffect)?"rgba(67,233,123,.1)":"rgba(255,255,255,.05)",color:"#fff",fontSize:16,cursor:(pendingEffect||autoEffect)?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center"}}>{(pendingEffect?CUSTOM_EFFECTS.find(e=>e.id===pendingEffect):autoEffect)?.icon||"❓"}</div>
            </div>
            {/* Suggestions — always expanded */}
            <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
              {availableSuggestions.length>0?availableSuggestions.map((s,i)=>(
                <button key={i} onClick={()=>{setCustomHabitName(s.name);setCustomHabitIcon(s.icon);const sug=autoSuggestEffect(s.name);setAutoEffect(sug);setPendingEffect(sug?.id||null);}} style={{background:customHabitName===s.name?"rgba(102,126,234,.2)":"rgba(255,255,255,.04)",border:customHabitName===s.name?"1px solid rgba(102,126,234,.3)":"1px solid rgba(255,255,255,.06)",borderRadius:8,padding:"5px 8px",fontSize:14,color:"#ccc",cursor:"pointer",display:"flex",alignItems:"center",gap:3}}>{s.icon} {s.name}</button>
              )):<div style={{fontSize:14,opacity:.35}}>All suggestions used — type your own!</div>}
            </div>
            {customHabitName.trim()&&<>
              {/* Selected effect bar — shows auto-suggested or user-picked effect */}
              {(()=>{
                const activeEff=pendingEffect?CUSTOM_EFFECTS.find(e=>e.id===pendingEffect):autoEffect;
                if(!activeEff)return null;
                const isAuto=!pendingEffect||pendingEffect===autoEffect?.id;
                return <div style={{background:"rgba(67,233,123,.1)",border:"1px solid rgba(67,233,123,.25)",borderRadius:10,padding:"8px 12px",marginBottom:8,display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:18}}>{activeEff.icon}</span>
                  <div style={{flex:1}}><div style={{fontSize:15,fontWeight:700}}>{isAuto?"Auto":"Selected"}: {activeEff.name}</div><div style={{fontSize:13,opacity:.4}}>Tap ✓ to add goal with this effect</div></div>
                  <button onClick={()=>confirmEffect(activeEff.id)} style={{background:"linear-gradient(135deg,#43e97b,#38f9d7)",border:"none",borderRadius:8,padding:"6px 12px",fontSize:16,fontWeight:800,cursor:"pointer",color:"#1a1a2e"}}>✓ Add</button>
                </div>;
              })()}
              <div style={{fontSize:14,fontWeight:700,opacity:.4,marginBottom:5}}>Pick an effect:</div>
              {["overlay","transform","movement"].map(cat=>{
                const catEffects=CUSTOM_EFFECTS.filter(e=>e.cat===cat);if(catEffects.length===0)return null;
                return <div key={cat} style={{marginBottom:6}}>
                  <div style={{fontSize:11,fontWeight:800,opacity:.3,marginBottom:3,letterSpacing:1}}>{EFFECT_CATS[cat]}</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:4}}>
                {catEffects.map(eff=>{
                  const isUsed=usedEffects.includes(eff.id);const isPending=pendingEffect===eff.id;
                  const isHinted=hinted.includes(eff.id)&&!isUsed;
                  return(
                    <div key={eff.id} onClick={()=>{if(isUsed)return;if(isPending){confirmEffect(eff.id);}else{setPendingEffect(eff.id);setCustomNegEffect(null);}}}
                      style={{padding:"5px 4px",borderRadius:8,cursor:isUsed?"default":"pointer",
                        background:isUsed?"rgba(255,255,255,.02)":isPending?"rgba(67,233,123,.2)":isHinted?"rgba(102,126,234,.12)":"rgba(255,255,255,.02)",
                        border:isUsed?"1px solid rgba(255,255,255,.03)":isPending?"1px solid rgba(67,233,123,.4)":isHinted?"1px solid rgba(102,126,234,.25)":"1px solid rgba(255,255,255,.04)",
                        fontSize:13,display:"flex",alignItems:"center",gap:3,opacity:isUsed?.3:1,transition:"all .15s"}}>
                      <span style={{fontSize:16}}>{eff.icon}</span><span style={{opacity:.7,lineHeight:1.1}}>{isPending?"✓ Confirm":eff.name}</span>
                    </div>);})}
                  </div></div>;})}
            </>}
          </div>
        </div>
        <div style={{padding:"8px 20px 0",display:"flex",gap:8}}><button style={S.btnS} onClick={()=>{if(editingGoals){setEditingGoals(false);setScreen("home");}else{setScreen("pick_animal");}}}>{editingGoals?"← Cancel":"← Back"}</button><button style={{...S.btn,flex:1,opacity:tempHabits.length?1:.4}} onClick={()=>{if(!tempHabits.length)return;if(editingGoals)saveEditGoals();else startNew();}}>{editingGoals?"Save Goals ✓":"Let's Go! 🚀"}</button></div>
        <div style={S.ad}/>
      </div>
    );
  }

  // ─── HOME SCREEN ──────────────────────────────────────────────────
  const negCount=appState?.selectedHabits?.filter(h=>!doneToday.includes(h)).length||0;
  const mood=negCount===0?"😊":negCount<=2?"😐":"😰";
  const totalHabits=appState?.selectedHabits?.length||0;
  const allHabitIds=appState?.selectedHabits||[];
  const visibleHabits=allHabitIds.slice(0,4);const overflowHabits=allHabitIds.slice(4);

  const HabitChip=({hId})=>{
    const h=habitsData.find(x=>x.id===hId)||{id:hId,name:hId,icon:"⭐"};const d=doneToday.includes(hId);
    const isQuest=dailyQuestId===hId;
    return(<div onClick={()=>toggleHabit(hId)} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 12px",borderRadius:10,background:d?"rgba(102,126,234,.15)":isQuest?"rgba(254,202,87,.08)":"rgba(255,255,255,.03)",border:d?"1px solid rgba(102,126,234,.25)":isQuest?"1px solid rgba(254,202,87,.2)":"1px solid rgba(255,255,255,.05)",cursor:"pointer",transition:"all .2s",position:"relative"}}>
      <span style={{fontSize:16}}>{h.icon}</span>
      <span style={{flex:1,fontSize:15,fontWeight:d?800:600,opacity:d?1:.6}}>{h.name}{isQuest&&<span style={{fontSize:13,color:"#feca57",fontWeight:800,marginLeft:4}}>3x</span>}</span>
      <div style={{width:20,height:20,borderRadius:6,background:d?"linear-gradient(135deg,#667eea,#764ba2)":"rgba(255,255,255,.05)",border:d?"none":"1.5px solid rgba(255,255,255,.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,color:"#fff"}}>{d&&"✓"}</div>
    </div>);
  };

  // Roaming detection
  const daysInactive=appState?getDaysInactive(appState):0;
  const isRoaming=daysInactive>=7;
  const recentActive=appState?getRecentActiveDays(appState,7):0;
  const halfBack=isRoaming&&recentActive>=3;
  const fullBack=isRoaming&&recentActive>=7;
  // Daily Quest — from wellness pool
  const dailyQuestData=appState?getDailyQuest(appState):null;
  const dailyQuestId=dailyQuestData?.matchedHabitId||null; // matched user goal (for 3x)
  const dailyQuestInfo=dailyQuestData?.quest||null; // the quest itself
  const dailyQuestDone=dailyQuestId&&doneToday.includes(dailyQuestId);
  const questNotInGoals=dailyQuestInfo&&!dailyQuestId; // quest doesn't match any user goal
  // Spacing check
  const todayTs=appState?.completionTimestamps?.[today]||[];
  const batchWarning=todayTs.length>=3&&((todayTs[todayTs.length-1]-todayTs[0])/60000<2);

  // ─── TAB BAR ────────────────────────────────────────────────────
  const tabBorderColor="rgba(102,126,234,.3)";
  const TabBar=(
    <div style={{flexShrink:0,margin:"0 4px"}}>
      <div style={{display:"flex",alignItems:"stretch",background:"#07071a",borderRadius:"14px 14px 0 0",border:`1px solid ${tabBorderColor}`,borderBottom:"none",overflow:"hidden"}}>
        {[{id:"buddy",icon:"🐾",label:"Buddy"},{id:"planner",icon:"📅",label:"Planner"},{id:"budget",icon:"💰",label:"Budget"},{id:"learn",icon:"🎓",label:"Learn"},{id:"notebook",icon:"📓",label:"Notes"}].map((tab,i)=>{
          const active=activeTab===tab.id;
          return(
            <button key={tab.id} onClick={()=>setActiveTab(tab.id)}
              style={{flex:1,padding:"10px 0 8px",
                background:active?"linear-gradient(180deg,#1a1a3a,#0e0e24)":"transparent",
                border:"none",
                cursor:"pointer",
                display:"flex",flexDirection:"column",alignItems:"center",gap:2,
                transition:"background .15s"}}>
              <span style={{fontSize:16,filter:active?"none":"grayscale(1) opacity(.35)"}}>{tab.icon}</span>
              <span style={{fontSize:11,fontWeight:800,color:active?"#a8b4f0":"rgba(255,255,255,.2)",letterSpacing:.5}}>{tab.label}</span>
            </button>
          );
        })}
        <button onClick={()=>setShowSettings(true)} 
          style={{padding:"10px 14px 8px",background:"transparent",border:"none",
            borderLeft:`1px solid ${tabBorderColor}`,
            cursor:"pointer",fontSize:15,opacity:.35}}>⚙️</button>
      </div>
    </div>
  );

  // ─── SETTINGS PANEL ────────────────────────────────────────────────
  const[searchQuery,setSearchQuery]=useState("");
  const[searchResults,setSearchResults]=useState([]);
  const doSearch=(q)=>{
    setSearchQuery(q);if(!q.trim()||q.trim().length<2){setSearchResults([]);return;}
    const term=q.trim().toLowerCase();const results=[];
    // Search notebook pages (NOT journal)
    try{const nb=JSON.parse(localStorage.getItem("zodibuddy_notebook_v1")||"{}");
      (nb.pages||[]).forEach((p,i)=>{
        if((p.title||"").toLowerCase().includes(term))results.push({type:"📓 Notebook",title:`Page ${i+1}: ${p.title}`,preview:p.content?.substring(0,60)||"",tab:"notebook",idx:i});
        else if((p.content||"").toLowerCase().includes(term)){const pos=p.content.toLowerCase().indexOf(term);const start=Math.max(0,pos-20);
          results.push({type:"📓 Notebook",title:`Page ${i+1}: ${p.title||"Untitled"}`,preview:"..."+p.content.substring(start,start+60)+"...",tab:"notebook",idx:i});}
      });}catch{}
    // Search flashcards
    try{const fc=JSON.parse(localStorage.getItem("zodibuddy_flashcards_v1")||"[]");
      fc.forEach(c=>{if(c.term.toLowerCase().includes(term)||c.def.toLowerCase().includes(term))
        results.push({type:"📒 Flashcard",title:c.term,preview:c.def.substring(0,60),cat:c.cat,tab:"learn"});});}catch{}
    // Search planner
    try{const pl=JSON.parse(localStorage.getItem("zodibuddy_planner_v1")||"{}");
      Object.entries(pl).forEach(([date,day])=>{
        if(day.note&&day.note.toLowerCase().includes(term))results.push({type:"📅 Planner Note",title:date,preview:day.note.substring(0,60),tab:"planner"});
        (day.slots||[]).forEach((s,i)=>{if(s&&s.toLowerCase().includes(term))results.push({type:"📅 Planner Slot",title:`${date} slot ${i}`,preview:s.substring(0,60),tab:"planner"});});
      });}catch{}
    // Search budget envelopes
    try{const bu=JSON.parse(localStorage.getItem("zodibuddy_budget_v1")||"{}");
      (bu.envelopes||[]).forEach(env=>{if(env.name.toLowerCase().includes(term))results.push({type:"💰 Budget",title:env.name,preview:`$${env.amount} budget`,tab:"budget"});
        (env.transactions||[]).forEach(t=>{if((t.note||"").toLowerCase().includes(term))results.push({type:"💰 Transaction",title:`${env.name}: ${t.note}`,preview:`$${t.amount}`,tab:"budget"});});
      });}catch{}
    // Search learn favorites
    try{const fv=JSON.parse(localStorage.getItem("zodibuddy_learnfavs_v1")||"{}");
      Object.entries(fv).forEach(([key,arr])=>{if(!Array.isArray(arr))return;
        arr.forEach(item=>{const text=JSON.stringify(item).toLowerCase();
          if(text.includes(term))results.push({type:"⭐ Favorite",title:item.title||item.term||item.word||item.name||item.q||item.text||item.tip||"",preview:item.def||item.a||item.practice||"",tab:"learn"});
        });});}catch{}
    setSearchResults(results);
  };

  const SettingsPanel=showSettings?(
    <div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(0,0,0,.92)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={()=>{setShowSettings(false);setSearchQuery("");setSearchResults([]);}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"linear-gradient(135deg,#1a1040,#121228)",borderRadius:20,padding:20,maxWidth:340,width:"100%",border:`1px solid rgba(255,255,255,.06)`,maxHeight:"80vh",overflowY:"auto"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
          <div style={{fontSize:18,fontWeight:900,color:"#e8e0f0"}}>⚙️ Settings</div>
          <button onClick={()=>{setShowSettings(false);setSearchQuery("");setSearchResults([]);}} style={{background:"rgba(255,255,255,.03)",border:`1px solid rgba(255,255,255,.06)`,borderRadius:8,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#e8e0f0",fontSize:16}}>✕</button>
        </div>

        {/* Search */}
        <div style={{marginBottom:16}}>
          <div style={{fontSize:14,fontWeight:800,opacity:.5,marginBottom:8}}>🔍 SEARCH EVERYTHING</div>
          <input value={searchQuery} onChange={e=>doSearch(e.target.value)} placeholder="Search notes, cards, planner, budget..."
            style={{width:"100%",padding:"10px 14px",borderRadius:10,border:"1px solid rgba(102,126,234,.3)",background:"rgba(102,126,234,.08)",color:"#e8e0f0",fontSize:15,outline:"none",fontFamily:"'Nunito',sans-serif"}}/>
          {searchQuery.trim().length>=2&&<div style={{marginTop:8,fontSize:12,opacity:.4}}>{searchResults.length} result{searchResults.length!==1?"s":""} found</div>}
          {searchResults.length>0&&<div style={{marginTop:6,maxHeight:200,overflowY:"auto"}}>
            {searchResults.map((r,i)=>(<div key={i} onClick={()=>{
              setShowSettings(false);setSearchQuery("");setSearchResults([]);
              if(r.tab==="notebook")setActiveTab("notebook");
              else if(r.tab==="planner")setActiveTab("planner");
              else if(r.tab==="budget")setActiveTab("budget");
              else if(r.tab==="learn")setActiveTab("learn");
            }} style={{background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.06)",borderRadius:10,padding:"8px 10px",marginBottom:4,cursor:"pointer"}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:11,color:"#a8b4f0",fontWeight:700}}>{r.type}</span>
                {r.cat&&<span style={{fontSize:9,padding:"1px 4px",borderRadius:3,background:"rgba(102,126,234,.1)",color:"#a8b4f0"}}>{r.cat}</span>}
              </div>
              <div style={{fontSize:13,fontWeight:700,color:"#e8e0f0",marginTop:2}}>{r.title}</div>
              {r.preview&&<div style={{fontSize:11,opacity:.4,marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.preview}</div>}
            </div>))}
          </div>}
          {searchQuery.trim().length>=2&&searchResults.length===0&&<div style={{textAlign:"center",opacity:.3,padding:10,fontSize:13}}>No results found</div>}
        </div>

        {/* Backup & Restore */}
        <div style={{marginBottom:16}}>
          <div style={{fontSize:14,fontWeight:800,opacity:.5,marginBottom:8}}>BACKUP & RESTORE</div>
          <div style={{display:"flex",gap:6}}>
            <button onClick={()=>{
              const backup={_zobuddy_backup:true,_version:14,_date:new Date().toISOString()};
              const keys=["zodibuddies_v1","zodibuddy_planner_v1","zodibuddy_clean_v1","zodibuddy_workout_v1","zodibuddy_budget_v1","zodibuddy_journal_v1","zodibuddy_notebook_v1","zodibuddy_flashcards_v1","zodibuddy_fc_archive_v1","zodibuddy_learnfavs_v1","zodibuddy_news_v1","zo_best_bubbles","zo_best_breakout","zo_best_breakout_time","zo_best_memory","zo_best_mines"];
              keys.forEach(k=>{try{const v=localStorage.getItem(k);if(v)backup[k]=JSON.parse(v);}catch{try{backup[k]=localStorage.getItem(k);}catch{}}});
              const blob=new Blob([JSON.stringify(backup,null,2)],{type:"application/json"});
              const url=URL.createObjectURL(blob);const a=document.createElement("a");
              a.href=url;a.download=`zobuddy_backup_${getToday()}.json`;document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);
            }} style={{flex:1,background:"rgba(67,233,123,.08)",border:"1px solid rgba(67,233,123,.15)",borderRadius:12,padding:"10px",fontSize:15,fontWeight:700,color:"#43e97b",cursor:"pointer"}}>📤 Export</button>
            <button onClick={()=>{
              const input=document.createElement("input");input.type="file";input.accept=".json";
              input.onchange=(e)=>{const file=e.target.files[0];if(!file)return;const reader=new FileReader();
                reader.onload=(ev)=>{try{const data=JSON.parse(ev.target.result);
                  if(!data?._zobuddy_backup){alert("Not a valid backup file.");return;}
                  // Restore all keys - support both old format (named fields) and new format (key-based)
                  const keyMap={"app":"zodibuddies_v1","planner":"zodibuddy_planner_v1","clean":"zodibuddy_clean_v1","workout":"zodibuddy_workout_v1","budget":"zodibuddy_budget_v1","journal":"zodibuddy_journal_v1"};
                  // Old format: named fields
                  Object.entries(keyMap).forEach(([field,key])=>{if(data[field])localStorage.setItem(key,JSON.stringify(data[field]));});
                  // New format: direct localStorage keys
                  const allKeys=["zodibuddies_v1","zodibuddy_planner_v1","zodibuddy_clean_v1","zodibuddy_workout_v1","zodibuddy_budget_v1","zodibuddy_journal_v1","zodibuddy_notebook_v1","zodibuddy_flashcards_v1","zodibuddy_fc_archive_v1","zodibuddy_learnfavs_v1","zodibuddy_news_v1","zo_best_bubbles","zo_best_breakout","zo_best_breakout_time","zo_best_memory","zo_best_mines"];
                  allKeys.forEach(k=>{if(data[k]!=null)localStorage.setItem(k,typeof data[k]==="string"?data[k]:JSON.stringify(data[k]));});
                  alert("✅ Restored! Reloading...");setTimeout(()=>window.location.reload(),500);
                }catch{alert("Invalid backup file.");}};reader.readAsText(file);};input.click();
            }} style={{flex:1,background:"rgba(96,165,250,.08)",border:"1px solid rgba(96,165,250,.15)",borderRadius:12,padding:"10px",fontSize:15,fontWeight:700,color:"#60a5fa",cursor:"pointer"}}>📥 Import</button>
          </div>
          <div style={{fontSize:13,opacity:.35,marginTop:6}}>Save all your data to a file</div>
        </div>

        {/* Reset */}
        <div style={{marginBottom:12}}>
          <div style={{fontSize:14,fontWeight:800,opacity:.5,marginBottom:8}}>RESET</div>
          <button onClick={()=>setShowResetConfirm(true)}
            style={{width:"100%",background:"rgba(245,87,108,.08)",border:"1px solid rgba(245,87,108,.15)",borderRadius:12,padding:"12px",fontSize:15,fontWeight:700,color:"#f5576c",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>🔄 Restart Buddy</button>
          <div style={{fontSize:12,opacity:.3,marginTop:4}}>Choose to transfer stats or start completely fresh</div>
        </div>

        <div style={{textAlign:"center",fontSize:12,opacity:.2,marginTop:8}}>Zobuddy v12</div>
      </div>
    </div>
  ):null;

  const tabContentStyle={borderLeft:`1px solid ${tabBorderColor}`,borderRight:`1px solid ${tabBorderColor}`,borderBottom:`1px solid ${tabBorderColor}`,borderTop:"none",borderRadius:"0 0 14px 14px",flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minHeight:0,margin:"0 4px"};
  const AdSpace=<div style={{height:60,minHeight:60,flexShrink:0}}/>;

  // ─── NOTEBOOK TAB ──────────────────────────────────────────────
  if(activeTab==="notebook")return(
    <div style={{...S.app}}>
      <style>{CSS}</style>
      {TabBar}
      {SettingsPanel}
      <div style={tabContentStyle}>
        <NotebookPanel/>
      </div>
      {AdSpace}
    </div>
  );

  // ─── LEARN TAB ──────────────────────────────────────────────────
  if(activeTab==="learn")return(
    <div style={{...S.app}}>
      <style>{CSS}</style>
      {TabBar}
      {SettingsPanel}
      <div style={tabContentStyle}>
        <LearnPanel/>
      </div>
      {AdSpace}
    </div>
  );

  // ─── BUDGET TAB ─────────────────────────────────────────────────
  if(activeTab==="budget")return(
    <div style={{...S.app}}>
      <style>{CSS}</style>
      {TabBar}
      {SettingsPanel}
      <div style={tabContentStyle}>
        <BudgetTracker budgetData={budgetData} setBudgetData={setBudgetData}/>
      </div>
      {AdSpace}
    </div>
  );

  // ─── PLANNER TAB ──────────────────────────────────────────────────
  if(activeTab==="planner")return(
    <div style={{...S.app}}>
      <style>{CSS}</style>
      {TabBar}
      {SettingsPanel}
      <div style={{...tabContentStyle,position:"relative"}}>
      <DayPlanner
        plannerData={plannerData} plannerViewDate={plannerViewDate} setPlannerViewDate={setPlannerViewDate}
        MOODS={MOODS} getPlannerDay={getPlannerDay} setMood={setMood} setSlotText={setSlotText} setDayNote={setDayNote}
        TIME_SLOTS={TIME_SLOTS} plannerHistory={plannerHistory}
        editingSlot={editingSlot} setEditingSlot={setEditingSlot} editingText={editingText} setEditingText={setEditingText}
        historyOpen={historyOpen} setHistoryOpen={setHistoryOpen}
        cleanData={cleanData} setCleanData={setCleanData}
        workoutData={workoutData} setWorkoutData={setWorkoutData}
        journalData={journalData} setJournalData={setJournalData}
      />
      </div>
      {AdSpace}
    </div>
  );

  return(
    <div style={{...S.app}}><style>{CSS}</style>
      {TabBar}
      {SettingsPanel}
      <div style={{...tabContentStyle,overflowY:"auto"}}>
      <Confetti/>

      {/* Roaming message */}
      {isRoaming&&!fullBack&&<div style={{background:"linear-gradient(135deg,rgba(245,87,108,.1),rgba(254,202,87,.1))",border:"1px solid rgba(245,87,108,.2)",borderRadius:12,margin:"8px 20px 0",padding:10,textAlign:"center"}}>
        <div style={{fontSize:16,fontWeight:800,color:"#f5576c",marginBottom:4}}>🌿 Your buddy went roaming!</div>
        <div style={{fontSize:14,opacity:.6,lineHeight:1.5}}>You've been away for {daysInactive} days. Your buddy wandered off to find food!
        {halfBack?" 🎟️ You earned a transfer token! Half your buddies are back. Keep going!":` Be active for ${3-recentActive>0?3-recentActive:0} more days to earn a transfer token.`}
        </div>
        <div style={{fontSize:13,opacity:.4,marginTop:4}}>💡 Maintain a 7-day streak to earn transfer tokens for stat migration.</div>
      </div>}
      

      {/* Header */}
      <div style={{padding:"10px 20px 0",textAlign:"center"}}>
        <div style={{fontSize:16,fontWeight:900,background:"linear-gradient(135deg,#f093fb,#f5576c,#feca57)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",lineHeight:1}}>{appState?.buddyName||"Zobuddy"}</div>
        <div onClick={()=>{clearTimeout(devTimer.t);setDevTaps(p=>{const n=p+1;if(n>=5){setDevStreak(prev=>prev!==null?null:0);return 0;}devTimer.t=setTimeout(()=>setDevTaps(0),1500);return n;});}} style={{fontSize:13,opacity:.25,marginTop:1,cursor:"default"}}>Day {days} • Lv.{level.level} {level.name}</div>
        {devStreak!==null&&<div style={{margin:"4px auto",maxWidth:220}}>
          <div style={{fontSize:11,opacity:.4,textAlign:"center",marginBottom:2}}>🔧 Dev: Streak preview ({devStreak}d)</div>
          <input type="range" min="0" max="35" value={devStreak} onChange={e=>setDevStreak(Number(e.target.value))} style={{width:"100%",height:4,appearance:"auto",opacity:.6}}/>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:10,opacity:.3}}><span>0</span><span>3</span><span>7</span><span>14</span><span>21</span><span>30+</span></div>
        </div>}
      </div>

      <div style={{display:"flex",justifyContent:"center",gap:16,padding:"6px 20px 4px"}}>
        <div style={{textAlign:"center"}}><div style={{fontSize:15,fontWeight:900}}>⚡{duelStats.power}</div><div style={{fontSize:11,opacity:.35}}>POWER{duelStats.tokens>0?` • 🎟️${duelStats.tokens}`:""}</div></div>
        {duelCode&&<div style={{textAlign:"center"}}><div style={{fontSize:16,fontWeight:900,color:"#feca57",letterSpacing:2,fontFamily:"monospace"}}>{duelCode}</div><div style={{fontSize:11,opacity:.35}}>CODE</div></div>}
        <div style={{textAlign:"center"}}><div style={{fontSize:15,fontWeight:900,color:streak>=3?"#feca57":"#555"}}>{streak>=3?"✨":""}{streak}d</div><div style={{fontSize:11,opacity:.35}}>STREAK</div></div>
        <div style={{textAlign:"center"}}><div style={{fontSize:15,fontWeight:900}}>{doneToday.length}/{totalHabits}</div><div style={{fontSize:11,opacity:.35}}>TODAY</div></div>
      </div>

      <div style={{padding:"0 20px 4px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:2}}>
          <span style={{fontSize:13,fontWeight:800,opacity:.4}}>{mood} HP</span>
          <span style={{fontSize:14,fontWeight:900,color:hp>=80?"#43e97b":hp>=50?"#feca57":"#f5576c"}}>{hp}%</span>
        </div>
        <HealthBar percent={hp}/>
      </div>

      {/* Spacing warning — above buddy */}
      {batchWarning&&<div style={{margin:"4px 20px",padding:"6px 12px",borderRadius:10,background:"rgba(245,87,108,.08)",border:"1px solid rgba(245,87,108,.15)"}}>
        <div style={{fontSize:14,color:"#f5576c",fontWeight:700}}>⚡ Slow down!</div>
        <div style={{fontSize:13,opacity:.5}}>Completing all goals at once stresses your buddy and caps HP at 75%. Space out your day!</div>
      </div>}

      {/* Buddy area */}
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",position:"relative",minHeight:0,padding:"0 16px 8px"}}>
        <div style={{position:"relative",width:"100%",maxWidth:280}}>
          {allDoneToday&&<div style={{textAlign:"center",marginBottom:2}}><span style={{fontSize:14,color:"#feca57"}}>✅ All done!</span></div>}
          {negCount>0&&!allDoneToday&&<div style={{textAlign:"center",fontSize:13,color:"#f5576c",opacity:.6,marginBottom:2}}>⚠️ {negCount} effect{negCount>1?"s":""} active</div>}
          <BuddyDisplay animal={appState?.animal} state={{...(appState||{}),_roaming:isRoaming&&!fullBack,auraStreak:streak}} size={160}/>
        </div>
        {nextLv&&<div style={{width:"100%",maxWidth:260,marginTop:4}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:13,opacity:.4,marginBottom:2}}><span>Next: {nextLv.name}</span><span>{streak}/{nextLv.auraDays}d</span></div>
          <div style={{height:3,borderRadius:2,background:"rgba(255,255,255,.05)",overflow:"hidden"}}><div style={{height:"100%",borderRadius:2,background:"linear-gradient(90deg,#667eea,#f093fb)",width:`${Math.min(100,(streak/nextLv.auraDays)*100)}%`,transition:"width .5s"}}/></div>
        </div>}
      </div>

      {/* Goals */}
      <div style={{padding:"6px 20px 0"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
          <span style={{fontSize:14,fontWeight:700,opacity:.35}}>GOALS</span>
          {canEditHabits?<button onClick={()=>openEditGoals()} style={{background:"rgba(102,126,234,.12)",border:"1px solid rgba(102,126,234,.25)",borderRadius:6,padding:"2px 8px",fontSize:13,color:"#a8b4f0",cursor:"pointer",fontWeight:700,display:"flex",alignItems:"center",gap:3}}>✏️ Edit</button>
          :<span style={{fontSize:13,opacity:.25}}>🔒 Locked until tomorrow</span>}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>{visibleHabits.map(hId=><HabitChip key={hId} hId={hId}/>)}</div>
        {overflowHabits.length>0&&<>
          <button onClick={()=>setShowMore(!showMore)} style={{...S.btnS,width:"100%",marginTop:4,textAlign:"center",fontSize:14,padding:"6px 0"}}>
            {showMore?"▲ Hide":`▼ +${overflowHabits.length} more (${overflowHabits.filter(h=>doneToday.includes(h)).length}/${overflowHabits.length} done)`}
          </button>
          {showMore&&<div style={{maxHeight:120,overflowY:"auto",display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,marginTop:4,padding:2}}>{overflowHabits.map(hId=><HabitChip key={hId} hId={hId}/>)}</div>}
        </>}
      </div>

      {/* Daily Quest — placed below goals for clear separation */}
      {dailyQuestInfo&&<div style={{margin:"8px 20px 0",padding:"10px 14px",borderRadius:12,background:"linear-gradient(135deg,rgba(254,202,87,.08),rgba(255,165,0,.04))",border:"1px solid rgba(254,202,87,.15)"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:16}}>{dailyQuestInfo.icon}</span>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:800,color:"#feca57"}}>⭐ Daily Quest</div>
            <div style={{fontSize:13,opacity:.6}}>{dailyQuestInfo.name}</div>
            {dailyQuestId&&<div style={{fontSize:13,color:"#43e97b",marginTop:2}}>✅ In your goals — complete for 3x HP!</div>}
          </div>
          {dailyQuestDone&&<span style={{fontSize:15,color:"#43e97b",fontWeight:800}}>✅</span>}
          {questNotInGoals&&canEditHabits&&<button onClick={addDailyQuest} style={{background:"linear-gradient(135deg,#43e97b,#38f9d7)",color:"#1a1a2e",border:"none",borderRadius:10,padding:"8px 14px",fontSize:15,fontWeight:800,cursor:"pointer",whiteSpace:"nowrap",minHeight:36}}>+ Add</button>}
        </div>
      </div>}

      {/* Action buttons */}
      <div style={{display:"flex",gap:8,padding:"10px 20px 16px"}}>
        <button onClick={()=>setShowShare(true)} style={{...S.btn,flex:1,fontSize:16,padding:"11px 0",background:"linear-gradient(135deg,#43e97b,#38f9d7)",color:"#1a1a2e"}}>📊 Stats</button>
        <button onClick={()=>setShowDuel(true)} style={{...S.btn,flex:1,fontSize:16,padding:"11px 0",background:"linear-gradient(135deg,#f093fb,#f5576c)"}}>⚔️ Battle</button>
        <button onClick={()=>setShowMiniGames(true)} style={{...S.btn,flex:1,fontSize:16,padding:"11px 0",background:"linear-gradient(135deg,#feca57,#fb923c)",color:"#1a1a2e"}}>🎮 Games</button>
      </div>


      {/* Reset confirmation */}
      {showResetConfirm&&<div style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(0,0,0,.85)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={()=>setShowResetConfirm(false)}>
        <div onClick={e=>e.stopPropagation()} style={{background:"linear-gradient(135deg,#1a1040,#2a0a1e)",borderRadius:20,padding:24,maxWidth:320,width:"100%",textAlign:"center",border:"1px solid rgba(245,87,108,.2)"}}>
          <div style={{fontSize:36,marginBottom:8}}>⚠️</div>
          <div style={{fontSize:16,fontWeight:900,color:"#f5576c",marginBottom:8}}>Restart?</div>
          <p style={{fontSize:16,opacity:.6,lineHeight:1.5,marginBottom:16}}>Pick how you want to restart:</p>
          {duelStats.tokens>0&&<button onClick={transferAndReset} style={{width:"100%",background:"linear-gradient(135deg,rgba(254,202,87,.15),rgba(255,165,0,.1))",border:"1px solid rgba(254,202,87,.3)",borderRadius:12,padding:"12px 16px",marginBottom:8,cursor:"pointer",display:"flex",alignItems:"center",gap:10,textAlign:"left"}}>
            <span style={{fontSize:24}}>🪙</span>
            <div>
              <div style={{fontSize:16,fontWeight:800,color:"#feca57"}}>Transfer Stats ({duelStats.tokens} token{duelStats.tokens>1?"s":""})</div>
              <div style={{fontSize:14,opacity:.5,color:"#e8e0f0"}}>New buddy keeps your streak, history & power</div>
            </div>
          </button>}
          <button onClick={reset} style={{width:"100%",background:"rgba(245,87,108,.12)",border:"1px solid rgba(245,87,108,.25)",borderRadius:12,padding:"12px 16px",marginBottom:8,cursor:"pointer",display:"flex",alignItems:"center",gap:10,textAlign:"left"}}>
            <span style={{fontSize:24}}>🗑️</span>
            <div>
              <div style={{fontSize:16,fontWeight:800,color:"#f5576c"}}>Reset All</div>
              <div style={{fontSize:14,opacity:.5,color:"#e8e0f0"}}>Start completely fresh — all stats cleared</div>
            </div>
          </button>
          <button onClick={()=>setShowResetConfirm(false)} style={{width:"100%",background:"rgba(255,255,255,.06)",color:"#999",border:"1px solid rgba(255,255,255,.08)",borderRadius:12,padding:"10px",fontSize:16,fontWeight:600,cursor:"pointer",marginTop:4}}>Cancel</button>
        </div>
      </div>}

      {showShare&&<ShareCard state={appState} animal={appState?.animal} onClose={()=>setShowShare(false)} duelCode={duelCode} onAddGoal={(g)=>{
        // Re-add a historical goal to current goals if not already active
        const existing=(appState?.allHabits||[]).find(h=>h.id===g.id);
        if(existing){
          // Goal definition exists, just add to selectedHabits
          setAppState(prev=>({...prev,selectedHabits:[...(prev.selectedHabits||[]).filter(x=>x!==g.id),g.id]}));
        } else {
          // Goal was deleted — re-create as custom goal
          const usedV=(appState?.allHabits||[]).filter(h=>h.negVisual).map(h=>h.negVisual);
          const avail=CUSTOM_EFFECTS.filter(ef=>!usedV.includes(ef.visual));
          const eff=avail[0]||CUSTOM_EFFECTS[0];
          const nd=NEGATIVE_EFFECTS.find(ef=>ef.id===eff?.id);
          const h={id:g.id.startsWith("custom_")?g.id:`custom_${Date.now()}`,name:g.name,icon:g.icon,negVisual:nd?.visual||"cry",negEffect:nd?.name||"Buddy looks sad"};
          setAppState(prev=>({...prev,allHabits:[...(prev.allHabits||[]),h],selectedHabits:[...(prev.selectedHabits||[]),h.id]}));
        }
      }}/>}
      {showDuel&&<DuelPanel state={appState} onClose={()=>setShowDuel(false)} duelCode={duelCode}/>}
      {showMiniGames&&<MiniGames onClose={()=>setShowMiniGames(false)} goalsToday={doneToday.length} totalGoals={totalHabits}/>}
      </div>
      {AdSpace}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(SpiritAnimals));
