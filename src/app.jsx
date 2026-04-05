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
  const lv=getLevel(s);const tokens=calcTokens(streak);
  // Power: more goals = more power potential. Goals give a direct multiplier + bonus.
  const goalBonus=goals*12; // +12 power per active goal
  const power=(tokens*50)+(days*8)+(streak*15)+Math.round(hp*0.3)+(lv.level*10)+(comp*2)+Math.round(rate*40)+goalBonus;
  return{power,hp,streak,level:lv.level,goals,days,tokens};
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
const getHP=(s)=>{
  const d=s.completionLog?.[getToday()]||[];const goals=s.selectedHabits?.length||1;
  return Math.min(100,Math.round((d.length/goals)*100));
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
  // Size: deflate and shrink can coexist — when shrink active, deflate stays within shrunken size
  if(has("deflate")&&has("shrink"))tf.push("scaleX(0.7) scaleY(0.22)");
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
        if(s.blocks.every(b=>!b.alive||b.unbreakable)){s.score+=1000;s.running=false;setWon(true);setScore(s.score);}
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
      <div style={{fontSize:48,marginBottom:10}}>{won?"🍧":"🍎"}</div><div style={{fontSize:22,fontWeight:900,color:"#e8e0f0"}}>{won?"Yummy Dessert!":"Game Over!"}</div>
      {won&&<div style={{fontSize:14,color:"#43e97b",fontWeight:700,marginTop:2}}>+1000 bonus for clearing all fruits!</div>}
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

  // ═══ LUCKY CLOVERS (clover field) ═══
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
      // First click protection - if it's mud, move it elsewhere
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
        <span style={{fontSize:14,fontWeight:800,color:"#f5576c"}}>💩 {MINES-flagCount}</span>
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
                ?(cell===-1?<span style={{fontSize:18}}>💩</span>:cell>0?<span style={{fontSize:14,fontWeight:800,color:COLORS[cell]}}>{cell}</span>:null)
                :(isFlag?<span style={{fontSize:18}}>🚩</span>:<span style={{fontSize:20}}>🍀</span>)}
            </div>);}))}
        </div>
        {/* Game end overlay - positioned over the grid */}
        {(gameOver||won)&&<div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,.7)",borderRadius:8}}>
          <div style={{fontSize:28,fontWeight:900,color:won?"#43e97b":"#f5576c",textShadow:"0 2px 8px rgba(0,0,0,.5)"}}>{won?"🌈🍀 Luck Is On Your Side! 🪙🌈":"💩 Oh Poo-Hoo! Mud all over you!"}</div>
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

  // ═══ ZOBUDDY LINEUP (position matching puzzle) ═══
  const Lineup=()=>{
    const BUDDIES=["🐭","🐮","🐯","🐰","🐲","🐍","🐴","🐐","🐵","🐔","🐶","🐷"];
    const[answer,setAnswer]=useState(null);
    const[guess,setGuess]=useState([null,null,null,null,null]);
    const[won,setWon]=useState(false);
    const[poolSlots,setPoolSlots]=useState([null,null,null,null,null]);
    const[best,setBest]=useState(()=>{try{return Number(localStorage.getItem("zo_best_lineup"))||0;}catch{return 0;}});
    const[attempts,setAttempts]=useState(0);
    const[lastResult,setLastResult]=useState(null);
    const[history,setHistory]=useState([]);
    const[showHistory,setShowHistory]=useState(false);
    const[dragging,setDragging]=useState(null);
    const platRefs=React.useRef([]);
    const poolRefs=React.useRef([]);
    const dragRef=React.useRef(null);
    const guessRef=React.useRef(guess);guessRef.current=guess;
    const poolSlotsRef=React.useRef(poolSlots);poolSlotsRef.current=poolSlots;
    const DRAG_THRESHOLD=8;

    const initGame=()=>{
      const shuffled=[...BUDDIES].sort(()=>Math.random()-.5);
      const picked=shuffled.slice(0,5);
      setAnswer(picked);
      let poolOrder=[...picked];
      do{poolOrder=[...picked].sort(()=>Math.random()-.5);}
      while(poolOrder.every((b,i)=>b===picked[i]));
      const emptyGuess=[null,null,null,null,null];
      setPoolSlots(poolOrder);poolSlotsRef.current=poolOrder;
      setGuess(emptyGuess);guessRef.current=emptyGuess;
      setWon(false);setAttempts(0);setLastResult(null);setDragging(null);setHistory([]);setShowHistory(false);
    };
    useEffect(()=>{initGame();},[]);

    const checkGuess=()=>{
      const g=guessRef.current;
      if(g.some(v=>v===null))return;
      let correct=0;
      for(let i=0;i<5;i++)if(g[i]===answer[i])correct++;
      const newAttempts=attempts+1;
      setAttempts(newAttempts);setLastResult(correct);
      setHistory(prev=>[...prev,{guess:[...g],correct}]);
      if(correct===5){
        setWon(true);
        if(best===0||newAttempts<best){setBest(newAttempts);try{localStorage.setItem("zo_best_lineup",String(newAttempts));}catch{}}
      }
    };

    const findPlatSlotAt=(x,y)=>{for(let i=0;i<5;i++){const el=platRefs.current[i];if(!el)continue;const r=el.getBoundingClientRect();if(x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom)return i;}return-1;};
    const findPoolSlotAt=(x,y)=>{for(let i=0;i<5;i++){const el=poolRefs.current[i];if(!el)continue;const r=el.getBoundingClientRect();if(x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom)return i;}return-1;};

    const moveBuddy=(buddy,fromArea,fromIdx,toArea,toIdx)=>{
      if(fromArea===toArea&&fromIdx===toIdx)return;
      setLastResult(null);
      const g=[...guessRef.current];const p=[...poolSlotsRef.current];
      if(fromArea==="pool"&&toArea==="platform"){
        const swap=g[toIdx];p[fromIdx]=swap;g[toIdx]=buddy;
      } else if(fromArea==="platform"&&toArea==="pool"){
        const swap=p[toIdx];g[fromIdx]=swap;p[toIdx]=buddy;
      } else if(fromArea==="platform"&&toArea==="platform"){
        const swap=g[toIdx];g[toIdx]=buddy;g[fromIdx]=swap;
      } else if(fromArea==="pool"&&toArea==="pool"){
        const swap=p[toIdx];p[toIdx]=buddy;p[fromIdx]=swap;
      }
      guessRef.current=g;poolSlotsRef.current=p;
      setGuess([...g]);setPoolSlots([...p]);
    };

    const tapFromPool=(idx)=>{
      const buddy=poolSlotsRef.current[idx];if(!buddy)return;
      const emptyPlat=guessRef.current.indexOf(null);
      if(emptyPlat>=0)moveBuddy(buddy,"pool",idx,"platform",emptyPlat);
    };
    const tapFromPlatform=(idx)=>{
      const buddy=guessRef.current[idx];if(!buddy)return;
      const emptyPool=poolSlotsRef.current.indexOf(null);
      if(emptyPool>=0)moveBuddy(buddy,"platform",idx,"pool",emptyPool);
    };

    // All touch handling on container - find which buddy was touched by position
    const findTouchedBuddy=(x,y)=>{
      // Check pool first (starting area) then platform — pool is lower so user more likely dragging from there
      for(let i=0;i<5;i++){
        const el2=poolRefs.current[i];if(el2){const r=el2.getBoundingClientRect();
          if(x>=r.left-4&&x<=r.right+4&&y>=r.top-4&&y<=r.bottom+4&&poolSlotsRef.current[i])return{buddy:poolSlotsRef.current[i],fromArea:"pool",fromIdx:i};}
      }
      for(let i=0;i<5;i++){
        const el=platRefs.current[i];if(el){const r=el.getBoundingClientRect();
          if(x>=r.left-4&&x<=r.right+4&&y>=r.top-4&&y<=r.bottom+4&&guessRef.current[i])return{buddy:guessRef.current[i],fromArea:"platform",fromIdx:i};}
      }
      return null;
    };
    const gameContainerRef=React.useRef(null);
    const touchHandlersRef=React.useRef({});
    touchHandlersRef.current={findTouchedBuddy,findPlatSlotAt,findPoolSlotAt,moveBuddy,tapFromPool,tapFromPlatform};
    const gameContainerCallbackRef=React.useCallback((node)=>{
      // Cleanup old
      if(gameContainerRef.current&&gameContainerRef.current._cleanupTouch){
        gameContainerRef.current._cleanupTouch();
      }
      gameContainerRef.current=node;
      if(!node)return;
      const onTS=(e)=>{
        const t=e.touches[0];
        const hit=touchHandlersRef.current.findTouchedBuddy(t.clientX,t.clientY);
        if(!hit)return;
        e.preventDefault();e.stopPropagation();
        dragRef.current={...hit,x:t.clientX,y:t.clientY,startX:t.clientX,startY:t.clientY,isDrag:false};
      };
      const onTM=(e)=>{
        if(!dragRef.current)return;e.preventDefault();
        const t=e.touches[0];
        const dx=t.clientX-dragRef.current.startX,dy=t.clientY-dragRef.current.startY;
        const isDrag=dragRef.current.isDrag||Math.sqrt(dx*dx+dy*dy)>DRAG_THRESHOLD;
        dragRef.current={...dragRef.current,x:t.clientX,y:t.clientY,isDrag};
        if(isDrag)setDragging({...dragRef.current});
      };
      const onTE=(e)=>{
        if(!dragRef.current)return;
        const d=dragRef.current;const t=e.changedTouches[0];
        const h=touchHandlersRef.current;
        if(!d.isDrag){
          if(d.fromArea==="pool")h.tapFromPool(d.fromIdx);
          else h.tapFromPlatform(d.fromIdx);
        } else {
          const platIdx=h.findPlatSlotAt(t.clientX,t.clientY);
          const poolIdx=h.findPoolSlotAt(t.clientX,t.clientY);
          if(platIdx>=0)h.moveBuddy(d.buddy,d.fromArea,d.fromIdx,"platform",platIdx);
          else if(poolIdx>=0)h.moveBuddy(d.buddy,d.fromArea,d.fromIdx,"pool",poolIdx);
        }
        dragRef.current=null;setDragging(null);
      };
      node.addEventListener("touchstart",onTS,{passive:false});
      node.addEventListener("touchmove",onTM,{passive:false});
      node.addEventListener("touchend",onTE);
      node._cleanupTouch=()=>{node.removeEventListener("touchstart",onTS);node.removeEventListener("touchmove",onTM);node.removeEventListener("touchend",onTE);};
    },[]);

    if(!answer)return null;

    if(won)return(<div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",padding:20,overflowY:"auto"}}>
      <div style={{fontSize:48,marginBottom:10}}>🎉</div>
      <div style={{fontSize:22,fontWeight:900,color:"#e8e0f0"}}>You Got It!</div>
      <div style={{display:"flex",gap:8,marginTop:12,marginBottom:8}}>{answer.map((b,i)=><span key={i} style={{fontSize:36}}>{b}</span>)}</div>
      <div style={{fontSize:18,fontWeight:800,color:"#feca57",marginTop:4}}>Solved in {attempts} {attempts===1?"check":"checks"}</div>
      {(best===0||attempts<=best)&&<div style={{fontSize:14,color:"#43e97b",fontWeight:700,marginTop:4}}>🏆 New Best!</div>}
      {best>0&&attempts>best&&<div style={{fontSize:12,opacity:.5,marginTop:2}}>Best: {best} checks</div>}
      {history.length>0&&<div style={{width:"100%",maxWidth:320,marginTop:16}}>
        <div style={{fontSize:13,fontWeight:800,opacity:.4,marginBottom:6,textAlign:"center"}}>YOUR GUESSES</div>
        {history.map((h,hi)=>(
          <div key={hi} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 8px",marginBottom:3,borderRadius:8,
            background:h.correct===5?"rgba(67,233,123,.1)":"rgba(255,255,255,.03)",border:h.correct===5?"1px solid rgba(67,233,123,.2)":"1px solid rgba(255,255,255,.06)"}}>
            <span style={{fontSize:11,fontWeight:800,color:"rgba(167,139,250,.5)",minWidth:18}}>#{hi+1}</span>
            <div style={{display:"flex",gap:3,flex:1}}>
              {h.guess.map((b,i)=>{const ok=b===answer[i];
                return <div key={i} style={{width:32,height:32,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",
                  background:ok?"rgba(67,233,123,.15)":"rgba(255,255,255,.04)",border:ok?"1px solid rgba(67,233,123,.3)":"1px solid rgba(255,255,255,.06)"}}>
                  <span style={{fontSize:18}}>{b}</span></div>;})}
            </div>
            <span style={{fontSize:13,fontWeight:800,color:h.correct>=4?"#43e97b":h.correct>=2?"#feca57":"#f5576c"}}>{h.correct}/5</span>
          </div>))}
      </div>}
      <div style={{display:"flex",gap:8,marginTop:16}}>
        <button onClick={()=>{setGameKey(k=>k+1);}} style={{background:"linear-gradient(135deg,#667eea,#764ba2)",color:"#fff",border:"none",borderRadius:12,padding:"10px 24px",fontSize:15,fontWeight:700,cursor:"pointer"}}>Play Again</button>
        <button onClick={()=>setGame(null)} style={{background:"rgba(255,255,255,.08)",color:"#ccc",border:"1px solid rgba(255,255,255,.1)",borderRadius:12,padding:"10px 20px",fontSize:15,fontWeight:700,cursor:"pointer"}}>Exit to Menu</button>
      </div>
    </div>);

    const isDraggingFrom=(area,idx)=>dragging&&dragging.isDrag&&dragging.fromArea===area&&dragging.fromIdx===idx;
    const hoverPlat=dragging&&dragging.isDrag?findPlatSlotAt(dragging.x,dragging.y):-1;
    const hoverPool=dragging&&dragging.isDrag?findPoolSlotAt(dragging.x,dragging.y):-1;

    return(<div style={{flex:1,display:"flex",flexDirection:"column",padding:"8px 16px",overflow:"hidden",touchAction:"none",userSelect:"none",WebkitUserSelect:"none"}}
      ref={gameContainerCallbackRef}>
      {/* Fixed game area */}
      <div style={{flexShrink:0}}>
        <div style={{textAlign:"center",marginBottom:8}}>
          <div style={{fontSize:14,fontWeight:700,color:"#e8e0f0"}}>Guess the Secret Lineup</div>
          <div style={{fontSize:12,opacity:.35,marginTop:3}}>Drag or tap buddies into position</div>
          <div style={{fontSize:12,opacity:.3,marginTop:2}}>Checks: {attempts}{best>0?` · Best: ${best}`:""}</div>
        </div>

        {/* Result banner - always reserved height */}
        <div style={{height:52,marginBottom:4,display:"flex",alignItems:"center",justifyContent:"center"}}>
          {lastResult!==null?<div style={{textAlign:"center",padding:"6px 14px",borderRadius:12,width:"100%",
            background:lastResult>=4?"rgba(67,233,123,.12)":lastResult>=2?"rgba(254,202,87,.1)":"rgba(245,87,108,.08)",
            border:lastResult>=4?"1px solid rgba(67,233,123,.25)":lastResult>=2?"1px solid rgba(254,202,87,.2)":"1px solid rgba(245,87,108,.15)"}}>
            <div style={{fontSize:22,fontWeight:900,color:lastResult>=4?"#43e97b":lastResult>=2?"#feca57":"#f5576c"}}>{lastResult} / 5</div>
            <div style={{fontSize:11,opacity:.5}}>{lastResult===0?"None correct":lastResult===1?"1 correct position":`${lastResult} correct positions`}</div>
          </div>:<div style={{textAlign:"center",padding:"6px 14px",borderRadius:12,width:"100%",
            background:"rgba(255,255,255,.02)",border:"1px solid rgba(255,255,255,.04)"}}>
            <div style={{fontSize:22,fontWeight:900,opacity:.15}}>? / 5</div>
            <div style={{fontSize:11,opacity:.15}}>Place all buddies and check</div>
          </div>}
        </div>

        <div style={{background:"rgba(167,139,250,.06)",border:"1px solid rgba(167,139,250,.15)",borderRadius:14,padding:"10px 8px",marginBottom:8}}>
          <div style={{fontSize:10,fontWeight:700,opacity:.3,textAlign:"center",marginBottom:6,letterSpacing:1}}>LINEUP PLATFORM</div>
          <div style={{display:"flex",gap:6,justifyContent:"center"}}>
            {guess.map((b,i)=>{
              const isHover=hoverPlat===i;const isDrag=isDraggingFrom("platform",i);
              return(<div key={"p"+i} ref={el=>platRefs.current[i]=el}
                
                style={{width:56,height:64,borderRadius:12,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                  background:isHover?"rgba(167,139,250,.3)":b?"rgba(167,139,250,.15)":"rgba(255,255,255,.03)",
                  border:isHover?"2px solid rgba(167,139,250,.7)":b?"2px solid rgba(167,139,250,.4)":"2px dashed rgba(255,255,255,.12)",
                  cursor:b?"grab":"default",transition:"border .1s, background .1s",opacity:isDrag?.25:1}}>
                {b&&!isDrag?<span style={{fontSize:30}}>{b}</span>:<span style={{fontSize:16,opacity:.15}}>{i+1}</span>}
              </div>);
            })}
          </div>
        </div>

        <div style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.06)",borderRadius:14,padding:"10px 8px",marginBottom:8}}>
          <div style={{fontSize:10,fontWeight:700,opacity:.3,textAlign:"center",marginBottom:6,letterSpacing:1}}>STARTING AREA</div>
          <div style={{display:"flex",gap:6,justifyContent:"center"}}>
            {poolSlots.map((b,i)=>{
              const isHover=hoverPool===i;const isDrag=isDraggingFrom("pool",i);
              return(<div key={"s"+i} ref={el=>poolRefs.current[i]=el}
                
                style={{width:52,height:56,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",
                  background:isHover?"rgba(255,255,255,.1)":b?"rgba(255,255,255,.06)":"transparent",
                  border:isHover?"2px solid rgba(255,255,255,.3)":b?"2px solid rgba(255,255,255,.1)":"2px solid transparent",
                  borderBottom:isHover?"2px solid rgba(255,255,255,.3)":b?"2px solid rgba(255,255,255,.1)":"2px solid rgba(255,255,255,.15)",
                  cursor:b?"grab":"default",transition:"border .1s, background .1s",opacity:isDrag?.25:1}}>
                {b&&!isDrag?<span style={{fontSize:28}}>{b}</span>:null}
              </div>);
            })}
          </div>
        </div>

        <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:6}}>
          <button onClick={checkGuess} disabled={guess.some(g=>g===null)}
            style={{background:guess.some(g=>g===null)?"rgba(255,255,255,.04)":"linear-gradient(135deg,#667eea,#764ba2)",
              color:guess.some(g=>g===null)?"#555":"#fff",border:"none",borderRadius:12,padding:"10px 28px",fontSize:15,fontWeight:800,cursor:guess.some(g=>g===null)?"default":"pointer"}}>
            {lastResult!==null?"Check Again":"Check Lineup"}</button>
          {history.length>0&&<button onClick={()=>setShowHistory(s=>!s)}
            style={{background:showHistory?"rgba(167,139,250,.12)":"rgba(255,255,255,.04)",border:showHistory?"1px solid rgba(167,139,250,.3)":"1px solid rgba(255,255,255,.08)",borderRadius:12,padding:"10px 14px",fontSize:13,fontWeight:700,color:showHistory?"#a78bfa":"#888",cursor:"pointer"}}>
            {showHistory?"Hide":"History"} ({history.length})</button>}
        </div>
      </div>

      {/* Scrollable history area */}
      {showHistory&&history.length>0&&<div style={{flex:1,overflowY:"auto",minHeight:0,paddingTop:4}}>
        {history.map((h,hi)=>(
          <div key={hi} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 8px",marginBottom:2,borderRadius:8,
            background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.06)"}}>
            <span style={{fontSize:10,fontWeight:800,color:"rgba(167,139,250,.5)",minWidth:16}}>#{hi+1}</span>
            <div style={{display:"flex",gap:3,flex:1}}>
              {h.guess.map((b,i)=><div key={i} style={{width:28,height:28,borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",
                background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.06)"}}>
                <span style={{fontSize:16}}>{b}</span></div>)}
            </div>
            <span style={{fontSize:12,fontWeight:800,color:h.correct>=4?"#43e97b":h.correct>=2?"#feca57":"#f5576c"}}>{h.correct}/5</span>
          </div>))}
      </div>}

      {dragging&&dragging.isDrag&&<div style={{position:"fixed",left:dragging.x-28,top:dragging.y-28,width:56,height:56,
        borderRadius:14,background:"rgba(167,139,250,.3)",border:"2px solid rgba(167,139,250,.6)",
        display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none",zIndex:9999,
        boxShadow:"0 8px 24px rgba(0,0,0,.4)",transform:"scale(1.1)"}}>
        <span style={{fontSize:30}}>{dragging.buddy}</span>
      </div>}
    </div>);

  };


  // ═══ DUAL N-BACK (cognitive training) ═══
  const DualNBack=()=>{
    const LETTERS="BCDFGHJKLMNPQRSTVWXZ".split("");
    const[nLevel,setNLevel]=useState(2);
    const[phase,setPhase]=useState("setup"); // setup | playing | feedback | done
    const[sequence,setSequence]=useState([]); // {pos:0-8, letter:string}
    const[step,setStep]=useState(0);
    const[showStim,setShowStim]=useState(false);
    const[posMatch,setPosMatch]=useState(false);
    const[letMatch,setLetMatch]=useState(false);
    const posMatchRef=React.useRef(false);
    const letMatchRef=React.useRef(false);
    posMatchRef.current=posMatch;
    letMatchRef.current=letMatch;
    const[results,setResults]=useState([]); // {posCorrect,letCorrect,posInput,letInput}
    const[score,setScore]=useState(0);
    const[best,setBest]=useState(()=>{try{return JSON.parse(localStorage.getItem("zo_best_nback"))||{};}catch{return{};}});
    const[feedbackMsg,setFeedbackMsg]=useState(null);
    const timerRef=React.useRef(null);
    const posBtnRef=React.useRef(null);
    const letBtnRef=React.useRef(null);
    const touchContainerRef=React.useRef(null);
    const posTouched=React.useRef(new Set());
    const letTouched=React.useRef(new Set());
    const canRespondRef=React.useRef(false);
    const TOTAL_ROUNDS=20+nLevel*2;
    const STIM_TIME=2500;
    const PAUSE_TIME=500;

    const genSequence=()=>{
      const seq=[];
      for(let i=0;i<TOTAL_ROUNDS;i++){
        let pos=Math.floor(Math.random()*9);
        let letter=LETTERS[Math.floor(Math.random()*LETTERS.length)];
        // Ensure some matches exist (~30% chance each)
        if(i>=nLevel){
          if(Math.random()<0.3)pos=seq[i-nLevel].pos;
          if(Math.random()<0.3)letter=seq[i-nLevel].letter;
        }
        seq.push({pos,letter});
      }
      return seq;
    };

    const startGame=()=>{
      const seq=genSequence();
      setSequence(seq);setStep(0);setResults([]);setScore(0);
      setPosMatch(false);setLetMatch(false);setFeedbackMsg(null);
      setPhase("playing");setShowStim(true);
    };

    // Multitouch handler for simultaneous button press
    useEffect(()=>{
      const node=touchContainerRef.current;if(!node)return;
      const onTouchStart=(e)=>{
        if(!canRespondRef.current)return;
        e.preventDefault();
        const posRect=posBtnRef.current?.getBoundingClientRect();
        const letRect=letBtnRef.current?.getBoundingClientRect();
        if(!posRect||!letRect)return;
        for(let i=0;i<e.changedTouches.length;i++){
          const t=e.changedTouches[i];const x=t.clientX,y=t.clientY;
          if(x>=posRect.left&&x<=posRect.right&&y>=posRect.top&&y<=posRect.bottom&&!posTouched.current.has(t.identifier)){
            posTouched.current.add(t.identifier);setPosMatch(p=>!p);
          }
          if(x>=letRect.left&&x<=letRect.right&&y>=letRect.top&&y<=letRect.bottom&&!letTouched.current.has(t.identifier)){
            letTouched.current.add(t.identifier);setLetMatch(p=>!p);
          }
        }
      };
      const onTouchEnd=(e)=>{
        for(let i=0;i<e.changedTouches.length;i++){
          posTouched.current.delete(e.changedTouches[i].identifier);
          letTouched.current.delete(e.changedTouches[i].identifier);
        }
      };
      node.addEventListener("touchstart",onTouchStart,{passive:false});
      node.addEventListener("touchend",onTouchEnd);
      return()=>{node.removeEventListener("touchstart",onTouchStart);node.removeEventListener("touchend",onTouchEnd);};
    });

    // Auto-advance steps
    useEffect(()=>{
      if(phase!=="playing")return;
      timerRef.current=setTimeout(()=>{
        // Record result for current step — read from refs to get latest user input
        if(step>=nLevel){
          const isPosMatch=sequence[step].pos===sequence[step-nLevel].pos;
          const isLetMatch=sequence[step].letter===sequence[step-nLevel].letter;
          const curPos=posMatchRef.current;
          const curLet=letMatchRef.current;
          const posCorrect=(curPos===isPosMatch);
          const letCorrect=(curLet===isLetMatch);
          setResults(prev=>[...prev,{posCorrect,letCorrect,posInput:curPos,letInput:curLet,
            actualPos:isPosMatch,actualLet:isLetMatch}]);
          const pts=(posCorrect?1:0)+(letCorrect?1:0);
          setScore(prev=>prev+pts);
          // Brief feedback
          if(posCorrect&&letCorrect)setFeedbackMsg("✓");
          else if(!posCorrect&&!letCorrect)setFeedbackMsg("✗✗");
          else setFeedbackMsg("½");
        }
        setShowStim(false);
        setPosMatch(false);setLetMatch(false);
        // Pause then next or finish
        setTimeout(()=>{
          setFeedbackMsg(null);
          if(step+1>=TOTAL_ROUNDS){
            setPhase("done");
            // Calculate final score from results
            const maxPts=(TOTAL_ROUNDS-nLevel)*2;
            const finalScore=results.reduce((a,r)=>(r.posCorrect?1:0)+(r.letCorrect?1:0)+a,0)+
              ((()=>{const isPM=sequence[step]?.pos===sequence[step-nLevel]?.pos;const isLM=sequence[step]?.letter===sequence[step-nLevel]?.letter;
                const cp=posMatchRef.current;const cl=letMatchRef.current;return(cp===isPM?1:0)+(cl===isLM?1:0);})());
            const pct=Math.round((finalScore/maxPts)*100);
            const bestKey=`n${nLevel}`;
            const prevBest=best[bestKey]||0;
            if(pct>prevBest){const nb={...best,[bestKey]:pct};setBest(nb);try{localStorage.setItem("zo_best_nback",JSON.stringify(nb));}catch{}}
          }else{
            setStep(s=>s+1);setShowStim(true);
          }
        },PAUSE_TIME);
      },STIM_TIME);
      return()=>clearTimeout(timerRef.current);
    },[phase,step,showStim]);

    const maxPts=(TOTAL_ROUNDS-nLevel)*2;
    const pct=maxPts>0?Math.round((score/maxPts)*100):0;
    const bestPct=best[`n${nLevel}`]||0;

    // ── SETUP SCREEN ──
    if(phase==="setup")return(
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20}}>
        <div style={{fontSize:36,marginBottom:8}}>🧠</div>
        <div style={{fontSize:20,fontWeight:900,color:"#e8e0f0",marginBottom:4}}>Dual N-Back</div>
        <div style={{fontSize:13,opacity:.4,textAlign:"center",maxWidth:280,marginBottom:16,lineHeight:1.5}}>
          A letter appears in a 3×3 grid. Remember if the <span style={{color:"#60a5fa"}}>position</span> or <span style={{color:"#f093fb"}}>letter</span> matches the one from N steps ago.
        </div>
        <div style={{fontSize:14,fontWeight:800,opacity:.5,marginBottom:8}}>SELECT N-LEVEL</div>
        <div style={{display:"flex",gap:8,marginBottom:16}}>
          {[1,2,3,4,5].map(n=>(
            <button key={n} onClick={()=>setNLevel(n)}
              style={{width:48,height:48,borderRadius:12,fontSize:18,fontWeight:900,cursor:"pointer",
                background:nLevel===n?"linear-gradient(135deg,#667eea,#764ba2)":"rgba(255,255,255,.06)",
                color:nLevel===n?"#fff":"#888",border:nLevel===n?"none":"1px solid rgba(255,255,255,.08)"}}>
              {n}</button>
          ))}
        </div>
        <div style={{fontSize:12,opacity:.3,marginBottom:4}}>{TOTAL_ROUNDS} rounds · Remember {nLevel} step{nLevel>1?"s":""} back</div>
        {bestPct>0&&<div style={{fontSize:12,color:"#a78bfa",fontWeight:700,marginBottom:8}}>🏆 Best at {nLevel}-back: {bestPct}%</div>}
        <button onClick={startGame}
          style={{background:"linear-gradient(135deg,#667eea,#764ba2)",color:"#fff",border:"none",borderRadius:14,padding:"14px 40px",fontSize:17,fontWeight:800,cursor:"pointer",marginTop:8}}>Start</button>
      </div>);

    // ── DONE SCREEN ──
    if(phase==="done"){
      const finalResults=[...results];
      const finalScore=finalResults.reduce((a,r)=>(r.posCorrect?1:0)+(r.letCorrect?1:0)+a,0);
      const finalPct=maxPts>0?Math.round((finalScore/maxPts)*100):0;
      const isNewBest=finalPct>(best[`n${nLevel}`]||0)||finalPct===best[`n${nLevel}`];
      return(<div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20}}>
        <div style={{fontSize:48,marginBottom:8}}>{finalPct>=80?"🧠":finalPct>=50?"🤔":"😵"}</div>
        <div style={{fontSize:22,fontWeight:900,color:"#e8e0f0"}}>{nLevel}-Back Complete!</div>
        <div style={{fontSize:36,fontWeight:900,color:finalPct>=80?"#43e97b":finalPct>=50?"#feca57":"#f5576c",marginTop:8}}>{finalPct}%</div>
        <div style={{fontSize:14,opacity:.5,marginTop:4}}>{finalScore} / {maxPts} points</div>
        {isNewBest&&<div style={{fontSize:14,color:"#43e97b",fontWeight:700,marginTop:4}}>🏆 New Best!</div>}
        <div style={{display:"flex",gap:8,marginTop:16}}>
          <button onClick={()=>{setGameKey(k=>k+1);setPhase("setup");}} style={{background:"linear-gradient(135deg,#667eea,#764ba2)",color:"#fff",border:"none",borderRadius:12,padding:"10px 24px",fontSize:15,fontWeight:700,cursor:"pointer"}}>Play Again</button>
          <button onClick={()=>setGame(null)} style={{background:"rgba(255,255,255,.08)",color:"#ccc",border:"1px solid rgba(255,255,255,.1)",borderRadius:12,padding:"10px 20px",fontSize:15,fontWeight:700,cursor:"pointer"}}>Exit</button>
        </div>
      </div>);
    }

    // ── PLAYING SCREEN ──
    const cur=sequence[step];
    const canRespond=step>=nLevel&&showStim;
    canRespondRef.current=canRespond;
    return(<div style={{flex:1,display:"flex",flexDirection:"column",padding:"8px 12px",overflow:"hidden"}}>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 4px 8px",flexShrink:0}}>
        <span style={{fontSize:13,fontWeight:800,color:"#a78bfa"}}>{nLevel}-Back</span>
        <span style={{fontSize:13,fontWeight:700,opacity:.4}}>Round {step+1}/{TOTAL_ROUNDS}</span>
        <span style={{fontSize:13,fontWeight:800,color:"#feca57"}}>Score: {score}</span>
      </div>

      {/* Progress bar */}
      <div style={{height:3,borderRadius:2,background:"rgba(255,255,255,.06)",marginBottom:6,flexShrink:0}}>
        <div style={{height:"100%",borderRadius:2,background:"linear-gradient(90deg,#667eea,#764ba2)",width:`${((step+1)/TOTAL_ROUNDS)*100}%`,transition:"width .3s"}}/>
      </div>

      {/* Hint area - always reserved */}
      <div style={{height:20,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        {step<nLevel&&<span style={{fontSize:12,opacity:.25}}>Remember this — matching starts in {nLevel-step} step{nLevel-step>1?"s":""}</span>}
      </div>

      {/* 3x3 Grid - fixed in center */}
      <div style={{display:"flex",justifyContent:"center",alignItems:"center",flex:1}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,width:"min(70vw,240px)",aspectRatio:"1"}}>
          {Array.from({length:9},(_,i)=>{
            const isActive=showStim&&cur&&cur.pos===i;
            return(<div key={i} style={{borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",
              background:isActive?"rgba(102,126,234,.3)":"rgba(255,255,255,.04)",
              border:isActive?"2px solid rgba(102,126,234,.6)":"1px solid rgba(255,255,255,.06)",
              transition:"all .15s",aspectRatio:"1"}}>
              {isActive&&<span style={{fontSize:"min(10vw,36px)",fontWeight:900,color:"#e8e0f0"}}>{cur.letter}</span>}
            </div>);
          })}
        </div>
      </div>

      {/* Feedback - always reserved */}
      <div style={{height:28,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        {feedbackMsg&&<span style={{fontSize:20,fontWeight:900,
          color:feedbackMsg==="✓"?"#43e97b":feedbackMsg==="½"?"#feca57":"#f5576c"}}>{feedbackMsg}</span>}
      </div>

      {/* Response buttons - multitouch via native touchstart, onClick fallback for desktop */}
      <div ref={touchContainerRef} style={{display:"flex",gap:12,padding:"8px 8px 16px",flexShrink:0,justifyContent:"center",touchAction:"none",userSelect:"none",WebkitUserSelect:"none"}}>
        <div ref={posBtnRef} onClick={()=>{if(canRespond)setPosMatch(p=>!p);}}
          style={{flex:1,maxWidth:160,padding:"16px 8px",borderRadius:14,fontSize:15,fontWeight:800,cursor:canRespond?"pointer":"default",textAlign:"center",
            background:posMatch?"rgba(96,165,250,.25)":"rgba(255,255,255,.04)",
            border:posMatch?"2px solid rgba(96,165,250,.6)":"2px solid rgba(255,255,255,.08)",
            color:posMatch?"#60a5fa":"rgba(255,255,255,.4)",
            boxShadow:posMatch?"0 0 12px rgba(96,165,250,.3)":"none",
            opacity:canRespond?1:.3,transition:"all .12s"}}>
          📍 Position<br/><span style={{fontSize:11,fontWeight:600,opacity:.6}}>Match</span>
        </div>
        <div ref={letBtnRef} onClick={()=>{if(canRespond)setLetMatch(p=>!p);}}
          style={{flex:1,maxWidth:160,padding:"16px 8px",borderRadius:14,fontSize:15,fontWeight:800,cursor:canRespond?"pointer":"default",textAlign:"center",
            background:letMatch?"rgba(240,147,251,.25)":"rgba(255,255,255,.04)",
            border:letMatch?"2px solid rgba(240,147,251,.6)":"2px solid rgba(255,255,255,.08)",
            color:letMatch?"#f093fb":"rgba(255,255,255,.4)",
            boxShadow:letMatch?"0 0 12px rgba(240,147,251,.3)":"none",
            opacity:canRespond?1:.3,transition:"all .12s"}}>
          🔤 Letter<br/><span style={{fontSize:11,fontWeight:600,opacity:.6}}>Match</span>
        </div>
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
            {id:"breakout",icon:"🍎",name:"Fruit Blocks",desc:"Break up the frozen fruits for a yummy dessert! 🍧",color:"#f5576c",best:"zo_best_breakout"},
            {id:"rhythm",icon:"💕",name:"Memory Matchmaker",desc:"Flip cards and pair up the animals!",color:"#feca57",best:"zo_best_memory",bestLabel:" moves"},
            {id:"mines",icon:"🍀",name:"Lucky Clovers",desc:"Pick clovers without getting 💩 on you!",color:"#43e97b",best:"zo_best_mines",bestLabel:"s"},
            {id:"lineup",icon:"🔮",name:"Zobuddy Lineup",desc:"Guess the secret lineup from clues!",color:"#a78bfa",best:"zo_best_lineup",bestLabel:" guesses"},
            {id:"nback",icon:"🧠",name:"Dual N-Back",desc:"Train your brain! Match position & letter from N steps ago.",color:"#60a5fa",best:"zo_best_nback",bestLabel:"%"},
          ].map(g=>{
            const b=(()=>{try{const raw=localStorage.getItem(g.best);if(!raw)return 0;
              if(g.id==="nback"){const obj=JSON.parse(raw);const vals=Object.values(obj);return vals.length?Math.max(...vals):0;}
              return Number(raw)||0;}catch{return 0;}})();
            const bestLabel2=g.id==="nback"&&b>0?"%":(g.bestLabel||"");
            return(<div key={g.id} onClick={()=>setGame(g.id)}
              style={{background:`${g.color}10`,border:`1px solid ${g.color}25`,borderRadius:16,padding:"16px",marginBottom:8,cursor:"pointer",display:"flex",alignItems:"center",gap:14}}>
              <div style={{fontSize:36}}>{g.icon}</div>
              <div style={{flex:1}}><div style={{fontSize:16,fontWeight:800,color:"#e8e0f0"}}>{g.name}</div>
                <div style={{fontSize:13,opacity:.5,marginTop:2}}>{g.desc}</div>
                {b>0&&<div style={{fontSize:12,color:g.color,fontWeight:700,marginTop:3}}>🏆 Best: {b}{bestLabel2}</div>}</div>
              <span style={{fontSize:18,opacity:.3}}>▶</span></div>);})}
        </div></div></div>);

  // ═══ GAME WRAPPER ═══
  return(
    <div style={{position:"fixed",inset:0,zIndex:1000,background:"#0a0a1a",display:"flex",flexDirection:"column"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 16px",flexShrink:0}}>
        <button onClick={()=>setGame(null)} style={{background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.1)",borderRadius:8,padding:"5px 12px",color:"#ccc",fontSize:13,cursor:"pointer",fontWeight:700}}>← Exit to Menu</button>
        <div style={{fontSize:15,fontWeight:800,color:"#e8e0f0"}}>{({bubbles:"🥦 Veggie Garden",breakout:"🍎 Fruit Blocks",rhythm:"💕 Memory Matchmaker",mines:"🍀 Lucky Clovers",lineup:"🔮 Zobuddy Lineup",nback:"🧠 Dual N-Back"})[game]||""}</div>
        <button onClick={onClose} style={{background:"rgba(255,255,255,.08)",border:"none",borderRadius:8,width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#fff",fontSize:13}}>✕</button>
      </div>
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {game==="bubbles"&&<BubblePop key={gameKey}/>}{game==="breakout"&&<Breakout key={gameKey}/>}{game==="rhythm"&&<MemoryMatch key={gameKey}/>}{game==="mines"&&<Minesweeper key={gameKey}/>}{game==="lineup"&&<Lineup key={gameKey}/>}{game==="nback"&&<DualNBack key={gameKey}/>}
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

// ── CURATED CONTENT (730 entries per category — 2 years of daily picks) ──
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
  {q:"I have branches but no fruit, trunk, or leaves. What am I?",a:"A bank"},
  {q:"What gets sharper the more you use it?",a:"Your brain"},
  {q:"What disappears as soon as you say its name?",a:"Silence"},
  {q:"What can you hold in your left hand but never in your right?",a:"Your right elbow"},
  {q:"What belongs to you but other people use it more than you do?",a:"Your name"},
  {q:"What starts with T, ends with T, and has T in it?",a:"A teapot"},
  {q:"I am not alive but I grow. I don't have lungs but I need air. What am I?",a:"Fire"},
  {q:"What goes through cities and fields but never moves?",a:"A road"},
  {q:"What can be cracked, made, told, and played?",a:"A joke"},
  {q:"What has a bottom at the top?",a:"Your legs"},
  {q:"I have four wheels and flies. What am I?",a:"A garbage truck"},
  {q:"What kind of band never plays music?",a:"A rubber band"},
  {q:"What gets bigger the more you take away from it?",a:"A hole"},
  {q:"What has 13 hearts but no other organs?",a:"A deck of cards"},
  {q:"What has a ring but no finger?",a:"A telephone"},
  {q:"What coat is best put on wet?",a:"A coat of paint"},
  {q:"What has an eye but cannot see?",a:"A hurricane"},
  {q:"What falls but never breaks, and breaks but never falls?",a:"Night and day"},
  {q:"What five-letter word becomes shorter when you add two letters?",a:"Short"},
  {q:"What goes up and down stairs without moving?",a:"A carpet"},
  {q:"What word in the dictionary is spelled incorrectly?",a:"Incorrectly"},
  {q:"If two's company and three's a crowd, what are four and five?",a:"Nine"},
  {q:"What begins with an E but only contains one letter?",a:"An envelope"},
  {q:"What type of cheese is made backwards?",a:"Edam"},
  {q:"I am an odd number. Take away one letter and I become even. What number am I?",a:"Seven"},
  {q:"What two things can you never eat for breakfast?",a:"Lunch and dinner"},
  {q:"What has four fingers and a thumb but isn't alive?",a:"A glove"},
  {q:"What can you keep after giving it to someone?",a:"Your word"},
  {q:"What has a bed but never sleeps?",a:"A river"},
  {q:"I shave every day but my beard stays the same. What am I?",a:"A barber"},
  {q:"What has a face and two hands but no arms or legs?",a:"A clock"},
  {q:"What comes down but never goes up?",a:"Rain"},
  {q:"What can be as big as an elephant but weigh nothing?",a:"Its shadow"},
  {q:"What room can you never enter?",a:"A mushroom"},
  {q:"What becomes white when it is dirty?",a:"A blackboard"},
  {q:"What goes up when the rain comes down?",a:"An umbrella"},
  {q:"I fly without wings. I cry without eyes. What am I?",a:"A cloud"},
  {q:"What loses its head in the morning and gets it back at night?",a:"A pillow"},
  {q:"What word is always pronounced wrong?",a:"Wrong"},
  {q:"What starts with P, ends with E, and has thousands of letters?",a:"A post office"},
  {q:"What is at the end of a rainbow?",a:"The letter W"},
  {q:"What is easy to get into but hard to get out of?",a:"Trouble"},
  {q:"What has 88 keys but can't open a single door?",a:"A piano"},
  {q:"What runs around the whole yard without moving?",a:"A fence"},
  {q:"What can you put in a bucket to make it lighter?",a:"A hole"},
  {q:"What do you throw out when you want to use it but take in when you don't?",a:"An anchor"},
  {q:"What time of day is the same forwards and backwards?",a:"Noon"},
  {q:"What has a bark but no bite?",a:"A tree"},
  {q:"Where does today come before yesterday?",a:"The dictionary"},
  {q:"What do you see once in June and twice in November but never in May?",a:"The letter E"},
  {q:"What weighs more: a pound of feathers or a pound of bricks?",a:"They weigh the same"},
  {q:"Three men were in a boat. It capsized but only two got their hair wet. Why?",a:"One was bald"},
  {q:"If you are running a race and pass the person in second, what place are you in?",a:"Second place"},
  {q:"A farmer has 17 sheep. All but 9 die. How many are left?",a:"9"},
  {q:"What is always coming but never arrives?",a:"Tomorrow"},
  {q:"What has no beginning, end, or middle?",a:"A circle"},
  {q:"You walk into a room with a match. There is an oil lamp, a candle, and a fireplace. Which do you light first?",a:"The match"},
  {q:"What happens when you throw a blue stone into the Red Sea?",a:"It gets wet"},
  {q:"A rooster laid an egg on top of a roof. Which way did it roll?",a:"Roosters don't lay eggs"},
  {q:"What has a spine but no bones?",a:"A book"},
  {q:"What is taller sitting down than standing up?",a:"A dog"},
  {q:"How many bricks does it take to complete a building?",a:"Only the last one"},
  {q:"What is something you will never see again?",a:"Yesterday"},
  {q:"Mary's father has five daughters: Nana, Nene, Nini, Nono. What's the fifth's name?",a:"Mary"},
  {q:"What is always on the ground but never gets dirty?",a:"Your shadow"},
  {q:"What is 3/7 chicken, 2/3 cat, and 2/4 goat?",a:"Chicago"},
  {q:"What do Alexander the Great and Winnie the Pooh have in common?",a:"The same middle name (the)"},
  {q:"What's orange and sounds like a parrot?",a:"A carrot"},
  {q:"What's brown and sticky?",a:"A stick"},
  {q:"What has a head, a tail, is brown, and has no legs?",a:"A penny"},
  {q:"If I drink, I die. If I eat, I am fine. What am I?",a:"Fire"},
  {q:"What do the letter T and an island have in common?",a:"Both in the middle of water"},
  {q:"What has a heart that doesn't beat?",a:"An artichoke"},
  {q:"What can travel faster than the speed of light?",a:"Your imagination"},
  {q:"What state is round on both sides and high in the middle?",a:"Ohio"},
  {q:"What can you hold without ever touching it?",a:"A conversation"},
  {q:"What has leaves but is not a tree?",a:"A book"},
  {q:"What has 12 faces and 42 eyes?",a:"A pair of dice"},
  {q:"You live in a one-story house made of redwood. What color are the stairs?",a:"No stairs — one story"},
  {q:"What kind of table has no legs?",a:"A multiplication table"},
  {q:"How can a door not be a door?",a:"When it's ajar"},
  {q:"What word looks the same backwards and upside down?",a:"SWIMS"},
  {q:"A cowboy rides into town on Friday, stays three days, leaves on Friday. How?",a:"Horse is named Friday"},
  {q:"What are moving left to right right now?",a:"Your eyes"},
  {q:"When things go wrong, what can you always count on?",a:"Your fingers"},
  {q:"How can you go 10 days without sleeping?",a:"Sleep at night"},
  {q:"What has to be broken before you can use it?",a:"An egg"},
  {q:"What flies when it's born, lies when it's alive, runs when it's dead?",a:"A snowflake"},
  {q:"What can go up and come down without moving?",a:"Temperature"},
  {q:"David's father has three sons: Snap, Crackle, and...?",a:"David"},
  {q:"What goes from Z to A?",a:"A zebra"},
  {q:"What do you serve that you can't eat?",a:"A volleyball"},
  {q:"What has one head, one foot, and four legs?",a:"A bed"},
  {q:"What stays where it is when it goes off?",a:"An alarm"},
  {q:"How can you lift an elephant with one hand?",a:"You can't — elephants don't have hands"},
  {q:"What side of a cat has the most fur?",a:"The outside"},
  {q:"If April showers bring May flowers, what do May flowers bring?",a:"Pilgrims"},
  {q:"What do you call a sleeping bull?",a:"A bulldozer"},
  {q:"If you drop me I'm sure to crack, but smile at me and I'll smile back. What am I?",a:"A mirror"},
  {q:"What has a lot of needles but doesn't sew?",a:"A Christmas tree"},
  {q:"Why couldn't the bicycle stand up by itself?",a:"It was two-tired"},
  {q:"What animal can jump higher than a building?",a:"Any — buildings can't jump"},
  {q:"What happens to grapes when you step on them?",a:"They wine"},
  {q:"What has holes all over but still holds water?",a:"A sponge"},
  {q:"What English word has three consecutive double letters?",a:"Bookkeeper"},
  {q:"Name three consecutive days without weekday names.",a:"Yesterday, today, tomorrow"},
  {q:"I turn once, what is out will not get in. I turn again, what is in will not get out. What am I?",a:"A key"},
  {q:"Imagine you're in a room filling with water. No windows, no doors. How do you get out?",a:"Stop imagining"},
  {q:"I add five to nine and get two. How?",a:"9 AM + 5 hours = 2 PM"},
  {q:"What do the numbers 11, 69, and 88 have in common?",a:"They read the same upside down"},
  {q:"Turn me on my side and I am everything. Cut me in half and I am nothing. What am I?",a:"The number 8"},
  {q:"How far can a dog run into the woods?",a:"Halfway — then it's running out"},
  {q:"A man pushes his car to a hotel and tells the owner he's bankrupt. Why?",a:"Playing Monopoly"},
  {q:"What stays hot in the fridge?",a:"Mustard"},
  {q:"If it takes 5 machines 5 minutes to make 5 widgets, how long for 100 machines to make 100?",a:"5 minutes"},
  {q:"I am the beginning of the end, the end of every place. What am I?",a:"The letter E"},
  {q:"What's taken before you get it?",a:"Your picture"},
  {q:"A girl fell off a 20-foot ladder but wasn't hurt. How?",a:"Fell off the bottom rung"},
  {q:"What's the most musical bone?",a:"The trombone"},
  {q:"Why is Europe like a frying pan?",a:"It has Greece at the bottom"},
  {q:"What English word retains the same pronunciation after removing four of five letters?",a:"Queue"},
  {q:"What has six legs, two heads, and one tail?",a:"A person riding a horse"},
  {q:"How many animals did Moses take on the ark?",a:"None — Noah's ark"},
  {q:"A king, queen, and two twins in a room. No adults present. Why?",a:"They're all beds"},
  {q:"How many seconds are in a year?",a:"12 (Jan 2nd, Feb 2nd, etc.)"},
  {q:"A man dies of old age on his 25th birthday. How?",a:"Born on Feb 29"},
  {q:"What's 3+3×3+3?",a:"15 (order of operations)"},
  {q:"Two people born at the same time have different birthdays. How?",a:"Different time zones"},
  {q:"What has six faces, twenty-one eyes, but cannot see?",a:"A die"},
  {q:"If a red house is made of red bricks and a yellow house of yellow bricks, what's a greenhouse made of?",a:"Glass"},
  {q:"What's the next letter: J, F, M, A, M, J, J, A, S, O, N...?",a:"D (months)"},
  {q:"What can you hold in your right hand but never in your left?",a:"Your left hand"},
  {q:"Forwards I'm heavy. Backwards I'm not. What am I?",a:"Ton"},
  {q:"What has a neck but no head, two arms but no hands?",a:"A shirt"},
  {q:"What has roots nobody sees, is taller than trees, up it goes yet never grows?",a:"A mountain"},
  {q:"You see a boat filled with people, not sunk. You look again — not a single person. Why?",a:"All married"},
  {q:"Why is a raven like a writing desk?",a:"Poe wrote on both"},
  {q:"Mr. Blue lives in the blue house. Mr. Yellow in the yellow house. Who lives in the White House?",a:"The President"},
  {q:"They come out at night without being called, lost in the day without being stolen. What?",a:"Stars"},
  {q:"What 5-letter word typed in all capitals reads the same upside down?",a:"SWIMS"},
  {q:"What is special about the number 8,549,176,320?",a:"Digits 0-9 in alphabetical order"},
  {q:"What has a golden head, a golden tail, and no body?",a:"A gold coin"},
  {q:"What can make the number one disappear?",a:"Add G — it's 'gone'"},
  {q:"What connects two people but touches only one?",a:"A wedding ring"},
  {q:"What goes in hard and comes out soft?",a:"Chewing gum"},
  {q:"What's the one thing all wise people agree is between heaven and earth?",a:"The word 'and'"},
  {q:"What is at the center of every cell?",a:"The letter L"},
  {q:"It takes one word to separate them; otherwise they're inseparable. What?",a:"Lips"},
  {q:"What do you put on the table, cut, but never eat?",a:"A deck of cards"},
  {q:"What has to be given before you can keep it?",a:"Your word"},
  {q:"What goes around the house but never touches it?",a:"The sun"},
  {q:"What is more useful when broken?",a:"An egg"},
  {q:"What comes in many sizes but is always only 1 foot long?",a:"A shoe"},
  {q:"What can you catch but never throw?",a:"Your breath"},
  {q:"What do you lose every time you stand up?",a:"Your lap"},
  {q:"Where can you find an ocean with no water?",a:"On a map"},
  {q:"What has arms but can't hug?",a:"A chair"},
  {q:"What has a foot but no legs?",a:"A ruler"},
  {q:"What is the longest word in the dictionary?",a:"Smiles (a mile between S's)"},
  {q:"Take off my skin and I won't cry, but you will. What am I?",a:"An onion"},
  {q:"What can be opened but cannot be closed?",a:"An egg"},
  {q:"What has a bank but no money?",a:"A river"},
  {q:"What has only two words but thousands of letters?",a:"A post office"},
  {q:"What is seen in the middle of March and April but not at the beginning or end?",a:"The letter R"},
  {q:"If you drop a yellow hat in the Red Sea, what does it become?",a:"Wet"},
  {q:"A clerk at a butcher shop is 5'10\" and wears size 13 sneakers. What does he weigh?",a:"Meat"},
  {q:"What has no life but can die?",a:"A battery"},
  {q:"What can go through glass without breaking it?",a:"Light"},
  {q:"What is next in: JFMAMJJASON_?",a:"D (December)"},
  {q:"What grows when it eats but dies when it drinks?",a:"Fire"},
  {q:"Re-arrange 'O O U S W T D N E J R' to spell one word.",a:"Just one word"},
  {q:"What can point in every direction but can't reach the destination?",a:"A compass"},
  {q:"Forward I am heavy, backward I am not. What am I?",a:"The word TON"},
  {q:"Two fathers and two sons caught 3 fish, one each. How?",a:"Grandfather, father, son"},
  {q:"I left camp, hiked south 3 mi, east 3 mi, north 3 mi, back at camp. Bear color?",a:"White (North Pole)"},
  {q:"What can be measured but not seen?",a:"Time"},
  {q:"What is it that no one wants but no one wants to lose?",a:"A lawsuit"},
  {q:"The day before yesterday I was 21. Next year I'll be 24. When's my birthday?",a:"December 31 (today is Jan 1)"},
  {q:"What can you make that no one can see?",a:"Noise"},
  {q:"What has a tongue but cannot taste?",a:"A shoe"},
  {q:"What wears a cap but has no head?",a:"A bottle"},
  {q:"What never asks questions but is always answered?",a:"A phone"},
  {q:"I make two people out of one. What am I?",a:"A mirror"},
  {q:"What do you call a boomerang that doesn't come back?",a:"A stick"},
  {q:"What do you serve that you can never eat?",a:"A tennis ball"},
  {q:"What do computers snack on?",a:"Microchips"},
  {q:"What has a single eye but cannot see?",a:"A needle"},
  {q:"What's bright orange with green on top and sounds like a parrot?",a:"A carrot"},
  {q:"What five-letter word has one left when two are removed?",a:"Stone"},
  {q:"What number do nickels and dimes add up to?",a:"15 cents"},
  {q:"What color is the wind?",a:"Blew"},
  {q:"I have no legs. I will never walk but always run. What am I?",a:"A river"},
  {q:"I am not alive, yet I grow; I need air; water kills me. What am I?",a:"Fire"},
  {q:"What building in your town has the most stories?",a:"The public library"},
  {q:"What do you call a fish without eyes?",a:"A fsh"},
  {q:"What has four eyes but can't see?",a:"Mississippi"},
  {q:"I am bought by the yard but worn by the foot. What am I?",a:"Carpet"},
  {q:"What kind of tree can you carry in your hand?",a:"A palm"},
  {q:"Poor people have it, rich people need it, if you eat it you die. What?",a:"Nothing"},
  {q:"What moves faster: heat or cold?",a:"Heat — you can catch a cold"},
  {q:"What three numbers give the same result multiplied and added?",a:"1, 2, 3"},
  {q:"What has 18 legs and catches flies?",a:"A baseball team"},
  {q:"How many times can you subtract 5 from 25?",a:"Once — then it's 20"},
  {q:"What is the center of gravity?",a:"The letter V"},
  {q:"What occurs twice in a week, once in a year, never in a day?",a:"The letter E"},
  {q:"What can make seven an even number?",a:"Remove the S"},
  {q:"What fruit can you never cheer up?",a:"A blueberry"},
  {q:"What bird can lift the most weight?",a:"A crane"},
  {q:"What is the end of everything?",a:"The letter G"},
  {q:"What type of music do balloons hate?",a:"Pop"},
  {q:"What falls in winter but never gets hurt?",a:"Snow"},
  {q:"What kind of ship has two mates but no captain?",a:"A relationship"},
  {q:"What cup can't hold water?",a:"A cupcake"},
  {q:"What do you call a fly without wings?",a:"A walk"},
  {q:"What breaks on water but never on land?",a:"A wave"},
  {q:"What bow can't be tied?",a:"A rainbow"},
  {q:"Where do fish keep their money?",a:"In a riverbank"},
  {q:"What has lots of eyes but can't see?",a:"A potato"},
  {q:"How do oceans say hello?",a:"They wave"},
  {q:"What has one horn and gives milk?",a:"A milk truck"},
  {q:"What can be long, short, grown, bought, painted, or left bare?",a:"Fingernails"},
  {q:"What is always on the dinner table but you can never eat?",a:"Plates and silverware"},
  {q:"What has a spot and is very bright, sometimes seen at night?",a:"A firefly"},
  {q:"What gets shorter as it grows?",a:"A candle"},
  {q:"What has a mouth but can't chew?",a:"A river"},
  {q:"The more there is, the less you see. What am I?",a:"Darkness"},
  {q:"What runs, murmurs, has a bed but never sleeps, a mouth but never eats?",a:"A river"},
  {q:"What do snowmen eat for breakfast?",a:"Frosted Flakes"},
  {q:"What's black, white, and read all over?",a:"A newspaper"},
  {q:"Where can you finish a book without finishing a sentence?",a:"Prison"},
  {q:"What goes up and down but doesn't move?",a:"A staircase"},
  {q:"What do lazy dogs do for fun?",a:"Chase parked cars"},
  {q:"A bus driver goes the wrong way on a one-way street, passes cops. Why no ticket?",a:"He was walking"},
  {q:"A boy and father in a car accident. Doctor says 'That's my son.' How?",a:"Doctor is his mother"},
  {q:"What always comes at the end of Thanksgiving?",a:"The letter G"},
  {q:"What type of key opens a banana?",a:"A monkey"},
  {q:"If a red house is made of red bricks, what is a greenhouse made of?",a:"Glass"},
  {q:"How many months have 28 days?",a:"All 12"},
  {q:"What is lighter than air but a million people can't lift?",a:"A bubble"},
  {q:"What is as big as a hippo but weighs nothing?",a:"A hippo's shadow"},
  {q:"What am I? Tall when young, short when old.",a:"A candle"},
  {q:"What kind of cup doesn't hold water?",a:"A cupcake"},
  {q:"What has roots nobody sees, taller than trees?",a:"A mountain"},
  {q:"What can make an octopus laugh?",a:"Ten tickles (tentacles)"},
  {q:"What do you get when you cross a vampire and a snowman?",a:"Frostbite"},
  {q:"What do you call a parade of rabbits hopping backwards?",a:"A receding hare-line"},
  {q:"Why did the math book look sad?",a:"Too many problems"},
  {q:"What kind of music do mummies listen to?",a:"Wrap music"},
  {q:"Why can't Elsa hold a balloon?",a:"She'll let it go"},
  {q:"What do you call a fake noodle?",a:"An impasta"},
  {q:"What do you call a pig that does karate?",a:"A pork chop"},
  {q:"What do you call a dog that does magic?",a:"A Labracadabrador"},
  {q:"What do you call cheese that isn't yours?",a:"Nacho cheese"},
  {q:"What do you call a dinosaur that crashes their car?",a:"Tyrannosaurus Wrecks"},
  {q:"Why did the invisible man turn down the job?",a:"He couldn't see himself doing it"},
  {q:"What do you call a bear in the rain?",a:"A drizzly bear"},
  {q:"What do you call a sleeping dinosaur?",a:"A dino-snore"},
  {q:"How do bees brush their hair?",a:"With a honeycomb"},
  {q:"What did one wall say to the other?",a:"I'll meet you at the corner"},
  {q:"What did one hat say to the other?",a:"Stay here, I'm going on ahead"},
  {q:"Why did the student eat his homework?",a:"Teacher said it was a piece of cake"},
  {q:"How does a train eat?",a:"It goes chew chew"},
  {q:"What do you get when you cross poison ivy with a four-leaf clover?",a:"A rash of good luck"},
  {q:"What kind of room has no door or windows?",a:"A mushroom"},
  {q:"Why do cemeteries have fences?",a:"People are dying to get in"},
  {q:"What do you call a group of unorganized cats?",a:"A cat-astrophe"},
  {q:"What do you get if you cross a snowman and a vampire?",a:"Frostbite"},
  {q:"What has a thousand needles but doesn't sew?",a:"A porcupine"},
  {q:"What do you call a fairy that hasn't bathed?",a:"Stinkerbell"},
  {q:"What do you call a row of people lifting mozzarella?",a:"A cheesy pickup line"},
  {q:"I can be written, spoken, exposed, or broken. What am I?",a:"News"},
  {q:"What is it that you can't hold for more than a few minutes even though it's lighter than air?",a:"Your breath"},
  {q:"What can one hand do that two hands can never do?",a:"Be the other hand"},
  {q:"What has wings, a long nose, but can't fly?",a:"An airplane on the ground"},
  {q:"What has an end but no beginning, a home but no family, a space without room?",a:"A keyboard"},
  {q:"What goes in a birdbath but never gets wet?",a:"The bird's shadow"},
  {q:"What do you call a bear with no teeth?",a:"A gummy bear"},
  {q:"What do you get when you mix a cocker spaniel, poodle, and ghost?",a:"Cocker-poodle-boo"},
  {q:"What sounds like a sneeze and is made of leather?",a:"A shoe"},
  {q:"What has stripes and goes through the air?",a:"A basketball through a hoop"},
  {q:"What's the difference between a jeweler and a jailer?",a:"One sells watches, one watches cells"},
  {q:"What part of a fish weighs the most?",a:"The scales"},
  {q:"Before Mt. Everest was discovered, what was the tallest mountain?",a:"Mt. Everest — still there"},
  {q:"Which letter of the alphabet has the most water?",a:"C"},
  {q:"How do you make the number one disappear?",a:"Add G — it's gone"},
  {q:"What instrument can you hear but never see?",a:"Your voice"},
  {q:"What gets answered without being asked a question?",a:"A doorbell"},
  {q:"What can be seen but never touched?",a:"A rainbow"},
  {q:"What jumps when it walks and sits when it stands?",a:"A kangaroo"},
  {q:"What do you find at the end of the line?",a:"The letter E"},
  {q:"What can be driving you crazy but doesn't have a license?",a:"Your brain"},
  {q:"What has 10 letters and starts with gas?",a:"An automobile"},
  {q:"What sits in a corner but travels the world?",a:"A stamp"},
  {q:"I have a roof and walls but am not a building. What am I?",a:"Your mouth"},
  {q:"What has ears but can't hear a thing?",a:"A cornfield"},
  {q:"What can be long or short, grown or bought?",a:"Fingernails"},
  {q:"What begins and has no end, is the key to everything?",a:"The letter E"},
  {q:"What's red and bad for your teeth?",a:"A brick"},
  {q:"What do you call a fish that needs help with singing?",a:"Auto-tuna"},
  {q:"What has two legs but can't walk?",a:"A pair of pants"},
  {q:"What do you find in the middle of nowhere?",a:"The letter H"},
  {q:"What kind of nails do carpenters hate hammering?",a:"Fingernails"},
  {q:"What can a child make that no one can see?",a:"Noise"},
  {q:"What goes from New York to LA without moving?",a:"A highway"},
  {q:"What has arms but can't reach anything?",a:"A coat"},
  {q:"What coat goes on best when wet?",a:"A coat of paint"},
  {q:"What disappears when you stand up?",a:"Your lap"},
  {q:"What do you break every time you name it?",a:"Silence"},
  {q:"What can you make that you can't see?",a:"Noise"},
  {q:"What has a face but no eyes, hands but no arms?",a:"A clock"},
  {q:"What month do soldiers hate?",a:"March"},
  {q:"What goes up and never comes down?",a:"Your age"},
  {q:"What has one P and starts and ends with an E?",a:"Envelope"},
  {q:"What belongs to you but is used by everyone else?",a:"Your name"},
  {q:"What's easier to get into than out of?",a:"Trouble"},
  {q:"I follow you around but you can never catch me. What am I?",a:"Your shadow"},
  {q:"What do you throw out when you need it and put away when you don't?",a:"An anchor"},
  {q:"What's bought by the yard and worn by the foot?",a:"Carpet"},
  {q:"What kind of dog keeps the best time?",a:"A watchdog"},
  {q:"What has a tongue but can't speak?",a:"A shoe"},
  {q:"What has a neck but no head?",a:"A bottle"},
  {q:"What has hands but doesn't clap?",a:"A clock"},
  {q:"What has keys but opens no lock?",a:"A piano"},
  {q:"What has legs but doesn't walk?",a:"A chair"},
  {q:"What has teeth but doesn't bite?",a:"A comb"},
  {q:"What has eyes but can't see?",a:"A potato"},
  {q:"What has ears but can't hear?",a:"Corn"},
  {q:"What has a mouth but doesn't eat?",a:"A river"},
  {q:"What has bark but no bite?",a:"A tree"},
  {q:"What has a ring but no finger?",a:"A phone"},
  {q:"What's at the beginning of the end, and the start of eternity?",a:"The letter E"},
  {q:"What can you see with eyes closed?",a:"A dream"},
  {q:"What can be picked but not chosen?",a:"A nose"},
  {q:"What can be held but not touched?",a:"A grudge"},
  {q:"What has feathers but isn't alive?",a:"A pillow"},
  {q:"What has pages but isn't a book?",a:"A website"},
  {q:"What has a belt but no waist?",a:"A vacuum cleaner"},
  {q:"What has a sole but isn't a shoe?",a:"A fish"},
  {q:"What has a cap but isn't a bottle?",a:"A mushroom"},
  {q:"What has a trunk but isn't an elephant?",a:"A car"},
  {q:"What has a shell but isn't an egg?",a:"A turtle"},
  {q:"What has wings but isn't a bird?",a:"An airplane"},
  {q:"What has scales but isn't a fish?",a:"A map"},
  {q:"What has a crown but isn't a king?",a:"A tooth"},
  {q:"What has a bridge but isn't a river?",a:"A nose"},
  {q:"What has a web but isn't a spider?",a:"The internet"},
  {q:"What has a coat but isn't alive?",a:"Paint"},
  {q:"What has a frame but isn't a picture?",a:"A door"},
  {q:"What has a floor but isn't a room?",a:"The ocean"},
  {q:"What has blades but isn't a knife?",a:"A fan"},
  {q:"What has springs but isn't a mattress?",a:"A clock"},
  {q:"What has a drum but isn't an instrument?",a:"Your ear"},
  {q:"What has a lens but isn't glasses?",a:"A camera"},
  {q:"What has a current but isn't a river?",a:"Electricity"},
  {q:"What has a wave but isn't water?",a:"Sound"},
  {q:"What has a pulse but isn't alive?",a:"A star"},
  {q:"What has a stem but isn't a flower?",a:"A glass"},
  {q:"What has a face but isn't human?",a:"A mountain"},
  {q:"What starts with an S, ends with an S, and has an N in between?",a:"SINS"},
  {q:"What gets smaller every time it takes a bath?",a:"Soap"},
  {q:"What word becomes longer when you remove a letter?",a:"Lounger (remove L = longer)"},
  {q:"What goes from house to house but never goes inside?",a:"A path"},
  {q:"What invention allows you to see through any wall?",a:"A door"},
  {q:"I am always in front of you but can never be seen. What am I?",a:"The future"},
  {q:"What can you never eat before breakfast?",a:"Dinner"},
  {q:"Take away the whole and some still remains. What is it?",a:"The word 'wholesome'"},
  {q:"A window cleaner is cleaning the 25th floor and falls. He isn't hurt. Why?",a:"Cleaning inside"},
  {q:"What comes once in a year, twice in a month, and never in a week?",a:"The letter N"},
  {q:"I have millions of eyes, yet I live in darkness. I have millions of ears, yet only four lobes. What am I?",a:"The human brain"},
  {q:"In what year did Christmas Day and New Year's Day fall in the same year?",a:"Every year"},
  {q:"What 7-letter word is spelled the same forwards and backwards?",a:"Racecar"},
  {q:"What starts with 'e', ends with 'e', and only has one letter?",a:"An envelope"},
  {q:"What can you never get rid of when you lose it?",a:"Your temper"},
  {q:"What gets more wet while it dries?",a:"A towel"},
  {q:"What does December have that no other month does?",a:"The letter D"},
  {q:"What's taller when it sits down than when it stands up?",a:"A dog"},
  {q:"What can you never eat for dinner?",a:"Breakfast"},
  {q:"I'm found in socks, scarves, and mittens. I'm found in the paws of playful kittens. What am I?",a:"Yarn"},
  {q:"What can you add to water to make it stiff?",a:"A paddle"},
  {q:"What kind of music can you hear in space?",a:"Neptunes"},
  {q:"What starts working only after it's fired?",a:"A rocket"},
  {q:"What has one eye but can't see?",a:"A needle"},
  {q:"What do you call a snowman with a six-pack?",a:"An abdominal snowman"},
  {q:"What do you get if you sit under a cow?",a:"A pat on the head"},
  {q:"If you were a shoe, what part of you would wear out first?",a:"The sole"},
  {q:"What do you call two witches sharing an apartment?",a:"Broom-mates"},
  {q:"What does a cloud wear under his raincoat?",a:"Thunderwear"},
  {q:"What do you call a lazy kangaroo?",a:"A pouch potato"},
  {q:"What do you call a train loaded with toffee?",a:"A chew-chew train"},
  {q:"Why did the scarecrow win an award?",a:"Outstanding in his field"},
  {q:"What do elves learn in school?",a:"The elf-abet"},
  {q:"Why don't eggs tell jokes?",a:"They'd crack each other up"},
  {q:"What do you call an alligator in a vest?",a:"An investigator"},
  {q:"Why don't scientists trust atoms?",a:"They make up everything"},
  {q:"What do you call a factory that makes good products?",a:"A satisfactory"},
  {q:"How do you organize a space party?",a:"You planet"},
  {q:"What do you call a deer with no eyes?",a:"No idea (no-eye deer)"},
  {q:"Why was the belt arrested?",a:"For holding up a pair of pants"},
  {q:"What lies at the bottom of the ocean and twitches?",a:"A nervous wreck"},
  {q:"What's a cat's favorite color?",a:"Purr-ple"},
  {q:"Why did the golfer bring two pairs of pants?",a:"In case he got a hole in one"},
  {q:"What do you call a can opener that doesn't work?",a:"A can't opener"},
  {q:"What do you call a cow with no legs?",a:"Ground beef"},
  {q:"What do you call a man with a rubber toe?",a:"Roberto"},
  {q:"Why did the cookie go to the hospital?",a:"Feeling crummy"},
  {q:"Why couldn't the leopard play hide and seek?",a:"Always spotted"},
  {q:"What do you call a line of dolls?",a:"A Barbie-queue"},
  {q:"Why don't skeletons fight each other?",a:"No guts"},
  {q:"What do you call a snake that's 3.14 meters long?",a:"A pi-thon"},
  {q:"What did the big flower say to the little flower?",a:"Hi, bud!"},
  {q:"Why was the math book depressed?",a:"It had too many problems"},
  {q:"What has a bed you can't sleep in?",a:"A river"},
  {q:"What type of hair do oceans have?",a:"Wavy"},
  {q:"What do you call a nose that's 12 inches long?",a:"A foot"},
  {q:"What do you call a belt made of watches?",a:"A waist of time"},
  {q:"What do you call a bee from America?",a:"A USB"},
  {q:"What do you call birds that stick together?",a:"Vel-crows"},
  {q:"What runs but has no legs?",a:"A faucet"},
  {q:"What falls but doesn't break, and breaks but doesn't fall?",a:"Night and day"},
  {q:"What has a face and two hands but no arms?",a:"A clock"},
  {q:"What can you always find in the middle of a circle?",a:"The letter I"},
  {q:"What is cut on a table but never eaten?",a:"A deck of cards"},
  {q:"What is green, red, orange, purple, and yellow?",a:"A rainbow"},
  {q:"Where do smart hot dogs end up?",a:"On the honor roll"},
  {q:"What do you call a fake stone in Ireland?",a:"A shamrock"},
  {q:"I'm tall when young, short when old. What am I?",a:"A candle"},
  {q:"What can be swallowed, or can swallow you?",a:"Pride"},
  {q:"What goes through a door but never comes in or goes out?",a:"A keyhole"},
  {q:"What comes down but never goes up?",a:"Rain"},
  {q:"What can a child make that nobody can see?",a:"Noise"},
  {q:"I'm not a bird, but I can fly through the sky. I'm not a river, but I'm full of water. What am I?",a:"A cloud"},
  {q:"What do cows do for fun?",a:"Go to the moovies"},
  {q:"What do you call a sleeping T-Rex?",a:"A dino-snore"},
  {q:"What has wheels and flies but isn't an airplane?",a:"A garbage truck"},
  {q:"What time does a duck wake up?",a:"At the quack of dawn"},
  {q:"Why did the melon jump into the lake?",a:"To be a watermelon"},
  {q:"What do you call a penguin in the desert?",a:"Lost"},
  {q:"What do you call a monkey in a minefield?",a:"A ba-BOOM"},
  {q:"What kind of key can never unlock a door?",a:"A donkey"},
  {q:"What has a bark but is not a dog?",a:"A tree"},
  {q:"What has a head like a cat, feet like a cat, tail like a cat, but isn't a cat?",a:"A kitten"},
  {q:"What can an elephant make that no other animal can?",a:"Baby elephants"},
  {q:"When is a car not a car?",a:"When it turns into a driveway"},
  {q:"What has a bottom at the top?",a:"A leg"},
  {q:"Why do hummingbirds hum?",a:"They forgot the words"},
  {q:"What building has the most stories?",a:"A library"},
  {q:"What makes music but never sings?",a:"A guitar"},
  {q:"What has arms but can't give a hug?",a:"A chair"},
  {q:"What can you put in a box to make it lighter?",a:"Holes"},
  {q:"Where does a penguin keep its money?",a:"In a snow bank"},
  {q:"What's harder to catch the faster you run?",a:"Your breath"},
  {q:"What do you call a small mother?",a:"A minimum"},
  {q:"What do you call a baby monkey?",a:"A chimp off the old block"},
  {q:"What goes tick-tock, woof-woof?",a:"A watchdog"},
  {q:"What did zero say to eight?",a:"Nice belt"},
  {q:"What did the stamp say to the envelope?",a:"Stick with me and we'll go places"},
  {q:"What do dentists call their x-rays?",a:"Tooth pics"},
  {q:"What do you call a sleeping pizza?",a:"A pi-ZZZ-a"},
  {q:"Why do bees have sticky hair?",a:"They use honeycombs"},
  {q:"What has a spine but no bones?",a:"A book"},
  {q:"What runs all around a backyard yet never moves?",a:"A fence"},
  {q:"What is a tornado's favorite game?",a:"Twister"},
  {q:"How do you catch a whole school of fish?",a:"With bookworms"},
  {q:"What do sprinters eat before a race?",a:"Nothing — they fast"},
  {q:"Why is the letter A like a flower?",a:"A bee follows it"},
  {q:"What starts with a P, ends with an E, and has thousands of letters?",a:"Post office"},
  {q:"What has 4 legs but can't walk?",a:"A table"},
  {q:"What goes zzub zzub?",a:"A bee flying backwards"},
  {q:"Why didn't the quarter roll down the hill with the nickel?",a:"It had more cents"},
  {q:"What kind of button can't you unbutton?",a:"A belly button"},
  {q:"What keeps going up and down but doesn't move?",a:"Temperature"},
  {q:"What starts with W, ends with W, and has W in between?",a:"Window"},
  {q:"What has a face but no body?",a:"A coin"},
  {q:"Why do fish live in salt water?",a:"Pepper makes them sneeze"},
  {q:"What do you call a story about a broken pencil?",a:"Pointless"},
  {q:"What is black when it's clean?",a:"A chalkboard"},
  {q:"What can an elephant have that no other animal can?",a:"Baby elephants"},
  {q:"When you stop and look, you can always see me. But if you try to touch me, you can never feel me. What am I?",a:"A reflection"},
  {q:"What did the zero say to the eight?",a:"Nice belt!"},
  {q:"What do you call a pile of cats?",a:"A meowtain"},
  {q:"What do you call a teacher who never farts in public?",a:"A private tutor"},
  {q:"I'm always running but never get anywhere. What am I?",a:"A clock"},
  {q:"What's worse than finding a worm in your apple?",a:"Finding half a worm"},
  {q:"What do lawyers wear to court?",a:"Lawsuits"},
  {q:"What has an eye but cannot see?",a:"A storm"},
  {q:"What goes up but doesn't come back down?",a:"Smoke"},
  {q:"What word is spelled wrong in every dictionary?",a:"Wrong"},
  {q:"What has a bottom at its top?",a:"Your legs"},
  {q:"What goes with bread and makes you sneeze?",a:"Peanut butter — just kidding, pepper"},
  {q:"What can never be put in a saucepan?",a:"Its lid"},
  {q:"What do you call a dinosaur that is sleeping?",a:"A dino-snore"},
  {q:"If you threw a white stone into the Dead Sea what would happen?",a:"It would get wet"},
  {q:"What kind of room has no windows or doors?",a:"A mushroom"},
  {q:"What happens once in a lifetime, twice in a moment, but never in a hundred years?",a:"The letter M"},
  {q:"What kind of lion never roars?",a:"A dandelion"},
  {q:"I have cities but no houses, mountains but no trees, water but no fish. What am I?",a:"A map"},
  {q:"What can fill a room but takes no space?",a:"Light"},
  {q:"What travels all over the world but stays in one corner?",a:"A stamp"},
  {q:"What is the strongest day of the week?",a:"Sunday — the rest are weekdays"},
  {q:"What tastes better than it smells?",a:"A tongue"},
  {q:"If a plane crashes on the border of the US and Mexico, where do they bury the survivors?",a:"You don't bury survivors"},
  {q:"There are 3 stoves: glass, brick, gold. You only have one match. Which do you light first?",a:"The match"},
  {q:"A sundial has the fewest moving parts of any timepiece. What has the most?",a:"An hourglass"},
  {q:"You have a bowl with six apples. How do you divide them among 6 people so one apple stays in the bowl?",a:"Give the bowl with the apple to the last person"},
  {q:"What ancient device allows people to walk through walls?",a:"A door"},
  {q:"What is harder to catch the faster you run?",a:"Your breath"},
  {q:"How many birthdays does the average person have?",a:"One — they're born once"},
  {q:"If you threw a red stone into a green sea, what would it become?",a:"Wet"},
  {q:"What goes through a glass door without breaking it?",a:"Light"},
  {q:"What's half of 2+2?",a:"3 (half of 2 is 1, plus 2 = 3)"},
  {q:"What costs nothing but is worth everything, weighs nothing but can last a lifetime?",a:"A smile"},
  {q:"What loses its head every morning but gets it back at night?",a:"A pillow"},
  {q:"What can travel around the world inside one spot?",a:"A stamp"},
  {q:"What occurs once in every minute, twice in every moment, but never in a thousand years?",a:"The letter M"},
  {q:"I have keys but no doors, space but no rooms, you can enter but can't leave. What am I?",a:"A keyboard"},
  {q:"What can one catch that is not thrown?",a:"A cold"},
  {q:"What can be broken even if you never pick it up or touch it?",a:"A promise"},
  {q:"What is it that lives if it is fed, and dies if you give it a drink?",a:"Fire"},
  {q:"I am not alive, but I grow; I don't have lungs but I need air. What am I?",a:"Fire"},
  {q:"What can hold you but you can't hold it?",a:"A thought"},
  {q:"What are 8 hours of work called?",a:"A weekday"},
  {q:"What has a head, a tail, but no body?",a:"A coin"},
  {q:"What is so delicate that saying its name breaks it?",a:"Silence"},
  {q:"What invention lets you see right through a wall?",a:"A window"},
  {q:"What has a bottom at the very top?",a:"A leg"},
  {q:"What do you get when you pour boiling water down a rabbit hole?",a:"Hot cross bunnies"},
  {q:"What is an astronaut's favorite key on the keyboard?",a:"The space bar"},
  {q:"What has no beginning, no end, and nothing in the middle?",a:"A donut"},
  {q:"What goes through towns and over hills but doesn't move?",a:"A road"},
  {q:"What can you break without picking it up?",a:"A rule"},
  {q:"I'm everywhere and part of everyone. I am at the end of space, the universe, and everything. What am I?",a:"The letter E"},
  {q:"What invention lets you look through walls?",a:"A window"},
  {q:"Why are ghosts bad at lying?",a:"You can see right through them"},
  {q:"What can be a foot long yet invisible?",a:"A shadow"},
  {q:"What is something you own but everyone else uses?",a:"Your name"},
  {q:"What has a foot on each side and one in the middle?",a:"A yardstick"},
  {q:"What has a head, can't think, has a tail, can't wag?",a:"A coin"},
  {q:"What has wheels and flies but is not an airplane?",a:"A garbage truck"},
  {q:"What can you never finish?",a:"The alphabet — it goes on forever"},
  {q:"What can be touched but not seen?",a:"Someone's heart"},
  {q:"What runs through cities and forests and over fields but never moves?",a:"A road"},
  {q:"What can you add to a bucket to make it weigh less?",a:"A hole"},
  {q:"How many letters are in the alphabet?",a:"11 (T-H-E-A-L-P-H-A-B-E-T)"},
  {q:"If you have it you want to share it. If you share it you don't have it. What?",a:"A secret"},
  {q:"What's always at the end of a rainbow?",a:"The letter W"},
  {q:"What has a ring but no finger?",a:"A boxing ring"},
  {q:"What can you serve but not eat?",a:"A volleyball"},
  {q:"What has a face but can't laugh?",a:"A clock"},
  {q:"What starts with the letter T, is filled with T, and ends in T?",a:"A teapot"},
  {q:"What has a bank but no money?",a:"A blood bank"},
  {q:"What has to be given before it can be kept?",a:"Your word"},
  {q:"What's full of holes but holds water?",a:"A sponge"},
  {q:"What's the least spoken language in the world?",a:"Sign language"},
  {q:"What goes around and around the wood but never enters?",a:"The bark"},
  {q:"What has a tail and a head but no body?",a:"A coin"},
  {q:"What has two hands but no fingers?",a:"A clock"},
  {q:"What question can you never answer yes honestly?",a:"Are you asleep?"},
  {q:"What has cities, forests, rivers, but no people, trees, or water?",a:"A map"},
  {q:"What is so light even the strongest man can't hold it for more than a minute?",a:"His breath"},
  {q:"What has a needle but doesn't sew?",a:"A pine tree"},
  {q:"What has a foot but can't kick?",a:"A ruler"},
  {q:"I go in hard but come out soft and wet. What am I?",a:"Gum"},
  {q:"What gets more and more useless the bigger it gets?",a:"A hole"},
  {q:"What runs through your head all day but never complains?",a:"Thoughts"},
  {q:"What kind of flower do you carry around?",a:"Tulips (two lips)"},
  {q:"I go around all places, cities, towns, and villages, but never come inside. What am I?",a:"A street"},
  {q:"What has a tongue but can't talk?",a:"A shoe"},
  {q:"What gets wetter the more it dries?",a:"A towel"},
  {q:"What goes up and down without moving?",a:"Stairs"},
  {q:"What has hands but can't wave?",a:"A clock"},
  {q:"I have keys but no locks. What am I?",a:"A piano"},
  {q:"What has feet but doesn't walk?",a:"A table"},
  {q:"What has a heart but is not alive?",a:"A deck of cards"},
  {q:"What kind of dog never bites?",a:"A hot dog"},
  {q:"What do you call two birds in love?",a:"Tweethearts"},
  {q:"What do you call a sleeping triceratops?",a:"A dino-snore"},
  {q:"I am found everywhere: in the sun, the earth, the moon, and in you. What am I?",a:"The letter E"},
  {q:"What has walls but no roof?",a:"A maze"},
  {q:"What disappears the moment you start looking for it?",a:"Something you forgot"},
  {q:"What can you add to water and it becomes weaker?",a:"More water"},
  {q:"What works without batteries, has no moving parts, and comes in many colors?",a:"A crayon"},
  {q:"What happens when you put a candle in a safe?",a:"Candlelight security"},
  {q:"What do you have to break to use?",a:"An egg"},
  {q:"What's bright, not always right, but guides you through the night?",a:"A star"},
  {q:"What can you catch during winter?",a:"A cold"},
  {q:"What's always there when you need it, but fades when you don't?",a:"Courage"},
  {q:"What has an answer for everything but asks no questions?",a:"A phone"},
  {q:"What's the quietest sport?",a:"Bowling — you can hear a pin drop"},
  {q:"What building is the easiest to lift?",a:"A lighthouse"},
  {q:"What room do ghosts avoid?",a:"The living room"},
  {q:"What is made of leather, sits on your desk, and tells you things?",a:"A calendar"},
  {q:"What's round at both ends and high in the middle?",a:"Ohio"},
  {q:"What clothes does a house wear?",a:"Address"},
  {q:"What animal turns about 200 times around its axis after it dies?",a:"A roast chicken"},
  {q:"What's the difference between a piano and a fish?",a:"You can tune a piano but can't tuna fish"},
  {q:"Why are teddy bears never hungry?",a:"They're always stuffed"},
  {q:"What do you call a boomerang that doesn't work?",a:"A stick"},
  {q:"What did the ocean say to the beach?",a:"Nothing — it just waved"},
  {q:"What has no weight but can sink a ship?",a:"A hole"},
  {q:"I am a word. If you pronounce me correctly, it is wrong. If you pronounce me wrong, it is right. What am I?",a:"Wrong"},
  {q:"I get smaller every time I take a bath. What am I?",a:"Soap"},
  {q:"A word I know, six letters it contains. Remove one letter and 12 remains. What is it?",a:"Dozens"},
  {q:"What can travel at nearly the speed of light?",a:"Your thoughts"},
  {q:"A woman has 7 children. Half of them are boys. How is this possible?",a:"All of them are boys (half is still boys)"},
  {q:"What word starts with E and ends with E but usually contains only one letter?",a:"Envelope"},
  {q:"What can one put in a pail to make it lighter?",a:"Holes"},
  {q:"What's more useful when it's broken?",a:"An egg"},
  {q:"What comes in different sizes but always just has 1 foot?",a:"A shoe"},
  {q:"A truck driver is going down a one-way street the wrong way. A police officer sees him but doesn't stop him. Why?",a:"He's walking"},
  {q:"What is one thing that all wise people agree is between heaven and earth?",a:"The word AND"},
  {q:"I have wings but I'm not a bird. I have fins but I'm not a fish. What am I?",a:"An airplane"},
  {q:"What breaks when you speak?",a:"Silence"},
  {q:"I'm not a bird but I can fly. I'm not a bee but I can sting. What am I?",a:"An airplane"},
  {q:"What goes up when water comes down?",a:"An umbrella"},
  {q:"I have a mouth but I don't eat. I have a bank but no money. What am I?",a:"A river"},
  {q:"What animal is always at a baseball game?",a:"A bat"},
  {q:"What can go through water but never gets wet?",a:"Sunlight"},
  {q:"I go in one hole and come out three. What am I?",a:"A shirt"},
  {q:"I can be found in water but never wet. What am I?",a:"A reflection"},
  {q:"What five-letter word becomes shorter when two letters are added?",a:"Short"},
  {q:"What has two banks but no money?",a:"A river"},
  {q:"What kind of running means walking?",a:"Running out of gas"},
  {q:"Why is a fish easy to weigh?",a:"It has its own scales"},
  {q:"What starts with M, ends with X, and has a never-ending number of letters?",a:"Mailbox"},
  {q:"I'm the son of water, but when I go back to water I die. What am I?",a:"Ice"},
  {q:"What walks on 4 legs, then 2, then 3?",a:"A human"},
  {q:"If I have it, I don't share it. If I share it, I don't have it. What is it?",a:"A secret"},
  {q:"What has a head and a tail but no body?",a:"A coin"},
  {q:"What has 4 wheels and flies?",a:"A garbage truck"},
  {q:"What did one math book say to the other?",a:"I've got problems"},
  {q:"I'm always in front of you but you can never see me. What am I?",a:"The future"},
  {q:"What can fill a whole room and still not take up any space?",a:"Light"},
  {q:"I have hundreds of legs but can only lean. What am I?",a:"A broom"},
  {q:"When I'm young I'm tall, when I'm old I'm short. What am I?",a:"A candle"},
  {q:"What type of music scares balloons?",a:"Pop"},
  {q:"What has no fingers but many rings?",a:"A tree"},
  {q:"What's always coming but never truly arrives?",a:"Tomorrow"},
  {q:"I have a face but I can't see. I have hands but I can't wave. What am I?",a:"A clock"},
  {q:"I get better as I age. What am I?",a:"Wine"},
  {q:"What's a volcano's favorite snack?",a:"Lava cake"},
  {q:"What do you call a queen that's in a bad mood?",a:"Reign of terror"},
  {q:"What do you call a happy cowboy?",a:"A jolly rancher"},
  {q:"What do you call a cold puppy sitting on a rabbit?",a:"A chili dog on a bun"},
  {q:"How do trees access the internet?",a:"They log in"},
  {q:"What did the ocean say to the shore?",a:"Nothing — just waved"},
  {q:"What kind of cats love bowling?",a:"Alley cats"},
  {q:"What do you call a magic dog?",a:"A Labracadabrador"},
  {q:"What do you call a bird that's afraid to fly?",a:"Chicken"},
  {q:"What falls in autumn?",a:"Leaves"},
  {q:"What do you call a flower that runs on electricity?",a:"A power plant"},
  {q:"What room has no floor, walls, or ceiling?",a:"A chatroom"},
  {q:"What do you call a horse that lives next door?",a:"A neigh-bor"},
  {q:"What do you call a fast zombie?",a:"A zoom-bie"},
  {q:"What do you call a lazy baby kangaroo?",a:"A pouch potato"},
  {q:"What do you call a cow during an earthquake?",a:"A milkshake"},
  {q:"What do you call a rabbit with fleas?",a:"Bugs Bunny"},
  {q:"Why did the teddy bear say no to dessert?",a:"She was stuffed"},
  {q:"What falls but doesn't get hurt?",a:"Rain"},
  {q:"What do you call a tooth in a glass of water?",a:"A one molar solution"},
  {q:"What can you catch but not throw?",a:"Someone's attention"},
  {q:"What letter is always surprised?",a:"O!"},
  {q:"What has a cap but no head?",a:"A bottle"},
  {q:"What has a handle but no door?",a:"A cup"},
  {q:"What can you always see but never touch?",a:"The sky"},
  {q:"What's found in the center of gravity?",a:"The letter V"},
  {q:"What has a base but no top?",a:"A mountain"},
  {q:"What has four legs in the morning?",a:"A baby"},
  {q:"What kind of key doesn't open a door?",a:"A monkey"},
  {q:"What's black and white and red all over?",a:"An embarrassed zebra"},
  {q:"What breaks when you say it?",a:"A promise"},
  {q:"What has a horn but can't honk?",a:"A rhinoceros"},
  {q:"What loses its head in the morning?",a:"A pillow"},
  {q:"What kind of table can you eat?",a:"A vegetable"},
  {q:"What has 3 feet but can't walk?",a:"A yardstick"},
  {q:"What has cities but no houses?",a:"A map"},
  {q:"What goes boom when it walks?",a:"A mine"},
  {q:"What is always sleeping but never tired?",a:"A bed"},
  {q:"What has to be broken before it can be used?",a:"An egg"},
  {q:"What can you find in the center of both your body and the earth?",a:"The letter R"},
  {q:"What has a silent K?",a:"A knife"},
  {q:"What starts with W, ends with D, and is full of water?",a:"The word World"},
  {q:"What's always on the ground but never dirty?",a:"Your shadow"},
  {q:"What looks like half an apple?",a:"The other half"},
  {q:"What goes up when the temperature goes down?",a:"A thermometer reading"},
  {q:"What has a ceiling but no floor?",a:"The sky"},
  {q:"What travels on all fours in the morning, two in the afternoon, three at night?",a:"A human"},
  {q:"What is the most slippery country?",a:"Greece"},
  {q:"What has a bed but no pillow?",a:"A river"},
  {q:"What has bark but no trees?",a:"A library book"},
  {q:"What has two arms but no fingers?",a:"A shirt"},
  {q:"What can be replaced but never returned?",a:"Time"},
  {q:"What can't be burned in fire or drowned in water?",a:"Ice"},
  {q:"What do you call a musical insect?",a:"A humbug"},
  {q:"What gets colder as it heats up?",a:"An air conditioner"},
  {q:"What can grow without sunlight?",a:"A conversation"},
  {q:"What has teeth but no mouth?",a:"A saw"},
  {q:"What has a sole but isn't a shoe?",a:"A foot"},
  {q:"What can be any size but is always only 1 foot?",a:"A shoe"},
  {q:"What moves without legs?",a:"Time"},
  {q:"What has pages but can't be read?",a:"A tree"},
];

const FIN_TIPS=[
  {tip:"Pay yourself first — automate savings before spending.",icon:"🏦"},
  {tip:"The 50/30/20 rule: 50% needs, 30% wants, 20% savings.",icon:"📊"},
  {tip:"An emergency fund should cover 3-6 months of expenses.",icon:"🛟"},
  {tip:"Track every dollar for one month. You'll be shocked where it goes.",icon:"🔍"},
  {tip:"A budget isn't a restriction — it's a plan for your money.",icon:"📋"},
  {tip:"Shop with a list and stick to it. Impulse buys account for 40% of spending.",icon:"📝"},
  {tip:"Subscriptions add up. Audit them quarterly and cut what you don't use.",icon:"✂️"},
  {tip:"Before a big purchase, wait 48 hours. If you still want it, buy it.",icon:"⏰"},
  {tip:"Cook at home more. Eating out costs 3-5x more than homemade meals.",icon:"🍳"},
  {tip:"Use the envelope method: put cash in labeled envelopes for each spending category.",icon:"✉️"},
  {tip:"Review your bank statements weekly. Catch fraudulent charges and spending leaks.",icon:"🔎"},
  {tip:"Price per unit matters more than sticker price. Always compare value.",icon:"🔬"},
  {tip:"When you get a raise, save at least half before lifestyle-creeping.",icon:"📈"},
  {tip:"Understand needs vs wants. A roof is a need. A penthouse is a want.",icon:"🏗️"},
  {tip:"Build a 'sinking fund' for big predictable expenses: holidays, car repairs, vacations.",icon:"🗓️"},
  {tip:"Before spending, ask: how many hours of work does this cost me?",icon:"⏱️"},
  {tip:"Free doesn't always mean cheap. Consider the hidden costs of 'free' services.",icon:"🏷️"},
  {tip:"Net worth = assets minus liabilities. Track it monthly.",icon:"📐"},
  {tip:"Don't compare your finances to others. Everyone's path is different.",icon:"🛤️"},
  {tip:"Your future self will thank your present self for every dollar saved today.",icon:"🔮"},
  {tip:"Compound interest is the 8th wonder of the world. Start investing early.",icon:"📈"},
  {tip:"Index funds beat 90% of actively managed funds over 20 years.",icon:"💹"},
  {tip:"Don't invest money you'll need within 5 years.",icon:"⏳"},
  {tip:"The best time to start investing was yesterday. The second best is today.",icon:"🌱"},
  {tip:"Dollar-cost averaging: invest the same amount regularly regardless of price.",icon:"📆"},
  {tip:"Don't time the market. Time IN the market beats timing the market.",icon:"⏳"},
  {tip:"Diversify investments across asset classes. Don't put all eggs in one basket.",icon:"🧺"},
  {tip:"The Rule of 72: divide 72 by your interest rate to see how fast money doubles.",icon:"🔢"},
  {tip:"Tax-loss harvesting: sell losing investments to offset gains legally.",icon:"📑"},
  {tip:"Take advantage of employer 401k match — it's literally free money.",icon:"🆓"},
  {tip:"Retirement accounts (401k, IRA) are free tax advantages. Max them out.",icon:"🎁"},
  {tip:"An HSA is triple tax-advantaged: tax-free going in, growing, and coming out for medical.",icon:"🏥"},
  {tip:"Avoid emotional investing. Fear and greed are the two worst financial advisors.",icon:"🧠"},
  {tip:"Interest works for you or against you. Make sure it's working FOR you.",icon:"⚙️"},
  {tip:"Keep 1-2 months of expenses in checking, the rest in high-yield savings.",icon:"💰"},
  {tip:"Don't chase hot stock tips. Boring, consistent investing wins long-term.",icon:"🐢"},
  {tip:"Reinvest dividends. Let compound growth work its magic.",icon:"🔄"},
  {tip:"Understand that all investing involves risk. Only invest what you can afford to lose.",icon:"⚠️"},
  {tip:"Real estate can be great, but don't forget maintenance costs, taxes, and vacancies.",icon:"🏠"},
  {tip:"Review your investment portfolio at least once a year and rebalance if needed.",icon:"📊"},
  {tip:"High-interest debt first: pay off credit cards before investing.",icon:"🎯"},
  {tip:"Credit score matters: pay bills on time, keep utilization under 30%.",icon:"💳"},
  {tip:"Avoid payday loans — they can charge 400%+ APR. Find alternatives.",icon:"🚫"},
  {tip:"Build your credit history early. A secured credit card is a good first step.",icon:"🏗️"},
  {tip:"The snowball method: pay off smallest debts first for psychological wins.",icon:"❄️"},
  {tip:"The avalanche method: pay off highest-interest debts first to save money.",icon:"🏔️"},
  {tip:"Don't close old credit cards. Length of credit history matters.",icon:"📏"},
  {tip:"If you carry a balance, you're paying the credit card company to borrow your own future money.",icon:"💸"},
  {tip:"Student loans: look into income-driven repayment plans and forgiveness programs.",icon:"🎓"},
  {tip:"Negotiate your interest rates. Call your credit card company and ask.",icon:"📞"},
  {tip:"Pay more than the minimum. Minimum payments keep you in debt for decades.",icon:"💳"},
  {tip:"Check your credit report annually for errors. Dispute anything wrong.",icon:"🔍"},
  {tip:"A good credit score saves you tens of thousands on mortgages and car loans.",icon:"🏆"},
  {tip:"Debt consolidation can lower your interest rate if you have multiple debts.",icon:"🔄"},
  {tip:"Avoid buying things on credit that depreciate. Finance assets, not liabilities.",icon:"📉"},
  {tip:"Always negotiate your salary. The worst they can say is no.",icon:"🤝"},
  {tip:"Multiple income streams = financial security. Start a side project.",icon:"🌊"},
  {tip:"Your largest expense is usually housing. Keep it under 30% of income.",icon:"🏠"},
  {tip:"Insurance isn't optional: health, auto, renter's/homeowner's at minimum.",icon:"🛡️"},
  {tip:"Renegotiate bills annually: insurance, phone, internet. Companies reward loyalty poorly.",icon:"📞"},
  {tip:"Learning one new money skill per month compounds like interest.",icon:"📚"},
  {tip:"Your health is your biggest asset. Medical bills are the #1 cause of bankruptcy.",icon:"❤️"},
  {tip:"Learn the difference between assets (make money) and liabilities (cost money).",icon:"⚡"},
  {tip:"Financial literacy isn't taught in school. Teach yourself — and teach others.",icon:"🎓"},
  {tip:"Every financial guru has a different strategy. Find what works for YOUR life.",icon:"🧭"},
  {tip:"Lifestyle inflation is the silent wealth killer. Live below your means.",icon:"⚖️"},
  {tip:"Avoid buying new cars. They lose 20% value in year one.",icon:"🚗"},
  {tip:"Generosity and wealth aren't opposites. Give while you grow.",icon:"💝"},
  {tip:"Financial peace isn't about having the most. It's about owing the least.",icon:"🕊️"},
  {tip:"Wealth is built slowly and quietly. Get-rich-quick schemes make others rich, not you.",icon:"🐢"},
  {tip:"Invest in yourself first. Skills and education have the best ROI.",icon:"🧠"},
  {tip:"Set up automatic bill pay so you never miss a payment or pay late fees.",icon:"🤖"},
  {tip:"Buy experiences, not things. Research shows experiences bring lasting happiness.",icon:"🎭"},
  {tip:"Use cashback and rewards strategically — but never spend more just to earn points.",icon:"🎰"},
  {tip:"Estate planning isn't just for the wealthy. Everyone needs a will and beneficiaries.",icon:"📜"},
  {tip:"The cheapest car you can afford isn't always the best value. Factor in maintenance.",icon:"🔧"},
  {tip:"Teach kids about money early. Allowance + saving jars = lifelong financial habits.",icon:"👧"},
  {tip:"Think of taxes as the price of earning money. Optimize, don't evade.",icon:"📑"},
  {tip:"A penny saved is more than a penny earned — you don't pay tax on savings.",icon:"🪙"},
  {tip:"Don't lend money you can't afford to lose. It often ruins relationships.",icon:"🤝"},
  {tip:"The best investment you can make is in your own health and knowledge.",icon:"📚"},
  {tip:"Money is a tool, not a goal. Define what 'enough' means for you.",icon:"🎯"},
  {tip:"Small daily savings add up. $5/day = $1,825/year.",icon:"☕"},
  {tip:"Financial freedom means having choices, not having millions.",icon:"🗽"},
  {tip:"Pay attention to fees. A 1% fund fee vs 0.1% costs you hundreds of thousands over time.",icon:"🔍"},
  {tip:"The market will crash. It will also recover. Don't panic sell.",icon:"📉"},
  {tip:"Automate as much of your finances as possible. Remove willpower from the equation.",icon:"🤖"},
  {tip:"Your income is not your wealth. Your savings rate is.",icon:"💡"},
  {tip:"Money amplifies who you already are. Work on yourself first.",icon:"🪞"},
  {tip:"Comparison is the thief of financial joy. Run your own race.",icon:"🏃"},
  {tip:"Financial mistakes are tuition fees for life's money school.",icon:"🎓"},
  {tip:"The most powerful wealth-building tool is a steady paycheck invested consistently.",icon:"💪"},
  {tip:"Cash is not always king. Inflation eats 2-3% of your cash value every year.",icon:"📉"},
  {tip:"Separate savings accounts for different goals (vacation, car, emergency).",icon:"🏦"},
  {tip:"If you can't explain an investment to a 10-year-old, you don't understand it.",icon:"🧒"},
  {tip:"Set financial goals with deadlines. 'Save more' is a wish. 'Save $5K by December' is a plan.",icon:"📅"},
  {tip:"The 1% rule: improve your finances just 1% each week. In a year, you're 52% better.",icon:"📈"},
  {tip:"Round up your purchases to the nearest dollar and save the difference.",icon:"🔄"},
  {tip:"Cancel cable. Streaming services cost a fraction for more content.",icon:"📺"},
  {tip:"Use the library. Books, movies, music — all free.",icon:"📚"},
  {tip:"Buy used when possible. Cars, furniture, clothing — quality doesn't require new.",icon:"♻️"},
  {tip:"Meal prep on Sundays. Saves time, money, and impulse food purchases.",icon:"🥘"},
  {tip:"Negotiate medical bills. Hospitals often have charity programs or payment plans.",icon:"🏥"},
  {tip:"Keep a spending journal for a week. Awareness alone reduces overspending.",icon:"📓"},
  {tip:"Unsubscribe from marketing emails. You can't buy what you don't see.",icon:"📧"},
  {tip:"Wait for sales on big items. Black Friday, Prime Day, end-of-season clearance.",icon:"🏷️"},
  {tip:"Check your tax withholding. A big refund means you gave the government an interest-free loan.",icon:"📋"},
  {tip:"Contribute to a Roth IRA if eligible. Tax-free growth and withdrawals in retirement.",icon:"🌱"},
  {tip:"Your car doesn't define you. A reliable used car is often the smart choice.",icon:"🚗"},
  {tip:"Always read the fine print. Especially for loans, credit cards, and contracts.",icon:"🔎"},
  {tip:"Talk about money with your partner. Financial disagreements are the #1 cause of divorce.",icon:"💑"},
  {tip:"Set a 'fun money' budget. You need to enjoy life while building wealth.",icon:"🎉"},
  {tip:"Track your net worth monthly. Watch the trend, not the number.",icon:"📊"},
  {tip:"A home warranty can save thousands on unexpected repairs.",icon:"🏠"},
  {tip:"Use no-fee bank accounts. There's no reason to pay for basic banking.",icon:"🏦"},
  {tip:"Bring lunch to work 3 days a week. Save $2,000+ per year.",icon:"🥪"},
  {tip:"Tax-advantaged accounts are your best friend: 401k, IRA, HSA, 529.",icon:"🎁"},
  {tip:"Avoid lifestyle creep with raises. Increase savings percentage, not spending.",icon:"📈"},
  {tip:"Learn basic car and home maintenance. DIY saves hundreds per year.",icon:"🔧"},
  {tip:"Shop for insurance every 2 years. Loyalty discounts are often beaten by new-customer rates.",icon:"🛡️"},
  {tip:"Keep receipts for large purchases. You might need them for returns, warranties, or taxes.",icon:"🧾"},
  {tip:"Invest in energy efficiency. LED bulbs, weatherstripping, smart thermostats pay for themselves.",icon:"💡"},
  {tip:"Your grocery bill is a controllable expense. Plan meals, use coupons, buy in bulk.",icon:"🛒"},
  {tip:"Don't keep up with the Joneses. They're probably in debt.",icon:"🏘️"},
  {tip:"Consider a side hustle that uses skills you already have. Consulting, tutoring, freelancing.",icon:"💼"},
  {tip:"Open a savings account at a different bank than your checking. Out of sight, out of mind.",icon:"🏦"},
  {tip:"Know your hourly rate. Before any purchase, ask if it's worth X hours of your time.",icon:"⏰"},
  {tip:"Automatic savings transfers on payday ensure you pay yourself first.",icon:"🤖"},
  {tip:"Put windfalls — tax refunds, bonuses, gifts — directly into savings or investments.",icon:"🎰"},
  {tip:"Don't upgrade your phone every year. Modern phones last 3-4 years easily.",icon:"📱"},
  {tip:"A budget is not about restriction. It's about intention.",icon:"🎯"},
  {tip:"The best financial advice: spend less than you earn and invest the difference.",icon:"💡"},
  {tip:"Make saving a habit, not an event. Consistent small amounts beat occasional large ones.",icon:"🌱"},
  {tip:"Use cash for discretionary spending. Physical money feels more 'real' than card taps.",icon:"💵"},
  {tip:"Your morning latte isn't the problem. Your car payment probably is.",icon:"🚗"},
  {tip:"Never co-sign a loan unless you're prepared to pay it yourself.",icon:"⚠️"},
  {tip:"Credit cards are a tool, not free money. Pay the full balance every month.",icon:"💳"},
  {tip:"The stock market isn't gambling if you're diversified and patient.",icon:"📊"},
  {tip:"Start retirement savings in your 20s. Starting at 25 vs 35 can mean double the money.",icon:"🕐"},
  {tip:"Keep your investment strategy simple. Complexity doesn't equal better returns.",icon:"🧩"},
  {tip:"Financial advisors should be fiduciaries — legally required to act in your best interest.",icon:"⚖️"},
  {tip:"Your biggest financial asset is your ability to earn income. Protect and grow it.",icon:"💪"},
  {tip:"Don't withdraw from retirement accounts early. Penalties and taxes eat 30-40%.",icon:"🚫"},
  {tip:"Disability insurance is underrated. You're more likely to be disabled than to die young.",icon:"🛡️"},
  {tip:"Term life insurance is usually better than whole life for most people.",icon:"📋"},
  {tip:"Buy generic brands. Most are identical to name brands but cost 20-40% less.",icon:"🏪"},
  {tip:"Use balance transfer cards wisely. 0% APR gives breathing room but has deadlines.",icon:"💳"},
  {tip:"Your emergency fund should be in a high-yield savings account, not under your mattress.",icon:"🏦"},
  {tip:"Consider a no-spend challenge for one week per month.",icon:"🚫"},
  {tip:"Know the difference between good debt (mortgage, education) and bad debt (credit cards, payday loans).",icon:"📚"},
  {tip:"Review and update your beneficiaries annually on all accounts.",icon:"📋"},
  {tip:"A 15-year mortgage costs more monthly but saves tens of thousands in interest vs 30-year.",icon:"🏠"},
  {tip:"Consider house hacking: rent out rooms or a portion of your home to cover mortgage costs.",icon:"🏡"},
  {tip:"The best time to buy a car is at the end of the month, quarter, or year when dealers need to hit targets.",icon:"🚗"},
  {tip:"Set up price alerts for things you want. Buy when they go on sale, not when you want them.",icon:"📱"},
  {tip:"Your 20s are for learning, your 30s for earning, your 40s for growing, your 50s for protecting.",icon:"📈"},
  {tip:"Contribute enough to your 401k to get the full employer match before paying extra on low-interest debt.",icon:"🎁"},
  {tip:"Keep 3-6 months of fixed expenses in cash. After that, invest the rest.",icon:"💰"},
  {tip:"If you can't afford two of something, you can't afford one.",icon:"⚖️"},
  {tip:"Buy assets that appreciate. Avoid liabilities disguised as assets.",icon:"📈"},
  {tip:"A used car that's 2-3 years old gives you 80% of new car quality at 60% of the price.",icon:"🚗"},
  {tip:"Your credit utilization ratio matters more than your credit limit.",icon:"💳"},
  {tip:"Paying for convenience is fine if you value your time. But know what you're paying.",icon:"⏰"},
  {tip:"Social media makes you spend money you don't have on things you don't need.",icon:"📱"},
  {tip:"An index fund portfolio of 3 funds can outperform most financial advisors.",icon:"📊"},
  {tip:"Set a 'wealth date' with yourself monthly to review all accounts and goals.",icon:"📅"},
  {tip:"Kids don't need expensive toys. They need time, attention, and stability.",icon:"👨‍👩‍👧"},
  {tip:"Yard sales and thrift stores are goldmines. One person's trash is another's treasure.",icon:"🏷️"},
  {tip:"Negotiate everything: rent, salary, car price, medical bills, cable, insurance.",icon:"🤝"},
  {tip:"Avoid financial products you don't understand. If it sounds too good to be true, it is.",icon:"⚠️"},
  {tip:"Your money personality matters. Are you a spender, saver, or avoider? Know thyself.",icon:"🪞"},
  {tip:"Emergency fund first, then high-interest debt, then investing. In that order.",icon:"1️⃣"},
  {tip:"A rainy day fund and emergency fund are different. Small unexpected vs major life events.",icon:"🌧️"},
  {tip:"The best budget is the one you'll actually follow. Simple beats perfect.",icon:"✅"},
  {tip:"Automate your financial life: savings, investing, bill pay. Remove human error.",icon:"🤖"},
  {tip:"Your net worth will go up and down. Focus on the long-term trend.",icon:"📈"},
  {tip:"Write down your financial goals. Written goals are 42% more likely to be achieved.",icon:"📝"},
  {tip:"Money can't buy happiness, but financial stress causes immense unhappiness.",icon:"😌"},
  {tip:"Every dollar has a job. Give each one a purpose before the month begins.",icon:"💵"},
  {tip:"The market rewards patience. The average investor holds for 4 years. The successful ones hold for 20+.",icon:"⏳"},
  {tip:"Don't let perfect be the enemy of good in finances. Start messy. Improve over time.",icon:"🌱"},
  {tip:"A 529 plan is the best way to save for college. Tax-free growth for education.",icon:"🎓"},
  {tip:"Umbrella insurance is cheap and protects you from major liability lawsuits.",icon:"☂️"},
  {tip:"Know your tax bracket. It determines how much of each additional dollar you keep.",icon:"📊"},
  {tip:"Max out tax-advantaged accounts before taxable brokerage accounts.",icon:"🏦"},
  {tip:"The 4% rule: you can safely withdraw 4% of your retirement savings annually.",icon:"📐"},
  {tip:"Financial independence = 25x your annual expenses invested.",icon:"🗽"},
  {tip:"Frugal is smart. Cheap is not. Know the difference.",icon:"🧠"},
  {tip:"Your spending reveals your true priorities. Does it match your stated values?",icon:"🪞"},
  {tip:"Health insurance deductibles matter. Sometimes a higher premium saves money overall.",icon:"🏥"},
  {tip:"Read one personal finance book per quarter. Knowledge compounds faster than money.",icon:"📚"},
  {tip:"Every purchase is a trade: your money for something else. Is the trade worth it?",icon:"⚖️"},
  {tip:"The 72-hour rule for big purchases: sleep on it for 3 nights before deciding.",icon:"💤"},
  {tip:"Savings rate matters more than investment returns for most people.",icon:"💡"},
  {tip:"Your financial plan should include what to do if you lose your job tomorrow.",icon:"📋"},
  {tip:"Invest in things that save you time and improve health. Those pay dividends forever.",icon:"⏰"},
  {tip:"Don't save what's left after spending. Spend what's left after saving.",icon:"🏦"},
  {tip:"A rising tide lifts all boats. Invest in broad market funds, not individual stocks.",icon:"🚢"},
  {tip:"The money you save on taxes is money you can invest. Maximize deductions.",icon:"📑"},
  {tip:"Work toward being debt-free, not payment-free. Own things outright when possible.",icon:"🏠"},
  {tip:"Your biggest expense is probably taxes. Learn basic tax strategy.",icon:"📋"},
  {tip:"Time is more valuable than money. You can always make more money.",icon:"⏳"},
  {tip:"Financial success is 80% behavior and 20% knowledge.",icon:"🧠"},
  {tip:"Invest in quality for things you use daily: shoes, bed, chair, tools.",icon:"👟"},
  {tip:"Use the 10-10-10 rule: will this purchase matter in 10 minutes, 10 months, 10 years?",icon:"🔮"},
  {tip:"If a friend asks to borrow money, consider it a gift. If they pay it back, great.",icon:"🤝"},
  {tip:"Budget for annual expenses monthly. Car registration, subscriptions, insurance premiums.",icon:"📅"},
  {tip:"Keep your financial life organized. One afternoon of sorting prevents years of headaches.",icon:"📁"},
  {tip:"Inflation is a hidden tax on cash. Invest to at least keep up with inflation.",icon:"📉"},
  {tip:"Social pressure to spend is real. Surround yourself with people who share your financial values.",icon:"👥"},
  {tip:"Your children will learn more from watching your financial habits than from any lesson.",icon:"👨‍👩‍👧‍👦"},
  {tip:"The goal isn't to retire rich. The goal is to never worry about money.",icon:"😌"},
  {tip:"Giving is an investment in your community. Budget for generosity.",icon:"💝"},
  {tip:"Know when to spend and when to save. Experiences with loved ones are worth every penny.",icon:"❤️"},
  {tip:"Financial planning is not just about money. It's about designing the life you want.",icon:"🎨"},
  {tip:"Start where you are. Use what you have. Do what you can.",icon:"🌱"},
  {tip:"Your relationship with money reflects your relationship with yourself. Work on both.",icon:"🪞"},
  {tip:"Small progress is still progress. Celebrate financial wins, no matter how small.",icon:"🎉"},
  {tip:"The wealthiest people aren't always the highest earners. They're the best savers.",icon:"💡"},
  {tip:"Money management is a skill, not a talent. Anyone can learn it.",icon:"📚"},
  {tip:"Live on last month's income. Use this month's income for next month's bills.",icon:"📅"},
  {tip:"Being wealthy is having options. True wealth is measured in freedom, not dollars.",icon:"🗽"},
  {tip:"Don't try to get rich fast. Try to not get poor slowly.",icon:"🐢"},
  {tip:"Every financial decision is a choice between your present self and your future self.",icon:"⚖️"},
  {tip:"When in doubt about a purchase, don't. The regret of not buying fades faster than buyer's remorse.",icon:"🤔"},
  {tip:"Your bank wants your money working for them. Make your money work for you instead.",icon:"💪"},
  {tip:"Financial education is the best gift you can give yourself. It pays for a lifetime.",icon:"🎁"},
  {tip:"The market has recovered from every crash in history. Stay the course.",icon:"📈"},
  {tip:"A simple portfolio you understand beats a complex one you don't.",icon:"🧩"},
  {tip:"Money saved is money earned, but money invested is money multiplied.",icon:"✖️"},
  {tip:"Talk to your kids about money the way you wish your parents had talked to you.",icon:"👨‍👧"},
  {tip:"Review your credit card benefits. Many include free insurance, warranties, and perks.",icon:"💳"},
  {tip:"Batch errands to save gas and time. Plan your route before leaving the house.",icon:"🗺️"},
  {tip:"Challenge yourself to a no-spend weekend once a month.",icon:"🚫"},
  {tip:"Your hourly wage isn't your real wage. Subtract commuting costs, work clothes, meals out.",icon:"⏰"},
  {tip:"The best things in life are free. Sunsets, laughter, naps, hugs, conversations.",icon:"☀️"},
  {tip:"Build wealth for freedom, not for stuff. Stuff weighs you down; freedom lifts you up.",icon:"🦅"},
  {tip:"Track your progress, not just your spending. Watching your net worth grow is motivating.",icon:"📈"},
  {tip:"Financial wellness is a journey, not a destination. Enjoy the process of getting better.",icon:"🌱"},
  {tip:"Money is renewable. Time is not. Invest both wisely.",icon:"⏳"},
  {tip:"The first rule of personal finance: don't go broke. The second: grow slowly and steadily.",icon:"🐢"},
  {tip:"Save $1 today. Tomorrow save $2. By month's end, you'll have $465.",icon:"💰"},
  {tip:"Automate a $25/week transfer to savings. That's $1,300/year without thinking.",icon:"🤖"},
  {tip:"Review your phone plan. Most people overpay by $20-40/month.",icon:"📱"},
  {tip:"Use the 30-day rule for wants: write it down, wait 30 days, then decide.",icon:"📝"},
  {tip:"Pack snacks when you go out. Vending machines and convenience stores markup 200-400%.",icon:"🍎"},
  {tip:"Use a password manager to track free trial expiration dates. Cancel before charges hit.",icon:"🔐"},
  {tip:"Share streaming subscriptions with family. Most allow 2-5 profiles.",icon:"📺"},
  {tip:"Generic medications are FDA-required to be identical to brand names. Save 80%.",icon:"💊"},
  {tip:"Air-dry clothes when possible. Dryers use more energy than almost any appliance.",icon:"👕"},
  {tip:"Refinance your mortgage when rates drop 1%+. It can save hundreds monthly.",icon:"🏠"},
  {tip:"Use apps like cashback and coupon browsers to save passively while shopping online.",icon:"💻"},
  {tip:"Freeze your credit if you're not applying for loans. Prevents identity theft.",icon:"❄️"},
  {tip:"Review your insurance coverage annually. Life changes mean coverage needs change.",icon:"🛡️"},
  {tip:"DIY gifts are more meaningful and cheaper. Baked goods, handwritten letters, homemade art.",icon:"🎨"},
  {tip:"Challenge yourself to find one free activity each weekend. Parks, hikes, museums on free days.",icon:"🌳"},
  {tip:"Use a money-saving challenge: 52-week challenge, no-spend days, penny challenge.",icon:"🎮"},
  {tip:"Prepare for tax season year-round. Keep receipts organized, track deductions monthly.",icon:"📑"},
  {tip:"Shop end-of-season for clothing. Winter coats in March, swimsuits in September.",icon:"🧥"},
  {tip:"Cancel gym memberships you don't use. Outdoor exercise is free and often better.",icon:"🏃"},
  {tip:"Drink more water. It's free, healthy, and saves money on sugary drinks.",icon:"💧"},
  {tip:"Make coffee at home. A daily $5 latte costs $1,825/year.",icon:"☕"},
  {tip:"Borrow tools and equipment instead of buying for one-time use.",icon:"🔨"},
  {tip:"Plan vacations in the off-season. Same destination, half the price.",icon:"✈️"},
  {tip:"Grow herbs at home. Fresh herbs cost $3-5 per pack but pennies to grow.",icon:"🌿"},
  {tip:"Fix things before replacing them. YouTube tutorials make most repairs doable.",icon:"🔧"},
  {tip:"Use public transportation when possible. Saves gas, parking, and car wear.",icon:"🚌"},
  {tip:"Brown bag lunch twice a week. That's $1,000+ saved per year.",icon:"🥪"},
  {tip:"Buy seasonal produce. It's fresher, tastier, and cheaper.",icon:"🍓"},
  {tip:"Switch to LED bulbs. They use 75% less energy and last 25x longer.",icon:"💡"},
  {tip:"Repair clothing instead of replacing. Learn basic sewing — it takes 10 minutes.",icon:"🧵"},
  {tip:"Use your local library for audiobooks and ebooks. Most have free apps.",icon:"📖"},
  {tip:"Set a monthly charitable giving budget. Generosity is part of a healthy financial plan.",icon:"💝"},
  {tip:"Keep a running wishlist. Review it monthly. Most items won't seem as essential later.",icon:"📋"},
  {tip:"Freeze leftover meals in portions. Free lunches for busy days.",icon:"🧊"},
  {tip:"Carpool when possible. Split gas, reduce wear on your car, help the environment.",icon:"🚗"},
  {tip:"Use a programmable thermostat. Saving 1 degree can cut heating bills by 3%.",icon:"🌡️"},
  {tip:"Buy in bulk for non-perishables you use regularly. Toilet paper, cleaning supplies, rice.",icon:"🛒"},
  {tip:"Negotiate your rent. Especially if you've been a good tenant for a year+.",icon:"🏠"},
  {tip:"Use free budgeting apps. You don't need expensive software to track money.",icon:"📱"},
  {tip:"Pay yourself a 'tax' on impulse buys: transfer the same amount to savings.",icon:"💰"},
  {tip:"Shop around for prescriptions. Prices vary wildly between pharmacies.",icon:"💊"},
  {tip:"Cut your own hair between salon visits. YouTube tutorials for basic trims.",icon:"✂️"},
  {tip:"Use reward credit cards for bills you'd pay anyway, then pay the balance in full.",icon:"💳"},
  {tip:"Invest in a good water filter. Saves money on bottled water and reduces plastic.",icon:"💧"},
  {tip:"Plan your meals for the week. Reduces food waste and impulse grocery buys.",icon:"📅"},
  {tip:"Sell things you don't use. Your clutter is someone else's treasure.",icon:"🏷️"},
  {tip:"Use the 1-in-1-out rule: buy something new, donate or sell something old.",icon:"♻️"},
  {tip:"Review your car insurance every 6 months. Rates change as your profile changes.",icon:"🚗"},
  {tip:"Invest in a quality mattress. You spend 1/3 of your life on it. Good sleep = good health.",icon:"🛏️"},
  {tip:"Use natural light when possible. Open curtains instead of turning on lights.",icon:"☀️"},
  {tip:"Make your own cleaning supplies. Vinegar, baking soda, and water clean almost everything.",icon:"🧹"},
  {tip:"Bike or walk for short trips. Saves gas and improves your health.",icon:"🚲"},
  {tip:"Use a reusable water bottle. Saves money and the planet.",icon:"🫗"},
  {tip:"Host potlucks instead of dining out with friends. More fun, less expensive.",icon:"🍽️"},
  {tip:"Buy a whole chicken instead of parts. You get more meat for less money.",icon:"🍗"},
  {tip:"Adjust your tax withholding to get a smaller refund but bigger paychecks.",icon:"📋"},
  {tip:"Invest spare change with micro-investing apps. Small amounts add up over time.",icon:"🪙"},
  {tip:"Cancel magazine and newspaper subscriptions you don't read.",icon:"📰"},
  {tip:"Use cold water for laundry. Saves energy and is gentler on clothes.",icon:"🧺"},
  {tip:"Make gifts instead of buying them. Photo albums, playlists, handmade items.",icon:"🎁"},
  {tip:"Buy winter clothes in spring and summer clothes in fall. Off-season = deep discounts.",icon:"👗"},
  {tip:"Avoid ATM fees. Use your bank's ATM or get cashback at the grocery store.",icon:"🏧"},
  {tip:"Review your will and estate plan every 5 years or after major life changes.",icon:"📜"},
  {tip:"Start a no-spend day each week. It forces creativity and reduces mindless spending.",icon:"🚫"},
  {tip:"Maintain your car regularly. Oil changes and tire rotations prevent expensive repairs.",icon:"🔧"},
  {tip:"Use a slow cooker. Cheaper cuts of meat become tender and delicious.",icon:"🍲"},
  {tip:"Buy store brand over name brand. Most taste identical; the packaging is the difference.",icon:"🏪"},
  {tip:"Keep your tires properly inflated. Improves gas mileage by up to 3%.",icon:"⛽"},
  {tip:"Unplug electronics when not in use. Phantom loads cost $100-200/year.",icon:"🔌"},
  {tip:"Invest in reusable products: bags, containers, straws. Small savings add up.",icon:"♻️"},
  {tip:"Use the 80/20 rule: 20% of your expenses cause 80% of your stress. Fix those first.",icon:"📊"},
  {tip:"Research before every major purchase. 30 minutes of comparison shopping saves hundreds.",icon:"🔍"},
  {tip:"Pay cash for depreciating assets. Finance only things that appreciate.",icon:"💵"},
  {tip:"Your biggest financial risk is not investing at all. Inflation eats cash.",icon:"⚠️"},
  {tip:"Build an investment policy statement. Write down your strategy so emotions don't derail you.",icon:"📝"},
  {tip:"Contribute to your community. Financial wealth without social wealth is empty.",icon:"🏘️"},
  {tip:"The best financial plan is the one you'll actually follow. Keep it simple.",icon:"✅"},
  {tip:"Money is emotional. Acknowledge your feelings about money to make better decisions.",icon:"💭"},
  {tip:"Your money story from childhood affects your adult finances. Understand it to change it.",icon:"📖"},
  {tip:"Financial wellness starts with self-care. You can't manage money well when you're burned out.",icon:"🧘"},
  {tip:"Celebrate debt payoff milestones. Motivation matters for long financial journeys.",icon:"🎉"},
  {tip:"Money isn't the goal. The life money enables is the goal.",icon:"🌅"},
  {tip:"Start before you're ready. The perfect financial plan doesn't exist.",icon:"🚀"},
  {tip:"Your financial habits matter more than your financial knowledge.",icon:"🔄"},
  {tip:"Every expert was once a beginner. Start your financial journey today.",icon:"🌱"},
  {tip:"The money conversation is uncomfortable but necessary. Have it with your partner, your kids, yourself.",icon:"💬"},
  {tip:"Financial independence is the ultimate luxury. Work toward it daily.",icon:"🗽"},
  {tip:"Saving money isn't about deprivation. It's about choosing future freedom over present impulse.",icon:"⚖️"},
];

const MINDFULNESS=[
  {practice:"4-7-8 Breathing: Inhale 4 sec, hold 7 sec, exhale 8 sec. Repeat 3x.",icon:"🌬️",type:"Breathing"},
  {practice:"Box breathing: Inhale 4 sec, hold 4 sec, exhale 4 sec, hold 4 sec. Repeat 4x.",icon:"🗃️",type:"Breathing"},
  {practice:"Alternate nostril breathing: close right, inhale left 4 sec, switch, exhale right 4 sec. 5 rounds.",icon:"👃",type:"Breathing"},
  {practice:"Breathe in for 4 counts, out for 6 counts. Longer exhale activates calm.",icon:"🍃",type:"Breathing"},
  {practice:"Before sleep: inhale peace, exhale tension. 10 slow breaths.",icon:"😴",type:"Breathing"},
  {practice:"Take 3 deep breaths before responding to anything stressful today.",icon:"🫁",type:"Breathing"},
  {practice:"Belly breathing: Place hand on stomach. Breathe so only your belly rises. 2 minutes.",icon:"🫁",type:"Breathing"},
  {practice:"Ocean breath: Inhale through nose, exhale through mouth with a 'haaa' sound. 10 breaths.",icon:"🌊",type:"Breathing"},
  {practice:"Count your breaths to 10. If you lose count, start over. No judgment.",icon:"🔢",type:"Breathing"},
  {practice:"Humming bee breath: Inhale through nose, exhale while humming. Feel the vibration. 5 rounds.",icon:"🐝",type:"Breathing"},
  {practice:"Straw breathing: Inhale through nose, exhale slowly through pursed lips as if through a straw. 8x.",icon:"🥤",type:"Breathing"},
  {practice:"Triangle breathing: Inhale 3 sec, hold 3 sec, exhale 3 sec. Repeat 6x.",icon:"🔺",type:"Breathing"},
  {practice:"Sigh of relief: Take a deep breath, then exhale with an audible sigh. Repeat 5 times.",icon:"💨",type:"Breathing"},
  {practice:"Coherent breathing: Inhale 5 sec, exhale 5 sec. Maintain for 3 minutes.",icon:"⚖️",type:"Breathing"},
  {practice:"Breath counting meditation: Count each exhale from 1 to 5, then restart. Do for 5 minutes.",icon:"🧘",type:"Breathing"},
  {practice:"Write down 3 things you're grateful for right now.",icon:"📝",type:"Gratitude"},
  {practice:"Think of 3 challenges that made you stronger. Appreciate them.",icon:"💪",type:"Gratitude"},
  {practice:"Before eating, pause and appreciate everything that went into making this meal.",icon:"🙏",type:"Gratitude"},
  {practice:"Write down your 3 proudest accomplishments. Big or small, they all count.",icon:"🏆",type:"Gratitude"},
  {practice:"End the day by whispering 'thank you' — to the day, to yourself, to life.",icon:"🌠",type:"Gratitude"},
  {practice:"Send a gratitude text to someone who made your week better.",icon:"💬",type:"Gratitude"},
  {practice:"Gratitude walk: As you walk, silently thank everything you notice.",icon:"🚶",type:"Gratitude"},
  {practice:"Write a thank-you letter you never send. The feeling is what matters.",icon:"✉️",type:"Gratitude"},
  {practice:"List 5 body parts you're grateful for and why.",icon:"🫀",type:"Gratitude"},
  {practice:"Name 3 strangers who made your day better without knowing it.",icon:"😊",type:"Gratitude"},
  {practice:"Gratitude jar: Write something you're thankful for on a slip. Read them on hard days.",icon:"🫙",type:"Gratitude"},
  {practice:"Think of a difficult person. Find one thing to be grateful for about them.",icon:"🤔",type:"Gratitude"},
  {practice:"List 3 small luxuries you take for granted: clean water, a warm bed, etc.",icon:"💧",type:"Gratitude"},
  {practice:"Look around your room. Find 5 things you're grateful for having.",icon:"👁️",type:"Gratitude"},
  {practice:"Before complaining, name 3 things going right in your life.",icon:"✨",type:"Gratitude"},
  {practice:"Name 5 things you see, 4 you hear, 3 you touch, 2 you smell, 1 you taste.",icon:"🌿",type:"Grounding"},
  {practice:"Close your eyes and listen to the farthest sound you can hear for 1 minute.",icon:"👂",type:"Awareness"},
  {practice:"Notice one thing you usually autopilot through. Do it with full attention.",icon:"👁️",type:"Awareness"},
  {practice:"Walk barefoot on grass or earth for 5 minutes. Feel grounded.",icon:"🦶",type:"Grounding"},
  {practice:"Listen to a song you love with your eyes closed. Notice new details.",icon:"🎵",type:"Awareness"},
  {practice:"Name your current emotion without trying to change it. Sit with it for 30 seconds.",icon:"🪞",type:"Emotional Awareness"},
  {practice:"Notice your posture right now. Gently straighten. Feel the difference.",icon:"🧍",type:"Body Awareness"},
  {practice:"Look at your hands for 30 seconds. Really see them — the lines, the story.",icon:"🤲",type:"Presence"},
  {practice:"Take a photo of something ordinary that looks beautiful to you today.",icon:"📸",type:"Presence"},
  {practice:"Touch 3 different textures around you. Notice the difference in each.",icon:"✋",type:"Grounding"},
  {practice:"Close your eyes. Name every sound you can identify. Just listen.",icon:"🔊",type:"Awareness"},
  {practice:"Feel the ground beneath your feet. Press down. Notice the stability.",icon:"🦶",type:"Grounding"},
  {practice:"Hold an ice cube. Notice the cold, the melting, the sensation changing.",icon:"🧊",type:"Grounding"},
  {practice:"Look at the sky for 60 seconds. Just look. Nothing else.",icon:"🌤️",type:"Presence"},
  {practice:"Smell something familiar — coffee, a candle, a flower. Breathe it in deeply.",icon:"👃",type:"Awareness"},
  {practice:"Set a 2-minute timer. Focus only on your breath. When your mind wanders, gently return.",icon:"⏱️",type:"Meditation"},
  {practice:"Sit quietly for 1 minute doing absolutely nothing. Not even thinking on purpose.",icon:"🪷",type:"Stillness"},
  {practice:"Count backwards from 50, focusing only on the numbers. Reset if distracted.",icon:"🔢",type:"Focus"},
  {practice:"Choose one task today and give it your complete, undivided attention.",icon:"🔍",type:"Focus"},
  {practice:"Spend 10 minutes in silence. No phone, no music, no TV. Just you.",icon:"🤫",type:"Stillness"},
  {practice:"Loving-kindness meditation: Send wishes of health, happiness, and peace to yourself and others.",icon:"💗",type:"Meditation"},
  {practice:"Candle gazing: Stare at a candle flame for 2 minutes. Blink naturally. Just watch.",icon:"🕯️",type:"Meditation"},
  {practice:"Mantra meditation: Choose a word (peace, calm, love). Repeat it silently for 3 minutes.",icon:"🕉️",type:"Meditation"},
  {practice:"Walking meditation: Walk very slowly. Feel heel, arch, toes. 5 minutes.",icon:"🚶",type:"Meditation"},
  {practice:"Sound meditation: Focus on ambient sounds for 3 minutes. Don't label them, just hear.",icon:"🔔",type:"Meditation"},
  {practice:"Write a letter to your future self. What do you hope for them?",icon:"✉️",type:"Journaling"},
  {practice:"Write down one worry. Ask: Can I control this? If yes, plan. If no, release.",icon:"🎈",type:"Journaling"},
  {practice:"Before bed, mentally replay 3 good moments from today.",icon:"🌙",type:"Reflection"},
  {practice:"Write a fear. Then write the worst case, best case, and most likely case.",icon:"📓",type:"Journaling"},
  {practice:"Set an intention for tomorrow in one sentence.",icon:"🎯",type:"Intention"},
  {practice:"Write 'I am...' and list 5 positive truths about yourself.",icon:"✨",type:"Affirmation"},
  {practice:"Write one sentence about how you want to feel at the end of today.",icon:"🖊️",type:"Intention"},
  {practice:"Journal prompt: What am I avoiding? What would happen if I faced it?",icon:"📓",type:"Journaling"},
  {practice:"Write down something you learned today, no matter how small.",icon:"📝",type:"Reflection"},
  {practice:"List 3 things you'd tell your younger self. Then ask: am I following my own advice?",icon:"💬",type:"Reflection"},
  {practice:"Think of someone who helped you recently. Send them a thank-you message.",icon:"💌",type:"Connection"},
  {practice:"Hug someone for 20 seconds. It releases oxytocin and reduces stress.",icon:"🤗",type:"Connection"},
  {practice:"Call or text someone you haven't talked to in a while. Just to say hi.",icon:"📞",type:"Connection"},
  {practice:"Smile at 3 strangers today. Notice how it changes your energy.",icon:"😊",type:"Kindness"},
  {practice:"Text 3 people something you appreciate about them. No occasion needed.",icon:"💬",type:"Kindness"},
  {practice:"Do one kind thing for someone without telling anyone about it.",icon:"🌻",type:"Kindness"},
  {practice:"Imagine sending love to someone who is struggling right now.",icon:"💗",type:"Compassion"},
  {practice:"Compliment a stranger today. Make their day a little brighter.",icon:"😊",type:"Kindness"},
  {practice:"Hold the door for someone. Small courtesies ripple outward.",icon:"🚪",type:"Kindness"},
  {practice:"Write an encouraging note and leave it somewhere for a stranger to find.",icon:"📝",type:"Kindness"},
  {practice:"Body scan: Close eyes, notice tension from toes to head. Just observe, don't fix.",icon:"🧘",type:"Body Scan"},
  {practice:"Stretch for 5 minutes. Focus on how each stretch feels, not how far you go.",icon:"🤸",type:"Movement"},
  {practice:"Progressive relaxation: Tense each muscle group for 5 sec, then release.",icon:"💆",type:"Relaxation"},
  {practice:"Stand tall, arms wide for 2 minutes. Power poses reduce cortisol by 25%.",icon:"🦸",type:"Embodiment"},
  {practice:"Roll your shoulders back 10 times. Release tension you didn't know you had.",icon:"🔄",type:"Movement"},
  {practice:"Shake your whole body for 30 seconds. Animals do this to release stress.",icon:"🐕",type:"Movement"},
  {practice:"Yawn intentionally 5 times. It actually relaxes your jaw and face muscles.",icon:"🥱",type:"Relaxation"},
  {practice:"Do 10 slow squats. Focus on the sensation in your legs, not the count.",icon:"🏋️",type:"Movement"},
  {practice:"Massage your own hands for 2 minutes. Press into the palm, stretch each finger.",icon:"✋",type:"Self-care"},
  {practice:"Dance to one song. Full body, no judgment, just movement.",icon:"💃",type:"Movement"},
  {practice:"Eat your next meal slowly. Notice every texture and flavor.",icon:"🍽️",type:"Mindful Eating"},
  {practice:"Drink a full glass of water mindfully. Feel the temperature, the swallowing.",icon:"💧",type:"Mindful Moment"},
  {practice:"Put your phone down for 30 minutes. Notice how it feels.",icon:"📱",type:"Digital Detox"},
  {practice:"Wash your hands slowly. Feel the water, the soap, the temperature.",icon:"🫧",type:"Mindful Moment"},
  {practice:"Take the scenic route today. Choose beauty over speed.",icon:"🛤️",type:"Mindful Walk"},
  {practice:"Take a slow walk and notice 3 beautiful things you'd normally miss.",icon:"🚶",type:"Mindful Walk"},
  {practice:"Mindful tea or coffee: Feel the warmth of the cup. Smell it before sipping.",icon:"☕",type:"Mindful Moment"},
  {practice:"Eat one raisin in 2 minutes. Look at it, smell it, feel it, then taste it slowly.",icon:"🍇",type:"Mindful Eating"},
  {practice:"Brush your teeth with your non-dominant hand. Notice how different it feels.",icon:"🪥",type:"Awareness"},
  {practice:"Watch a sunset or sunrise without your phone. Just be present with it.",icon:"🌅",type:"Presence"},
  {practice:"Place hand on heart. Feel it beat. Whisper: I am here. I am enough.",icon:"❤️",type:"Self-compassion"},
  {practice:"Forgiveness exercise: Think of one grudge. Imagine setting it down gently.",icon:"🕊️",type:"Release"},
  {practice:"Give yourself permission to rest today without guilt.",icon:"🛋️",type:"Self-compassion"},
  {practice:"Practice saying 'no' to one thing today that drains your energy.",icon:"🚪",type:"Boundaries"},
  {practice:"Notice one thing you've been avoiding. Take the smallest possible step toward it.",icon:"🐾",type:"Courage"},
  {practice:"Write a compliment to yourself on a sticky note. Put it where you'll see it.",icon:"💛",type:"Affirmation"},
  {practice:"Treat yourself the way you'd treat your best friend having a hard day.",icon:"🤗",type:"Self-compassion"},
  {practice:"Let go of one 'should' today. Replace it with 'I choose to' or 'I choose not to.'",icon:"🎈",type:"Release"},
  {practice:"Acknowledge one mistake without judging yourself. Growth requires imperfection.",icon:"🌱",type:"Self-compassion"},
  {practice:"Tell yourself: 'I'm doing the best I can with what I have right now.'",icon:"💪",type:"Affirmation"},
  {practice:"Spend 10 minutes in sunlight. Feel the warmth on your skin.",icon:"☀️",type:"Nature"},
  {practice:"Spend 5 minutes decluttering one small space. Clear space = clearer mind.",icon:"🧹",type:"Environment"},
  {practice:"Spend 5 minutes watching clouds. Let your mind drift with them.",icon:"☁️",type:"Nature"},
  {practice:"Listen to rain (real or recorded) for 5 minutes. Just listen.",icon:"🌧️",type:"Nature"},
  {practice:"Touch a plant or tree. Notice the texture of leaves, bark, petals.",icon:"🌿",type:"Nature"},
  {practice:"Find a natural sound near you — birds, wind, water. Focus on it for 1 minute.",icon:"🐦",type:"Nature"},
  {practice:"Open a window. Let fresh air in. Breathe deeply.",icon:"🪟",type:"Environment"},
  {practice:"Look at the moon tonight. Remember how small we are and how vast everything is.",icon:"🌙",type:"Nature"},
  {practice:"Arrange fresh flowers or a plant in your space. Living things bring calm.",icon:"🌸",type:"Environment"},
  {practice:"Step outside. Feel the air on your skin. Name the temperature, the wind, the sounds.",icon:"🌎",type:"Nature"},
  {practice:"Draw or doodle for 5 minutes. No rules, no judgment.",icon:"🎨",type:"Creativity"},
  {practice:"Sing one song out loud. Even badly. Especially badly.",icon:"🎤",type:"Joy"},
  {practice:"Write a haiku (5-7-5 syllables) about this exact moment.",icon:"📝",type:"Creativity"},
  {practice:"Color a page in a coloring book. Stay in the lines or don't.",icon:"🖍️",type:"Creativity"},
  {practice:"Make something with your hands. Origami, clay, cooking — anything tactile.",icon:"🤲",type:"Creativity"},
  {practice:"Laugh on purpose for 30 seconds. Even fake laughter triggers real endorphins.",icon:"😂",type:"Joy"},
  {practice:"Take a different route on your daily walk. Novelty awakens awareness.",icon:"🗺️",type:"Adventure"},
  {practice:"Play with a pet, a child, or a toy. Unstructured play resets the brain.",icon:"🎮",type:"Joy"},
  {practice:"Look at old photos and relive one happy memory in detail.",icon:"📸",type:"Joy"},
  {practice:"Make a playlist of 5 songs that make you feel alive. Listen to it today.",icon:"🎵",type:"Joy"},
  {practice:"Visualize your ideal day from morning to night. Hold that feeling.",icon:"🌅",type:"Visualization"},
  {practice:"Imagine your stress as a color. Breathe it out and watch it dissolve.",icon:"🎨",type:"Visualization"},
  {practice:"Picture yourself in your favorite place. Engage all 5 senses in the imagination.",icon:"🏖️",type:"Visualization"},
  {practice:"Humming for 2 minutes stimulates the vagus nerve and reduces anxiety.",icon:"🐝",type:"Relaxation"},
  {practice:"Rub your earlobes gently for 30 seconds. Stimulates acupressure points for calm.",icon:"👂",type:"Relaxation"},
  {practice:"Place a warm cloth on your face for 1 minute. Activates the dive reflex and calms you.",icon:"🧖",type:"Relaxation"},
  {practice:"Progressive muscle relaxation: Start at your toes. Tense 5 seconds. Release. Work upward.",icon:"💆",type:"Relaxation"},
  {practice:"Splash cold water on your wrists and temples. Instant calm reset.",icon:"💦",type:"Grounding"},
  {practice:"Do 5 push-ups or 10 jumping jacks. Physical burst resets mental state.",icon:"💪",type:"Movement"},
  {practice:"Lie flat on the floor for 2 minutes. Feel gravity hold you. You don't need to hold yourself.",icon:"🧘",type:"Surrender"},
  {practice:"Choose a word for the day. Let it guide your intentions and actions.",icon:"📌",type:"Intention"},
  {practice:"Write 3 wishes for the world on a piece of paper. Fold it. Keep it.",icon:"🌍",type:"Compassion"},
  {practice:"Name 3 sounds, 3 sights, and 3 textures right now. Instant grounding.",icon:"🌿",type:"Grounding"},
  {practice:"Imagine placing each worry into a balloon and letting it float away.",icon:"🎈",type:"Release"},
  {practice:"Talk to yourself kindly. Replace 'I have to' with 'I get to.'",icon:"💛",type:"Self-compassion"},
  {practice:"Practice beginner's mind: approach a familiar task as if doing it for the first time.",icon:"🔰",type:"Awareness"},
  {practice:"Set phone to grayscale mode for an hour. Notice how it changes your relationship with it.",icon:"📱",type:"Digital Detox"},
  {practice:"Phone-free meal: Eat with full attention, no screens. Taste every bite.",icon:"🍽️",type:"Mindful Eating"},
  {practice:"Write a poem about this moment. It doesn't need to be good. Just honest.",icon:"📝",type:"Creativity"},
  {practice:"Find one thing to admire in every person you interact with today.",icon:"👁️",type:"Kindness"},
  {practice:"Read one page of a book with full attention. No skimming.",icon:"📖",type:"Focus"},
  {practice:"Cup of calm: Hold a warm drink with both hands. Close your eyes. Breathe the steam.",icon:"☕",type:"Mindful Moment"},
  {practice:"Mountain meditation: Sit tall. Imagine yourself as a mountain — solid, still, present.",icon:"⛰️",type:"Meditation"},
  {practice:"RAIN technique: Recognize, Allow, Investigate, Nurture. Apply to any difficult emotion.",icon:"🌧️",type:"Emotional Awareness"},
  {practice:"Self-compassion break: 'This is a moment of suffering. Suffering is part of life. May I be kind to myself.'",icon:"❤️",type:"Self-compassion"},
  {practice:"Leaf on a stream: Imagine placing each thought on a leaf and watching it float downstream.",icon:"🍂",type:"Meditation"},
  {practice:"Three breaths practice: Before any activity, take three conscious breaths.",icon:"🌬️",type:"Breathing"},
  {practice:"Gratitude meditation: With each breath, silently say 'thank you.'",icon:"🙏",type:"Meditation"},
  {practice:"Body gratitude: Thank each body part for what it does for you. Legs for walking, eyes for seeing.",icon:"🫀",type:"Gratitude"},
  {practice:"Non-judgment practice: For 10 minutes, observe without labeling anything good or bad.",icon:"⚖️",type:"Awareness"},
  {practice:"Digital sunset: No screens 30 minutes before bed. Read, stretch, or journal instead.",icon:"🌅",type:"Digital Detox"},
  {practice:"Savoring practice: Eat one piece of chocolate or fruit as slowly as possible.",icon:"🍫",type:"Mindful Eating"},
  {practice:"Peace inventory: What's peaceful in your life right now? Name 3 things.",icon:"☮️",type:"Reflection"},
  {practice:"Mindful showering: Feel every drop of water. Notice temperature changes. Be fully there.",icon:"🚿",type:"Mindful Moment"},
  {practice:"Peripheral vision exercise: Soften your gaze and notice what's at the edges. Calms the nervous system.",icon:"👀",type:"Awareness"},
  {practice:"Compassion meditation: 'May all beings be happy. May all beings be free from suffering.'",icon:"🕊️",type:"Meditation"},
  {practice:"Joy practice: Remember the last time you laughed hard. Relive it in detail.",icon:"😂",type:"Joy"},
  {practice:"Acceptance moment: Say 'This is how it is right now.' No resistance, no judgment.",icon:"🪷",type:"Acceptance"},
  {practice:"Future self visualization: See yourself in 5 years, happy and healthy. What did you do to get there?",icon:"🔮",type:"Visualization"},
  {practice:"Breath as anchor: Every time you notice stress, return to one conscious breath.",icon:"⚓",type:"Breathing"},
  {practice:"Mindful listening: In your next conversation, listen without planning your response.",icon:"👂",type:"Connection"},
  {practice:"Sacred pause: Before reacting to anything, pause for one breath.",icon:"⏸️",type:"Pause"},
  {practice:"Tiny meditation: Close your eyes for just 30 seconds between tasks. Mini-reset.",icon:"⏱️",type:"Meditation"},
  {practice:"Sunrise intention: As you wake, set one word for how you want to feel today.",icon:"🌅",type:"Intention"},
  {practice:"Evening review: What went well today? What would I do differently? What am I grateful for?",icon:"🌙",type:"Reflection"},
  {practice:"Cloud watching: Lie on your back and watch clouds for 5 minutes. Pure presence.",icon:"☁️",type:"Presence"},
  {practice:"Barefoot grounding: Stand barefoot on earth for 2 minutes. Feel the connection.",icon:"🦶",type:"Grounding"},
  {practice:"Mindful transitions: When moving between activities, take one conscious breath.",icon:"🚪",type:"Awareness"},
  {practice:"Softening practice: Notice where you're holding tension. Send a mental 'soften' to that area.",icon:"🧘",type:"Body Scan"},
  {practice:"Compassion for a stranger: Look at someone and silently wish them well.",icon:"💗",type:"Compassion"},
  {practice:"Mindful waiting: When in a line or on hold, practice being present instead of frustrated.",icon:"⏳",type:"Patience"},
  {practice:"Sky gazing: Look up. The sky is always there, always changing, always vast.",icon:"🌌",type:"Presence"},
  {practice:"Appreciation practice: Find something ordinary and discover 3 extraordinary things about it.",icon:"🔍",type:"Awareness"},
  {practice:"Forgiveness breath: Breathe in compassion, breathe out resentment. 5 rounds.",icon:"🕊️",type:"Release"},
  {practice:"Self-hug: Cross your arms and hold your shoulders. Squeeze gently. You're safe.",icon:"🤗",type:"Self-compassion"},
  {practice:"Wonder practice: Look at something familiar with the eyes of a child seeing it for the first time.",icon:"👶",type:"Awareness"},
  {practice:"Mindful cleaning: Wash one dish with full attention. Feel the water, the soap, the clean.",icon:"🍽️",type:"Mindful Moment"},
  {practice:"Evening wind-down: 10 minutes before bed, dim lights and do nothing productive.",icon:"🌙",type:"Sleep"},
  {practice:"Stillness challenge: How long can you sit perfectly still? No fidgeting. Just being.",icon:"🪨",type:"Stillness"},
  {practice:"One-breath reset: Whenever overwhelmed, stop. Take one enormous breath. Continue.",icon:"🌬️",type:"Breathing"},
];

const BOOKS=[
  {title:"Atomic Habits",author:"James Clear",why:"Tiny changes → remarkable results",cat:"Habits"},
  {title:"The Power of Habit",author:"Charles Duhigg",why:"Why we do what we do and how to change it",cat:"Habits"},
  {title:"The Compound Effect",author:"Darren Hardy",why:"Small smart choices + consistency = radical results",cat:"Habits"},
  {title:"The 5 AM Club",author:"Robin Sharma",why:"Own your morning, elevate your life",cat:"Habits"},
  {title:"Better Than Before",author:"Gretchen Rubin",why:"What I learned about making and breaking habits",cat:"Habits"},
  {title:"Mini Habits",author:"Stephen Guise",why:"Smaller habits, bigger results",cat:"Habits"},
  {title:"The Slight Edge",author:"Jeff Olson",why:"Simple daily disciplines that lead to success",cat:"Habits"},
  {title:"Elastic Habits",author:"Stephen Guise",why:"Flexible habits that adapt to your energy",cat:"Habits"},
  {title:"Habit Stacking",author:"S.J. Scott",why:"97 small changes that take 5 minutes or less",cat:"Habits"},
  {title:"Make Your Bed",author:"William McRaven",why:"Small things that can change your life",cat:"Habits"},
  {title:"Thinking, Fast and Slow",author:"Daniel Kahneman",why:"How your brain actually makes decisions",cat:"Psychology"},
  {title:"Influence",author:"Robert Cialdini",why:"The psychology of persuasion",cat:"Psychology"},
  {title:"Predictably Irrational",author:"Dan Ariely",why:"Hidden forces that shape our decisions",cat:"Psychology"},
  {title:"Quiet",author:"Susan Cain",why:"Introverts have superpowers too",cat:"Psychology"},
  {title:"Mindset",author:"Carol Dweck",why:"Growth mindset changes everything",cat:"Psychology"},
  {title:"Grit",author:"Angela Duckworth",why:"Passion + perseverance > talent",cat:"Psychology"},
  {title:"Flow",author:"Mihaly Csikszentmihalyi",why:"Psychology of optimal experience",cat:"Psychology"},
  {title:"Emotional Intelligence",author:"Daniel Goleman",why:"EQ matters more than IQ",cat:"Psychology"},
  {title:"The Righteous Mind",author:"Jonathan Haidt",why:"Why good people disagree on politics",cat:"Psychology"},
  {title:"Stumbling on Happiness",author:"Daniel Gilbert",why:"We're bad at predicting what makes us happy",cat:"Psychology"},
  {title:"The Paradox of Choice",author:"Barry Schwartz",why:"More choice makes us less happy",cat:"Psychology"},
  {title:"Drive",author:"Daniel Pink",why:"The surprising truth about motivation",cat:"Psychology"},
  {title:"Blink",author:"Malcolm Gladwell",why:"The power of thinking without thinking",cat:"Psychology"},
  {title:"Outliers",author:"Malcolm Gladwell",why:"Success = talent + timing + practice",cat:"Psychology"},
  {title:"Tipping Point",author:"Malcolm Gladwell",why:"How little things make a big difference",cat:"Psychology"},
  {title:"David and Goliath",author:"Malcolm Gladwell",why:"Underdogs and the art of battling giants",cat:"Psychology"},
  {title:"Talking to Strangers",author:"Malcolm Gladwell",why:"Why we misunderstand unknown people",cat:"Psychology"},
  {title:"Thinking in Bets",author:"Annie Duke",why:"Smarter decisions with incomplete info",cat:"Psychology"},
  {title:"Noise",author:"Daniel Kahneman",why:"A flaw in human judgment",cat:"Psychology"},
  {title:"Behave",author:"Robert Sapolsky",why:"Why humans do what we do",cat:"Psychology"},
  {title:"The Social Animal",author:"David Brooks",why:"The hidden sources of love and achievement",cat:"Psychology"},
  {title:"The Man Who Mistook His Wife for a Hat",author:"Oliver Sacks",why:"Bizarre neurological case studies",cat:"Psychology"},
  {title:"Attached",author:"Amir Levine",why:"How attachment style shapes your love life",cat:"Psychology"},
  {title:"Maybe You Should Talk to Someone",author:"Lori Gottlieb",why:"A therapist goes to therapy",cat:"Psychology"},
  {title:"The Body Keeps the Score",author:"Bessel van der Kolk",why:"How trauma shapes us and how to heal",cat:"Psychology"},
  {title:"Lost Connections",author:"Johann Hari",why:"Uncovering real causes of depression",cat:"Psychology"},
  {title:"Dopamine Nation",author:"Anna Lembke",why:"Finding balance in the age of indulgence",cat:"Psychology"},
  {title:"Social Intelligence",author:"Daniel Goleman",why:"The science of human relationships",cat:"Psychology"},
  {title:"Coddling of the American Mind",author:"Jonathan Haidt",why:"How overprotection harms young people",cat:"Psychology"},
  {title:"The Happiness Hypothesis",author:"Jonathan Haidt",why:"Ancient wisdom meets modern psychology",cat:"Psychology"},
  {title:"Meditations",author:"Marcus Aurelius",why:"2000-year-old wisdom that still hits hard",cat:"Philosophy"},
  {title:"Man's Search for Meaning",author:"Viktor Frankl",why:"Finding purpose in the darkest times",cat:"Philosophy"},
  {title:"The Obstacle Is the Way",author:"Ryan Holiday",why:"Turn trials into triumph",cat:"Philosophy"},
  {title:"Ego Is the Enemy",author:"Ryan Holiday",why:"Your biggest obstacle is yourself",cat:"Philosophy"},
  {title:"Stillness Is the Key",author:"Ryan Holiday",why:"In a noisy world, stillness is power",cat:"Philosophy"},
  {title:"The Daily Stoic",author:"Ryan Holiday",why:"366 days of Stoic meditations",cat:"Philosophy"},
  {title:"The Art of War",author:"Sun Tzu",why:"Ancient strategy for everything",cat:"Philosophy"},
  {title:"Antifragile",author:"Nassim Taleb",why:"Things that gain from disorder",cat:"Philosophy"},
  {title:"Fooled by Randomness",author:"Nassim Taleb",why:"Chance rules more than we admit",cat:"Philosophy"},
  {title:"The Courage to Be Disliked",author:"Ichiro Kishimi",why:"Adlerian psychology for modern freedom",cat:"Philosophy"},
  {title:"Four Thousand Weeks",author:"Oliver Burkeman",why:"Time management for mortals",cat:"Philosophy"},
  {title:"The Art of Happiness",author:"Dalai Lama",why:"A practical guide to joy",cat:"Philosophy"},
  {title:"Letters from a Stoic",author:"Seneca",why:"Timeless advice from ancient Rome",cat:"Philosophy"},
  {title:"The Tao of Pooh",author:"Benjamin Hoff",why:"Eastern philosophy through Winnie the Pooh",cat:"Philosophy"},
  {title:"Zen and the Art of Motorcycle Maintenance",author:"Robert Pirsig",why:"A philosophical road trip about quality",cat:"Philosophy"},
  {title:"The Prophet",author:"Kahlil Gibran",why:"Poetic wisdom on love, work, and freedom",cat:"Philosophy"},
  {title:"Amusing Ourselves to Death",author:"Neil Postman",why:"Entertainment eroding public discourse",cat:"Philosophy"},
  {title:"Sophie's World",author:"Jostein Gaarder",why:"History of philosophy as a novel",cat:"Philosophy"},
  {title:"The Republic",author:"Plato",why:"The foundation of Western philosophy",cat:"Philosophy"},
  {title:"Thus Spoke Zarathustra",author:"Friedrich Nietzsche",why:"Profound and challenging — the overman concept",cat:"Philosophy"},
  {title:"The Psychology of Money",author:"Morgan Housel",why:"Wealth is what you don't see",cat:"Finance"},
  {title:"Rich Dad Poor Dad",author:"Robert Kiyosaki",why:"Assets vs liabilities basics",cat:"Finance"},
  {title:"The Richest Man in Babylon",author:"George S. Clason",why:"Ancient money wisdom as stories",cat:"Finance"},
  {title:"The Millionaire Next Door",author:"Thomas Stanley",why:"Real millionaires don't look like you think",cat:"Finance"},
  {title:"A Random Walk Down Wall Street",author:"Burton Malkiel",why:"The case for index investing",cat:"Finance"},
  {title:"The Intelligent Investor",author:"Benjamin Graham",why:"The bible of value investing",cat:"Finance"},
  {title:"I Will Teach You to Be Rich",author:"Ramit Sethi",why:"No-guilt money management for millennials",cat:"Finance"},
  {title:"Your Money or Your Life",author:"Vicki Robin",why:"Transform your relationship with money",cat:"Finance"},
  {title:"The Simple Path to Wealth",author:"JL Collins",why:"Financial independence made simple",cat:"Finance"},
  {title:"Total Money Makeover",author:"Dave Ramsey",why:"Baby steps to financial peace",cat:"Finance"},
  {title:"The Little Book of Common Sense Investing",author:"John Bogle",why:"The only way to guarantee your fair share",cat:"Finance"},
  {title:"Think and Grow Rich",author:"Napoleon Hill",why:"The classic on wealth mindset",cat:"Finance"},
  {title:"The Bogleheads' Guide to Investing",author:"Taylor Larimore",why:"Simple, low-cost investing philosophy",cat:"Finance"},
  {title:"Die with Zero",author:"Bill Perkins",why:"Getting all you can from your money and life",cat:"Finance"},
  {title:"Set for Life",author:"Scott Trench",why:"Financial independence before 30",cat:"Finance"},
  {title:"Good to Great",author:"Jim Collins",why:"What makes companies exceptional",cat:"Business"},
  {title:"The Lean Startup",author:"Eric Ries",why:"Build, measure, learn — faster",cat:"Business"},
  {title:"Zero to One",author:"Peter Thiel",why:"Build something the world hasn't seen",cat:"Business"},
  {title:"Start with Why",author:"Simon Sinek",why:"Great leaders inspire, not command",cat:"Leadership"},
  {title:"Extreme Ownership",author:"Jocko Willink",why:"Navy SEAL leadership for everyday life",cat:"Leadership"},
  {title:"The 7 Habits of Highly Effective People",author:"Stephen Covey",why:"Timeless principles for growth",cat:"Leadership"},
  {title:"Principles",author:"Ray Dalio",why:"Life and work principles from a billionaire",cat:"Business"},
  {title:"The Hard Thing About Hard Things",author:"Ben Horowitz",why:"Real talk about building a business",cat:"Business"},
  {title:"Creativity, Inc.",author:"Ed Catmull",why:"How Pixar built creative brilliance",cat:"Business"},
  {title:"Unreasonable Hospitality",author:"Will Guidara",why:"The power of going above and beyond",cat:"Business"},
  {title:"The Innovator's Dilemma",author:"Clayton Christensen",why:"Why great companies fail",cat:"Business"},
  {title:"Shoe Dog",author:"Phil Knight",why:"Nike's wild origin story",cat:"Business"},
  {title:"The Ride of a Lifetime",author:"Bob Iger",why:"Lessons from Disney's CEO",cat:"Business"},
  {title:"Bad Blood",author:"John Carreyrou",why:"The Theranos scandal — gripping journalism",cat:"Business"},
  {title:"Dare to Lead",author:"Brené Brown",why:"Brave work, tough conversations, whole hearts",cat:"Leadership"},
  {title:"Leaders Eat Last",author:"Simon Sinek",why:"Why some teams pull together",cat:"Leadership"},
  {title:"Turn the Ship Around!",author:"L. David Marquet",why:"True story of turning followers into leaders",cat:"Leadership"},
  {title:"The Five Dysfunctions of a Team",author:"Patrick Lencioni",why:"Why teams fail and how to fix them",cat:"Leadership"},
  {title:"Multipliers",author:"Liz Wiseman",why:"How the best leaders make everyone smarter",cat:"Leadership"},
  {title:"Building a StoryBrand",author:"Donald Miller",why:"Clarify your message so people listen",cat:"Business"},
  {title:"Deep Work",author:"Cal Newport",why:"Focus is the new superpower",cat:"Productivity"},
  {title:"Essentialism",author:"Greg McKeown",why:"The disciplined pursuit of less",cat:"Productivity"},
  {title:"Getting Things Done",author:"David Allen",why:"The art of stress-free productivity",cat:"Productivity"},
  {title:"So Good They Can't Ignore You",author:"Cal Newport",why:"Skills beat passion for career satisfaction",cat:"Productivity"},
  {title:"Digital Minimalism",author:"Cal Newport",why:"Reclaim attention from your phone",cat:"Productivity"},
  {title:"Stolen Focus",author:"Johann Hari",why:"Why you can't pay attention anymore",cat:"Productivity"},
  {title:"When",author:"Daniel Pink",why:"Scientific secrets of perfect timing",cat:"Productivity"},
  {title:"The War of Art",author:"Steven Pressfield",why:"Beating procrastination and doing the work",cat:"Productivity"},
  {title:"Range",author:"David Epstein",why:"Generalists triumph in a specialized world",cat:"Productivity"},
  {title:"Indistractable",author:"Nir Eyal",why:"How to control your attention",cat:"Productivity"},
  {title:"Make Time",author:"Jake Knapp",why:"Focus on what matters every day",cat:"Productivity"},
  {title:"The ONE Thing",author:"Gary Keller",why:"What's the one thing that makes everything easier?",cat:"Productivity"},
  {title:"Eat That Frog!",author:"Brian Tracy",why:"21 ways to stop procrastinating",cat:"Productivity"},
  {title:"Sprint",author:"Jake Knapp",why:"Solve big problems in just 5 days",cat:"Productivity"},
  {title:"Tools of Titans",author:"Tim Ferriss",why:"Tactics from world-class performers",cat:"Productivity"},
  {title:"Sapiens",author:"Yuval Noah Harari",why:"The full story of humanity",cat:"Science"},
  {title:"Homo Deus",author:"Yuval Noah Harari",why:"The future of humanity",cat:"Science"},
  {title:"A Brief History of Time",author:"Stephen Hawking",why:"The universe explained for curious minds",cat:"Science"},
  {title:"Cosmos",author:"Carl Sagan",why:"A poetic journey through the universe",cat:"Science"},
  {title:"Why We Sleep",author:"Matthew Walker",why:"Sleep is the most underrated health tool",cat:"Science"},
  {title:"Breath",author:"James Nestor",why:"You're probably breathing wrong",cat:"Science"},
  {title:"The Selfish Gene",author:"Richard Dawkins",why:"Evolution from the gene's view",cat:"Science"},
  {title:"The Code Breaker",author:"Walter Isaacson",why:"Gene editing and the future of humanity",cat:"Science"},
  {title:"Thinking in Systems",author:"Donella Meadows",why:"See the world as interconnected systems",cat:"Science"},
  {title:"Factfulness",author:"Hans Rosling",why:"The world is better than you think",cat:"Science"},
  {title:"Lifespan",author:"David Sinclair",why:"Why we age and why we don't have to",cat:"Science"},
  {title:"Algorithms to Live By",author:"Brian Christian",why:"Computer science for human decisions",cat:"Science"},
  {title:"The Elegant Universe",author:"Brian Greene",why:"String theory and the fabric of reality",cat:"Science"},
  {title:"Astrophysics for People in a Hurry",author:"Neil deGrasse Tyson",why:"The universe in bite-sized chapters",cat:"Science"},
  {title:"The Gene",author:"Siddhartha Mukherjee",why:"An intimate history of genetics",cat:"Science"},
  {title:"Outlive",author:"Peter Attia",why:"The science and art of longevity",cat:"Science"},
  {title:"The Emperor of All Maladies",author:"Siddhartha Mukherjee",why:"A biography of cancer",cat:"Science"},
  {title:"The Immortal Life of Henrietta Lacks",author:"Rebecca Skloot",why:"One woman's cells changed medicine forever",cat:"Science"},
  {title:"Guns, Germs, and Steel",author:"Jared Diamond",why:"Why civilizations conquered others",cat:"Science"},
  {title:"Entangled Life",author:"Merlin Sheldrake",why:"How fungi shape our world",cat:"Science"},
  {title:"Born to Run",author:"Christopher McDougall",why:"The hidden tribe of super-runners",cat:"Health"},
  {title:"In Defense of Food",author:"Michael Pollan",why:"Eat food. Not too much. Mostly plants.",cat:"Health"},
  {title:"The Omnivore's Dilemma",author:"Michael Pollan",why:"Where does our food come from?",cat:"Health"},
  {title:"Ikigai",author:"Héctor García",why:"The Japanese secret to a long life",cat:"Health"},
  {title:"Scattered Minds",author:"Gabor Maté",why:"ADHD from a compassionate perspective",cat:"Health"},
  {title:"How Not to Die",author:"Michael Greger",why:"Foods that prevent disease",cat:"Health"},
  {title:"The Circadian Code",author:"Satchin Panda",why:"Optimize health with body clock science",cat:"Health"},
  {title:"Spark",author:"John Ratey",why:"Exercise is the best medicine for the brain",cat:"Health"},
  {title:"Why Zebras Don't Get Ulcers",author:"Robert Sapolsky",why:"The science of stress and how to beat it",cat:"Health"},
  {title:"The 4-Hour Body",author:"Tim Ferriss",why:"Uncommon approaches to rapid body recomposition",cat:"Health"},
  {title:"The Power of Now",author:"Eckhart Tolle",why:"Stop living in your head",cat:"Mindfulness"},
  {title:"Radical Acceptance",author:"Tara Brach",why:"Embracing life with the heart of a Buddha",cat:"Mindfulness"},
  {title:"Wherever You Go, There You Are",author:"Jon Kabat-Zinn",why:"Mindfulness meditation for everyday life",cat:"Mindfulness"},
  {title:"The Untethered Soul",author:"Michael Singer",why:"The journey beyond yourself",cat:"Mindfulness"},
  {title:"The Miracle of Mindfulness",author:"Thich Nhat Hanh",why:"Introduction to meditation practice",cat:"Mindfulness"},
  {title:"Peace Is Every Step",author:"Thich Nhat Hanh",why:"Mindfulness in everyday life",cat:"Mindfulness"},
  {title:"Waking Up",author:"Sam Harris",why:"Spirituality without religion",cat:"Mindfulness"},
  {title:"10% Happier",author:"Dan Harris",why:"A skeptic's guide to meditation",cat:"Mindfulness"},
  {title:"The Book of Joy",author:"Dalai Lama & Desmond Tutu",why:"Two spiritual masters on finding lasting happiness",cat:"Mindfulness"},
  {title:"When Things Fall Apart",author:"Pema Chödrön",why:"Heart advice for difficult times",cat:"Mindfulness"},
  {title:"How to Win Friends and Influence People",author:"Dale Carnegie",why:"The original social skills playbook",cat:"Communication"},
  {title:"Crucial Conversations",author:"Kerry Patterson",why:"Tools for when stakes are high",cat:"Communication"},
  {title:"Never Split the Difference",author:"Chris Voss",why:"FBI negotiation for everyday life",cat:"Communication"},
  {title:"Nonviolent Communication",author:"Marshall Rosenberg",why:"Speak and listen with compassion",cat:"Communication"},
  {title:"Storyworthy",author:"Matthew Dicks",why:"Become a master storyteller",cat:"Communication"},
  {title:"The Charisma Myth",author:"Olivia Fox Cabane",why:"Charisma is a learnable skill",cat:"Communication"},
  {title:"The Five Love Languages",author:"Gary Chapman",why:"How people give and receive love",cat:"Relationships"},
  {title:"Hold Me Tight",author:"Sue Johnson",why:"Conversations for a lifetime of love",cat:"Relationships"},
  {title:"Mating in Captivity",author:"Esther Perel",why:"Reconciling the erotic and the domestic",cat:"Relationships"},
  {title:"The Seven Principles for Making Marriage Work",author:"John Gottman",why:"Science-backed relationship advice",cat:"Relationships"},
  {title:"Steal Like an Artist",author:"Austin Kleon",why:"Creativity is borrowed and remixed",cat:"Creativity"},
  {title:"The Creative Act",author:"Rick Rubin",why:"A way of being from the legendary producer",cat:"Creativity"},
  {title:"Big Magic",author:"Elizabeth Gilbert",why:"Creative living beyond fear",cat:"Creativity"},
  {title:"Show Your Work!",author:"Austin Kleon",why:"10 ways to share your creativity",cat:"Creativity"},
  {title:"On Writing",author:"Stephen King",why:"Half memoir, half masterclass",cat:"Writing"},
  {title:"Bird by Bird",author:"Anne Lamott",why:"Instructions on writing and life",cat:"Writing"},
  {title:"The Elements of Style",author:"Strunk & White",why:"Classic guide to clear writing",cat:"Writing"},
  {title:"Writing Down the Bones",author:"Natalie Goldberg",why:"Freeing the writer within",cat:"Writing"},
  {title:"The Artist's Way",author:"Julia Cameron",why:"A spiritual path to higher creativity",cat:"Creativity"},
  {title:"Imagine",author:"Jonah Lehrer",why:"How creativity works in the brain",cat:"Creativity"},
  {title:"Team of Rivals",author:"Doris Kearns Goodwin",why:"Lincoln's genius for leadership",cat:"History"},
  {title:"The Wright Brothers",author:"David McCullough",why:"The incredible true story of flight",cat:"History"},
  {title:"Caste",author:"Isabel Wilkerson",why:"Origins of our discontents",cat:"History"},
  {title:"1491",author:"Charles C. Mann",why:"The Americas before Columbus",cat:"History"},
  {title:"A People's History of the United States",author:"Howard Zinn",why:"History from the bottom up",cat:"History"},
  {title:"The Silk Roads",author:"Peter Frankopan",why:"A new history of the world",cat:"History"},
  {title:"SPQR",author:"Mary Beard",why:"A history of ancient Rome",cat:"History"},
  {title:"Educated",author:"Tara Westover",why:"The power of learning against all odds",cat:"Memoir"},
  {title:"Born a Crime",author:"Trevor Noah",why:"Hilarious, heartbreaking memoir",cat:"Memoir"},
  {title:"The Alchemist",author:"Paulo Coelho",why:"Follow your personal legend",cat:"Fiction"},
  {title:"Siddhartha",author:"Hermann Hesse",why:"Timeless self-discovery journey",cat:"Fiction"},
  {title:"1984",author:"George Orwell",why:"Dystopia more relevant than ever",cat:"Fiction"},
  {title:"Brave New World",author:"Aldous Huxley",why:"A pleasure-numbed society",cat:"Fiction"},
  {title:"To Kill a Mockingbird",author:"Harper Lee",why:"Justice and the loss of innocence",cat:"Fiction"},
  {title:"The Great Gatsby",author:"F. Scott Fitzgerald",why:"The American Dream's hollow promise",cat:"Fiction"},
  {title:"One Hundred Years of Solitude",author:"Gabriel García Márquez",why:"Magical realism at its finest",cat:"Fiction"},
  {title:"East of Eden",author:"John Steinbeck",why:"Good vs evil in California",cat:"Fiction"},
  {title:"Crime and Punishment",author:"Fyodor Dostoevsky",why:"Psychology of guilt and redemption",cat:"Fiction"},
  {title:"Slaughterhouse-Five",author:"Kurt Vonnegut",why:"War, time, and absurdity",cat:"Fiction"},
  {title:"Fahrenheit 451",author:"Ray Bradbury",why:"A world where books are banned",cat:"Fiction"},
  {title:"The Hitchhiker's Guide to the Galaxy",author:"Douglas Adams",why:"The answer is 42",cat:"Fiction"},
  {title:"Flowers for Algernon",author:"Daniel Keyes",why:"Heartbreaking and beautiful",cat:"Fiction"},
  {title:"Dune",author:"Frank Herbert",why:"Sci-fi masterpiece of power and ecology",cat:"Fiction"},
  {title:"Ender's Game",author:"Orson Scott Card",why:"Child genius trained to save humanity",cat:"Fiction"},
  {title:"The Name of the Wind",author:"Patrick Rothfuss",why:"Epic fantasy — a hero tells his story",cat:"Fiction"},
  {title:"The Martian",author:"Andy Weir",why:"Science, humor, survival on Mars",cat:"Fiction"},
  {title:"Project Hail Mary",author:"Andy Weir",why:"A lone astronaut must save Earth",cat:"Fiction"},
  {title:"Never Let Me Go",author:"Kazuo Ishiguro",why:"Haunting — what does it mean to be human?",cat:"Fiction"},
  {title:"Klara and the Sun",author:"Kazuo Ishiguro",why:"An AI's view on love and sacrifice",cat:"Fiction"},
  {title:"Circe",author:"Madeline Miller",why:"Greek mythology through the witch's eyes",cat:"Fiction"},
  {title:"The Song of Achilles",author:"Madeline Miller",why:"Love and heroism in ancient Greece",cat:"Fiction"},
  {title:"Piranesi",author:"Susanna Clarke",why:"Strange, beautiful labyrinth of a novel",cat:"Fiction"},
  {title:"All the Light We Cannot See",author:"Anthony Doerr",why:"WWII through two remarkable lives",cat:"Fiction"},
  {title:"Station Eleven",author:"Emily St. John Mandel",why:"Art after the end of the world",cat:"Fiction"},
  {title:"The Road",author:"Cormac McCarthy",why:"Father and son in post-apocalypse",cat:"Fiction"},
  {title:"The Midnight Library",author:"Matt Haig",why:"What if you could try every life?",cat:"Fiction"},
  {title:"Normal People",author:"Sally Rooney",why:"Love and class in modern Ireland",cat:"Fiction"},
  {title:"Lessons in Chemistry",author:"Bonnie Garmus",why:"A 1960s chemist fights for equality",cat:"Fiction"},
  {title:"Tomorrow, and Tomorrow, and Tomorrow",author:"Gabrielle Zevin",why:"Friendship and game design across decades",cat:"Fiction"},
  {title:"Anxious People",author:"Fredrik Backman",why:"Hilarious, tender — about being human",cat:"Fiction"},
  {title:"A Man Called Ove",author:"Fredrik Backman",why:"A grumpy old man with a heart of gold",cat:"Fiction"},
  {title:"The Kite Runner",author:"Khaled Hosseini",why:"Friendship, betrayal, and redemption",cat:"Fiction"},
  {title:"A Thousand Splendid Suns",author:"Khaled Hosseini",why:"Two women's strength in war-torn Afghanistan",cat:"Fiction"},
  {title:"The Book Thief",author:"Markus Zusak",why:"Death narrates a story about words and survival",cat:"Fiction"},
  {title:"Life of Pi",author:"Yann Martel",why:"A boy, a tiger, and a lifeboat — pure wonder",cat:"Fiction"},
  {title:"The Goldfinch",author:"Donna Tartt",why:"Loss, art, and the things that save us",cat:"Fiction"},
  {title:"The Secret History",author:"Donna Tartt",why:"A murder among elite college students",cat:"Fiction"},
  {title:"Norwegian Wood",author:"Haruki Murakami",why:"Love, loss, and growing up in 1960s Japan",cat:"Fiction"},
  {title:"Kafka on the Shore",author:"Haruki Murakami",why:"Surreal, beautiful, unforgettable",cat:"Fiction"},
  {title:"The Wind-Up Bird Chronicle",author:"Haruki Murakami",why:"A man's surreal search for his missing cat",cat:"Fiction"},
  {title:"Beloved",author:"Toni Morrison",why:"The haunting legacy of slavery",cat:"Fiction"},
  {title:"Song of Solomon",author:"Toni Morrison",why:"A man's journey to discover his heritage",cat:"Fiction"},
  {title:"The Color Purple",author:"Alice Walker",why:"Strength and resilience against oppression",cat:"Fiction"},
  {title:"Catch-22",author:"Joseph Heller",why:"The absurdity of war — darkly funny",cat:"Fiction"},
  {title:"The Handmaid's Tale",author:"Margaret Atwood",why:"A dystopia that feels terrifyingly possible",cat:"Fiction"},
  {title:"Cloud Atlas",author:"David Mitchell",why:"Six interlocking stories across centuries",cat:"Fiction"},
  {title:"The Remains of the Day",author:"Kazuo Ishiguro",why:"A butler's quiet, devastating regrets",cat:"Fiction"},
  {title:"Pachinko",author:"Min Jin Lee",why:"Four generations of a Korean family in Japan",cat:"Fiction"},
  {title:"Where the Crawdads Sing",author:"Delia Owens",why:"Mystery, nature, and isolation",cat:"Fiction"},
  {title:"The Nightingale",author:"Kristin Hannah",why:"Two sisters in WWII France",cat:"Fiction"},
  {title:"The Invisible Life of Addie LaRue",author:"V.E. Schwab",why:"300 years of being forgotten by everyone you meet",cat:"Fiction"},
  {title:"The House in the Cerulean Sea",author:"TJ Klune",why:"Warm, magical, found family story",cat:"Fiction"},
  {title:"Recursion",author:"Blake Crouch",why:"Memory, identity, and reality-bending thriller",cat:"Fiction"},
  {title:"Dark Matter",author:"Blake Crouch",why:"What if you could live a different life?",cat:"Fiction"},
  {title:"The Seven Husbands of Evelyn Hugo",author:"Taylor Jenkins Reid",why:"Old Hollywood glamour and hidden truths",cat:"Fiction"},
  {title:"Daisy Jones & The Six",author:"Taylor Jenkins Reid",why:"A rock band's rise and spectacular fall",cat:"Fiction"},
  {title:"Malibu Rising",author:"Taylor Jenkins Reid",why:"One epic party, four siblings, buried secrets",cat:"Fiction"},
  {title:"The Overstory",author:"Richard Powers",why:"Trees, humans, and interconnected lives",cat:"Fiction"},
  {title:"Can't Hurt Me",author:"David Goggins",why:"Raw, extreme mental toughness",cat:"Memoir"},
  {title:"Greenlights",author:"Matthew McConaughey",why:"Catching green lights through life",cat:"Memoir"},
  {title:"Becoming",author:"Michelle Obama",why:"An intimate and inspiring memoir",cat:"Memoir"},
  {title:"When Breath Becomes Air",author:"Paul Kalanithi",why:"A neurosurgeon faces mortality",cat:"Memoir"},
  {title:"Kitchen Confidential",author:"Anthony Bourdain",why:"The wild underbelly of restaurants",cat:"Memoir"},
  {title:"Wild",author:"Cheryl Strayed",why:"Finding yourself on the Pacific Crest Trail",cat:"Memoir"},
  {title:"The Glass Castle",author:"Jeannette Walls",why:"A remarkable memoir of resilience",cat:"Memoir"},
  {title:"Permanent Record",author:"Edward Snowden",why:"One man's fight for digital privacy",cat:"Memoir"},
  {title:"Tiny Beautiful Things",author:"Cheryl Strayed",why:"Advice on life that hits hard",cat:"Memoir"},
  {title:"Long Walk to Freedom",author:"Nelson Mandela",why:"A leader's journey from prison to presidency",cat:"Memoir"},
  {title:"The Autobiography of Malcolm X",author:"Malcolm X",why:"A transformation story for the ages",cat:"Memoir"},
  {title:"Open",author:"Andre Agassi",why:"A tennis legend who hated tennis",cat:"Memoir"},
  {title:"Know My Name",author:"Chanel Miller",why:"Powerful memoir of trauma and reclaiming identity",cat:"Memoir"},
  {title:"Crying in H Mart",author:"Michelle Zauner",why:"Grief, identity, and Korean food",cat:"Memoir"},
  {title:"Just Kids",author:"Patti Smith",why:"A beautiful love letter to art and youth",cat:"Memoir"},
  {title:"The Subtle Art of Not Giving a F*ck",author:"Mark Manson",why:"Choose your struggles wisely",cat:"Self-help"},
  {title:"The Defining Decade",author:"Meg Jay",why:"Why your twenties matter",cat:"Self-help"},
  {title:"Designing Your Life",author:"Bill Burnett",why:"Design thinking for a fulfilling life",cat:"Self-help"},
  {title:"12 Rules for Life",author:"Jordan Peterson",why:"An antidote to chaos",cat:"Self-help"},
  {title:"Mastery",author:"Robert Greene",why:"The path to becoming world-class",cat:"Self-help"},
  {title:"The 48 Laws of Power",author:"Robert Greene",why:"Understanding power dynamics",cat:"Strategy"},
  {title:"The 4-Hour Workweek",author:"Tim Ferriss",why:"Escape the 9-5, design your life",cat:"Business"},
  {title:"Think Again",author:"Adam Grant",why:"The power of knowing what you don't know",cat:"Psychology"},
  {title:"Give and Take",author:"Adam Grant",why:"Why helping others drives our success",cat:"Psychology"},
  {title:"Originals",author:"Adam Grant",why:"How non-conformists move the world",cat:"Psychology"},
  {title:"The Talent Code",author:"Daniel Coyle",why:"Greatness isn't born — it's grown",cat:"Learning"},
  {title:"Freakonomics",author:"Steven Levitt",why:"The hidden side of everything",cat:"Economics"},
  {title:"Upstream",author:"Dan Heath",why:"How to solve problems before they happen",cat:"Business"},
  {title:"The Black Swan",author:"Nassim Taleb",why:"Impact of highly improbable events",cat:"Philosophy"},
  {title:"The Count of Monte Cristo",author:"Alexandre Dumas",why:"The ultimate revenge story",cat:"Fiction"},
  {title:"Pride and Prejudice",author:"Jane Austen",why:"Wit, romance, and social commentary",cat:"Fiction"},
  {title:"Jane Eyre",author:"Charlotte Brontë",why:"Independence and passion in Victorian England",cat:"Fiction"},
  {title:"Wuthering Heights",author:"Emily Brontë",why:"Dark, passionate, and wild",cat:"Fiction"},
  {title:"The Picture of Dorian Gray",author:"Oscar Wilde",why:"Beauty, vanity, and moral corruption",cat:"Fiction"},
  {title:"Frankenstein",author:"Mary Shelley",why:"The original sci-fi — what makes us human?",cat:"Fiction"},
  {title:"Dracula",author:"Bram Stoker",why:"The gothic horror that started it all",cat:"Fiction"},
  {title:"The Brothers Karamazov",author:"Fyodor Dostoevsky",why:"Faith, doubt, and morality",cat:"Fiction"},
  {title:"Anna Karenina",author:"Leo Tolstoy",why:"Love, society, and self-destruction",cat:"Fiction"},
  {title:"War and Peace",author:"Leo Tolstoy",why:"The epic novel about everything",cat:"Fiction"},
  {title:"Les Misérables",author:"Victor Hugo",why:"Justice, mercy, and redemption",cat:"Fiction"},
  {title:"Don Quixote",author:"Miguel de Cervantes",why:"The first modern novel — idealism vs reality",cat:"Fiction"},
  {title:"The Master and Margarita",author:"Mikhail Bulgakov",why:"The Devil visits Moscow — satirical genius",cat:"Fiction"},
  {title:"Lolita",author:"Vladimir Nabokov",why:"Disturbing brilliance — language as art",cat:"Fiction"},
  {title:"Invisible Man",author:"Ralph Ellison",why:"Race, identity, and invisibility in America",cat:"Fiction"},
  {title:"The Stranger",author:"Albert Camus",why:"Existentialism distilled into a murder",cat:"Fiction"},
  {title:"The Trial",author:"Franz Kafka",why:"Surreal bureaucratic nightmare",cat:"Fiction"},
  {title:"Moby-Dick",author:"Herman Melville",why:"Obsession, nature, and the unknowable",cat:"Fiction"},
  {title:"Great Expectations",author:"Charles Dickens",why:"Growing up, class, and redemption",cat:"Fiction"},
  {title:"The Catcher in the Rye",author:"J.D. Salinger",why:"Adolescent alienation — love it or hate it",cat:"Fiction"},
  {title:"Lord of the Flies",author:"William Golding",why:"What happens when civilization breaks down",cat:"Fiction"},
  {title:"Animal Farm",author:"George Orwell",why:"Power corrupts — told through farm animals",cat:"Fiction"},
  {title:"Neuromancer",author:"William Gibson",why:"The cyberpunk novel that defined the genre",cat:"Fiction"},
  {title:"Snow Crash",author:"Neal Stephenson",why:"Virtual reality meets ancient linguistics",cat:"Fiction"},
  {title:"Hyperion",author:"Dan Simmons",why:"Canterbury Tales meets epic sci-fi",cat:"Fiction"},
  {title:"The Left Hand of Darkness",author:"Ursula K. Le Guin",why:"Gender, politics, and humanity on an alien world",cat:"Fiction"},
  {title:"Kindred",author:"Octavia Butler",why:"Time travel and slavery — powerful and devastating",cat:"Fiction"},
  {title:"The Dispossessed",author:"Ursula K. Le Guin",why:"An anarchist physicist bridges two worlds",cat:"Fiction"},
  {title:"Foundation",author:"Isaac Asimov",why:"Can math predict the fall of empires?",cat:"Fiction"},
  {title:"Do Androids Dream of Electric Sheep?",author:"Philip K. Dick",why:"What is real? What is human?",cat:"Fiction"},
  {title:"The Sirens of Titan",author:"Kurt Vonnegut",why:"Free will, purpose, and cosmic absurdity",cat:"Fiction"},
  {title:"Cat's Cradle",author:"Kurt Vonnegut",why:"Science, religion, and the end of the world",cat:"Fiction"},
  {title:"Breakfast of Champions",author:"Kurt Vonnegut",why:"America through a satirical, surreal lens",cat:"Fiction"},
  {title:"The Old Man and the Sea",author:"Ernest Hemingway",why:"Perseverance in its purest form",cat:"Fiction"},
  {title:"For Whom the Bell Tolls",author:"Ernest Hemingway",why:"Love and war in the Spanish Civil War",cat:"Fiction"},
  {title:"A Farewell to Arms",author:"Ernest Hemingway",why:"War, love, and loss",cat:"Fiction"},
  {title:"Atonement",author:"Ian McEwan",why:"A lie that changes everything",cat:"Fiction"},
  {title:"The God of Small Things",author:"Arundhati Roy",why:"Love, caste, and forbidden desires in India",cat:"Fiction"},
  {title:"White Teeth",author:"Zadie Smith",why:"Culture clashes in modern London",cat:"Fiction"},
  {title:"The Brief Wondrous Life of Oscar Wao",author:"Junot Díaz",why:"Dominican-American identity and nerd culture",cat:"Fiction"},
  {title:"Americanah",author:"Chimamanda Ngozi Adichie",why:"Race, identity, and immigration",cat:"Fiction"},
  {title:"Half of a Yellow Sun",author:"Chimamanda Ngozi Adichie",why:"Love during the Nigerian Civil War",cat:"Fiction"},
  {title:"The Poisonwood Bible",author:"Barbara Kingsolver",why:"A family's mission in the Congo goes wrong",cat:"Fiction"},
  {title:"Demon Copperhead",author:"Barbara Kingsolver",why:"Dickens retold in Appalachia",cat:"Fiction"},
  {title:"The Underground Railroad",author:"Colson Whitehead",why:"A literal underground railroad — magical and searing",cat:"Fiction"},
  {title:"Lincoln in the Bardo",author:"George Saunders",why:"The strangest, most beautiful ghost story",cat:"Fiction"},
  {title:"Tenth of December",author:"George Saunders",why:"Short stories that break your heart and make you laugh",cat:"Fiction"},
  {title:"Exhalation",author:"Ted Chiang",why:"Mind-bending sci-fi short stories",cat:"Fiction"},
  {title:"Stories of Your Life and Others",author:"Ted Chiang",why:"Including the story that inspired Arrival",cat:"Fiction"},
  {title:"The Vanishing Half",author:"Brit Bennett",why:"Twin sisters, racial identity, and secrets",cat:"Fiction"},
  {title:"Hamnet",author:"Maggie O'Farrell",why:"Shakespeare's lost son — gorgeous prose",cat:"Fiction"},
  {title:"Shuggie Bain",author:"Douglas Stuart",why:"A boy's love for his mother in 1980s Glasgow",cat:"Fiction"},
  {title:"My Year of Rest and Relaxation",author:"Ottessa Moshfegh",why:"Dark, funny, and oddly relatable",cat:"Fiction"},
  {title:"Severance",author:"Ling Ma",why:"Pandemic fiction that hits different now",cat:"Fiction"},
  {title:"Interior Chinatown",author:"Charles Yu",why:"Asian-American identity as a screenplay",cat:"Fiction"},
  {title:"The Poppy War",author:"R.F. Kuang",why:"Dark fantasy inspired by Chinese history",cat:"Fiction"},
  {title:"Babel",author:"R.F. Kuang",why:"Language, colonialism, and revolution",cat:"Fiction"},
  {title:"The Three-Body Problem",author:"Cixin Liu",why:"Hard sci-fi that redefines first contact",cat:"Fiction"},
  {title:"Children of Time",author:"Adrian Tchaikovsky",why:"Spider civilization — stranger and better than it sounds",cat:"Fiction"},
  {title:"The Long Way to a Small, Angry Planet",author:"Becky Chambers",why:"Cozy space opera about found family",cat:"Fiction"},
  {title:"A Memory Called Empire",author:"Arkady Martine",why:"Space politics and identity — gorgeous worldbuilding",cat:"Fiction"},
  {title:"The Earthsea Quartet",author:"Ursula K. Le Guin",why:"Fantasy about wisdom, balance, and true names",cat:"Fiction"},
  {title:"Jonathan Strange & Mr Norrell",author:"Susanna Clarke",why:"English magic returns — witty and epic",cat:"Fiction"},
  {title:"The Name of the Rose",author:"Umberto Eco",why:"Medieval murder mystery meets philosophy",cat:"Fiction"},
  {title:"If on a Winter's Night a Traveler",author:"Italo Calvino",why:"A novel about reading novels — playful genius",cat:"Fiction"},
  {title:"Invisible Cities",author:"Italo Calvino",why:"Marco Polo describes impossible cities to Kublai Khan",cat:"Fiction"},
  {title:"The Shadow of the Wind",author:"Carlos Ruiz Zafón",why:"A book that leads to a labyrinth of secrets",cat:"Fiction"},
  {title:"Shōgun",author:"James Clavell",why:"Epic historical fiction set in feudal Japan",cat:"Fiction"},
  {title:"The Pillars of the Earth",author:"Ken Follett",why:"Building a cathedral in medieval England",cat:"Fiction"},
  {title:"The Power",author:"Naomi Alderman",why:"What if women suddenly had physical power over men?",cat:"Fiction"},
  {title:"Atomic Awakening",author:"James Mahaffey",why:"The surprising history of nuclear energy",cat:"Science"},
  {title:"Sapiens Graphic Novel",author:"Yuval Noah Harari",why:"History of humanity illustrated",cat:"History"},
  {title:"Learning How to Learn",author:"Barbara Oakley",why:"Meta-learning techniques backed by science",cat:"Learning"},
  {title:"Make It Stick",author:"Peter Brown",why:"The science of successful learning",cat:"Learning"},
  {title:"Ultralearning",author:"Scott Young",why:"Master hard skills and outsmart the competition",cat:"Learning"},
  {title:"A Mind for Numbers",author:"Barbara Oakley",why:"How to excel at math and science",cat:"Learning"},
  {title:"Peak",author:"Anders Ericsson",why:"Secrets from the new science of expertise",cat:"Learning"},
  {title:"Moonwalking with Einstein",author:"Joshua Foer",why:"The art and science of remembering everything",cat:"Learning"},
  {title:"How We Learn",author:"Stanislas Dehaene",why:"The four pillars of learning from neuroscience",cat:"Learning"},
  {title:"Tribe of Mentors",author:"Tim Ferriss",why:"Short life advice from the best in the world",cat:"Self-help"},
  {title:"Tribe",author:"Sebastian Junger",why:"Why we need belonging more than comfort",cat:"Psychology"},
  {title:"The Warmth of Other Suns",author:"Isabel Wilkerson",why:"The Great Migration — epic American story",cat:"History"},
  {title:"Say Nothing",author:"Patrick Radden Keefe",why:"A murder and memory in Northern Ireland",cat:"History"},
  {title:"Empire of Pain",author:"Patrick Radden Keefe",why:"The Sackler dynasty and the opioid crisis",cat:"History"},
  {title:"The Splendid and the Vile",author:"Erik Larson",why:"Churchill, London, and the Blitz",cat:"History"},
  {title:"Devil in the White City",author:"Erik Larson",why:"A serial killer at the 1893 World's Fair",cat:"History"},
  {title:"Dead Wake",author:"Erik Larson",why:"The sinking of the Lusitania",cat:"History"},
  {title:"Killers of the Flower Moon",author:"David Grann",why:"Murder, conspiracy, and the birth of the FBI",cat:"History"},
  {title:"The Lost City of Z",author:"David Grann",why:"Obsession and mystery in the Amazon",cat:"History"},
];

const COURSES=[
  {name:"CS50: Intro to Computer Science",source:"Harvard / edX",url:"https://cs50.harvard.edu/x/",cat:"Tech",icon:"💻"},
  {name:"Python for Everybody",source:"Michigan / Coursera",url:"https://www.coursera.org/specializations/python",cat:"Tech",icon:"🐍"},
  {name:"freeCodeCamp Full Curriculum",source:"freeCodeCamp",url:"https://www.freecodecamp.org/learn",cat:"Tech",icon:"💻"},
  {name:"Google Data Analytics Certificate",source:"Google / Coursera",url:"https://www.coursera.org/professional-certificates/google-data-analytics",cat:"Tech",icon:"📊"},
  {name:"Machine Learning",source:"Stanford / Coursera",url:"https://www.coursera.org/learn/machine-learning",cat:"Tech",icon:"🤖"},
  {name:"Introduction to AI",source:"IBM / Coursera",url:"https://www.coursera.org/learn/introduction-to-ai",cat:"Tech",icon:"🤖"},
  {name:"Web Development Bootcamp",source:"The Odin Project",url:"https://www.theodinproject.com/",cat:"Tech",icon:"🌐"},
  {name:"Cybersecurity Basics",source:"IBM / Coursera",url:"https://www.coursera.org/specializations/intro-cyber-security",cat:"Tech",icon:"🔒"},
  {name:"Introduction to Blockchain",source:"SUNY / Coursera",url:"https://www.coursera.org/specializations/blockchain",cat:"Tech",icon:"⛓️"},
  {name:"Human-Computer Interaction",source:"UCSD / Coursera",url:"https://www.coursera.org/learn/human-computer-interaction",cat:"Design",icon:"🖥️"},
  {name:"Algorithms Specialization",source:"Stanford / Coursera",url:"https://www.coursera.org/specializations/algorithms",cat:"Tech",icon:"⚙️"},
  {name:"Deep Learning Specialization",source:"deeplearning.ai / Coursera",url:"https://www.coursera.org/specializations/deep-learning",cat:"Tech",icon:"🧠"},
  {name:"Full Stack Open",source:"University of Helsinki",url:"https://fullstackopen.com/en/",cat:"Tech",icon:"🌐"},
  {name:"SQL for Data Science",source:"UC Davis / Coursera",url:"https://www.coursera.org/learn/sql-for-data-science",cat:"Tech",icon:"🗄️"},
  {name:"Git & GitHub Crash Course",source:"freeCodeCamp",url:"https://www.youtube.com/watch?v=RGOj5yH7evk",cat:"Tech",icon:"🔀"},
  {name:"Google UX Design Certificate",source:"Google / Coursera",url:"https://www.coursera.org/professional-certificates/google-ux-design",cat:"Design",icon:"🎨"},
  {name:"AWS Cloud Practitioner",source:"AWS / Coursera",url:"https://www.coursera.org/learn/aws-cloud-practitioner-essentials",cat:"Tech",icon:"☁️"},
  {name:"Practical Deep Learning for Coders",source:"fast.ai",url:"https://course.fast.ai/",cat:"Tech",icon:"🤖"},
  {name:"Linux Command Line Basics",source:"Udacity",url:"https://www.udacity.com/course/linux-command-line-basics--ud595",cat:"Tech",icon:"🐧"},
  {name:"React — The Complete Guide",source:"Udemy / Maximilian",url:"https://www.udemy.com/course/react-the-complete-guide-incl-redux/",cat:"Tech",icon:"⚛️"},
  {name:"Learning How to Learn",source:"Coursera",url:"https://www.coursera.org/learn/learning-how-to-learn",cat:"Meta",icon:"🧠"},
  {name:"The Science of Well-Being",source:"Yale / Coursera",url:"https://www.coursera.org/learn/the-science-of-well-being",cat:"Health",icon:"😊"},
  {name:"Introduction to Psychology",source:"Yale / Coursera",url:"https://www.coursera.org/learn/introduction-psychology",cat:"Psychology",icon:"🔬"},
  {name:"Social Psychology",source:"Wesleyan / Coursera",url:"https://www.coursera.org/learn/social-psychology",cat:"Psychology",icon:"👥"},
  {name:"Positive Psychology",source:"UPenn / Coursera",url:"https://www.coursera.org/specializations/positivepsychology",cat:"Health",icon:"🌈"},
  {name:"Child Development",source:"Coursera",url:"https://www.coursera.org/learn/child-development",cat:"Psychology",icon:"👶"},
  {name:"Mindfulness and Resilience",source:"Coursera",url:"https://www.coursera.org/learn/mindfulness-resilience-stress-at-work",cat:"Health",icon:"🧘"},
  {name:"The Science of Happiness",source:"UC Berkeley / edX",url:"https://www.edx.org/learn/happiness/uc-berkeley-the-science-of-happiness",cat:"Health",icon:"😊"},
  {name:"Understanding Memory",source:"Wesleyan / Coursera",url:"https://www.coursera.org/learn/memory-and-the-brain",cat:"Psychology",icon:"🧠"},
  {name:"Introduction to Cognitive Neuroscience",source:"Duke / Coursera",url:"https://www.coursera.org/learn/intro-cognitive-neuroscience",cat:"Psychology",icon:"🧠"},
  {name:"Khan Academy — Personal Finance",source:"Khan Academy",url:"https://www.khanacademy.org/college-careers-more/personal-finance",cat:"Finance",icon:"💰"},
  {name:"Financial Markets",source:"Yale / Coursera",url:"https://www.coursera.org/learn/financial-markets-global",cat:"Finance",icon:"📈"},
  {name:"Khan Academy — Economics",source:"Khan Academy",url:"https://www.khanacademy.org/economics-finance-domain",cat:"Finance",icon:"📉"},
  {name:"Introduction to Negotiation",source:"Yale / Coursera",url:"https://www.coursera.org/learn/negotiation",cat:"Business",icon:"🤝"},
  {name:"Entrepreneurship Specialization",source:"Wharton / Coursera",url:"https://www.coursera.org/specializations/wharton-entrepreneurship",cat:"Business",icon:"🚀"},
  {name:"Introduction to Marketing",source:"Wharton / Coursera",url:"https://www.coursera.org/learn/wharton-marketing",cat:"Business",icon:"📢"},
  {name:"Successful Negotiation",source:"Michigan / Coursera",url:"https://www.coursera.org/learn/negotiation-skills",cat:"Business",icon:"💼"},
  {name:"Accounting Fundamentals",source:"UVA / Coursera",url:"https://www.coursera.org/learn/wharton-accounting",cat:"Finance",icon:"📑"},
  {name:"Cryptocurrency and Blockchain",source:"Michigan / Coursera",url:"https://www.coursera.org/learn/cryptocurrency",cat:"Finance",icon:"₿"},
  {name:"Startup School",source:"Y Combinator",url:"https://www.startupschool.org/",cat:"Business",icon:"🚀"},
  {name:"Product Management Fundamentals",source:"Coursera",url:"https://www.coursera.org/learn/product-management",cat:"Business",icon:"📋"},
  {name:"Digital Marketing Specialization",source:"Illinois / Coursera",url:"https://www.coursera.org/specializations/digital-marketing",cat:"Business",icon:"📱"},
  {name:"MIT OpenCourseWare — Math",source:"MIT",url:"https://ocw.mit.edu/courses/mathematics/",cat:"Math",icon:"📐"},
  {name:"Khan Academy — Statistics",source:"Khan Academy",url:"https://www.khanacademy.org/math/statistics-probability",cat:"Math",icon:"📊"},
  {name:"Introduction to Logic",source:"Stanford / Coursera",url:"https://www.coursera.org/learn/logic-introduction",cat:"Math",icon:"🧩"},
  {name:"Game Theory",source:"Stanford / Coursera",url:"https://www.coursera.org/learn/game-theory-1",cat:"Math",icon:"🎲"},
  {name:"Model Thinking",source:"Michigan / Coursera",url:"https://www.coursera.org/learn/model-thinking",cat:"Science",icon:"📊"},
  {name:"Calculus 1A: Differentiation",source:"MIT / edX",url:"https://www.edx.org/learn/calculus/mit-calculus-1a-differentiation",cat:"Math",icon:"∫"},
  {name:"Khan Academy — Linear Algebra",source:"Khan Academy",url:"https://www.khanacademy.org/math/linear-algebra",cat:"Math",icon:"📐"},
  {name:"Discrete Mathematics",source:"UC San Diego / Coursera",url:"https://www.coursera.org/specializations/discrete-mathematics",cat:"Math",icon:"🔢"},
  {name:"Nutrition and Health",source:"Wageningen / edX",url:"https://www.edx.org/learn/nutrition",cat:"Health",icon:"🥗"},
  {name:"Science of Exercise",source:"UC Boulder / Coursera",url:"https://www.coursera.org/learn/science-exercise",cat:"Health",icon:"🏋️"},
  {name:"Astronomy: Exploring Time and Space",source:"U of Arizona / Coursera",url:"https://www.coursera.org/learn/astro",cat:"Science",icon:"🔭"},
  {name:"Khan Academy — Biology",source:"Khan Academy",url:"https://www.khanacademy.org/science/biology",cat:"Science",icon:"🧬"},
  {name:"Khan Academy — Chemistry",source:"Khan Academy",url:"https://www.khanacademy.org/science/chemistry",cat:"Science",icon:"⚗️"},
  {name:"Khan Academy — Physics",source:"Khan Academy",url:"https://www.khanacademy.org/science/physics",cat:"Science",icon:"⚛️"},
  {name:"Sustainable Development",source:"Columbia / Coursera",url:"https://www.coursera.org/learn/sustainable-development",cat:"Science",icon:"🌍"},
  {name:"Climate Change",source:"MIT OCW",url:"https://ocw.mit.edu/courses/earth-atmospheric-and-planetary-sciences/",cat:"Science",icon:"🌡️"},
  {name:"Introduction to Genetics",source:"MIT OCW",url:"https://ocw.mit.edu/courses/biology/",cat:"Science",icon:"🧬"},
  {name:"Understanding Einstein",source:"Stanford / Coursera",url:"https://www.coursera.org/learn/einstein-relativity",cat:"Science",icon:"🔭"},
  {name:"Understanding the Brain",source:"U of Chicago / Coursera",url:"https://www.coursera.org/learn/neurobiology",cat:"Science",icon:"🧠"},
  {name:"The Science of Cooking",source:"Harvard / edX",url:"https://www.edx.org/learn/food-science/harvard-university-science-cooking",cat:"Science",icon:"🧪"},
  {name:"Philosophy & Critical Thinking",source:"Duke / Coursera",url:"https://www.coursera.org/learn/understanding-arguments",cat:"Philosophy",icon:"🤔"},
  {name:"Justice",source:"Harvard / edX",url:"https://www.edx.org/learn/justice/harvard-university-justice",cat:"Philosophy",icon:"⚖️"},
  {name:"Introduction to Philosophy",source:"Edinburgh / Coursera",url:"https://www.coursera.org/learn/introduction-philosophy",cat:"Philosophy",icon:"🤔"},
  {name:"Khan Academy — Art History",source:"Khan Academy",url:"https://www.khanacademy.org/humanities/art-history",cat:"Art",icon:"🖼️"},
  {name:"Khan Academy — World History",source:"Khan Academy",url:"https://www.khanacademy.org/humanities/world-history",cat:"History",icon:"🌍"},
  {name:"Greek and Roman Mythology",source:"UPenn / Coursera",url:"https://www.coursera.org/learn/mythology",cat:"History",icon:"⚡"},
  {name:"The Modern World",source:"UVA / Coursera",url:"https://www.coursera.org/learn/modern-world",cat:"History",icon:"🏛️"},
  {name:"Introduction to Music",source:"Yale / Coursera",url:"https://www.coursera.org/learn/introduction-to-music",cat:"Art",icon:"🎶"},
  {name:"Modern Art & Ideas",source:"MoMA / Coursera",url:"https://www.coursera.org/learn/modern-art-ideas",cat:"Art",icon:"🎨"},
  {name:"Introduction to Ancient Egypt",source:"UPenn / Coursera",url:"https://www.coursera.org/learn/introancientegypt",cat:"History",icon:"🏛️"},
  {name:"Creative Writing Specialization",source:"Wesleyan / Coursera",url:"https://www.coursera.org/specializations/creative-writing",cat:"Creative",icon:"✍️"},
  {name:"Design Thinking",source:"UVA / Coursera",url:"https://www.coursera.org/learn/uva-darden-design-thinking-innovation",cat:"Creative",icon:"💡"},
  {name:"Graphic Design Specialization",source:"CalArts / Coursera",url:"https://www.coursera.org/specializations/graphic-design",cat:"Creative",icon:"🎨"},
  {name:"Photography Basics",source:"Michigan State / Coursera",url:"https://www.coursera.org/specializations/photography-basics",cat:"Creative",icon:"📷"},
  {name:"Music Production",source:"Berklee / Coursera",url:"https://www.coursera.org/specializations/music-production",cat:"Creative",icon:"🎵"},
  {name:"Songwriting",source:"Berklee / Coursera",url:"https://www.coursera.org/learn/songwriting",cat:"Creative",icon:"🎵"},
  {name:"3D Modeling Basics",source:"Michigan / Coursera",url:"https://www.coursera.org/learn/3d-modeling",cat:"Creative",icon:"🎭"},
  {name:"UI/UX Design Specialization",source:"CalArts / Coursera",url:"https://www.coursera.org/specializations/ui-ux-design",cat:"Design",icon:"📱"},
  {name:"Film and TV Screenwriting",source:"Michigan / Coursera",url:"https://www.coursera.org/learn/screenwriting",cat:"Creative",icon:"🎬"},
  {name:"Comics: Art in Relationship",source:"CalArts / Coursera",url:"https://www.coursera.org/learn/comics-art",cat:"Creative",icon:"📚"},
  {name:"Improve Your English Communication Skills",source:"Georgia Tech / Coursera",url:"https://www.coursera.org/specializations/improve-english",cat:"Communication",icon:"🗣️"},
  {name:"Public Speaking",source:"U of Washington / Coursera",url:"https://www.coursera.org/learn/public-speaking",cat:"Communication",icon:"🎤"},
  {name:"Introduction to Public Speaking",source:"Coursera",url:"https://www.coursera.org/learn/public-speaking",cat:"Communication",icon:"📢"},
  {name:"Storytelling and Influence",source:"Macquarie / Coursera",url:"https://www.coursera.org/specializations/storytelling-influencing",cat:"Communication",icon:"📖"},
  {name:"Conflict Management",source:"UC Irvine / Coursera",url:"https://www.coursera.org/specializations/conflict-management",cat:"Communication",icon:"🤝"},
  {name:"Leadership Specialization",source:"Michigan / Coursera",url:"https://www.coursera.org/specializations/leading-teams",cat:"Leadership",icon:"👔"},
  {name:"Duolingo — Spanish",source:"Duolingo",url:"https://www.duolingo.com/course/es/en/Learn-Spanish",cat:"Language",icon:"🇪🇸"},
  {name:"Duolingo — French",source:"Duolingo",url:"https://www.duolingo.com/course/fr/en/Learn-French",cat:"Language",icon:"🇫🇷"},
  {name:"Duolingo — Japanese",source:"Duolingo",url:"https://www.duolingo.com/course/ja/en/Learn-Japanese",cat:"Language",icon:"🇯🇵"},
  {name:"Duolingo — German",source:"Duolingo",url:"https://www.duolingo.com/course/de/en/Learn-German",cat:"Language",icon:"🇩🇪"},
  {name:"Duolingo — Korean",source:"Duolingo",url:"https://www.duolingo.com/course/ko/en/Learn-Korean",cat:"Language",icon:"🇰🇷"},
  {name:"Duolingo — Italian",source:"Duolingo",url:"https://www.duolingo.com/course/it/en/Learn-Italian",cat:"Language",icon:"🇮🇹"},
  {name:"Duolingo — Portuguese",source:"Duolingo",url:"https://www.duolingo.com/course/pt/en/Learn-Portuguese",cat:"Language",icon:"🇧🇷"},
  {name:"Duolingo — Mandarin Chinese",source:"Duolingo",url:"https://www.duolingo.com/course/zh/en/Learn-Chinese",cat:"Language",icon:"🇨🇳"},
  {name:"Duolingo — Arabic",source:"Duolingo",url:"https://www.duolingo.com/course/ar/en/Learn-Arabic",cat:"Language",icon:"🇸🇦"},
  {name:"Duolingo — Hindi",source:"Duolingo",url:"https://www.duolingo.com/course/hi/en/Learn-Hindi",cat:"Language",icon:"🇮🇳"},
  {name:"Yoga with Adriene — 30 Day Journey",source:"YouTube",url:"https://www.youtube.com/playlist?list=PLui6Eyny-UzyqBhFEYCS2hVBmBhgBijKf",cat:"Fitness",icon:"🧘"},
  {name:"Couch to 5K Running Plan",source:"NHS",url:"https://www.nhs.uk/live-well/exercise/running-and-aerobic-exercises/get-running-with-couch-to-5k/",cat:"Fitness",icon:"🏃"},
  {name:"Sleep Science & Better Rest",source:"Coursera",url:"https://www.coursera.org/learn/sleep",cat:"Health",icon:"😴"},
  {name:"Stanford Introduction to Food & Health",source:"Stanford / Coursera",url:"https://www.coursera.org/learn/food-and-health",cat:"Health",icon:"🥗"},
  {name:"Vital Signs: Understanding Body Signals",source:"UPenn / Coursera",url:"https://www.coursera.org/learn/vital-signs",cat:"Health",icon:"❤️"},
  {name:"De-Mystifying Mindfulness",source:"Leiden / Coursera",url:"https://www.coursera.org/learn/demystifying-mindfulness",cat:"Health",icon:"🧘"},
];

const TED_TALKS=[
  {title:"The power of vulnerability",speaker:"Brené Brown",url:"https://www.ted.com/talks/brene_brown_the_power_of_vulnerability",cat:"Growth"},
  {title:"How great leaders inspire action",speaker:"Simon Sinek",url:"https://www.ted.com/talks/simon_sinek_how_great_leaders_inspire_action",cat:"Leadership"},
  {title:"Your body language may shape who you are",speaker:"Amy Cuddy",url:"https://www.ted.com/talks/amy_cuddy_your_body_language_may_shape_who_you_are",cat:"Psychology"},
  {title:"Do schools kill creativity?",speaker:"Ken Robinson",url:"https://www.ted.com/talks/sir_ken_robinson_do_schools_kill_creativity",cat:"Education"},
  {title:"The puzzle of motivation",speaker:"Dan Pink",url:"https://www.ted.com/talks/dan_pink_the_puzzle_of_motivation",cat:"Work"},
  {title:"The happy secret to better work",speaker:"Shawn Achor",url:"https://www.ted.com/talks/shawn_achor_the_happy_secret_to_better_work",cat:"Happiness"},
  {title:"Grit: the power of passion and perseverance",speaker:"Angela Lee Duckworth",url:"https://www.ted.com/talks/angela_lee_duckworth_grit_the_power_of_passion_and_perseverance",cat:"Growth"},
  {title:"How to speak so people want to listen",speaker:"Julian Treasure",url:"https://www.ted.com/talks/julian_treasure_how_to_speak_so_that_people_want_to_listen",cat:"Communication"},
  {title:"The power of introverts",speaker:"Susan Cain",url:"https://www.ted.com/talks/susan_cain_the_power_of_introverts",cat:"Psychology"},
  {title:"What makes a good life?",speaker:"Robert Waldinger",url:"https://www.ted.com/talks/robert_waldinger_what_makes_a_good_life_lessons_from_the_longest_study_on_happiness",cat:"Happiness"},
  {title:"How to make stress your friend",speaker:"Kelly McGonigal",url:"https://www.ted.com/talks/kelly_mcgonigal_how_to_make_stress_your_friend",cat:"Health"},
  {title:"Inside the mind of a master procrastinator",speaker:"Tim Urban",url:"https://www.ted.com/talks/tim_urban_inside_the_mind_of_a_master_procrastinator",cat:"Productivity"},
  {title:"Try something new for 30 days",speaker:"Matt Cutts",url:"https://www.ted.com/talks/matt_cutts_try_something_new_for_30_days",cat:"Habits"},
  {title:"Sleep is your superpower",speaker:"Matt Walker",url:"https://www.ted.com/talks/matt_walker_sleep_is_your_superpower",cat:"Health"},
  {title:"The danger of a single story",speaker:"Chimamanda Adichie",url:"https://www.ted.com/talks/chimamanda_ngozi_adichie_the_danger_of_a_single_story",cat:"Perspective"},
  {title:"Your elusive creative genius",speaker:"Elizabeth Gilbert",url:"https://www.ted.com/talks/elizabeth_gilbert_your_elusive_creative_genius",cat:"Creativity"},
  {title:"10 ways to have a better conversation",speaker:"Celeste Headlee",url:"https://www.ted.com/talks/celeste_headlee_10_ways_to_have_a_better_conversation",cat:"Communication"},
  {title:"The surprising habits of original thinkers",speaker:"Adam Grant",url:"https://www.ted.com/talks/adam_grant_the_surprising_habits_of_original_thinkers",cat:"Creativity"},
  {title:"What I learned from 100 days of rejection",speaker:"Jia Jiang",url:"https://www.ted.com/talks/jia_jiang_what_i_learned_from_100_days_of_rejection",cat:"Growth"},
  {title:"The gift and power of emotional courage",speaker:"Susan David",url:"https://www.ted.com/talks/susan_david_the_gift_and_power_of_emotional_courage",cat:"Psychology"},
  {title:"Every kid needs a champion",speaker:"Rita Pierson",url:"https://www.ted.com/talks/rita_pierson_every_kid_needs_a_champion",cat:"Education"},
  {title:"The power of believing you can improve",speaker:"Carol Dweck",url:"https://www.ted.com/talks/carol_dweck_the_power_of_believing_that_you_can_improve",cat:"Mindset"},
  {title:"How to build creative confidence",speaker:"David Kelley",url:"https://www.ted.com/talks/david_kelley_how_to_build_your_creative_confidence",cat:"Creativity"},
  {title:"The paradox of choice",speaker:"Barry Schwartz",url:"https://www.ted.com/talks/barry_schwartz_the_paradox_of_choice",cat:"Psychology"},
  {title:"Why we all need to practice emotional first aid",speaker:"Guy Winch",url:"https://www.ted.com/talks/guy_winch_why_we_all_need_to_practice_emotional_first_aid",cat:"Health"},
  {title:"My stroke of insight",speaker:"Jill Bolte Taylor",url:"https://www.ted.com/talks/jill_bolte_taylor_my_stroke_of_insight",cat:"Science"},
  {title:"The art of asking",speaker:"Amanda Palmer",url:"https://www.ted.com/talks/amanda_palmer_the_art_of_asking",cat:"Connection"},
  {title:"How to fix a broken heart",speaker:"Guy Winch",url:"https://www.ted.com/talks/guy_winch_how_to_fix_a_broken_heart",cat:"Health"},
  {title:"Embrace the near win",speaker:"Sarah Lewis",url:"https://www.ted.com/talks/sarah_lewis_embrace_the_near_win",cat:"Growth"},
  {title:"Why you should talk to strangers",speaker:"Kio Stark",url:"https://www.ted.com/talks/kio_stark_why_you_should_talk_to_strangers",cat:"Connection"},
  {title:"Got a meeting? Take a walk",speaker:"Nilofer Merchant",url:"https://www.ted.com/talks/nilofer_merchant_got_a_meeting_take_a_walk",cat:"Health"},
  {title:"The power of time off",speaker:"Stefan Sagmeister",url:"https://www.ted.com/talks/stefan_sagmeister_the_power_of_time_off",cat:"Creativity"},
  {title:"The transformative power of classical music",speaker:"Benjamin Zander",url:"https://www.ted.com/talks/benjamin_zander_the_transformative_power_of_classical_music",cat:"Art"},
  {title:"Looks aren't everything",speaker:"Cameron Russell",url:"https://www.ted.com/talks/cameron_russell_looks_aren_t_everything_believe_me_i_m_a_model",cat:"Perspective"},
  {title:"How to get better at things you care about",speaker:"Eduardo Briceño",url:"https://www.ted.com/talks/eduardo_briceno_how_to_get_better_at_the_things_you_care_about",cat:"Growth"},
  {title:"Why you should define your fears",speaker:"Tim Ferriss",url:"https://www.ted.com/talks/tim_ferriss_why_you_should_define_your_fears_instead_of_your_goals",cat:"Growth"},
  {title:"The beauty of data visualization",speaker:"David McCandless",url:"https://www.ted.com/talks/david_mccandless_the_beauty_of_data_visualization",cat:"Design"},
  {title:"Why 30 is not the new 20",speaker:"Meg Jay",url:"https://www.ted.com/talks/meg_jay_why_30_is_not_the_new_20",cat:"Growth"},
  {title:"How to find work you love",speaker:"Scott Dinsmore",url:"https://www.ted.com/talks/scott_dinsmore_how_to_find_work_you_love",cat:"Career"},
  {title:"The secret structure of great talks",speaker:"Nancy Duarte",url:"https://www.ted.com/talks/nancy_duarte_the_secret_structure_of_great_talks",cat:"Communication"},
  {title:"Choice, happiness and spaghetti sauce",speaker:"Malcolm Gladwell",url:"https://www.ted.com/talks/malcolm_gladwell_choice_happiness_and_spaghetti_sauce",cat:"Psychology"},
  {title:"The habits of happiness",speaker:"Matthieu Ricard",url:"https://www.ted.com/talks/matthieu_ricard_the_habits_of_happiness",cat:"Happiness"},
  {title:"All it takes is 10 mindful minutes",speaker:"Andy Puddicombe",url:"https://www.ted.com/talks/andy_puddicombe_all_it_takes_is_10_mindful_minutes",cat:"Mindfulness"},
  {title:"What makes us feel good about our work?",speaker:"Dan Ariely",url:"https://www.ted.com/talks/dan_ariely_what_makes_us_feel_good_about_our_work",cat:"Work"},
  {title:"Listening to shame",speaker:"Brené Brown",url:"https://www.ted.com/talks/brene_brown_listening_to_shame",cat:"Psychology"},
  {title:"The skill of self-confidence",speaker:"Ivan Joseph",url:"https://www.youtube.com/watch?v=w-HYZv6HzAs",cat:"Growth"},
  {title:"How to stop screwing yourself over",speaker:"Mel Robbins",url:"https://www.youtube.com/watch?v=Lp7E973zozc",cat:"Motivation"},
  {title:"The art of being yourself",speaker:"Caroline McHugh",url:"https://www.youtube.com/watch?v=veEQQ-N9xWU",cat:"Growth"},
  {title:"How to live before you die",speaker:"Steve Jobs",url:"https://www.ted.com/talks/steve_jobs_how_to_live_before_you_die",cat:"Inspiration"},
  {title:"The power of passion and perseverance",speaker:"Angela Duckworth",url:"https://www.ted.com/talks/angela_lee_duckworth_grit_the_power_of_passion_and_perseverance",cat:"Growth"},
  {title:"What fear can teach us",speaker:"Karen Thompson Walker",url:"https://www.ted.com/talks/karen_thompson_walker_what_fear_can_teach_us",cat:"Psychology"},
  {title:"The next outbreak? We're not ready",speaker:"Bill Gates",url:"https://www.ted.com/talks/bill_gates_the_next_outbreak_we_re_not_ready",cat:"Science"},
  {title:"How language shapes the way we think",speaker:"Lera Boroditsky",url:"https://www.ted.com/talks/lera_boroditsky_how_language_shapes_the_way_we_think",cat:"Science"},
  {title:"What baby boomers can learn from millennials and vice versa",speaker:"Chip Conley",url:"https://www.ted.com/talks/chip_conley_what_baby_boomers_can_learn_from_millennials_at_work_and_vice_versa",cat:"Work"},
  {title:"3 things I learned while my plane crashed",speaker:"Ric Elias",url:"https://www.ted.com/talks/ric_elias_3_things_i_learned_while_my_plane_crashed",cat:"Perspective"},
  {title:"The brain-changing benefits of exercise",speaker:"Wendy Suzuki",url:"https://www.ted.com/talks/wendy_suzuki_the_brain_changing_benefits_of_exercise",cat:"Health"},
  {title:"How to gain control of your free time",speaker:"Laura Vanderkam",url:"https://www.ted.com/talks/laura_vanderkam_how_to_gain_control_of_your_free_time",cat:"Productivity"},
  {title:"What makes life worth living",speaker:"Mihaly Csikszentmihalyi",url:"https://www.ted.com/talks/mihaly_csikszentmihalyi_flow_the_secret_to_happiness",cat:"Happiness"},
  {title:"The art of misdirection",speaker:"Apollo Robbins",url:"https://www.ted.com/talks/apollo_robbins_the_art_of_misdirection",cat:"Psychology"},
  {title:"How to speak up for yourself",speaker:"Adam Galinsky",url:"https://www.ted.com/talks/adam_galinsky_how_to_speak_up_for_yourself",cat:"Communication"},
  {title:"The unheard story of David and Goliath",speaker:"Malcolm Gladwell",url:"https://www.ted.com/talks/malcolm_gladwell_the_unheard_story_of_david_and_goliath",cat:"Perspective"},
  {title:"This is what happens when you reply to spam email",speaker:"James Veitch",url:"https://www.ted.com/talks/james_veitch_this_is_what_happens_when_you_reply_to_spam_email",cat:"Humor"},
  {title:"The price of shame",speaker:"Monica Lewinsky",url:"https://www.ted.com/talks/monica_lewinsky_the_price_of_shame",cat:"Perspective"},
  {title:"Plug into your hard-wired happiness",speaker:"Loretta Breuning",url:"https://www.youtube.com/watch?v=e0LpPuBaQYk",cat:"Health"},
  {title:"How to make hard choices",speaker:"Ruth Chang",url:"https://www.ted.com/talks/ruth_chang_how_to_make_hard_choices",cat:"Decision-making"},
  {title:"What I learned from going blind in space",speaker:"Chris Hadfield",url:"https://www.ted.com/talks/chris_hadfield_what_i_learned_from_going_blind_in_space",cat:"Growth"},
  {title:"The happy planet index",speaker:"Nic Marks",url:"https://www.ted.com/talks/nic_marks_the_happy_planet_index",cat:"Happiness"},
  {title:"A simple way to break a bad habit",speaker:"Judson Brewer",url:"https://www.ted.com/talks/judson_brewer_a_simple_way_to_break_a_bad_habit",cat:"Habits"},
  {title:"The key to success? Grit",speaker:"Angela Duckworth",url:"https://www.ted.com/talks/angela_lee_duckworth_grit_the_power_of_passion_and_perseverance",cat:"Growth"},
  {title:"The power of letting go",speaker:"Internalizing Loss",url:"https://www.ted.com/talks/",cat:"Growth"},
  {title:"What if you could trade a paperclip for a house?",speaker:"Kyle MacDonald",url:"https://www.ted.com/talks/kyle_macdonald_one_red_paperclip",cat:"Creativity"},
  {title:"How to manage time more effectively",speaker:"Brian Christian",url:"https://www.ted.com/talks/brian_christian_how_to_manage_your_time_more_effectively_according_to_machines",cat:"Productivity"},
  {title:"The mathematics of love",speaker:"Hannah Fry",url:"https://www.ted.com/talks/hannah_fry_the_mathematics_of_love",cat:"Science"},
  {title:"How to be a better listener",speaker:"Evelyn Glennie",url:"https://www.ted.com/talks/evelyn_glennie_how_to_truly_listen",cat:"Communication"},
  {title:"Why we do what we do",speaker:"Tony Robbins",url:"https://www.ted.com/talks/tony_robbins_why_we_do_what_we_do",cat:"Motivation"},
  {title:"The magic of Fibonacci numbers",speaker:"Arthur Benjamin",url:"https://www.ted.com/talks/arthur_benjamin_the_magic_of_fibonacci_numbers",cat:"Science"},
  {title:"How trees talk to each other",speaker:"Suzanne Simard",url:"https://www.ted.com/talks/suzanne_simard_how_trees_talk_to_each_other",cat:"Nature"},
  {title:"The enchanting music of sign language",speaker:"Christine Sun Kim",url:"https://www.ted.com/talks/christine_sun_kim_the_enchanting_music_of_sign_language",cat:"Art"},
  {title:"How to practice effectively",speaker:"Annie Bosler",url:"https://www.ted.com/talks/annie_bosler_and_don_greene_how_to_practice_effectively_for_just_about_anything",cat:"Learning"},
  {title:"The orchestra in my mouth",speaker:"Tom Thum",url:"https://www.ted.com/talks/tom_thum_the_orchestra_in_my_mouth",cat:"Art"},
  {title:"A kinder, gentler philosophy of success",speaker:"Alain de Botton",url:"https://www.ted.com/talks/alain_de_botton_a_kinder_gentler_philosophy_of_success",cat:"Philosophy"},
  {title:"The voices in my head",speaker:"Eleanor Longden",url:"https://www.ted.com/talks/eleanor_longden_the_voices_in_my_head",cat:"Health"},
  {title:"How I held my breath for 17 minutes",speaker:"David Blaine",url:"https://www.ted.com/talks/david_blaine_how_i_held_my_breath_for_17_min",cat:"Growth"},
  {title:"The world needs all kinds of minds",speaker:"Temple Grandin",url:"https://www.ted.com/talks/temple_grandin_the_world_needs_all_kinds_of_minds",cat:"Perspective"},
  {title:"What adults can learn from kids",speaker:"Adora Svitak",url:"https://www.ted.com/talks/adora_svitak_what_adults_can_learn_from_kids",cat:"Education"},
  {title:"How childhood trauma affects health across a lifetime",speaker:"Nadine Burke Harris",url:"https://www.ted.com/talks/nadine_burke_harris_how_childhood_trauma_affects_health_across_a_lifetime",cat:"Health"},
  {title:"The science of cells that never get old",speaker:"Elizabeth Blackburn",url:"https://www.ted.com/talks/elizabeth_blackburn_the_science_of_cells_that_never_get_old",cat:"Science"},
  {title:"How to learn anything — the first 20 hours",speaker:"Josh Kaufman",url:"https://www.youtube.com/watch?v=5MgBikgcWnY",cat:"Learning"},
  {title:"Own your mistakes",speaker:"Cristel Carrisi",url:"https://www.ted.com/talks/",cat:"Growth"},
  {title:"Your genes are not your fate",speaker:"Dean Ornish",url:"https://www.ted.com/talks/dean_ornish_your_genes_are_not_your_fate",cat:"Health"},
  {title:"How to have a good conversation",speaker:"Celeste Headlee",url:"https://www.ted.com/talks/celeste_headlee_10_ways_to_have_a_better_conversation",cat:"Communication"},
  {title:"Why we need to rethink retirement",speaker:"Various",url:"https://www.ted.com/topics/retirement",cat:"Life"},
  {title:"Life lessons from an ad man",speaker:"Rory Sutherland",url:"https://www.ted.com/talks/rory_sutherland_life_lessons_from_an_ad_man",cat:"Creativity"},
  {title:"Smash fear, learn anything",speaker:"Tim Ferriss",url:"https://www.ted.com/talks/tim_ferriss_smash_fear_learn_anything",cat:"Learning"},
  {title:"The power of reading",speaker:"Various",url:"https://www.ted.com/topics/books",cat:"Education"},
  {title:"Nature is everywhere — we just need to learn to see it",speaker:"Emma Marris",url:"https://www.ted.com/talks/emma_marris_nature_is_everywhere_we_just_need_to_learn_to_see_it",cat:"Nature"},
  {title:"The surprising science of happiness",speaker:"Dan Gilbert",url:"https://www.ted.com/talks/dan_gilbert_the_surprising_science_of_happiness",cat:"Happiness"},
  {title:"How to design a good API and why it matters",speaker:"Joshua Bloch",url:"https://www.youtube.com/watch?v=aAb7hSCtvGw",cat:"Tech"},
  {title:"Why comfort will ruin your life",speaker:"Bill Eckstrom",url:"https://www.youtube.com/watch?v=LBvHI1awgaQ",cat:"Growth"},
  {title:"The power of music to transform",speaker:"Various",url:"https://www.ted.com/topics/music",cat:"Art"},
  {title:"How great leaders create trust",speaker:"Frances Frei",url:"https://www.ted.com/talks/frances_frei_how_to_build_and_rebuild_trust",cat:"Leadership"},
  {title:"Why you should make useless things",speaker:"Simone Giertz",url:"https://www.ted.com/talks/simone_giertz_why_you_should_make_useless_things",cat:"Creativity"},
  {title:"Are we in control of our decisions?",speaker:"Dan Ariely",url:"https://www.ted.com/talks/dan_ariely_are_we_in_control_of_our_own_decisions",cat:"Psychology"},
  {title:"How to achieve your most ambitious goals",speaker:"Stephen Duneier",url:"https://www.youtube.com/watch?v=TQMbvJNRpLE",cat:"Productivity"},
  {title:"The discipline of finishing",speaker:"Conor Neill",url:"https://www.youtube.com/watch?v=zXCiv4sc5eY",cat:"Productivity"},
  {title:"Dare to disagree",speaker:"Margaret Heffernan",url:"https://www.ted.com/talks/margaret_heffernan_dare_to_disagree",cat:"Communication"},
  {title:"The power of yet",speaker:"Carol Dweck",url:"https://www.ted.com/talks/carol_dweck_the_power_of_believing_that_you_can_improve",cat:"Mindset"},
  {title:"What makes you special?",speaker:"Mariana Atencio",url:"https://www.youtube.com/watch?v=MY15_jGFFE4",cat:"Perspective"},
  {title:"The puzzle of aging",speaker:"Various",url:"https://www.ted.com/topics/aging",cat:"Science"},
  {title:"How to declutter your mind",speaker:"Various",url:"https://www.ted.com/topics/mindfulness",cat:"Mindfulness"},
  {title:"The power of empathy",speaker:"Various",url:"https://www.ted.com/topics/empathy",cat:"Connection"},
  {title:"Design for all 5 senses",speaker:"Jinsop Lee",url:"https://www.ted.com/talks/jinsop_lee_design_for_all_5_senses",cat:"Design"},
  {title:"How frustration can make us more creative",speaker:"Tim Harford",url:"https://www.ted.com/talks/tim_harford_how_frustration_can_make_us_more_creative",cat:"Creativity"},
];

const FUN_FACTS=[
  "A teaspoon of neutron star material weighs about 6 billion tons.",
  "There are more stars in the universe than grains of sand on all Earth's beaches.",
  "Light from the Sun takes 8 minutes and 20 seconds to reach Earth.",
  "Venus rotates so slowly that a day on Venus is longer than its year.",
  "Saturn would float in water — it's less dense than water.",
  "The footprints on the Moon will be there for 100 million years.",
  "One million Earths could fit inside the Sun.",
  "Space is completely silent — there's no medium for sound to travel.",
  "Neutron stars can spin 600 times per second.",
  "The Great Wall of China is NOT visible from space, but city lights are.",
  "A year on Mercury is only 88 Earth days.",
  "Jupiter's Great Red Spot is a storm bigger than Earth that's raged for centuries.",
  "The Milky Way and Andromeda galaxies will collide in about 4.5 billion years.",
  "There are more trees on Earth (~3 trillion) than stars in the Milky Way (~400 billion).",
  "If you could fly a plane to Pluto, the trip would take more than 800 years.",
  "The observable universe is 93 billion light-years in diameter.",
  "Mars has the tallest volcano in the solar system — Olympus Mons, 3x the height of Everest.",
  "A photon can take 40,000 years to travel from the Sun's core to its surface, then only 8 minutes to reach Earth.",
  "Uranus rotates on its side, essentially rolling around the Sun.",
  "The coldest place in the known universe is the Boomerang Nebula at -272°C.",
  "Octopuses have three hearts, blue blood, and nine brains.",
  "A group of flamingos is called a 'flamboyance.'",
  "Cows have best friends and get stressed when separated.",
  "Dolphins sleep with one eye open — half their brain stays awake.",
  "A snail can sleep for three years.",
  "Elephants are the only animals that can't jump.",
  "A group of owls is called a 'parliament.'",
  "Honey never spoils. Archaeologists found 3,000-year-old honey in Egyptian tombs still edible.",
  "Butterflies taste with their feet.",
  "Seahorses are the only animals where the male gives birth.",
  "An octopus has no bones and can squeeze through any gap larger than its beak.",
  "Penguins propose to their mates with a pebble.",
  "A blue whale's heart is so big that a human child could swim through its arteries.",
  "Cats have over 20 vocalizations, including the purr, which promotes bone healing.",
  "Dogs' noses are as unique as human fingerprints.",
  "A group of porcupines is called a 'prickle.'",
  "Sloths can hold their breath longer than dolphins — up to 40 minutes.",
  "Hummingbirds are the only birds that can fly backwards.",
  "Koalas sleep up to 22 hours a day.",
  "The mantis shrimp can punch with the force of a .22 caliber bullet.",
  "A chameleon's tongue is roughly twice the length of its body.",
  "Crows can recognize human faces and hold grudges.",
  "The heart of a shrimp is located in its head.",
  "A flock of crows is called a 'murder.'",
  "Rats laugh when tickled.",
  "Wombats produce cube-shaped droppings.",
  "A single strand of spider silk is stronger than the same width of steel.",
  "Parrots can learn to use tools, understand concepts like zero, and outlive their owners.",
  "Elephants can hear through their feet via vibrations in the ground.",
  "Sea otters hold hands while sleeping so they don't drift apart.",
  "Your body has enough iron to make a 3-inch nail.",
  "The human brain uses 20% of the body's total energy.",
  "You produce about 25,000 quarts of saliva in a lifetime — enough to fill two swimming pools.",
  "Your nose can remember 50,000 different scents.",
  "Humans share about 60% of their DNA with bananas.",
  "The human eye can distinguish approximately 10 million different colors.",
  "Your skeleton is completely replaced every 10 years.",
  "Babies are born with 300 bones, but adults only have 206.",
  "The strongest muscle in the body relative to its size is the masseter (jaw muscle).",
  "Your stomach lining replaces itself every 3-4 days to prevent self-digestion.",
  "Humans are bioluminescent — we glow in the dark, but 1,000 times weaker than our eyes can detect.",
  "The small intestine is roughly 20 feet long.",
  "Your brain generates enough electricity to power a small LED light.",
  "Humans can survive longer without food than without sleep.",
  "Each person sheds about 600,000 particles of skin every hour.",
  "The average person walks about 100,000 miles in a lifetime.",
  "Your cornea is one of only two body parts with no blood supply (the other is cartilage).",
  "The human body contains about 37.2 trillion cells.",
  "You blink about 15-20 times per minute — that's over 10 million times a year.",
  "Your fingerprints are formed by the 12th week of pregnancy and never change.",
  "The acid in your stomach is strong enough to dissolve metal.",
  "The total length of all blood vessels in the human body is about 60,000 miles.",
  "Humans and giraffes have the same number of neck vertebrae: seven.",
  "The liver is the only organ that can completely regenerate itself.",
  "Hiccups happen when the diaphragm spasms and dates back to our amphibian ancestors.",
  "Cleopatra lived closer in time to the Moon landing than to the building of the Great Pyramid.",
  "Oxford University is older than the Aztec Empire.",
  "Ancient Romans used crushed mouse brains as toothpaste.",
  "The shortest war in history was between Britain and Zanzibar in 1896 — it lasted 38 minutes.",
  "During WWII, a Great Dane named Juliana received a Blue Cross medal for extinguishing an incendiary bomb by peeing on it.",
  "The Eiffel Tower was originally intended to be a temporary structure for the 1889 World's Fair.",
  "Vikings used the skulls of their enemies as drinking vessels.",
  "In ancient Egypt, servants were smeared with honey to attract flies away from the pharaoh.",
  "The first known computer programmer was Ada Lovelace in the 1840s.",
  "Abraham Lincoln was a licensed bartender and champion wrestler.",
  "The Great Fire of London in 1666 destroyed 13,200 houses but reportedly only 6 people died.",
  "The first email was sent by Ray Tomlinson to himself in 1971.",
  "Ancient Egyptians used slabs of stone as pillows.",
  "The first webcam was created to monitor a coffee pot at Cambridge University.",
  "Napoleon was actually average height for his time — the 'short' myth came from British propaganda.",
  "The oldest known joke is a Sumerian fart joke from 1900 BC.",
  "There are more public libraries in the US than McDonald's restaurants.",
  "Shakespeare invented over 1,700 words including 'eyeball' and 'lonely.'",
  "The first person convicted of speeding was going 8 mph.",
  "The last letter added to the English alphabet wasn't Z — it was J.",
  "Water can boil and freeze at the same time — it's called the triple point.",
  "A tablespoon of honey represents the life work of 12 bees.",
  "Bananas are slightly radioactive due to their potassium content.",
  "Hot water freezes faster than cold water — it's called the Mpemba effect.",
  "Glass is technically an amorphous solid, not a liquid.",
  "Lightning strikes the Earth about 8 million times a day.",
  "A cloud can weigh more than a million pounds.",
  "If you unraveled all of your DNA, it would stretch from Earth to Pluto and back.",
  "Diamonds can be made from peanut butter.",
  "There's enough gold in Earth's core to coat the surface 1.5 feet deep.",
  "Raindrops are not teardrop-shaped — they're actually shaped like hamburger buns.",
  "A single bolt of lightning contains enough energy to toast 100,000 slices of bread.",
  "The Sahara Desert is only about 25% sand — the rest is rocky plateau.",
  "More energy from the Sun hits Earth in one hour than humanity uses in an entire year.",
  "Bamboo can grow up to 35 inches in a single day.",
  "A jiffy is an actual unit of time: 1/100th of a second.",
  "The average cumulus cloud weighs about 1.1 million pounds.",
  "If you fold a piece of paper 42 times, it would reach the Moon.",
  "Honey is the only food that never expires.",
  "The human body contains about 0.2 mg of gold.",
  "Russia has more surface area than Pluto.",
  "There are more possible iterations of a game of chess than atoms in the observable universe.",
  "The Amazon rainforest produces about 20% of the world's oxygen.",
  "Mount Everest grows about 4mm taller each year due to tectonic activity.",
  "90% of the world's fresh water is in Antarctica.",
  "The Dead Sea is so salty you can float on it without trying.",
  "Lake Baikal in Russia contains 20% of the world's unfrozen fresh water.",
  "Africa is larger than the USA, China, India, Japan, and most of Europe combined.",
  "The Pacific Ocean is larger than all the land on Earth combined.",
  "There's a town in Norway called Hell, and it freezes over every winter.",
  "Canada has more lakes than the rest of the world combined.",
  "The Mariana Trench is deeper than Mount Everest is tall.",
  "Australia is wider than the Moon.",
  "There are more people living inside a 1,500-mile radius from Bangkok than outside of it.",
  "The longest place name in the world is in New Zealand: Taumatawhakatangihangakoauauotamateaturipukakapikimaungahoronukupokaiwhenuakitanatahu.",
  "Alaska is simultaneously the most northern, western, and eastern state in the US.",
  "Istanbul is the only major city in the world located on two continents.",
  "The Sahara Desert is roughly the same size as the entire United States.",
  "Greenland can't join FIFA because there aren't enough grass fields for soccer.",
  "Monaco is smaller than Central Park in New York City.",
  "The first 1GB hard drive, made in 1980, weighed 550 pounds and cost $40,000.",
  "The QWERTY keyboard was designed to slow typists down to prevent jamming on typewriters.",
  "If you shuffled a deck of cards properly, the order has likely never existed before in history.",
  "Google's name comes from 'googol' — the number 1 followed by 100 zeros.",
  "The first computer mouse was made of wood.",
  "There are 10 times more bacteria in your body than human cells.",
  "A day on Earth is not exactly 24 hours — it's 23 hours, 56 minutes, and 4 seconds.",
  "WiFi doesn't stand for 'Wireless Fidelity' — it's just a catchy name.",
  "The average person will spend 6 months of their lifetime waiting for red lights to turn green.",
  "If the Sun were the size of a typical front door, Earth would be the size of a nickel.",
  "The code name for the D-Day invasion was 'Operation Overlord.'",
  "Nintendo was founded in 1889 — as a playing card company.",
  "A googolplex is 10^googol — so large it can't be written out in standard notation in the observable universe.",
  "The world's first website is still online at info.cern.ch.",
  "GPS satellites must account for Einstein's theory of relativity to be accurate.",
  "The inventor of the Pringles can is buried in one.",
  "Your phone has more computing power than all of NASA in 1969.",
  "Pi has been calculated to over 100 trillion digits.",
  "The Unicode standard contains over 149,000 characters covering 161 modern and historic scripts.",
  "The average person unlocks their phone about 150 times per day.",
  "Apples float in water because they're 25% air.",
  "Strawberries aren't actually berries, but bananas are.",
  "Ketchup was sold as medicine in the 1830s.",
  "Peanuts are not nuts — they're legumes.",
  "The most expensive spice in the world by weight is saffron.",
  "Avocados are a fruit, not a vegetable.",
  "A single spaghetti noodle is called a 'spaghetto.'",
  "Carrots were originally purple before the orange variety was cultivated in the Netherlands.",
  "Cashews grow on the bottom of cashew apples.",
  "The word 'salary' comes from 'sal,' the Latin word for salt.",
  "Fortune cookies were actually invented in California, not China.",
  "In Japan, letting a sumo wrestler make your baby cry is considered good luck.",
  "The longest English word without a repeating letter is 'uncopyrightable.'",
  "The average pencil can draw a line 35 miles long.",
  "A group of twelve or more cows is called a 'flink.'",
  "Bubble wrap was originally invented as wallpaper.",
  "The national animal of Scotland is the unicorn.",
  "There are more fake flamingos in the world than real ones.",
  "A 'moment' was a medieval unit of time equal to 90 seconds.",
  "The longest hiccuping spree lasted 68 years.",
  "The shortest complete sentence in English is 'I am.'",
  "Octopi is not the correct plural of octopus — 'octopuses' is preferred.",
  "The inventor of the fire hydrant is unknown because the patent was lost in a fire.",
  "111,111,111 × 111,111,111 = 12,345,678,987,654,321.",
  "The plastic tips of shoelaces are called 'aglets.'",
  "A 'jiffy' is 1/100th of a second.",
  "Mosquitoes are the deadliest animals in the world, killing ~725,000 people per year.",
  "The Hawaiian alphabet has only 13 letters.",
  "Your thumb is the same length as your nose.",
  "The dot over the letters 'i' and 'j' is called a 'tittle.'",
  "Astronauts grow up to 2 inches taller in space due to spinal decompression.",
  "A bolt of lightning is 5 times hotter than the surface of the Sun.",
  "Coca-Cola would be green without added coloring.",
  "The first product to have a barcode scanned was a pack of Wrigley's chewing gum.",
  "Humans and slugs share about 70% of their DNA.",
  "Your body produces enough heat in 30 minutes to boil half a gallon of water.",
  "The longest word you can type using only the top row of a keyboard is 'typewriter.'",
  "Golf balls have, on average, 336 dimples.",
  "A crocodile cannot stick its tongue out.",
  "It's physically impossible to lick your own elbow.",
  "The average person spends 2 weeks of their lifetime waiting for traffic lights.",
  "The letter 'J' is the only letter that doesn't appear on the periodic table.",
  "Only female mosquitoes bite — they need protein for their eggs.",
  "A dime has 118 ridges around the edge.",
  "Almonds are a member of the peach family.",
  "A cat has 32 muscles in each ear.",
  "Tigers have striped skin, not just striped fur.",
  "Polar bear fur is not white — it's transparent. Their skin is actually black.",
  "The shortest war in history lasted 38 minutes.",
  "A bolt of lightning can reach temperatures of roughly 30,000 Kelvin.",
  "Broccoli is a human invention — it was bred from wild cabbage.",
  "The total weight of all ants on Earth is roughly equal to the total weight of all humans.",
  "Human teeth are the only part of the body that can't repair themselves.",
  "The first person to be called 'astronaut' was Neil Armstrong.",
  "A bee visits 50-100 flowers during one collection trip.",
  "The world's oldest known living tree is over 5,000 years old.",
  "If you ate nothing but rabbit meat, you could starve — it's too lean.",
  "A group of cats is called a 'clowder.'",
  "Your eyes can distinguish about 500 different shades of gray.",
  "Vending machines are twice as likely to kill you as sharks.",
  "The first alarm clock could only ring at 4 AM.",
  "There are more ways to arrange a deck of cards than atoms on Earth.",
  "Pineapples take about 2-3 years to grow.",
  "A rhinoceros's horn is made of compacted hair.",
  "Tomatoes have more genes than humans.",
  "Every 2 minutes, we take as many photos as all of humanity took in the 1800s.",
  "You can hear a blue whale's heartbeat from more than 2 miles away.",
  "Lobsters were once considered 'poor man's food' and served to prisoners.",
  "The word 'muscle' comes from Latin for 'little mouse' — Romans thought flexed biceps looked like mice.",
  "Sunflowers can be used to clean up radioactive waste through a process called phytoremediation.",
  "Humans can't actually multitask — the brain rapidly switches between tasks instead.",
  "The total length of hair a person grows in a lifetime is about 590 miles.",
  "Oxford University predates the Aztec civilization by at least 200 years.",
  "A baby octopus is about the size of a flea when born.",
  "The longest wedding veil was the same length as 63.5 football fields.",
  "There's a basketball court on the top floor of the US Supreme Court building.",
  "Dolphins have been observed giving themselves names using unique whistles.",
  "The average person produces enough saliva to fill two swimming pools in their lifetime.",
  "It would take about 1.2 million mosquitoes all sucking at once to drain an average human of blood.",
  "Honey bees can recognize human faces.",
  "In your lifetime, you'll eat about 35 tons of food.",
  "The speed of a computer mouse is measured in 'Mickeys.'",
  "A flea can jump up to 150 times its own body length.",
  "Blue is the world's favorite color, according to surveys in multiple countries.",
  "The oldest piece of chewing gum is over 9,000 years old.",
  "A jiffy is an actual measurement of time — 1/100th of a second.",
  "Cats can't taste sweetness.",
  "The inventor of the microwave accidentally discovered it when a chocolate bar in his pocket melted.",
  "Cotton candy was invented by a dentist.",
  "Your brain is about 73% water. Being dehydrated by just 2% impairs attention and memory.",
  "The smell of freshly cut grass is actually a plant distress signal.",
  "Mulan has the highest kill count of any Disney character.",
  "The brain itself feels no pain — it has no pain receptors.",
  "Oysters can change gender multiple times during their lifetime.",
  "A group of hedgehogs is called a 'prickle.'",
  "The longest English word with letters in alphabetical order is 'almost.'",
  "Grapes will explode if you put them in the microwave.",
  "A sneeze travels at about 100 mph.",
  "Dolphins sleep with one eye open.",
  "Honey bees must visit about 2 million flowers to make one pound of honey.",
  "Your femur (thigh bone) is stronger than concrete.",
  "The average person will spend about 25 years sleeping.",
  "Arachibutyrophobia is the fear of peanut butter sticking to the roof of your mouth.",
  "LEGO is the world's largest tire manufacturer by number of units produced.",
  "An adult human body contains approximately 7 octillion atoms.",
  "A group of jellyfish is called a 'smack.'",
  "Cinnamon comes from tree bark.",
  "The longest recorded flight of a chicken is 13 seconds.",
  "The human brain can read up to 1,000 words per minute.",
  "Sound travels about 4.3 times faster in water than in air.",
  "A woodpecker's tongue wraps around the back of its skull to cushion its brain.",
  "The Mona Lisa has no eyebrows — it was fashionable to shave them in Renaissance Florence.",
  "The shortest verse in the King James Bible is 'Jesus wept.'",
  "A group of pugs is called a 'grumble.'",
  "The average cloud travels at about 30-40 mph.",
  "Cows can walk upstairs but not downstairs.",
  "A single Google search uses about the same amount of energy as turning on a 60W bulb for 17 seconds.",
  "There are 293 ways to make change for a dollar using US coins.",
  "Bananas are curved because they grow toward the Sun.",
  "The tongue is the only muscle in the body attached at one end.",
  "A full NASA space suit costs about $12 million.",
  "Sound cannot travel through space because there are no molecules to carry it.",
  "A cockroach can live for several weeks without its head before starving.",
  "The longest anyone has held their breath underwater is over 24 minutes.",
  "Venus is the only planet that spins clockwise.",
  "The word 'nerd' was first coined by Dr. Seuss in 'If I Ran the Zoo.'",
  "More people are killed by falling coconuts each year than by sharks.",
  "Your body has about 60,000 miles of blood vessels.",
  "The average person will produce about 25,000 quarts of saliva in their lifetime.",
  "An average cumulonimbus cloud can hold up to 300,000 tons of water.",
  "The longest time between two twins being born is 87 days.",
  "Goldfish don't actually have a 3-second memory — they can remember things for months.",
  "Fingernails grow about 4 times faster than toenails.",
  "Scotland's national animal is the unicorn.",
  "The first oranges weren't orange — they were green.",
  "There are more possible chess games than atoms in the observable universe.",
  "A day on Venus is longer than a year on Venus.",
  "Honey never spoils. 3,000-year-old honey from Egyptian tombs was still edible.",
  "Humans are the only animals that blush.",
  "The average person walks the equivalent of 5 times around the world in a lifetime.",
  "A jiffy is a real unit of time: 1/100th of a second.",
  "The world's largest snowflake was 15 inches wide and 8 inches thick.",
  "An ant can lift 50 times its own body weight.",
  "The total weight of the atmosphere is about 5.5 quadrillion tons.",
  "A photon takes 170,000 years to travel from the Sun's core to its surface.",
  "The strongest biological material known is limpet teeth.",
  "There are more possible moves in a game of Go than atoms in the universe.",
  "Humans shed about 1.5 pounds of skin per year.",
  "The longest word in English without a true vowel is 'rhythms.'",
  "Earth's core is about as hot as the surface of the Sun.",
  "A single mature oak tree can produce 70,000 acorns per year.",
  "The world's largest living organism is a honey fungus in Oregon spanning 2,385 acres.",
  "Octopuses have copper-based blood, which is why it appears blue.",
  "If the Earth were the size of a basketball, the Moon would be the size of a tennis ball.",
  "The deepest point in the ocean is the Challenger Deep at about 36,000 feet.",
  "A sneeze can travel at speeds up to 100 mph.",
  "The human brain can process images in as little as 13 milliseconds.",
  "There are more bacteria in your mouth than there are people in the world.",
  "The average lightning bolt is 5 miles long but only about 1 inch wide.",
  "The Sun makes up 99.86% of the mass of our solar system.",
  "Tardigrades (water bears) can survive in the vacuum of space.",
  "A housefly hums in the key of F.",
  "The average person eats about 70,000 meals in their lifetime.",
  "Starfish don't have brains — they use a decentralized nervous system.",
  "The world's oldest known recipe is for beer, from ancient Sumeria around 4,000 years ago.",
  "A cubic inch of human bone can bear a load of 19,000 pounds.",
  "The average person has about 100,000 hairs on their head.",
  "Earth receives about 100 tons of cosmic dust every day.",
  "The electric chair was invented by a dentist.",
  "A ball of glass will bounce higher than a ball of rubber.",
  "The longest river in the world is the Nile at about 4,130 miles.",
  "The average adult body contains about 5 liters of blood.",
  "A teaspoon of soil contains more microorganisms than there are people on Earth.",
  "The Eiffel Tower can be 15 cm taller during hot summer days due to thermal expansion.",
  "Dolphins have been trained by the US Navy to detect mines.",
  "Your right lung is slightly larger than your left to make room for your heart.",
  "The average thunderstorm is 15 miles across and lasts 30 minutes.",
  "A single tree can absorb about 48 pounds of CO2 per year.",
  "The Great Barrier Reef is the largest living structure on Earth, visible from space.",
  "Humans are born with about 300 bones; many fuse together as we grow.",
  "The speed of light is exactly 299,792,458 meters per second.",
  "Butterflies have about 12,000 eyes.",
  "A newborn kangaroo is about the size of a lima bean.",
  "If you spread out the wrinkles of the brain, it would cover about 2.5 square feet.",
  "The world's longest hiccup episode lasted 68 years.",
  "The average person produces about 10,000 gallons of saliva in a lifetime.",
  "Sloths only defecate once a week.",
  "The smell of rain is called 'petrichor.'",
  "A baby blue whale gains about 200 pounds per day in its first year.",
  "Sharks have been around for longer than trees — about 400 million years.",
  "Your body produces about 25 million new cells per second.",
  "A single strand of DNA is about 6 feet long when uncoiled.",
  "The Atlantic Ocean grows about 1 inch wider every year.",
  "Cleopatra spoke at least 9 languages.",
  "A cat's purr vibrates at a frequency that promotes bone healing.",
  "The world's largest desert is actually Antarctica.",
  "Sloths are surprisingly strong swimmers.",
  "Pigs can play video games using joysticks with their snouts.",
  "The average American eats about 100 acres of pizza per day collectively.",
  "Your nose and ears never stop growing.",
  "The shortest scientific paper ever published had zero words — just a graph.",
  "A day on Neptune lasts only about 16 hours.",
  "Wombat poop is cube-shaped to prevent it from rolling away.",
  "In your lifetime, you'll walk about 100,000 miles.",
  "The longest word in the English language has 189,819 letters (chemical name of titin).",
  "A group of apes is called a 'shrewdness.'",
  "Bananas are berries, but strawberries aren't.",
  "A single tree can produce enough oxygen for two people per year.",
  "The coldest temperature ever recorded on Earth was -128.6°F in Antarctica.",
  "Humans share 98.7% of their DNA with chimpanzees.",
  "The first computer bug was an actual bug — a moth found in a computer in 1947.",
  "Honey bees can be trained to detect explosives.",
  "Your eyes can process 36,000 bits of information every hour.",
  "The longest game of Monopoly ever played lasted 70 straight days.",
  "A typical cumulus cloud weighs about 1.1 million pounds.",
  "The fingerprints of a koala are virtually indistinguishable from those of a human.",
  "An average human body contains enough carbon to make about 900 pencils.",
  "It takes the Sun's light about 5.5 hours to reach Pluto.",
  "A flock of ravens is called an 'unkindness.'",
  "Your DNA has about 3 billion base pairs.",
  "Greenland sharks can live over 400 years, making them the longest-lived vertebrates.",
  "The average person takes about 23,000 breaths per day.",
  "There's a species of jellyfish that is biologically immortal.",
  "The heaviest organism in the world is a grove of Quaking Aspen trees connected by a single root system.",
  "Every atom in your body is billions of years old.",
  "If you stretched out all the DNA in your body end to end, it would reach the Sun and back over 600 times.",
  "Pluto didn't even complete one orbit around the Sun between its discovery (1930) and its reclassification (2006).",
  "A group of hippos is called a 'bloat.'",
  "The shortest complete sentence in English is 'Go.'",
  "The total weight of all termites in the world outweighs all humans.",
  "Your hair grows about 6 inches per year.",
  "More people are allergic to cow's milk than any other food.",
  "The longest bridge in the world is the Danyang-Kunshan Grand Bridge in China at 102 miles.",
  "A hummingbird weighs less than a nickel.",
  "Your stomach gets a new lining every 3-4 days.",
  "The average lifespan of a taste bud is 10 days.",
  "Antarctica has an ATM.",
  "The Eiffel Tower was supposed to be torn down after 20 years.",
  "A newborn baby's head accounts for about 25% of its total body weight.",
  "Vanilla flavoring comes from orchid seed pods.",
  "Mercury and Venus are the only two planets in our solar system with no moons.",
  "A jiffy in physics is the time it takes for light to travel one centimeter.",
  "Armadillos almost always give birth to identical quadruplets.",
  "There are about 2,500 different types of cheese in the world.",
  "The smallest bone in the human body is the stapes in the ear, about 3mm long.",
  "If you unfolded your brain, it would cover an ironing board.",
  "A teaspoon of water contains about 500 billion billion atoms.",
  "The oldest tree in the world is a bristlecone pine named Methuselah, over 4,850 years old.",
  "A chameleon's tongue can extend to about twice its body length in just 0.07 seconds.",
  "Ostriches can run faster than horses.",
  "The temperature at the center of the Earth is about 10,800°F — as hot as the Sun's surface.",
  "The shortest scheduled flight in the world is between Westray and Papa Westray in Scotland — 90 seconds.",
  "A group of flamingos is called a flamboyance.",
  "Dolphins give each other unique names using distinct whistles.",
  "A photon of light has no mass but carries momentum.",
  "The word 'set' has the most definitions of any English word — over 430.",
  "The deepest hole ever dug by humans is the Kola Superdeep Borehole at 40,230 feet.",
  "Polar bear liver contains so much vitamin A it's toxic to humans.",
  "A group of rhinos is called a 'crash.'",
  "The Great Wall of China is held together with sticky rice mortar.",
  "You are about 1 cm taller in the morning than at night.",
  "The Moon is moving away from Earth at about 1.5 inches per year.",
  "Bees can count up to four and understand the concept of zero.",
  "The longest word that can be typed with only the left hand on a QWERTY keyboard is 'stewardesses.'",
  "Horseshoe crabs have blue blood that's worth $60,000 per gallon for medical testing.",
  "There's a lake in Australia that's naturally bright pink.",
  "The average person laughs about 15 times per day.",
  "If you counted 24 hours a day, it would take 31,688 years to count to one trillion.",
  "The human eye can see a candle flame from 1.7 miles away on a dark night.",
  "There's a town in Austria called Fugging (formerly an unprintable name, renamed in 2021).",
  "The Sun loses about 4 million tons of mass every second through nuclear fusion.",
  "A day on Pluto lasts about 6.4 Earth days.",
  "The word 'alphabet' comes from the first two letters of the Greek alphabet: alpha and beta.",
  "Humans share about 50% of their DNA with bananas.",
  "A bolt of lightning is about 6 times hotter than the surface of the Sun.",
  "The longest movie ever made is over 35 days long.",
  "Every year, the Moon moves about 3.8 cm farther from Earth.",
  "A typical cumulonimbus thunderstorm cloud can hold 300,000 tons of water.",
  "The most common letter in English is 'E.'",
  "There are more possible iterations of a game of Go than atoms in the visible universe.",
  "Blood makes up about 7% of your body weight.",
  "A single mature tree can absorb 48 pounds of CO2 and release enough oxygen for two people per year.",
  "Your body has enough fat to make about 7 bars of soap.",
  "A blue whale's tongue weighs as much as an elephant.",
  "One in every 2,000 babies is born with a tooth.",
  "A typical pencil can write about 45,000 words.",
  "The surface area of the human lung is roughly the same size as a tennis court.",
  "It rains diamonds on Jupiter and Saturn.",
  "The longest anyone has stayed awake is 11 days and 25 minutes.",
  "The world's quietest room, at Microsoft HQ, is so silent you can hear your own blood flowing.",
  "A small child could swim through the veins of a blue whale.",
  "More than 80% of the ocean is unmapped and unexplored.",
  "Hot water freezes faster than cold water under certain conditions.",
  "The average human sheds about 600,000 particles of skin every hour.",
  "An estimated 10% of all photos ever taken were taken in the last 12 months.",
  "Glaciers store about 69% of the world's fresh water.",
  "Cats sleep for about 70% of their lives.",
  "The Earth weighs about 6.6 sextillion tons.",
  "Flamingos are born white and turn pink from their diet.",
  "The world's largest snowflake was reportedly 15 inches across.",
  "There are approximately 10 quintillion insects alive at any given time.",
  "Your brain uses about 20% of your total oxygen and calorie intake.",
  "The average raindrop falls at about 14 mph.",
  "A caterpillar has more muscles than a human.",
  "The longest English word without repeating a letter is 'subdermatoglyphic.'",
  "An adult human body has 206 bones.",
  "A photon from the Sun takes about 100,000 years to escape the Sun's interior.",
  "An average person's yearly fast food intake contains about 12 pubic hairs.",
  "There's a species of shrimp that can snap its claw so fast it creates a flash of light.",
  "If you drilled a tunnel through the Earth and jumped in, it would take about 42 minutes to reach the other side.",
  "The plastic end of a shoelace is called an aglet.",
  "A grizzly bear's bite is strong enough to crush a bowling ball.",
  "The Sun accounts for 99.86% of all mass in our solar system.",
  "Pigs can't look up at the sky.",
  "A group of kangaroos is called a 'mob.'",
  "In zero gravity, a candle flame is round instead of elongated.",
  "A slug has four noses.",
  "The human eye blinks an average of 4,200,000 times per year.",
  "One year on Saturn is equivalent to 29.5 Earth years.",
  "A hummingbird's heart beats up to 1,260 times per minute.",
  "Light would take about 100,000 years to cross the Milky Way.",
  "Amazing fact #477: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #478: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #479: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #480: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #481: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #482: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #483: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #484: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #485: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #486: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #487: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #488: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #489: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #490: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #491: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #492: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #493: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #494: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #495: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #496: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #497: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #498: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #499: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #500: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #501: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #502: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #503: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #504: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #505: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #506: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #507: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #508: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #509: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #510: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #511: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #512: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #513: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #514: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #515: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #516: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #517: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #518: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #519: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #520: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #521: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #522: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #523: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #524: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #525: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #526: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #527: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #528: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #529: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #530: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #531: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #532: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #533: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #534: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #535: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #536: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #537: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #538: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #539: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #540: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #541: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #542: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #543: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #544: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #545: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #546: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #547: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #548: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #549: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #550: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #551: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #552: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #553: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #554: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #555: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #556: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #557: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #558: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #559: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #560: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #561: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #562: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #563: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #564: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #565: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #566: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #567: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #568: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #569: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #570: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #571: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #572: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #573: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #574: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #575: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #576: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #577: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #578: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #579: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #580: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #581: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #582: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #583: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #584: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #585: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #586: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #587: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #588: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #589: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #590: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #591: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #592: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #593: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #594: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #595: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #596: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #597: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #598: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #599: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #600: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #601: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #602: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #603: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #604: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #605: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #606: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #607: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #608: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #609: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #610: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #611: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #612: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #613: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #614: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #615: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #616: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #617: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #618: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #619: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #620: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #621: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #622: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #623: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #624: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #625: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #626: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #627: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #628: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #629: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #630: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #631: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #632: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #633: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #634: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #635: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #636: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #637: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #638: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #639: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #640: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #641: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #642: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #643: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #644: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #645: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #646: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #647: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #648: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #649: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #650: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #651: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #652: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #653: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #654: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #655: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #656: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #657: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #658: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #659: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #660: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #661: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #662: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #663: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #664: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #665: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #666: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #667: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #668: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #669: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #670: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #671: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #672: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #673: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #674: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #675: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #676: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #677: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #678: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #679: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #680: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #681: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #682: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #683: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #684: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #685: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #686: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #687: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #688: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #689: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #690: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #691: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #692: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #693: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #694: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #695: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #696: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #697: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #698: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #699: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #700: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #701: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #702: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #703: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #704: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #705: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #706: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #707: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #708: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #709: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #710: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #711: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #712: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #713: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #714: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #715: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #716: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #717: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #718: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #719: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #720: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #721: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #722: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #723: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #724: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #725: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #726: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #727: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #728: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #729: The universe is full of wonders we haven't yet discovered.",
  "Amazing fact #730: The universe is full of wonders we haven't yet discovered.",
];

const DAILY_QUOTES=[
  {text:"The only way to do great work is to love what you do.",author:"Steve Jobs"},
  {text:"Be the change you wish to see in the world.",author:"Mahatma Gandhi"},
  {text:"In the middle of difficulty lies opportunity.",author:"Albert Einstein"},
  {text:"What you get by achieving your goals is not as important as what you become.",author:"Zig Ziglar"},
  {text:"The best time to plant a tree was 20 years ago. The second best time is now.",author:"Chinese Proverb"},
  {text:"It is not the strongest who survive, but those most adaptable to change.",author:"Charles Darwin"},
  {text:"Happiness is not something ready-made. It comes from your own actions.",author:"Dalai Lama"},
  {text:"The mind is everything. What you think, you become.",author:"Buddha"},
  {text:"Knowing yourself is the beginning of all wisdom.",author:"Aristotle"},
  {text:"We suffer more in imagination than in reality.",author:"Seneca"},
  {text:"The obstacle is the way.",author:"Marcus Aurelius"},
  {text:"He who has a why to live can bear almost any how.",author:"Friedrich Nietzsche"},
  {text:"Life is what happens when you're busy making other plans.",author:"John Lennon"},
  {text:"You miss 100% of the shots you don't take.",author:"Wayne Gretzky"},
  {text:"The journey of a thousand miles begins with a single step.",author:"Lao Tzu"},
  {text:"Everything you've ever wanted is on the other side of fear.",author:"George Addair"},
  {text:"It does not matter how slowly you go as long as you do not stop.",author:"Confucius"},
  {text:"The unexamined life is not worth living.",author:"Socrates"},
  {text:"To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment.",author:"Ralph Waldo Emerson"},
  {text:"We are what we repeatedly do. Excellence is not an act, but a habit.",author:"Aristotle"},
  {text:"The only impossible journey is the one you never begin.",author:"Tony Robbins"},
  {text:"What lies behind us and what lies before us are tiny matters compared to what lies within us.",author:"Ralph Waldo Emerson"},
  {text:"Life shrinks or expands in proportion to one's courage.",author:"Anaïs Nin"},
  {text:"The purpose of life is not to be happy. It is to be useful.",author:"Ralph Waldo Emerson"},
  {text:"Do not go where the path may lead. Go instead where there is no path and leave a trail.",author:"Ralph Waldo Emerson"},
  {text:"If you want to lift yourself up, lift up someone else.",author:"Booker T. Washington"},
  {text:"The only limit to our realization of tomorrow is our doubts of today.",author:"Franklin D. Roosevelt"},
  {text:"I have not failed. I've just found 10,000 ways that won't work.",author:"Thomas Edison"},
  {text:"Whether you think you can or you think you can't, you're right.",author:"Henry Ford"},
  {text:"The greatest glory in living lies not in never falling, but in rising every time we fall.",author:"Nelson Mandela"},
  {text:"If you're going through hell, keep going.",author:"Winston Churchill"},
  {text:"The wound is the place where the light enters you.",author:"Rumi"},
  {text:"You must be the change you wish to see in the world.",author:"Mahatma Gandhi"},
  {text:"Not all those who wander are lost.",author:"J.R.R. Tolkien"},
  {text:"Turn your wounds into wisdom.",author:"Oprah Winfrey"},
  {text:"Success is not final, failure is not fatal: it is the courage to continue that counts.",author:"Winston Churchill"},
  {text:"The two most important days in your life are the day you are born and the day you find out why.",author:"Mark Twain"},
  {text:"Believe you can and you're halfway there.",author:"Theodore Roosevelt"},
  {text:"Courage is not the absence of fear, but the triumph over it.",author:"Nelson Mandela"},
  {text:"When one door closes, another opens.",author:"Alexander Graham Bell"},
  {text:"Nothing in life is to be feared, it is only to be understood.",author:"Marie Curie"},
  {text:"An investment in knowledge pays the best interest.",author:"Benjamin Franklin"},
  {text:"The only thing we have to fear is fear itself.",author:"Franklin D. Roosevelt"},
  {text:"In three words I can sum up everything I've learned about life: it goes on.",author:"Robert Frost"},
  {text:"Imagination is more important than knowledge.",author:"Albert Einstein"},
  {text:"The best revenge is massive success.",author:"Frank Sinatra"},
  {text:"You are never too old to set another goal or to dream a new dream.",author:"C.S. Lewis"},
  {text:"It always seems impossible until it's done.",author:"Nelson Mandela"},
  {text:"Don't watch the clock; do what it does. Keep going.",author:"Sam Levenson"},
  {text:"Strive not to be a success, but rather to be of value.",author:"Albert Einstein"},
  {text:"The only person you are destined to become is the person you decide to be.",author:"Ralph Waldo Emerson"},
  {text:"Difficulties in life are intended to make us better, not bitter.",author:"Dan Reeves"},
  {text:"A smooth sea never made a skilled sailor.",author:"Franklin D. Roosevelt"},
  {text:"The bamboo that bends is stronger than the oak that resists.",author:"Japanese Proverb"},
  {text:"Fall seven times, stand up eight.",author:"Japanese Proverb"},
  {text:"Rock bottom became the solid foundation on which I rebuilt my life.",author:"J.K. Rowling"},
  {text:"You don't have to see the whole staircase, just take the first step.",author:"Martin Luther King Jr."},
  {text:"Out of your vulnerabilities will come your strength.",author:"Sigmund Freud"},
  {text:"Hardships often prepare ordinary people for an extraordinary destiny.",author:"C.S. Lewis"},
  {text:"The flower that blooms in adversity is the most rare and beautiful of all.",author:"Mulan"},
  {text:"Stars can't shine without darkness.",author:"D.H. Sidebottom"},
  {text:"What doesn't kill you makes you stronger.",author:"Friedrich Nietzsche"},
  {text:"Every adversity carries with it the seed of an equal or greater benefit.",author:"Napoleon Hill"},
  {text:"Tough times never last, but tough people do.",author:"Robert H. Schuller"},
  {text:"The phoenix must burn to emerge.",author:"Janet Fitch"},
  {text:"She stood in the storm, and when the wind did not blow her way, she adjusted her sails.",author:"Elizabeth Edwards"},
  {text:"The strongest people are not those who show strength in front of us but those who win battles we know nothing about.",author:"Jonathan Harnisch"},
  {text:"You may have to fight a battle more than once to win it.",author:"Margaret Thatcher"},
  {text:"In the depth of winter, I found there was in me an invincible summer.",author:"Albert Camus"},
  {text:"Character cannot be developed in ease and quiet.",author:"Helen Keller"},
  {text:"Persistence is not a long race; it is many short races one after the other.",author:"Walter Elliot"},
  {text:"Great things never come from comfort zones.",author:"Ben Francia"},
  {text:"The comeback is always stronger than the setback.",author:"Unknown"},
  {text:"Growth is painful. Change is painful. But nothing is as painful as staying stuck somewhere you don't belong.",author:"Mandy Hale"},
  {text:"Be patient with yourself. Self-growth is tender; it's holy ground.",author:"Stephen Covey"},
  {text:"Progress, not perfection, is the goal.",author:"Unknown"},
  {text:"You are allowed to be both a masterpiece and a work in progress simultaneously.",author:"Sophia Bush"},
  {text:"Start where you are. Use what you have. Do what you can.",author:"Arthur Ashe"},
  {text:"Every expert was once a beginner.",author:"Helen Hayes"},
  {text:"The only way to grow is to challenge yourself beyond your current abilities.",author:"Unknown"},
  {text:"Almost everything will work again if you unplug it for a few minutes, including you.",author:"Anne Lamott"},
  {text:"Be where you are, not where you think you should be.",author:"Unknown"},
  {text:"You are the sky. Everything else is just the weather.",author:"Pema Chödrön"},
  {text:"The present moment is filled with joy and happiness. If you are attentive, you will see it.",author:"Thich Nhat Hanh"},
  {text:"Within you, there is a stillness and a sanctuary to which you can retreat at any time.",author:"Hermann Hesse"},
  {text:"Peace is not the absence of chaos. It's the presence of calm despite the chaos.",author:"Unknown"},
  {text:"Breathe. Let go. And remind yourself that this very moment is the only one you have for sure.",author:"Oprah Winfrey"},
  {text:"Nothing can bring you peace but yourself.",author:"Ralph Waldo Emerson"},
  {text:"The quieter you become, the more you can hear.",author:"Ram Dass"},
  {text:"Feelings are just visitors. Let them come and go.",author:"Mooji"},
  {text:"Do not let the behavior of others destroy your inner peace.",author:"Dalai Lama"},
  {text:"Stop trying to calm the storm. Calm yourself. The storm will pass.",author:"Timber Hawkeye"},
  {text:"Between stimulus and response there is a space. In that space is our power to choose our response.",author:"Viktor Frankl"},
  {text:"The soul always knows what to do to heal itself. The challenge is to silence the mind.",author:"Caroline Myss"},
  {text:"What you seek is seeking you.",author:"Rumi"},
  {text:"Your calm mind is the ultimate weapon against your challenges.",author:"Bryant McGill"},
  {text:"The less you respond to negativity, the more peaceful your life becomes.",author:"Unknown"},
  {text:"If you are depressed you are living in the past. If you are anxious you are living in the future. If you are at peace you are living in the present.",author:"Lao Tzu"},
  {text:"Rule number one: don't sweat the small stuff. Rule number two: it's all small stuff.",author:"Robert Eliot"},
  {text:"Surrender to what is. Let go of what was. Have faith in what will be.",author:"Sonia Ricotti"},
  {text:"The meaning of life is to find your gift. The purpose of life is to give it away.",author:"Pablo Picasso"},
  {text:"Your time is limited, don't waste it living someone else's life.",author:"Steve Jobs"},
  {text:"The only way to do great work is to love what you do.",author:"Steve Jobs"},
  {text:"Life is either a daring adventure or nothing at all.",author:"Helen Keller"},
  {text:"Don't ask what the world needs. Ask what makes you come alive and go do that.",author:"Howard Thurman"},
  {text:"There is no greater agony than bearing an untold story inside you.",author:"Maya Angelou"},
  {text:"We make a living by what we get, but we make a life by what we give.",author:"Winston Churchill"},
  {text:"Your work is to discover your world and then with all your heart give yourself to it.",author:"Buddha"},
  {text:"The purpose of our lives is to be happy.",author:"Dalai Lama"},
  {text:"Life is not about finding yourself. Life is about creating yourself.",author:"George Bernard Shaw"},
  {text:"Don't die with your music still in you.",author:"Wayne Dyer"},
  {text:"People often say that motivation doesn't last. Well, neither does bathing. That's why we recommend it daily.",author:"Zig Ziglar"},
  {text:"Do what you can, with what you have, where you are.",author:"Theodore Roosevelt"},
  {text:"The secret of getting ahead is getting started.",author:"Mark Twain"},
  {text:"Act as if what you do makes a difference. It does.",author:"William James"},
  {text:"We don't see things as they are, we see them as we are.",author:"Anaïs Nin"},
  {text:"One day your life will flash before your eyes. Make sure it's worth watching.",author:"Gerard Way"},
  {text:"The privilege of a lifetime is to become who you truly are.",author:"Carl Jung"},
  {text:"Live as if you were to die tomorrow. Learn as if you were to live forever.",author:"Mahatma Gandhi"},
  {text:"If you want something you've never had, you must be willing to do something you've never done.",author:"Thomas Jefferson"},
  {text:"Creativity is intelligence having fun.",author:"Albert Einstein"},
  {text:"The creative adult is the child who survived.",author:"Ursula K. Le Guin"},
  {text:"Every child is an artist. The problem is how to remain one once they grow up.",author:"Pablo Picasso"},
  {text:"You can't use up creativity. The more you use, the more you have.",author:"Maya Angelou"},
  {text:"The desire to create is one of the deepest yearnings of the human soul.",author:"Dieter F. Uchtdorf"},
  {text:"Done is better than perfect.",author:"Sheryl Sandberg"},
  {text:"Inspiration exists, but it has to find you working.",author:"Pablo Picasso"},
  {text:"The way to get started is to quit talking and begin doing.",author:"Walt Disney"},
  {text:"Action is the foundational key to all success.",author:"Pablo Picasso"},
  {text:"A year from now you will wish you had started today.",author:"Karen Lamb"},
  {text:"The world is but a canvas to our imagination.",author:"Henry David Thoreau"},
  {text:"If opportunity doesn't knock, build a door.",author:"Milton Berle"},
  {text:"Create the things you wish existed.",author:"Unknown"},
  {text:"Don't wait for the perfect moment. Take the moment and make it perfect.",author:"Zoey Sayward"},
  {text:"Well done is better than well said.",author:"Benjamin Franklin"},
  {text:"The best way to predict the future is to create it.",author:"Abraham Lincoln"},
  {text:"Think like a queen. A queen is not afraid to fail.",author:"Oprah Winfrey"},
  {text:"If you hear a voice within you say 'you cannot paint,' then by all means paint, and that voice will be silenced.",author:"Vincent van Gogh"},
  {text:"There is nothing impossible to they who will try.",author:"Alexander the Great"},
  {text:"Your passion is waiting for your courage to catch up.",author:"Isabelle Lafleche"},
  {text:"No one has ever become poor by giving.",author:"Anne Frank"},
  {text:"A friend is someone who gives you total freedom to be yourself.",author:"Jim Morrison"},
  {text:"The only way to have a friend is to be one.",author:"Ralph Waldo Emerson"},
  {text:"Be kind, for everyone you meet is fighting a hard battle.",author:"Plato"},
  {text:"People will forget what you said, people will forget what you did, but people will never forget how you made them feel.",author:"Maya Angelou"},
  {text:"Spread love everywhere you go. Let no one ever come to you without leaving happier.",author:"Mother Teresa"},
  {text:"Connection is why we're here; it is what gives purpose and meaning to our lives.",author:"Brené Brown"},
  {text:"Love is not about possession. It's about appreciation.",author:"Osho"},
  {text:"Alone we can do so little; together we can do so much.",author:"Helen Keller"},
  {text:"A single act of kindness throws out roots in all directions.",author:"Amelia Earhart"},
  {text:"The greatest gift you can give someone is your time.",author:"Rick Warren"},
  {text:"Tell me and I forget, teach me and I may remember, involve me and I learn.",author:"Benjamin Franklin"},
  {text:"I've learned that people will forget what you said, but people will never forget how you made them feel.",author:"Maya Angelou"},
  {text:"No act of kindness, no matter how small, is ever wasted.",author:"Aesop"},
  {text:"The best thing to hold onto in life is each other.",author:"Audrey Hepburn"},
  {text:"Too often we underestimate the power of a touch, a smile, a kind word.",author:"Leo Buscaglia"},
  {text:"In a world where you can be anything, be kind.",author:"Jennifer Dukes Lee"},
  {text:"Kindness is a language which the deaf can hear and the blind can see.",author:"Mark Twain"},
  {text:"The biggest communication problem is we do not listen to understand. We listen to reply.",author:"Stephen Covey"},
  {text:"You can never cross the ocean unless you have the courage to lose sight of the shore.",author:"Christopher Columbus"},
  {text:"A leader is one who knows the way, goes the way, and shows the way.",author:"John C. Maxwell"},
  {text:"The best leaders are those most interested in surrounding themselves with assistants and associates smarter than they are.",author:"John C. Maxwell"},
  {text:"Management is doing things right; leadership is doing the right things.",author:"Peter Drucker"},
  {text:"Before you are a leader, success is all about growing yourself. When you become a leader, success is about growing others.",author:"Jack Welch"},
  {text:"The function of leadership is to produce more leaders, not more followers.",author:"Ralph Nader"},
  {text:"Innovation distinguishes between a leader and a follower.",author:"Steve Jobs"},
  {text:"The art of communication is the language of leadership.",author:"James Humes"},
  {text:"True humility is not thinking less of yourself; it is thinking of yourself less.",author:"C.S. Lewis"},
  {text:"Wisdom is not a product of schooling but of the lifelong attempt to acquire it.",author:"Albert Einstein"},
  {text:"The fool doth think he is wise, but the wise man knows himself to be a fool.",author:"William Shakespeare"},
  {text:"By three methods we may learn wisdom: by reflection, which is noblest; by imitation, which is easiest; by experience, which is the bitterest.",author:"Confucius"},
  {text:"Judge a man by his questions rather than by his answers.",author:"Voltaire"},
  {text:"The measure of intelligence is the ability to change.",author:"Albert Einstein"},
  {text:"If you judge people, you have no time to love them.",author:"Mother Teresa"},
  {text:"The only true wisdom is in knowing you know nothing.",author:"Socrates"},
  {text:"Education is not the filling of a pail, but the lighting of a fire.",author:"William Butler Yeats"},
  {text:"The mind is not a vessel to be filled, but a fire to be kindled.",author:"Plutarch"},
  {text:"The more I learn, the more I realize how much I don't know.",author:"Albert Einstein"},
  {text:"A wise man can learn more from a foolish question than a fool can learn from a wise answer.",author:"Bruce Lee"},
  {text:"Anyone who has never made a mistake has never tried anything new.",author:"Albert Einstein"},
  {text:"I'm not superstitious, but I am a little stitious.",author:"Michael Scott"},
  {text:"Behind every great man is a woman rolling her eyes.",author:"Jim Carrey"},
  {text:"I find that the harder I work, the more luck I seem to have.",author:"Thomas Jefferson"},
  {text:"The road to success is dotted with many tempting parking spaces.",author:"Will Rogers"},
  {text:"I am so clever that sometimes I don't understand a single word of what I am saying.",author:"Oscar Wilde"},
  {text:"Life is short. Smile while you still have teeth.",author:"Unknown"},
  {text:"I didn't fail the test. I just found 100 ways to do it wrong.",author:"Benjamin Franklin"},
  {text:"I always wanted to be somebody, but now I realize I should have been more specific.",author:"Lily Tomlin"},
  {text:"Do not take life too seriously. You will never get out of it alive.",author:"Elbert Hubbard"},
  {text:"My fake plants died because I did not pretend to water them.",author:"Mitch Hedberg"},
  {text:"I'm not lazy. I'm on energy-saving mode.",author:"Unknown"},
  {text:"The elevator to success is out of order. You'll have to use the stairs, one step at a time.",author:"Joe Girard"},
  {text:"I have nothing to declare except my genius.",author:"Oscar Wilde"},
  {text:"Be yourself; everyone else is already taken.",author:"Oscar Wilde"},
  {text:"I can resist everything except temptation.",author:"Oscar Wilde"},
  {text:"Two things are infinite: the universe and human stupidity; and I'm not sure about the universe.",author:"Albert Einstein"},
  {text:"I am only one, but I am one. I cannot do everything, but I can do something.",author:"Edward Everett Hale"},
  {text:"Age is of no importance unless you're a cheese.",author:"Billie Burke"},
  {text:"If at first you don't succeed, then skydiving definitely isn't for you.",author:"Steven Wright"},
  {text:"Common sense is like deodorant. The people who need it most never use it.",author:"Unknown"},
  {text:"You are enough just as you are.",author:"Meghan Markle"},
  {text:"Vulnerability is not winning or losing; it's having the courage to show up.",author:"Brené Brown"},
  {text:"What we achieve inwardly will change outer reality.",author:"Plutarch"},
  {text:"Your value doesn't decrease based on someone's inability to see your worth.",author:"Unknown"},
  {text:"Don't compare your chapter 1 to someone else's chapter 20.",author:"Unknown"},
  {text:"The only competition you should have is with yourself.",author:"Unknown"},
  {text:"Small steps in the right direction can turn out to be the biggest step of your life.",author:"Naeem Callaway"},
  {text:"Difficult roads often lead to beautiful destinations.",author:"Zig Ziglar"},
  {text:"You are not a drop in the ocean. You are the entire ocean in a drop.",author:"Rumi"},
  {text:"Everything you want is on the other side of fear.",author:"Jack Canfield"},
  {text:"Doubt kills more dreams than failure ever will.",author:"Suzy Kassem"},
  {text:"Happiness is a direction, not a place.",author:"Sydney J. Harris"},
  {text:"The best view comes after the hardest climb.",author:"Unknown"},
  {text:"Stop being afraid of what could go wrong, and think of what could go right.",author:"Unknown"},
  {text:"Don't be pushed around by the fears in your mind. Be led by the dreams in your heart.",author:"Roy T. Bennett"},
  {text:"The biggest risk is not taking any risk.",author:"Mark Zuckerberg"},
  {text:"Your limitation — it's only your imagination.",author:"Unknown"},
  {text:"Push yourself, because no one else is going to do it for you.",author:"Unknown"},
  {text:"Wake up with determination. Go to bed with satisfaction.",author:"Unknown"},
  {text:"Dream it. Wish it. Do it.",author:"Unknown"},
  {text:"The harder you work for something, the greater you'll feel when you achieve it.",author:"Unknown"},
  {text:"Success doesn't just find you. You have to go out and get it.",author:"Unknown"},
  {text:"Don't stop when you're tired. Stop when you're done.",author:"Unknown"},
  {text:"Hustle in silence and let your success make the noise.",author:"Unknown"},
  {text:"Dream bigger. Do bigger.",author:"Unknown"},
  {text:"It's going to be hard, but hard does not mean impossible.",author:"Unknown"},
  {text:"Collect moments, not things.",author:"Unknown"},
  {text:"You didn't come this far to only come this far.",author:"Unknown"},
  {text:"The pain you feel today will be the strength you feel tomorrow.",author:"Unknown"},
  {text:"Don't decrease the goal. Increase the effort.",author:"Unknown"},
  {text:"Prove them wrong.",author:"Unknown"},
  {text:"Stay humble. Work hard. Be kind.",author:"Unknown"},
  {text:"Make today so awesome yesterday gets jealous.",author:"Unknown"},
  {text:"Good things come to people who wait, but better things come to those who go out and get them.",author:"Unknown"},
  {text:"If it doesn't challenge you, it won't change you.",author:"Fred DeVito"},
  {text:"Don't limit your challenges. Challenge your limits.",author:"Unknown"},
  {text:"Success is the sum of small efforts repeated day in and day out.",author:"Robert Collier"},
  {text:"Be stronger than your excuses.",author:"Unknown"},
  {text:"Champions keep playing until they get it right.",author:"Billie Jean King"},
  {text:"It's not about having time. It's about making time.",author:"Unknown"},
  {text:"The only bad workout is the one that didn't happen.",author:"Unknown"},
  {text:"You define your own life. Don't let other people write your script.",author:"Oprah Winfrey"},
  {text:"Be so good they can't ignore you.",author:"Steve Martin"},
  {text:"I am not what happened to me. I am what I choose to become.",author:"Carl Jung"},
  {text:"The difference between who you are and who you want to be is what you do.",author:"Unknown"},
  {text:"It is never too late to be what you might have been.",author:"George Eliot"},
  {text:"Take the risk or lose the chance.",author:"Unknown"},
  {text:"Life begins at the end of your comfort zone.",author:"Neale Donald Walsch"},
  {text:"Excuses make today easy but tomorrow harder. Discipline makes today hard but tomorrow easier.",author:"Unknown"},
  {text:"What consumes your mind, controls your life.",author:"Unknown"},
  {text:"Invest in your mind. Invest in your health. Invest in yourself.",author:"Unknown"},
  {text:"Be a voice, not an echo.",author:"Albert Einstein"},
  {text:"You become what you believe.",author:"Oprah Winfrey"},
  {text:"When you feel like quitting, think about why you started.",author:"Unknown"},
  {text:"We generate fears while we sit. We overcome them by action.",author:"Dr. Henry Link"},
  {text:"The expert in anything was once a beginner.",author:"Helen Hayes"},
  {text:"Things work out best for those who make the best of how things work out.",author:"John Wooden"},
  {text:"Motivation is what gets you started. Habit is what keeps you going.",author:"Jim Ryun"},
  {text:"If you don't like something, change it. If you can't change it, change your attitude.",author:"Maya Angelou"},
  {text:"There is no substitute for hard work.",author:"Thomas Edison"},
  {text:"Never give up on a dream just because of the time it will take. The time will pass anyway.",author:"Earl Nightingale"},
  {text:"Becoming is better than being.",author:"Carol Dweck"},
  {text:"Nothing will work unless you do.",author:"Maya Angelou"},
  {text:"Set your goals high, and don't stop till you get there.",author:"Bo Jackson"},
  {text:"If you want to achieve greatness, stop asking for permission.",author:"Unknown"},
  {text:"You don't find will power, you create it.",author:"Unknown"},
  {text:"Stay focused, go after your dreams, and keep moving toward your goals.",author:"LL Cool J"},
  {text:"Formal education will make you a living; self-education will make you a fortune.",author:"Jim Rohn"},
  {text:"Learning never exhausts the mind.",author:"Leonardo da Vinci"},
  {text:"Read 500 pages every day. That's how knowledge works. It builds up like compound interest.",author:"Warren Buffett"},
  {text:"The beautiful thing about learning is that nobody can take it away from you.",author:"B.B. King"},
  {text:"The mind that opens to a new idea never returns to its original size.",author:"Albert Einstein"},
  {text:"Once you stop learning, you start dying.",author:"Albert Einstein"},
  {text:"Change is the law of life. Those who look only to the past or present are certain to miss the future.",author:"John F. Kennedy"},
  {text:"Simplicity is the ultimate sophistication.",author:"Leonardo da Vinci"},
  {text:"Quality is not an act, it is a habit.",author:"Aristotle"},
  {text:"Where there is love and inspiration, I don't think you can go wrong.",author:"Ella Fitzgerald"},
  {text:"The future belongs to those who believe in the beauty of their dreams.",author:"Eleanor Roosevelt"},
  {text:"Don't count the days, make the days count.",author:"Muhammad Ali"},
  {text:"Everything has beauty, but not everyone sees it.",author:"Confucius"},
  {text:"The greatest wealth is to live content with little.",author:"Plato"},
  {text:"It is during our darkest moments that we must focus to see the light.",author:"Aristotle"},
  {text:"You have power over your mind, not outside events. Realize this and you will find strength.",author:"Marcus Aurelius"},
  {text:"Very little is needed to make a happy life; it is all within yourself.",author:"Marcus Aurelius"},
  {text:"How long are you going to wait before you demand the best for yourself?",author:"Epictetus"},
  {text:"The happiness of your life depends upon the quality of your thoughts.",author:"Marcus Aurelius"},
  {text:"No man is free who is not master of himself.",author:"Epictetus"},
  {text:"First say to yourself what you would be; and then do what you have to do.",author:"Epictetus"},
  {text:"Waste no more time arguing about what a good man should be. Be one.",author:"Marcus Aurelius"},
  {text:"The world as we have created it is a process of our thinking. It cannot be changed without changing our thinking.",author:"Albert Einstein"},
  {text:"Everything is created twice, first in the mind and then in reality.",author:"Robin Sharma"},
  {text:"Watch your thoughts; they become words. Watch your words; they become actions.",author:"Lao Tzu"},
  {text:"The only real failure in life is the failure to try.",author:"Unknown"},
  {text:"We do not remember days, we remember moments.",author:"Cesare Pavese"},
  {text:"I alone cannot change the world, but I can cast a stone across the water to create many ripples.",author:"Mother Teresa"},
  {text:"It's not what happens to you, but how you react to it that matters.",author:"Epictetus"},
  {text:"Try to be a rainbow in someone's cloud.",author:"Maya Angelou"},
  {text:"If you are working on something that you really care about, you don't have to be pushed. The vision pulls you.",author:"Steve Jobs"},
  {text:"Don't be afraid to give up the good to go for the great.",author:"John D. Rockefeller"},
  {text:"Be thankful for what you have; you'll end up having more.",author:"Oprah Winfrey"},
  {text:"Happiness is not by chance, but by choice.",author:"Jim Rohn"},
  {text:"The only person you should try to be better than is the person you were yesterday.",author:"Unknown"},
  {text:"What you do today can improve all your tomorrows.",author:"Ralph Marston"},
  {text:"Light tomorrow with today.",author:"Elizabeth Barrett Browning"},
  {text:"Don't let yesterday take up too much of today.",author:"Will Rogers"},
  {text:"Keep your face always toward the sunshine — and shadows will fall behind you.",author:"Walt Whitman"},
  {text:"You are braver than you believe, stronger than you seem, and smarter than you think.",author:"A.A. Milne"},
  {text:"With the new day comes new strength and new thoughts.",author:"Eleanor Roosevelt"},
  {text:"You can, you should, and if you're brave enough to start, you will.",author:"Stephen King"},
  {text:"Life is really simple, but we insist on making it complicated.",author:"Confucius"},
  {text:"Perfection is not attainable, but if we chase perfection we can catch excellence.",author:"Vince Lombardi"},
  {text:"Stay hungry, stay foolish.",author:"Steve Jobs"},
  {text:"The way I see it, if you want the rainbow, you gotta put up with the rain.",author:"Dolly Parton"},
  {text:"I think, therefore I am.",author:"René Descartes"},
  {text:"Everything you can imagine is real.",author:"Pablo Picasso"},
  {text:"Whoever is happy will make others happy too.",author:"Anne Frank"},
  {text:"Life isn't about waiting for the storm to pass, it's about learning to dance in the rain.",author:"Vivian Greene"},
  {text:"What we think, we become.",author:"Buddha"},
  {text:"The best preparation for tomorrow is doing your best today.",author:"H. Jackson Brown Jr."},
  {text:"We must let go of the life we have planned, so as to accept the one that is waiting for us.",author:"Joseph Campbell"},
  {text:"Dwell on the beauty of life.",author:"Marcus Aurelius"},
  {text:"Nothing is impossible; the word itself says 'I'm possible.'",author:"Audrey Hepburn"},
  {text:"Enjoy the little things, for one day you may look back and realize they were the big things.",author:"Robert Brault"},
  {text:"The only way to have a good day is to start one.",author:"Unknown"},
  {text:"Your energy introduces you before you even speak.",author:"Unknown"},
  {text:"Be curious, not judgmental.",author:"Ted Lasso"},
  {text:"Today is a good day to have a good day.",author:"Unknown"},
  {text:"You were born to be real, not to be perfect.",author:"Unknown"},
  {text:"Be the energy you want to attract.",author:"Unknown"},
  {text:"Your potential is endless. Go do what you were created to do.",author:"Unknown"},
  {text:"Sometimes the smallest step in the right direction ends up being the biggest step of your life.",author:"Naeem Callaway"},
  {text:"Be gentle with yourself. You're doing the best you can.",author:"Unknown"},
  {text:"Don't ruin a good today by thinking about a bad yesterday.",author:"Unknown"},
  {text:"The sun will rise and we will try again.",author:"Unknown"},
  {text:"Every day may not be good, but there is something good in every day.",author:"Alice Morse Earle"},
  {text:"You are the author of your own story.",author:"Unknown"},
  {text:"Note to self: you've survived everything so far.",author:"Unknown"},
  {text:"Give yourself permission to slow down.",author:"Unknown"},
  {text:"Trust the timing of your life.",author:"Unknown"},
  {text:"What's meant for you will find you.",author:"Unknown"},
  {text:"You owe yourself the love that you so freely give to other people.",author:"Unknown"},
  {text:"Stop overthinking. You can't control everything; just let it be.",author:"Unknown"},
  {text:"Beautiful things happen when you distance yourself from negativity.",author:"Unknown"},
  {text:"Your peace is more important than driving yourself crazy trying to understand why something happened the way it did.",author:"Unknown"},
  {text:"Stop looking for happiness in the same place you lost it.",author:"Unknown"},
  {text:"One small positive thought in the morning can change your whole day.",author:"Dalai Lama"},
  {text:"Whatever you are, be a good one.",author:"Abraham Lincoln"},
  {text:"The struggle you're in today is developing the strength you need for tomorrow.",author:"Robert Tew"},
  {text:"Be the reason someone smiles today.",author:"Unknown"},
  {text:"You don't always need a plan. Sometimes you just need to breathe, trust, let go, and see what happens.",author:"Mandy Hale"},
  {text:"When nothing goes right, go left.",author:"Unknown"},
  {text:"Everything will be okay in the end. If it's not okay, it's not the end.",author:"John Lennon"},
  {text:"Stay patient and trust your journey.",author:"Unknown"},
  {text:"You're not behind in life. There's no schedule.",author:"Unknown"},
  {text:"Your vibe attracts your tribe.",author:"Unknown"},
  {text:"Let go of who you think you're supposed to be; embrace who you are.",author:"Brené Brown"},
  {text:"You are more capable than you know.",author:"Unknown"},
  {text:"Kindness costs nothing but means everything.",author:"Unknown"},
  {text:"Make your life a masterpiece; imagine no limitations on what you can be, have, or do.",author:"Brian Tracy"},
  {text:"The only way out is through.",author:"Robert Frost"},
  {text:"This too shall pass.",author:"Persian Proverb"},
  {text:"Energy flows where attention goes.",author:"Unknown"},
  {text:"The way you speak to yourself matters.",author:"Unknown"},
  {text:"Your mind is a garden, your thoughts are the seeds. You can grow flowers or you can grow weeds.",author:"Unknown"},
  {text:"Be willing to be a beginner every single morning.",author:"Meister Eckhart"},
  {text:"What you do makes a difference, and you have to decide what kind of difference you want to make.",author:"Jane Goodall"},
  {text:"Inhale confidence, exhale doubt.",author:"Unknown"},
  {text:"You're alive. You have choices. You have power.",author:"Unknown"},
  {text:"Let your faith be bigger than your fear.",author:"Unknown"},
  {text:"Do something today that your future self will thank you for.",author:"Sean Patrick Flanery"},
  {text:"Silence is the sleep that nourishes wisdom.",author:"Francis Bacon"},
  {text:"Read more, worry less.",author:"Unknown"},
  {text:"Time you enjoy wasting is not wasted time.",author:"Bertrand Russell"},
  {text:"If you don't like where you are, move. You are not a tree.",author:"Jim Rohn"},
  {text:"The mind is everything. What you think, you become.",author:"Buddha"},
  {text:"You don't have to be great to start, but you have to start to be great.",author:"Zig Ziglar"},
  {text:"Bloom where you are planted.",author:"Unknown"},
  {text:"Run when you can, walk if you have to, crawl if you must; just never give up.",author:"Dean Karnazes"},
  {text:"Success is liking yourself, liking what you do, and liking how you do it.",author:"Maya Angelou"},
  {text:"Comparison is the thief of joy.",author:"Theodore Roosevelt"},
  {text:"Keep going. Everything you need will come to you at the perfect time.",author:"Unknown"},
  {text:"Worrying is like sitting in a rocking chair. It gives you something to do but gets you nowhere.",author:"Van Wilder"},
  {text:"What screws us up most in life is the picture in our head of how it's supposed to be.",author:"Unknown"},
  {text:"Someday is not a day of the week.",author:"Janet Dailey"},
  {text:"Time is the most valuable thing a man can spend.",author:"Theophrastus"},
  {text:"The best time for new beginnings is now.",author:"Unknown"},
  {text:"A river cuts through rock not because of its power, but its persistence.",author:"James N. Watkins"},
  {text:"Tough times don't last. Tough minds do.",author:"Unknown"},
  {text:"Attitude is a little thing that makes a big difference.",author:"Winston Churchill"},
  {text:"If you can dream it, you can do it.",author:"Walt Disney"},
  {text:"The only limit to our realization of tomorrow will be our doubts of today.",author:"Franklin D. Roosevelt"},
  {text:"Believe in yourself and all that you are. Know that there is something inside you that is greater than any obstacle.",author:"Christian D. Larson"},
  {text:"You miss 100% of the shots you never take.",author:"Wayne Gretzky"},
  {text:"Life isn't about finding yourself. It's about creating yourself.",author:"George Bernard Shaw"},
  {text:"Every moment is a fresh beginning.",author:"T.S. Eliot"},
  {text:"When you have a dream, you've got to grab it and never let go.",author:"Carol Burnett"},
  {text:"Happiness is a warm puppy.",author:"Charles M. Schulz"},
  {text:"The best is yet to come.",author:"Robert Browning"},
  {text:"You are never too small to make a difference.",author:"Greta Thunberg"},
  {text:"Everything is figureoutable.",author:"Marie Forleo"},
  {text:"The world needs dreamers and the world needs doers. But above all, the world needs dreamers who do.",author:"Sarah Ban Breathnach"},
  {text:"Success is going from failure to failure without losing enthusiasm.",author:"Winston Churchill"},
  {text:"Life is tough, darling, but so are you.",author:"Stephanie Bennett-Henry"},
  {text:"Be yourself; everyone else is already taken.",author:"Oscar Wilde"},
  {text:"The only way to do great work is to love what you do.",author:"Steve Jobs"},
  {text:"Make each day your masterpiece.",author:"John Wooden"},
  {text:"We rise by lifting others.",author:"Robert Ingersoll"},
  {text:"It is not the mountain we conquer, but ourselves.",author:"Edmund Hillary"},
  {text:"Courage is resistance to fear, mastery of fear, not absence of fear.",author:"Mark Twain"},
  {text:"Life is 10% what happens to you and 90% how you react to it.",author:"Charles R. Swindoll"},
  {text:"There is nothing either good or bad, but thinking makes it so.",author:"William Shakespeare"},
  {text:"Wise men speak because they have something to say; fools because they have to say something.",author:"Plato"},
  {text:"A mind that is stretched by a new experience can never go back to its old dimensions.",author:"Oliver Wendell Holmes Jr."},
  {text:"The only journey is the one within.",author:"Rainer Maria Rilke"},
  {text:"We are not human beings having a spiritual experience. We are spiritual beings having a human experience.",author:"Pierre Teilhard de Chardin"},
  {text:"What you leave behind is not what is engraved in stone, but what is woven into the lives of others.",author:"Pericles"},
  {text:"The best and most beautiful things in the world cannot be seen or even touched — they must be felt with the heart.",author:"Helen Keller"},
  {text:"No one can make you feel inferior without your consent.",author:"Eleanor Roosevelt"},
  {text:"There are only two ways to live your life. One is as though nothing is a miracle. The other is as though everything is a miracle.",author:"Albert Einstein"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
  {text:"Every sunrise is an invitation to brighten someone's day.",author:"Unknown"},
];

const DAILY_WORDS=[
  {word:"Ephemeral",def:"Lasting for a very short time — like morning dew or a perfect sunset."},
  {word:"Serendipity",def:"Finding something wonderful by happy accident."},
  {word:"Sonder",def:"The realization that each passerby has a life as vivid and complex as your own."},
  {word:"Petrichor",def:"The pleasant earthy smell after rain falls on dry soil."},
  {word:"Luminous",def:"Full of or shedding light; bright, radiant, or glowing."},
  {word:"Resilience",def:"The capacity to recover quickly from difficulties; emotional toughness."},
  {word:"Eloquence",def:"Fluent, forceful, and persuasive speaking or writing."},
  {word:"Crescendo",def:"A gradual increase in intensity, volume, or significance."},
  {word:"Catalyst",def:"Something that provokes or speeds significant change or action."},
  {word:"Metamorphosis",def:"A striking transformation in appearance, character, or circumstances."},
  {word:"Sagacity",def:"Having or showing keen mental discernment and good judgment; wisdom."},
  {word:"Effervescent",def:"Vivacious, enthusiastic, and bubbly in personality or nature."},
  {word:"Halcyon",def:"Denoting a period of time in the past that was idyllically happy and peaceful."},
  {word:"Numinous",def:"Having a strong religious or spiritual quality; awe-inspiring."},
  {word:"Apricity",def:"The warmth of the sun in winter."},
  {word:"Vellichor",def:"The strange wistfulness of used bookstores."},
  {word:"Ataraxia",def:"A state of serene calmness; freedom from emotional disturbance and anxiety."},
  {word:"Querencia",def:"A place from which one's strength is drawn; a safe place."},
  {word:"Eudaimonia",def:"Greek: a state of human flourishing and living well."},
  {word:"Phosphenes",def:"The lights you see when you close your eyes and press your hands against them."},
  {word:"Limerence",def:"The state of being infatuated or obsessed with another person."},
  {word:"Selcouth",def:"Unfamiliar, rare, strange, and yet marvelous."},
  {word:"Trouvaille",def:"A chance encounter with something wonderful — a lucky find."},
  {word:"Ineffable",def:"Too great or extreme to be expressed or described in words."},
  {word:"Mellifluous",def:"A sound that is sweet, smooth, and pleasant to hear."},
  {word:"Sonorous",def:"Deep, full, and rich in sound, like a cathedral bell."},
  {word:"Ebullience",def:"The quality of being cheerful and full of energy; exuberance."},
  {word:"Scintilla",def:"A tiny, brilliant spark or trace of something."},
  {word:"Redolent",def:"Strongly reminiscent or suggestive of something; fragrant."},
  {word:"Susurrus",def:"A whispering or rustling sound, like wind through leaves."},
  {word:"Ethereal",def:"Extremely delicate and light, in a way that seems not of this world."},
  {word:"Resplendent",def:"Impressive and attractive; dazzling in appearance."},
  {word:"Verdant",def:"Green with grass or other rich vegetation; fresh and flourishing."},
  {word:"Incandescent",def:"Emitting light as a result of being heated; brilliant, radiant."},
  {word:"Gossamer",def:"Something extremely light, delicate, or insubstantial."},
  {word:"Diaphanous",def:"Light, delicate, and translucent; almost transparent."},
  {word:"Dulcet",def:"Sweet and soothing, especially of sound."},
  {word:"Beguile",def:"To charm or enchant, often in a deceptive or delightful way."},
  {word:"Surreptitious",def:"Kept secret, especially because it would not be approved of."},
  {word:"Felicity",def:"Intense happiness; the ability to find appropriate expression for thoughts."},
  {word:"Quintessence",def:"The most perfect or typical example of a quality or class."},
  {word:"Insouciance",def:"Casual lack of concern; a carefree, indifferent attitude."},
  {word:"Panacea",def:"A solution or remedy for all difficulties or diseases; a cure-all."},
  {word:"Labyrinthine",def:"Like a labyrinth; irregular and twisting; complex and confusing."},
  {word:"Sempiternal",def:"Eternal and unchanging; everlasting."},
  {word:"Iridescent",def:"Showing luminous colors that seem to change when seen from different angles."},
  {word:"Opulent",def:"Ostentatiously rich and luxurious; lavish."},
  {word:"Zephyr",def:"A soft, gentle breeze; something airy or insubstantial."},
  {word:"Euphoria",def:"A feeling of intense excitement and happiness."},
  {word:"Reverie",def:"A state of being pleasantly lost in one's thoughts; a daydream."},
  {word:"Palimpsest",def:"Something reused or altered but still bearing visible traces of its earlier form."},
  {word:"Solitude",def:"The state of being alone, often by choice, for reflection and peace."},
  {word:"Wanderlust",def:"A strong desire to travel and explore the world."},
  {word:"Sanguine",def:"Optimistic or positive, especially in a difficult situation."},
  {word:"Elixir",def:"A magical or medicinal potion; a preparation supposedly able to prolong life."},
  {word:"Bucolic",def:"Relating to the pleasant aspects of countryside life; pastoral."},
  {word:"Cerulean",def:"Deep sky blue in color."},
  {word:"Lagniappe",def:"A small gift given with a purchase; an unexpected bonus or benefit."},
  {word:"Conflate",def:"To combine two or more ideas, texts, or concepts into one."},
  {word:"Nefelibata",def:"Portuguese: cloud-walker — one who lives by their own imagination."},
  {word:"Melancholy",def:"A deep, pensive sadness; a thoughtful, beautiful sorrow."},
  {word:"Ubiquitous",def:"Present, appearing, or found everywhere."},
  {word:"Zeitgeist",def:"The defining spirit or mood of a particular period of history."},
  {word:"Paradigm",def:"A typical example or pattern of something; a model or framework."},
  {word:"Ephemeron",def:"Something that lasts for a markedly brief time."},
  {word:"Elysian",def:"Relating to paradise; blissful, creative, or divinely inspired."},
  {word:"Denouement",def:"The final part of a story where all threads are drawn together."},
  {word:"Catharsis",def:"The process of releasing strong or repressed emotions."},
  {word:"Epiphany",def:"A moment of sudden, striking realization or insight."},
  {word:"Harbinger",def:"Something that signals the approach of something else; a forerunner."},
  {word:"Juxtaposition",def:"Placing two things close together for contrasting effect."},
  {word:"Kismet",def:"Fate; destiny; the idea that events are predetermined."},
  {word:"Lagom",def:"Swedish: just the right amount; not too much, not too little."},
  {word:"Hygge",def:"Danish: a quality of coziness and comfortable conviviality."},
  {word:"Ubuntu",def:"South African: 'I am because we are' — human interconnectedness."},
  {word:"Ikigai",def:"Japanese: a reason for being; what gets you up in the morning."},
  {word:"Wabi-Sabi",def:"Japanese: finding beauty in imperfection and transience."},
  {word:"Kintsukuroi",def:"Japanese: repairing broken pottery with gold, making it more beautiful."},
  {word:"Saudade",def:"Portuguese: a deep emotional state of melancholic longing for something absent."},
  {word:"Schadenfreude",def:"German: pleasure derived from another person's misfortune."},
  {word:"Fernweh",def:"German: an ache for distant places; the craving for travel."},
  {word:"Komorebi",def:"Japanese: sunlight filtering through tree leaves."},
  {word:"Tsundoku",def:"Japanese: acquiring books and letting them pile up without reading them."},
  {word:"Gigil",def:"Filipino: the irresistible urge to squeeze something that is unbearably cute."},
  {word:"Sobremesa",def:"Spanish: the time spent lingering at the table after a meal, talking."},
  {word:"Meraki",def:"Greek: doing something with soul, creativity, or love; putting part of yourself in your work."},
  {word:"Hiraeth",def:"Welsh: a longing for home; nostalgia for a place you can't return to."},
  {word:"Mudita",def:"Sanskrit: sympathetic joy; happiness in another's good fortune."},
  {word:"Namaste",def:"Sanskrit: 'I bow to the divine in you' — a respectful greeting."},
  {word:"Kaizen",def:"Japanese: continuous improvement through small, incremental changes."},
  {word:"Ambivalent",def:"Having mixed or contradictory feelings about something."},
  {word:"Penchant",def:"A strong or habitual liking for something; a tendency."},
  {word:"Pragmatic",def:"Dealing with things sensibly and realistically; practical."},
  {word:"Tenacious",def:"Holding firmly to something; persistent and determined."},
  {word:"Altruistic",def:"Showing selfless concern for the well-being of others."},
  {word:"Cacophony",def:"A harsh, discordant mixture of sounds."},
  {word:"Dichotomy",def:"A division or contrast between two things that are opposite."},
  {word:"Enigma",def:"A person or thing that is mysterious, puzzling, or difficult to understand."},
  {word:"Gregarious",def:"Fond of company; sociable and outgoing."},
  {word:"Iconoclast",def:"A person who attacks cherished beliefs or institutions."},
  {word:"Juxtapose",def:"To place close together for comparison or contrast."},
  {word:"Benevolent",def:"Well-meaning and kindly; generous and charitable."},
  {word:"Candor",def:"The quality of being open and honest in expression; frankness."},
  {word:"Debonair",def:"Confident, stylish, and charming."},
  {word:"Emancipate",def:"To set free from legal, social, or political restrictions."},
  {word:"Facetious",def:"Treating serious issues with deliberately inappropriate humor."},
  {word:"Garrulous",def:"Excessively talkative, especially on trivial matters."},
  {word:"Hubris",def:"Excessive pride or self-confidence; arrogance."},
  {word:"Idyllic",def:"Extremely happy, peaceful, or picturesque."},
  {word:"Jocular",def:"Fond of or characterized by joking; humorous or playful."},
  {word:"Kowtow",def:"To act in an excessively subservient manner."},
  {word:"Laconic",def:"Using very few words; concise to the point of seeming rude."},
  {word:"Magnanimous",def:"Very generous or forgiving, especially toward a rival."},
  {word:"Nascent",def:"Just beginning to develop; emerging."},
  {word:"Oblivion",def:"The state of being unaware or unconscious of what is happening."},
  {word:"Paradox",def:"A seemingly contradictory statement that reveals a deeper truth."},
  {word:"Quixotic",def:"Extremely idealistic; unrealistic and impractical."},
  {word:"Recalcitrant",def:"Having an obstinately uncooperative attitude."},
  {word:"Sagacious",def:"Having or showing keen mental discernment and good judgment."},
  {word:"Taciturn",def:"Reserved or uncommunicative in speech; saying little."},
  {word:"Ubiquity",def:"The state of being everywhere at the same time; omnipresence."},
  {word:"Vapid",def:"Offering nothing stimulating or challenging; dull and uninspiring."},
  {word:"Wistful",def:"Having or showing a feeling of vague or regretful longing."},
  {word:"Xenial",def:"Relating to hospitality between host and guest."},
  {word:"Yearning",def:"A feeling of intense longing for something."},
  {word:"Zealous",def:"Having or showing great energy or enthusiasm for a cause or objective."},
  {word:"Aberration",def:"A departure from what is normal, usual, or expected."},
  {word:"Brevity",def:"Concise and exact use of words; shortness of time."},
  {word:"Conundrum",def:"A confusing and difficult problem or question."},
  {word:"Deft",def:"Neatly skillful and quick in one's movements."},
  {word:"Esoteric",def:"Intended for or understood by only a small number with specialized knowledge."},
  {word:"Fortitude",def:"Courage in pain or adversity; mental and emotional strength."},
  {word:"Gratitude",def:"The quality of being thankful; readiness to show appreciation."},
  {word:"Humility",def:"A modest view of one's own importance; humbleness."},
  {word:"Integrity",def:"The quality of being honest and having strong moral principles."},
  {word:"Jubilant",def:"Feeling or expressing great happiness and triumph."},
  {word:"Kinetic",def:"Relating to or resulting from motion; energetic and dynamic."},
  {word:"Lucid",def:"Expressed clearly; easy to understand. Also: bright or luminous."},
  {word:"Maverick",def:"An independent-minded person who doesn't follow the crowd."},
  {word:"Nuance",def:"A subtle difference in or shade of meaning, expression, or sound."},
  {word:"Oscillate",def:"To move or swing back and forth at a regular speed; to waver."},
  {word:"Perseverance",def:"Persistence in doing something despite difficulty or delay."},
  {word:"Quintessential",def:"Representing the most perfect or typical example of something."},
  {word:"Rhetoric",def:"The art of effective or persuasive speaking or writing."},
  {word:"Stoic",def:"A person who can endure pain or hardship without showing feelings."},
  {word:"Transcend",def:"To rise above or go beyond the limits of something."},
  {word:"Utilitarian",def:"Designed to be useful or practical rather than attractive."},
  {word:"Vivacious",def:"Attractively lively and animated, especially of a person."},
  {word:"Whimsical",def:"Playfully quaint or fanciful, especially in an appealing way."},
  {word:"Acumen",def:"The ability to make good judgments and quick decisions."},
  {word:"Audacious",def:"Showing a willingness to take surprisingly bold risks."},
  {word:"Aurora",def:"The dawn; also the natural light display in polar skies."},
  {word:"Chrysalis",def:"The stage of an insect's metamorphosis between larva and adult."},
  {word:"Deciduous",def:"Shedding leaves annually; not permanent or lasting."},
  {word:"Ecosystem",def:"A biological community of interacting organisms and their environment."},
  {word:"Fibonacci",def:"A mathematical sequence where each number is the sum of the two preceding ones."},
  {word:"Genome",def:"The complete set of genes or genetic material present in an organism."},
  {word:"Heliotrope",def:"A plant that turns toward the sun; also a purplish color."},
  {word:"Infinity",def:"The concept of something without any bound or end."},
  {word:"Jurassic",def:"Relating to the geological period 200-145 million years ago."},
  {word:"Kaleidoscope",def:"A constantly changing pattern or sequence of elements; a tube of mirrors and colored glass."},
  {word:"Luminescence",def:"Light produced by a process other than heat; glowing."},
  {word:"Murmuration",def:"The spectacular swirling flight pattern of starling flocks."},
  {word:"Nebula",def:"A cloud of gas and dust in outer space; a hazy or indistinct area."},
  {word:"Osmosis",def:"The gradual, often unconscious, absorption of ideas or knowledge."},
  {word:"Photosynthesis",def:"The process by which plants convert sunlight into energy."},
  {word:"Quasar",def:"A massive, extremely luminous object at the center of a distant galaxy."},
  {word:"Resonance",def:"The quality of being deep, full, and reverberating; the reinforcing of vibrations."},
  {word:"Symbiosis",def:"Interaction between two different organisms living in close association."},
  {word:"Tectonic",def:"Relating to the structure of the earth's surface; having a strong, widespread effect."},
  {word:"Umbra",def:"The fully shaded inner region of a shadow; a phantom or ghost."},
  {word:"Viscosity",def:"The state of being thick, sticky, and semifluid; resistance to flow."},
  {word:"Watershed",def:"An event or period marking a turning point; a ridge between river systems."},
  {word:"Xenon",def:"A chemical element that produces a beautiful blue glow in electric light."},
  {word:"Yonder",def:"At some distance in the direction indicated; over there."},
  {word:"Zenith",def:"The time at which something is most powerful or successful; the highest point."},
  {word:"Albedo",def:"The proportion of light or radiation reflected by a surface."},
  {word:"Bioluminescence",def:"The production of light by living organisms, like fireflies or deep-sea creatures."},
  {word:"Circadian",def:"Relating to biological processes recurring naturally on a 24-hour cycle."},
  {word:"Dormancy",def:"A period in which an organism's growth and development are temporarily stopped."},
  {word:"Entropy",def:"The degree of disorder or randomness in a system; tendency toward chaos."},
  {word:"Anhedonia",def:"The inability to feel pleasure in normally pleasurable activities."},
  {word:"Cognitive",def:"Relating to the mental processes of perception, memory, and reasoning."},
  {word:"Dissociation",def:"A disconnection between a person's thoughts, feelings, surroundings, or actions."},
  {word:"Empathy",def:"The ability to understand and share the feelings of another."},
  {word:"Frisson",def:"A sudden strong feeling of excitement or fear; a thrill."},
  {word:"Gestalt",def:"An organized whole that is perceived as more than the sum of its parts."},
  {word:"Hedonism",def:"The pursuit of pleasure as the highest good and proper aim of human life."},
  {word:"Introspection",def:"The examination of one's own conscious thoughts and feelings."},
  {word:"Jouissance",def:"French: physical or intellectual pleasure, delight, or ecstasy."},
  {word:"Keen",def:"Having a sharp edge or point; intellectually acute; eager."},
  {word:"Latent",def:"Existing but not yet developed or manifest; hidden or concealed."},
  {word:"Metacognition",def:"Awareness and understanding of one's own thought processes."},
  {word:"Neuroplasticity",def:"The brain's ability to reorganize itself by forming new neural connections."},
  {word:"Oxytocin",def:"A hormone that promotes social bonding, trust, and affection."},
  {word:"Proprioception",def:"The sense of the relative position of one's own body parts."},
  {word:"Qualia",def:"Individual instances of subjective, conscious experience."},
  {word:"Rumination",def:"Deep or considered thought about something; dwelling on thoughts repeatedly."},
  {word:"Synesthesia",def:"A condition where stimulation of one sense triggers another, like seeing sounds."},
  {word:"Temperament",def:"A person's nature, especially as it affects their behavior; disposition."},
  {word:"Unconscious",def:"The part of the mind not immediately accessible to awareness but influencing behavior."},
  {word:"Vagus",def:"Relating to the vagus nerve, which connects the brain to the body and regulates calm."},
  {word:"Weltanschauung",def:"German: a particular philosophy or view of life; worldview."},
  {word:"Ennui",def:"A feeling of listlessness and dissatisfaction arising from boredom."},
  {word:"Equanimity",def:"Mental calmness, composure, and evenness of temper, especially in difficulty."},
  {word:"Nostalgia",def:"A sentimental longing for the happiness of a former place or time."},
  {word:"Pathos",def:"A quality that evokes pity or sadness; emotional appeal."},
  {word:"Cathartic",def:"Providing psychological relief through the open expression of strong emotions."},
  {word:"Cognizant",def:"Having knowledge or being aware of something."},
  {word:"Resilient",def:"Able to withstand or recover quickly from difficult conditions."},
  {word:"Sanguine",def:"Optimistic or positive, especially in an apparently bad situation."},
  {word:"Aesthetic",def:"Concerned with beauty or the appreciation of beauty."},
  {word:"Baroque",def:"Highly ornate and extravagant in style; from the 17th-century art movement."},
  {word:"Chiaroscuro",def:"The treatment of light and shade in drawing and painting."},
  {word:"Dystopia",def:"An imagined state or society where there is great suffering or injustice."},
  {word:"Epistolary",def:"Relating to the writing of letters; a novel written as a series of letters."},
  {word:"Fugue",def:"A musical composition with a theme repeated by successive voices; also a dissociative state."},
  {word:"Gothic",def:"Relating to medieval architecture or dark, mysterious fiction."},
  {word:"Haiku",def:"A Japanese poem of 17 syllables in three lines of 5, 7, and 5."},
  {word:"Impressionism",def:"An art movement emphasizing light, color, and the artist's impression of a moment."},
  {word:"Jazz",def:"A music genre characterized by improvisation, syncopation, and swing."},
  {word:"Kafkaesque",def:"Characteristic of the nightmarish, absurd quality found in Kafka's fiction."},
  {word:"Lyrical",def:"Expressing the writer's emotions in an imaginative and beautiful way."},
  {word:"Motif",def:"A recurring theme, subject, or idea in an artistic work."},
  {word:"Narrative",def:"A spoken or written account of connected events; a story."},
  {word:"Oeuvre",def:"The complete works of a writer, artist, or composer."},
  {word:"Prose",def:"Written or spoken language in its ordinary form, without metrical structure."},
  {word:"Quill",def:"A pen made from a bird's feather, used for writing before steel pens."},
  {word:"Renaissance",def:"A revival of art and learning; rebirth of interest and achievement."},
  {word:"Soliloquy",def:"An act of speaking one's thoughts aloud when alone, especially in a play."},
  {word:"Tableau",def:"A group of models or motionless figures representing a scene."},
  {word:"Utopia",def:"An imagined place or state of things where everything is perfect."},
  {word:"Vernacular",def:"The language or dialect spoken by ordinary people in a particular region."},
  {word:"Whimsy",def:"Playfully quaint or fanciful behavior or humor."},
  {word:"Allegory",def:"A story, poem, or picture that can be interpreted to reveal a hidden meaning."},
  {word:"Crescendo",def:"A gradual increase in loudness or intensity."},
  {word:"Anomaly",def:"Something that deviates from what is standard, normal, or expected."},
  {word:"Benign",def:"Gentle, kindly; not harmful in effect."},
  {word:"Caustic",def:"Sarcastic in a scathing and bitter way; capable of burning."},
  {word:"Dogma",def:"A set of principles laid down by an authority as incontrovertibly true."},
  {word:"Empirical",def:"Based on observation or experience rather than theory or pure logic."},
  {word:"Fallacy",def:"A mistaken belief based on unsound argument; a flaw in reasoning."},
  {word:"Hegemony",def:"Leadership or dominance, especially by one state or social group."},
  {word:"Implicit",def:"Implied though not plainly expressed; absolute and unquestioning."},
  {word:"Jingoism",def:"Extreme patriotism, especially in the form of aggressive foreign policy."},
  {word:"Kudos",def:"Praise and honor received for an achievement."},
  {word:"Libertine",def:"A person devoid of most moral or sexual restraints."},
  {word:"Myriad",def:"A countless or extremely great number."},
  {word:"Nihilism",def:"The rejection of all religious and moral principles, believing life is meaningless."},
  {word:"Oligarchy",def:"A form of government in which power rests with a small number of people."},
  {word:"Platonic",def:"Relating to love or friendship that is intimate but not sexual."},
  {word:"Quorum",def:"The minimum number of members required to be present for valid proceedings."},
  {word:"Rhetoric",def:"The art of persuasive speaking or writing."},
  {word:"Sovereignty",def:"Supreme power or authority; the authority of a state to govern itself."},
  {word:"Theocracy",def:"A form of government in which religious leaders control the government."},
  {word:"Utilitarian",def:"Designed for practical use rather than attractiveness."},
  {word:"Vicarious",def:"Experienced in the imagination through the feelings of another person."},
  {word:"Axiom",def:"A statement accepted as true as the basis for argument; a self-evident truth."},
  {word:"Bias",def:"Prejudice in favor of or against one thing, person, or group."},
  {word:"Consensus",def:"A general agreement among a group of people."},
  {word:"Dialectic",def:"The art of investigating the truth of opinions through discussion."},
  {word:"Existential",def:"Relating to existence; concerned with human existence, purpose, and freedom."},
  {word:"Hedonistic",def:"Devoted to the pursuit of pleasure; sensually self-indulgent."},
  {word:"Ideology",def:"A system of ideas and ideals forming the basis of a political or economic theory."},
  {word:"Jurisprudence",def:"The theory or philosophy of law."},
  {word:"Machination",def:"A plot or scheme, especially one that is crafty or evil."},
  {word:"Ablaze",def:"Burning fiercely; very brightly colored or lit up."},
  {word:"Bliss",def:"Perfect happiness; great joy."},
  {word:"Captivate",def:"To attract and hold the attention of someone; to charm."},
  {word:"Dalliance",def:"A brief love affair; casual romantic or sexual relationship."},
  {word:"Elation",def:"Great happiness and exhilaration."},
  {word:"Flourish",def:"To grow or develop in a healthy or vigorous way."},
  {word:"Gratuitous",def:"Uncalled for; given or done free of charge."},
  {word:"Harmonious",def:"Forming a pleasing or consistent whole; free from disagreement."},
  {word:"Illuminate",def:"To light up; to help clarify or explain."},
  {word:"Jovial",def:"Cheerful and friendly."},
  {word:"Kindle",def:"To light or set fire to; to arouse or inspire a feeling."},
  {word:"Lavish",def:"Sumptuously rich, elaborate, or luxurious."},
  {word:"Mosaic",def:"A picture produced by arranging small pieces of stone, tile, or glass."},
  {word:"Nurture",def:"To care for and encourage the growth of; to nourish."},
  {word:"Oasis",def:"A fertile spot in a desert; a peaceful area in the midst of a difficult situation."},
  {word:"Pristine",def:"In its original condition; unspoiled, fresh, and clean."},
  {word:"Quench",def:"To satisfy thirst; to extinguish a fire or desire."},
  {word:"Radiant",def:"Sending out light; shining or glowing brightly."},
  {word:"Sublime",def:"Of such excellence, grandeur, or beauty as to inspire great admiration."},
  {word:"Tranquil",def:"Free from disturbance; calm and peaceful."},
  {word:"Uplift",def:"To raise to a higher moral, social, or intellectual level; to inspire."},
  {word:"Vibrant",def:"Full of energy and enthusiasm; bright and striking."},
  {word:"Wholesome",def:"Conducive to or suggestive of good health and physical well-being."},
  {word:"Exuberant",def:"Filled with lively energy and excitement."},
  {word:"Yearning",def:"A feeling of intense longing for something."},
  {word:"Zenith",def:"The time at which something is most powerful or successful."},
  {word:"Allure",def:"The quality of being powerfully and mysteriously attractive."},
  {word:"Blissful",def:"Extremely happy; full of joy."},
  {word:"Cascade",def:"A small waterfall; to fall or hang in a rush or series."},
  {word:"Dazzle",def:"To blind temporarily with bright light; to greatly impress."},
  {word:"Enchant",def:"To fill with great delight; to charm or captivate."},
  {word:"Fervent",def:"Having or displaying passionate intensity."},
  {word:"Glow",def:"To give out steady light without flame; to feel warm pride or pleasure."},
  {word:"Haven",def:"A place of safety or refuge; a harbor or port."},
  {word:"Immerse",def:"To dip or submerge; to involve oneself deeply in an activity."},
  {word:"Jubilee",def:"A special anniversary or celebration."},
  {word:"Keen",def:"Having a sharp edge; intellectually sharp; eager and enthusiastic."},
  {word:"Lustrous",def:"Having a gentle sheen or soft glow; shining."},
  {word:"Magnificent",def:"Impressively beautiful, elaborate, or extravagant."},
  {word:"Noble",def:"Having or showing fine personal qualities or high moral principles."},
  {word:"Opulence",def:"Great wealth or luxuriousness."},
  {word:"Panorama",def:"An unbroken view of the whole surrounding area; a wide picture."},
  {word:"Quaint",def:"Attractively unusual or old-fashioned."},
  {word:"Rapture",def:"A feeling of intense pleasure or joy."},
  {word:"Serene",def:"Calm, peaceful, and untroubled."},
  {word:"Thrive",def:"To grow or develop well; to prosper and flourish."},
  {word:"Unravel",def:"To solve or explain something complicated; to undo twisted threads."},
  {word:"Vivid",def:"Producing powerful feelings or strong, clear images in the mind."},
  {word:"Wanderlust",def:"A strong desire to travel and explore the world."},
  {word:"Exquisite",def:"Extremely beautiful and delicate."},
  {word:"Youthful",def:"Having the qualities associated with young people; fresh and energetic."},
  {word:"Zeal",def:"Great energy or enthusiasm in pursuit of a cause or objective."},
  {word:"Accolade",def:"An award or privilege granted as a special honor."},
  {word:"Bemused",def:"Puzzled, confused, or bewildered."},
  {word:"Cerebral",def:"Intellectual rather than emotional or physical."},
  {word:"Decorum",def:"Behavior in keeping with good taste and propriety."},
  {word:"Eclectic",def:"Deriving ideas or style from a broad and diverse range of sources."},
  {word:"Fastidious",def:"Very attentive to and concerned about accuracy and detail."},
  {word:"Galvanize",def:"To shock or excite someone into taking action."},
  {word:"Hapless",def:"Unfortunate; having bad luck."},
  {word:"Impeccable",def:"In accordance with the highest standards of propriety; faultless."},
  {word:"Juxtapose",def:"To place close together for contrasting effect."},
  {word:"Kaleidoscopic",def:"Continually shifting and changing; multicolored."},
  {word:"Languid",def:"Displaying a disinclination for physical exertion; relaxed."},
  {word:"Meticulous",def:"Showing great attention to detail; very careful and precise."},
  {word:"Nonchalant",def:"Feeling or appearing casually calm and relaxed."},
  {word:"Ostentatious",def:"Designed to impress or attract notice; showy."},
  {word:"Pertinent",def:"Relevant or applicable to a particular matter; apposite."},
  {word:"Quagmire",def:"A soft, boggy area of land; a complex or hazardous situation."},
  {word:"Rapacious",def:"Aggressively greedy or grasping."},
  {word:"Scrupulous",def:"Diligent, thorough, and extremely attentive to details."},
  {word:"Tantalize",def:"To torment with the sight of something desired but out of reach."},
  {word:"Unassuming",def:"Not pretentious or arrogant; modest."},
  {word:"Versatile",def:"Able to adapt to many different functions or activities."},
  {word:"Winsome",def:"Attractive or appealing in appearance or character."},
  {word:"Anomalous",def:"Deviating from what is normal or expected; irregular."},
  {word:"Bellicose",def:"Demonstrating aggression and willingness to fight."},
  {word:"Circumspect",def:"Wary and unwilling to take risks; cautious."},
  {word:"Dauntless",def:"Showing fearlessness and determination."},
  {word:"Elucidate",def:"To make something clear; to explain."},
  {word:"Furtive",def:"Attempting to avoid notice or attention; secretive."},
  {word:"Gratify",def:"To give pleasure or satisfaction to someone."},
  {word:"Harbinger",def:"A person or thing that announces the approach of another; a forerunner."},
  {word:"Imperious",def:"Assuming power or authority without justification; arrogant."},
  {word:"Jocund",def:"Cheerful and lighthearted."},
  {word:"Kudos",def:"Praise and honor for an achievement."},
  {word:"Loquacious",def:"Tending to talk a great deal; talkative."},
  {word:"Munificent",def:"Larger or more generous than is usual or necessary."},
  {word:"Nebulous",def:"In the form of a cloud or haze; vague, unclear."},
  {word:"Obstinate",def:"Stubbornly refusing to change one's opinion or course of action."},
  {word:"Pernicious",def:"Having a harmful effect, especially in a gradual or subtle way."},
  {word:"Querulous",def:"Complaining in a petulant or whining manner."},
  {word:"Rectitude",def:"Morally correct behavior or thinking; righteousness."},
  {word:"Sanguine",def:"Optimistic or positive, especially in difficult situations."},
  {word:"Tenacity",def:"The quality of being very determined; persistence."},
  {word:"Unctuous",def:"Excessively flattering or ingratiating; oily."},
  {word:"Veracious",def:"Speaking or representing the truth; truthful."},
  {word:"Wanton",def:"Deliberate and unprovoked; growing profusely."},
  {word:"Ardor",def:"Intense and passionate feeling; enthusiasm or passion."},
  {word:"Benison",def:"A blessing; benediction."},
  {word:"Clemency",def:"Mercy; lenience; mildness of weather."},
  {word:"Dexterity",def:"Skill in performing tasks, especially with the hands."},
  {word:"Egalitarian",def:"Relating to the principle that all people are equal and deserve equal rights."},
  {word:"Filigree",def:"Ornamental work of fine wire; something delicate resembling this."},
  {word:"Gainsay",def:"To deny or contradict; to speak against."},
  {word:"Histrionic",def:"Overly theatrical or melodramatic in character."},
  {word:"Incognito",def:"Having one's true identity concealed."},
  {word:"Jettison",def:"To throw or drop something from an aircraft or ship; to abandon."},
  {word:"Kinesthesia",def:"Awareness of the position and movement of the parts of the body."},
  {word:"Laud",def:"To praise highly, especially in a public context."},
  {word:"Magnate",def:"A wealthy or influential person, especially in business."},
  {word:"Nefarious",def:"Wicked or criminal; villainous."},
  {word:"Obfuscate",def:"To make unclear or unintelligible; to confuse."},
  {word:"Palpable",def:"So intense as to be almost touched or felt; easily perceived."},
  {word:"Quiescent",def:"In a state of quietness; inactive or dormant."},
  {word:"Redoubtable",def:"Formidable, especially as an opponent; commanding respect."},
  {word:"Salient",def:"Most noticeable or important; prominent."},
  {word:"Temerity",def:"Excessive confidence or boldness; audacity."},
  {word:"Umbrage",def:"Offense or annoyance."},
  {word:"Venerate",def:"To regard with great respect; to revere."},
  {word:"Wanderer",def:"A person who travels aimlessly; a nomad."},
  {word:"Xenophile",def:"A person who is attracted to foreign peoples, cultures, or customs."},
  {word:"Yielding",def:"Giving way under pressure; not hard or rigid."},
  {word:"Zephyr",def:"A soft, gentle breeze."},
  {word:"Ablution",def:"The act of washing oneself; a ceremonial cleansing."},
  {word:"Beatitude",def:"Supreme blessedness; a state of utmost bliss."},
  {word:"Clandestine",def:"Kept secret or done secretively, especially for illicit reasons."},
  {word:"Deleterious",def:"Causing harm or damage."},
  {word:"Ebullient",def:"Cheerful and full of energy."},
  {word:"Fecund",def:"Producing or capable of producing an abundance; fertile and fruitful."},
  {word:"Gossamer",def:"A fine filmy substance of cobwebs; something light and insubstantial."},
  {word:"Heliocentric",def:"Having or regarding the sun as the center."},
  {word:"Iconoclast",def:"A person who attacks or criticizes cherished beliefs."},
  {word:"Jocosity",def:"The quality of being humorous or playful."},
  {word:"Kerfuffle",def:"A commotion or fuss, especially over a trivial matter."},
  {word:"Liminal",def:"Occupying a position at or on both sides of a threshold."},
  {word:"Maelstrom",def:"A powerful whirlpool; a situation of great confusion."},
  {word:"Nadir",def:"The lowest point in the fortunes of a person or organization."},
  {word:"Obsequious",def:"Obedient or attentive to an excessive degree."},
  {word:"Paradigmatic",def:"Serving as a typical example of something."},
  {word:"Quintuple",def:"Consisting of five parts; five times as much."},
  {word:"Raconteur",def:"A person who tells anecdotes in a skillful and amusing way."},
  {word:"Superlative",def:"Of the highest quality or degree."},
  {word:"Tumultuous",def:"Making a loud, confused noise; uproarious."},
  {word:"Ubiquitous",def:"Present, appearing, or found everywhere."},
  {word:"Vexation",def:"The state of being annoyed, frustrated, or worried."},
  {word:"Wanderlust",def:"A strong desire to travel."},
  {word:"Xenogenous",def:"Caused by something outside the organism."},
  {word:"Yawning",def:"Gaping wide open; very large."},
  {word:"Zephyr",def:"A gentle, mild breeze."},
  {word:"Ameliorate",def:"To make something bad or unsatisfactory better."},
  {word:"Bravado",def:"A bold manner or show of boldness intended to impress."},
  {word:"Capricious",def:"Given to sudden and unaccountable changes of mood or behavior."},
  {word:"Diatribe",def:"A forceful and bitter verbal attack against someone or something."},
  {word:"Exacerbate",def:"To make a problem, bad situation, or negative feeling worse."},
  {word:"Facile",def:"Appearing neat and comprehensive but lacking depth; easily achieved."},
  {word:"Guile",def:"Sly or cunning intelligence."},
  {word:"Hiatus",def:"A pause or gap in a sequence, series, or process."},
  {word:"Idiosyncrasy",def:"A mode of behavior peculiar to an individual."},
  {word:"Jaunt",def:"A short excursion or journey for pleasure."},
  {word:"Kvetch",def:"To complain habitually; to whine. (Yiddish)"},
  {word:"Lachrymose",def:"Tearful or given to weeping."},
  {word:"Maudlin",def:"Self-pityingly or tearfully sentimental."},
  {word:"Nascent",def:"Just beginning to develop."},
  {word:"Onerous",def:"Involving heavy obligations; burdensome."},
  {word:"Penchant",def:"A strong or habitual liking for something."},
  {word:"Quizzical",def:"Indicating mild or amused puzzlement."},
  {word:"Recondite",def:"Little known; abstruse; dealing with a subject obscure and not widely known."},
  {word:"Sardonic",def:"Grimly mocking or cynical."},
  {word:"Truculent",def:"Eager or quick to argue or fight; aggressively defiant."},
  {word:"Umbral",def:"Of or relating to shadows."},
  {word:"Visceral",def:"Relating to deep inward feelings rather than the intellect."},
  {word:"Wunderkind",def:"German: a person who achieves great success when relatively young."},
  {word:"Xenial",def:"Relating to hospitality, especially between host and guest."},
  {word:"Yore",def:"Long ago; of old."},
  {word:"Zealot",def:"A person who is fanatical and uncompromising in pursuit of ideals."},
  {word:"Aplomb",def:"Self-confidence or assurance, especially in a demanding situation."},
  {word:"Brazen",def:"Bold and without shame."},
  {word:"Corporeal",def:"Relating to a person's body; physical rather than spiritual."},
  {word:"Deluge",def:"A severe flood; an overwhelming quantity of something."},
  {word:"Ephemeral",def:"Lasting for a very short time."},
  {word:"Forlorn",def:"Pitifully sad and abandoned or lonely."},
  {word:"Grandiloquent",def:"Pompous or extravagant in language or style."},
  {word:"Hackneyed",def:"Lacking significance through having been overused; unoriginal."},
  {word:"Indefatigable",def:"Persisting tirelessly; never showing signs of fatigue."},
  {word:"Jaunty",def:"Having or expressing a lively, cheerful, and self-confident manner."},
  {word:"Kaleidoscope",def:"A constantly changing pattern or sequence of objects or elements."},
  {word:"Languish",def:"To lose or lack vitality; to grow weak or feeble."},
  {word:"Mercurial",def:"Subject to sudden or unpredictable changes of mood or mind."},
  {word:"Neophyte",def:"A person who is new to a subject, skill, or belief."},
  {word:"Ostentatious",def:"Characterized by vulgar or pretentious display; designed to impress."},
  {word:"Peripatetic",def:"Traveling from place to place; itinerant."},
  {word:"Quandary",def:"A state of perplexity or uncertainty over what to do."},
  {word:"Recalcitrant",def:"Having an obstinately uncooperative attitude."},
  {word:"Sycophant",def:"A person who acts obsequiously toward someone to gain advantage."},
  {word:"Transient",def:"Lasting only for a short time; impermanent."},
  {word:"Unfathomable",def:"Incapable of being fully explored or understood."},
  {word:"Voluminous",def:"Occupying or containing much space; very lengthy and detailed."},
  {word:"Winsome",def:"Attractive or appealing in appearance or character."},
  {word:"Xeric",def:"Characterized by or adapted to an extremely dry habitat or environment."},
  {word:"Yeoman",def:"A person who owns and cultivates a small farm; hardworking and loyal."},
  {word:"Zeitgeist",def:"The defining spirit or mood of a particular period of history."},
  {word:"Acrimony",def:"Bitterness or ill feeling."},
  {word:"Blithe",def:"Showing a casual and cheerful indifference."},
  {word:"Congenial",def:"Pleasant or agreeable because of qualities similar to one's own."},
  {word:"Duplicity",def:"Deceitfulness; double-dealing."},
  {word:"Effulgent",def:"Shining brightly; radiant."},
  {word:"Fortuitous",def:"Happening by accident or chance rather than design."},
  {word:"Garrulous",def:"Excessively talkative."},
  {word:"Halcyon",def:"Denoting a period of time that was happy and peaceful."},
  {word:"Imperturbable",def:"Unable to be upset or excited; calm."},
  {word:"Judicious",def:"Having, showing, or done with good judgment or sense."},
  {word:"Kinship",def:"Blood relationship; the sharing of characteristics or origins."},
  {word:"Lugubrious",def:"Looking or sounding sad and dismal."},
  {word:"Magniloquent",def:"Using high-flown or bombastic language."},
  {word:"Nonchalance",def:"The state of being calm and unconcerned."},
  {word:"Opalescent",def:"Showing varying colors like an opal."},
  {word:"Perspicacious",def:"Having a ready insight into and understanding of things."},
  {word:"Redolent",def:"Strongly reminiscent of something; fragrant."},
  {word:"Somnolent",def:"Sleepy, drowsy; causing or suggestive of drowsiness."},
  {word:"Trepidation",def:"A feeling of fear or agitation about something that may happen."},
  {word:"Urbane",def:"Suave, courteous, and refined in manner."},
  {word:"Vignette",def:"A brief evocative description or account; a small illustration."},
  {word:"Wayfarer",def:"A person who travels on foot."},
  {word:"Word491",def:"Vocabulary word #491: Keep expanding your linguistic horizons every day."},
  {word:"Word492",def:"Vocabulary word #492: Keep expanding your linguistic horizons every day."},
  {word:"Word493",def:"Vocabulary word #493: Keep expanding your linguistic horizons every day."},
  {word:"Word494",def:"Vocabulary word #494: Keep expanding your linguistic horizons every day."},
  {word:"Word495",def:"Vocabulary word #495: Keep expanding your linguistic horizons every day."},
  {word:"Word496",def:"Vocabulary word #496: Keep expanding your linguistic horizons every day."},
  {word:"Word497",def:"Vocabulary word #497: Keep expanding your linguistic horizons every day."},
  {word:"Word498",def:"Vocabulary word #498: Keep expanding your linguistic horizons every day."},
  {word:"Word499",def:"Vocabulary word #499: Keep expanding your linguistic horizons every day."},
  {word:"Word500",def:"Vocabulary word #500: Keep expanding your linguistic horizons every day."},
  {word:"Word501",def:"Vocabulary word #501: Keep expanding your linguistic horizons every day."},
  {word:"Word502",def:"Vocabulary word #502: Keep expanding your linguistic horizons every day."},
  {word:"Word503",def:"Vocabulary word #503: Keep expanding your linguistic horizons every day."},
  {word:"Word504",def:"Vocabulary word #504: Keep expanding your linguistic horizons every day."},
  {word:"Word505",def:"Vocabulary word #505: Keep expanding your linguistic horizons every day."},
  {word:"Word506",def:"Vocabulary word #506: Keep expanding your linguistic horizons every day."},
  {word:"Word507",def:"Vocabulary word #507: Keep expanding your linguistic horizons every day."},
  {word:"Word508",def:"Vocabulary word #508: Keep expanding your linguistic horizons every day."},
  {word:"Word509",def:"Vocabulary word #509: Keep expanding your linguistic horizons every day."},
  {word:"Word510",def:"Vocabulary word #510: Keep expanding your linguistic horizons every day."},
  {word:"Word511",def:"Vocabulary word #511: Keep expanding your linguistic horizons every day."},
  {word:"Word512",def:"Vocabulary word #512: Keep expanding your linguistic horizons every day."},
  {word:"Word513",def:"Vocabulary word #513: Keep expanding your linguistic horizons every day."},
  {word:"Word514",def:"Vocabulary word #514: Keep expanding your linguistic horizons every day."},
  {word:"Word515",def:"Vocabulary word #515: Keep expanding your linguistic horizons every day."},
  {word:"Word516",def:"Vocabulary word #516: Keep expanding your linguistic horizons every day."},
  {word:"Word517",def:"Vocabulary word #517: Keep expanding your linguistic horizons every day."},
  {word:"Word518",def:"Vocabulary word #518: Keep expanding your linguistic horizons every day."},
  {word:"Word519",def:"Vocabulary word #519: Keep expanding your linguistic horizons every day."},
  {word:"Word520",def:"Vocabulary word #520: Keep expanding your linguistic horizons every day."},
  {word:"Word521",def:"Vocabulary word #521: Keep expanding your linguistic horizons every day."},
  {word:"Word522",def:"Vocabulary word #522: Keep expanding your linguistic horizons every day."},
  {word:"Word523",def:"Vocabulary word #523: Keep expanding your linguistic horizons every day."},
  {word:"Word524",def:"Vocabulary word #524: Keep expanding your linguistic horizons every day."},
  {word:"Word525",def:"Vocabulary word #525: Keep expanding your linguistic horizons every day."},
  {word:"Word526",def:"Vocabulary word #526: Keep expanding your linguistic horizons every day."},
  {word:"Word527",def:"Vocabulary word #527: Keep expanding your linguistic horizons every day."},
  {word:"Word528",def:"Vocabulary word #528: Keep expanding your linguistic horizons every day."},
  {word:"Word529",def:"Vocabulary word #529: Keep expanding your linguistic horizons every day."},
  {word:"Word530",def:"Vocabulary word #530: Keep expanding your linguistic horizons every day."},
  {word:"Word531",def:"Vocabulary word #531: Keep expanding your linguistic horizons every day."},
  {word:"Word532",def:"Vocabulary word #532: Keep expanding your linguistic horizons every day."},
  {word:"Word533",def:"Vocabulary word #533: Keep expanding your linguistic horizons every day."},
  {word:"Word534",def:"Vocabulary word #534: Keep expanding your linguistic horizons every day."},
  {word:"Word535",def:"Vocabulary word #535: Keep expanding your linguistic horizons every day."},
  {word:"Word536",def:"Vocabulary word #536: Keep expanding your linguistic horizons every day."},
  {word:"Word537",def:"Vocabulary word #537: Keep expanding your linguistic horizons every day."},
  {word:"Word538",def:"Vocabulary word #538: Keep expanding your linguistic horizons every day."},
  {word:"Word539",def:"Vocabulary word #539: Keep expanding your linguistic horizons every day."},
  {word:"Word540",def:"Vocabulary word #540: Keep expanding your linguistic horizons every day."},
  {word:"Word541",def:"Vocabulary word #541: Keep expanding your linguistic horizons every day."},
  {word:"Word542",def:"Vocabulary word #542: Keep expanding your linguistic horizons every day."},
  {word:"Word543",def:"Vocabulary word #543: Keep expanding your linguistic horizons every day."},
  {word:"Word544",def:"Vocabulary word #544: Keep expanding your linguistic horizons every day."},
  {word:"Word545",def:"Vocabulary word #545: Keep expanding your linguistic horizons every day."},
  {word:"Word546",def:"Vocabulary word #546: Keep expanding your linguistic horizons every day."},
  {word:"Word547",def:"Vocabulary word #547: Keep expanding your linguistic horizons every day."},
  {word:"Word548",def:"Vocabulary word #548: Keep expanding your linguistic horizons every day."},
  {word:"Word549",def:"Vocabulary word #549: Keep expanding your linguistic horizons every day."},
  {word:"Word550",def:"Vocabulary word #550: Keep expanding your linguistic horizons every day."},
  {word:"Word551",def:"Vocabulary word #551: Keep expanding your linguistic horizons every day."},
  {word:"Word552",def:"Vocabulary word #552: Keep expanding your linguistic horizons every day."},
  {word:"Word553",def:"Vocabulary word #553: Keep expanding your linguistic horizons every day."},
  {word:"Word554",def:"Vocabulary word #554: Keep expanding your linguistic horizons every day."},
  {word:"Word555",def:"Vocabulary word #555: Keep expanding your linguistic horizons every day."},
  {word:"Word556",def:"Vocabulary word #556: Keep expanding your linguistic horizons every day."},
  {word:"Word557",def:"Vocabulary word #557: Keep expanding your linguistic horizons every day."},
  {word:"Word558",def:"Vocabulary word #558: Keep expanding your linguistic horizons every day."},
  {word:"Word559",def:"Vocabulary word #559: Keep expanding your linguistic horizons every day."},
  {word:"Word560",def:"Vocabulary word #560: Keep expanding your linguistic horizons every day."},
  {word:"Word561",def:"Vocabulary word #561: Keep expanding your linguistic horizons every day."},
  {word:"Word562",def:"Vocabulary word #562: Keep expanding your linguistic horizons every day."},
  {word:"Word563",def:"Vocabulary word #563: Keep expanding your linguistic horizons every day."},
  {word:"Word564",def:"Vocabulary word #564: Keep expanding your linguistic horizons every day."},
  {word:"Word565",def:"Vocabulary word #565: Keep expanding your linguistic horizons every day."},
  {word:"Word566",def:"Vocabulary word #566: Keep expanding your linguistic horizons every day."},
  {word:"Word567",def:"Vocabulary word #567: Keep expanding your linguistic horizons every day."},
  {word:"Word568",def:"Vocabulary word #568: Keep expanding your linguistic horizons every day."},
  {word:"Word569",def:"Vocabulary word #569: Keep expanding your linguistic horizons every day."},
  {word:"Word570",def:"Vocabulary word #570: Keep expanding your linguistic horizons every day."},
  {word:"Word571",def:"Vocabulary word #571: Keep expanding your linguistic horizons every day."},
  {word:"Word572",def:"Vocabulary word #572: Keep expanding your linguistic horizons every day."},
  {word:"Word573",def:"Vocabulary word #573: Keep expanding your linguistic horizons every day."},
  {word:"Word574",def:"Vocabulary word #574: Keep expanding your linguistic horizons every day."},
  {word:"Word575",def:"Vocabulary word #575: Keep expanding your linguistic horizons every day."},
  {word:"Word576",def:"Vocabulary word #576: Keep expanding your linguistic horizons every day."},
  {word:"Word577",def:"Vocabulary word #577: Keep expanding your linguistic horizons every day."},
  {word:"Word578",def:"Vocabulary word #578: Keep expanding your linguistic horizons every day."},
  {word:"Word579",def:"Vocabulary word #579: Keep expanding your linguistic horizons every day."},
  {word:"Word580",def:"Vocabulary word #580: Keep expanding your linguistic horizons every day."},
  {word:"Word581",def:"Vocabulary word #581: Keep expanding your linguistic horizons every day."},
  {word:"Word582",def:"Vocabulary word #582: Keep expanding your linguistic horizons every day."},
  {word:"Word583",def:"Vocabulary word #583: Keep expanding your linguistic horizons every day."},
  {word:"Word584",def:"Vocabulary word #584: Keep expanding your linguistic horizons every day."},
  {word:"Word585",def:"Vocabulary word #585: Keep expanding your linguistic horizons every day."},
  {word:"Word586",def:"Vocabulary word #586: Keep expanding your linguistic horizons every day."},
  {word:"Word587",def:"Vocabulary word #587: Keep expanding your linguistic horizons every day."},
  {word:"Word588",def:"Vocabulary word #588: Keep expanding your linguistic horizons every day."},
  {word:"Word589",def:"Vocabulary word #589: Keep expanding your linguistic horizons every day."},
  {word:"Word590",def:"Vocabulary word #590: Keep expanding your linguistic horizons every day."},
  {word:"Word591",def:"Vocabulary word #591: Keep expanding your linguistic horizons every day."},
  {word:"Word592",def:"Vocabulary word #592: Keep expanding your linguistic horizons every day."},
  {word:"Word593",def:"Vocabulary word #593: Keep expanding your linguistic horizons every day."},
  {word:"Word594",def:"Vocabulary word #594: Keep expanding your linguistic horizons every day."},
  {word:"Word595",def:"Vocabulary word #595: Keep expanding your linguistic horizons every day."},
  {word:"Word596",def:"Vocabulary word #596: Keep expanding your linguistic horizons every day."},
  {word:"Word597",def:"Vocabulary word #597: Keep expanding your linguistic horizons every day."},
  {word:"Word598",def:"Vocabulary word #598: Keep expanding your linguistic horizons every day."},
  {word:"Word599",def:"Vocabulary word #599: Keep expanding your linguistic horizons every day."},
  {word:"Word600",def:"Vocabulary word #600: Keep expanding your linguistic horizons every day."},
  {word:"Word601",def:"Vocabulary word #601: Keep expanding your linguistic horizons every day."},
  {word:"Word602",def:"Vocabulary word #602: Keep expanding your linguistic horizons every day."},
  {word:"Word603",def:"Vocabulary word #603: Keep expanding your linguistic horizons every day."},
  {word:"Word604",def:"Vocabulary word #604: Keep expanding your linguistic horizons every day."},
  {word:"Word605",def:"Vocabulary word #605: Keep expanding your linguistic horizons every day."},
  {word:"Word606",def:"Vocabulary word #606: Keep expanding your linguistic horizons every day."},
  {word:"Word607",def:"Vocabulary word #607: Keep expanding your linguistic horizons every day."},
  {word:"Word608",def:"Vocabulary word #608: Keep expanding your linguistic horizons every day."},
  {word:"Word609",def:"Vocabulary word #609: Keep expanding your linguistic horizons every day."},
  {word:"Word610",def:"Vocabulary word #610: Keep expanding your linguistic horizons every day."},
  {word:"Word611",def:"Vocabulary word #611: Keep expanding your linguistic horizons every day."},
  {word:"Word612",def:"Vocabulary word #612: Keep expanding your linguistic horizons every day."},
  {word:"Word613",def:"Vocabulary word #613: Keep expanding your linguistic horizons every day."},
  {word:"Word614",def:"Vocabulary word #614: Keep expanding your linguistic horizons every day."},
  {word:"Word615",def:"Vocabulary word #615: Keep expanding your linguistic horizons every day."},
  {word:"Word616",def:"Vocabulary word #616: Keep expanding your linguistic horizons every day."},
  {word:"Word617",def:"Vocabulary word #617: Keep expanding your linguistic horizons every day."},
  {word:"Word618",def:"Vocabulary word #618: Keep expanding your linguistic horizons every day."},
  {word:"Word619",def:"Vocabulary word #619: Keep expanding your linguistic horizons every day."},
  {word:"Word620",def:"Vocabulary word #620: Keep expanding your linguistic horizons every day."},
  {word:"Word621",def:"Vocabulary word #621: Keep expanding your linguistic horizons every day."},
  {word:"Word622",def:"Vocabulary word #622: Keep expanding your linguistic horizons every day."},
  {word:"Word623",def:"Vocabulary word #623: Keep expanding your linguistic horizons every day."},
  {word:"Word624",def:"Vocabulary word #624: Keep expanding your linguistic horizons every day."},
  {word:"Word625",def:"Vocabulary word #625: Keep expanding your linguistic horizons every day."},
  {word:"Word626",def:"Vocabulary word #626: Keep expanding your linguistic horizons every day."},
  {word:"Word627",def:"Vocabulary word #627: Keep expanding your linguistic horizons every day."},
  {word:"Word628",def:"Vocabulary word #628: Keep expanding your linguistic horizons every day."},
  {word:"Word629",def:"Vocabulary word #629: Keep expanding your linguistic horizons every day."},
  {word:"Word630",def:"Vocabulary word #630: Keep expanding your linguistic horizons every day."},
  {word:"Word631",def:"Vocabulary word #631: Keep expanding your linguistic horizons every day."},
  {word:"Word632",def:"Vocabulary word #632: Keep expanding your linguistic horizons every day."},
  {word:"Word633",def:"Vocabulary word #633: Keep expanding your linguistic horizons every day."},
  {word:"Word634",def:"Vocabulary word #634: Keep expanding your linguistic horizons every day."},
  {word:"Word635",def:"Vocabulary word #635: Keep expanding your linguistic horizons every day."},
  {word:"Word636",def:"Vocabulary word #636: Keep expanding your linguistic horizons every day."},
  {word:"Word637",def:"Vocabulary word #637: Keep expanding your linguistic horizons every day."},
  {word:"Word638",def:"Vocabulary word #638: Keep expanding your linguistic horizons every day."},
  {word:"Word639",def:"Vocabulary word #639: Keep expanding your linguistic horizons every day."},
  {word:"Word640",def:"Vocabulary word #640: Keep expanding your linguistic horizons every day."},
  {word:"Word641",def:"Vocabulary word #641: Keep expanding your linguistic horizons every day."},
  {word:"Word642",def:"Vocabulary word #642: Keep expanding your linguistic horizons every day."},
  {word:"Word643",def:"Vocabulary word #643: Keep expanding your linguistic horizons every day."},
  {word:"Word644",def:"Vocabulary word #644: Keep expanding your linguistic horizons every day."},
  {word:"Word645",def:"Vocabulary word #645: Keep expanding your linguistic horizons every day."},
  {word:"Word646",def:"Vocabulary word #646: Keep expanding your linguistic horizons every day."},
  {word:"Word647",def:"Vocabulary word #647: Keep expanding your linguistic horizons every day."},
  {word:"Word648",def:"Vocabulary word #648: Keep expanding your linguistic horizons every day."},
  {word:"Word649",def:"Vocabulary word #649: Keep expanding your linguistic horizons every day."},
  {word:"Word650",def:"Vocabulary word #650: Keep expanding your linguistic horizons every day."},
  {word:"Word651",def:"Vocabulary word #651: Keep expanding your linguistic horizons every day."},
  {word:"Word652",def:"Vocabulary word #652: Keep expanding your linguistic horizons every day."},
  {word:"Word653",def:"Vocabulary word #653: Keep expanding your linguistic horizons every day."},
  {word:"Word654",def:"Vocabulary word #654: Keep expanding your linguistic horizons every day."},
  {word:"Word655",def:"Vocabulary word #655: Keep expanding your linguistic horizons every day."},
  {word:"Word656",def:"Vocabulary word #656: Keep expanding your linguistic horizons every day."},
  {word:"Word657",def:"Vocabulary word #657: Keep expanding your linguistic horizons every day."},
  {word:"Word658",def:"Vocabulary word #658: Keep expanding your linguistic horizons every day."},
  {word:"Word659",def:"Vocabulary word #659: Keep expanding your linguistic horizons every day."},
  {word:"Word660",def:"Vocabulary word #660: Keep expanding your linguistic horizons every day."},
  {word:"Word661",def:"Vocabulary word #661: Keep expanding your linguistic horizons every day."},
  {word:"Word662",def:"Vocabulary word #662: Keep expanding your linguistic horizons every day."},
  {word:"Word663",def:"Vocabulary word #663: Keep expanding your linguistic horizons every day."},
  {word:"Word664",def:"Vocabulary word #664: Keep expanding your linguistic horizons every day."},
  {word:"Word665",def:"Vocabulary word #665: Keep expanding your linguistic horizons every day."},
  {word:"Word666",def:"Vocabulary word #666: Keep expanding your linguistic horizons every day."},
  {word:"Word667",def:"Vocabulary word #667: Keep expanding your linguistic horizons every day."},
  {word:"Word668",def:"Vocabulary word #668: Keep expanding your linguistic horizons every day."},
  {word:"Word669",def:"Vocabulary word #669: Keep expanding your linguistic horizons every day."},
  {word:"Word670",def:"Vocabulary word #670: Keep expanding your linguistic horizons every day."},
  {word:"Word671",def:"Vocabulary word #671: Keep expanding your linguistic horizons every day."},
  {word:"Word672",def:"Vocabulary word #672: Keep expanding your linguistic horizons every day."},
  {word:"Word673",def:"Vocabulary word #673: Keep expanding your linguistic horizons every day."},
  {word:"Word674",def:"Vocabulary word #674: Keep expanding your linguistic horizons every day."},
  {word:"Word675",def:"Vocabulary word #675: Keep expanding your linguistic horizons every day."},
  {word:"Word676",def:"Vocabulary word #676: Keep expanding your linguistic horizons every day."},
  {word:"Word677",def:"Vocabulary word #677: Keep expanding your linguistic horizons every day."},
  {word:"Word678",def:"Vocabulary word #678: Keep expanding your linguistic horizons every day."},
  {word:"Word679",def:"Vocabulary word #679: Keep expanding your linguistic horizons every day."},
  {word:"Word680",def:"Vocabulary word #680: Keep expanding your linguistic horizons every day."},
  {word:"Word681",def:"Vocabulary word #681: Keep expanding your linguistic horizons every day."},
  {word:"Word682",def:"Vocabulary word #682: Keep expanding your linguistic horizons every day."},
  {word:"Word683",def:"Vocabulary word #683: Keep expanding your linguistic horizons every day."},
  {word:"Word684",def:"Vocabulary word #684: Keep expanding your linguistic horizons every day."},
  {word:"Word685",def:"Vocabulary word #685: Keep expanding your linguistic horizons every day."},
  {word:"Word686",def:"Vocabulary word #686: Keep expanding your linguistic horizons every day."},
  {word:"Word687",def:"Vocabulary word #687: Keep expanding your linguistic horizons every day."},
  {word:"Word688",def:"Vocabulary word #688: Keep expanding your linguistic horizons every day."},
  {word:"Word689",def:"Vocabulary word #689: Keep expanding your linguistic horizons every day."},
  {word:"Word690",def:"Vocabulary word #690: Keep expanding your linguistic horizons every day."},
  {word:"Word691",def:"Vocabulary word #691: Keep expanding your linguistic horizons every day."},
  {word:"Word692",def:"Vocabulary word #692: Keep expanding your linguistic horizons every day."},
  {word:"Word693",def:"Vocabulary word #693: Keep expanding your linguistic horizons every day."},
  {word:"Word694",def:"Vocabulary word #694: Keep expanding your linguistic horizons every day."},
  {word:"Word695",def:"Vocabulary word #695: Keep expanding your linguistic horizons every day."},
  {word:"Word696",def:"Vocabulary word #696: Keep expanding your linguistic horizons every day."},
  {word:"Word697",def:"Vocabulary word #697: Keep expanding your linguistic horizons every day."},
  {word:"Word698",def:"Vocabulary word #698: Keep expanding your linguistic horizons every day."},
  {word:"Word699",def:"Vocabulary word #699: Keep expanding your linguistic horizons every day."},
  {word:"Word700",def:"Vocabulary word #700: Keep expanding your linguistic horizons every day."},
  {word:"Word701",def:"Vocabulary word #701: Keep expanding your linguistic horizons every day."},
  {word:"Word702",def:"Vocabulary word #702: Keep expanding your linguistic horizons every day."},
  {word:"Word703",def:"Vocabulary word #703: Keep expanding your linguistic horizons every day."},
  {word:"Word704",def:"Vocabulary word #704: Keep expanding your linguistic horizons every day."},
  {word:"Word705",def:"Vocabulary word #705: Keep expanding your linguistic horizons every day."},
  {word:"Word706",def:"Vocabulary word #706: Keep expanding your linguistic horizons every day."},
  {word:"Word707",def:"Vocabulary word #707: Keep expanding your linguistic horizons every day."},
  {word:"Word708",def:"Vocabulary word #708: Keep expanding your linguistic horizons every day."},
  {word:"Word709",def:"Vocabulary word #709: Keep expanding your linguistic horizons every day."},
  {word:"Word710",def:"Vocabulary word #710: Keep expanding your linguistic horizons every day."},
  {word:"Word711",def:"Vocabulary word #711: Keep expanding your linguistic horizons every day."},
  {word:"Word712",def:"Vocabulary word #712: Keep expanding your linguistic horizons every day."},
  {word:"Word713",def:"Vocabulary word #713: Keep expanding your linguistic horizons every day."},
  {word:"Word714",def:"Vocabulary word #714: Keep expanding your linguistic horizons every day."},
  {word:"Word715",def:"Vocabulary word #715: Keep expanding your linguistic horizons every day."},
  {word:"Word716",def:"Vocabulary word #716: Keep expanding your linguistic horizons every day."},
  {word:"Word717",def:"Vocabulary word #717: Keep expanding your linguistic horizons every day."},
  {word:"Word718",def:"Vocabulary word #718: Keep expanding your linguistic horizons every day."},
  {word:"Word719",def:"Vocabulary word #719: Keep expanding your linguistic horizons every day."},
  {word:"Word720",def:"Vocabulary word #720: Keep expanding your linguistic horizons every day."},
  {word:"Word721",def:"Vocabulary word #721: Keep expanding your linguistic horizons every day."},
  {word:"Word722",def:"Vocabulary word #722: Keep expanding your linguistic horizons every day."},
  {word:"Word723",def:"Vocabulary word #723: Keep expanding your linguistic horizons every day."},
  {word:"Word724",def:"Vocabulary word #724: Keep expanding your linguistic horizons every day."},
  {word:"Word725",def:"Vocabulary word #725: Keep expanding your linguistic horizons every day."},
  {word:"Word726",def:"Vocabulary word #726: Keep expanding your linguistic horizons every day."},
  {word:"Word727",def:"Vocabulary word #727: Keep expanding your linguistic horizons every day."},
  {word:"Word728",def:"Vocabulary word #728: Keep expanding your linguistic horizons every day."},
  {word:"Word729",def:"Vocabulary word #729: Keep expanding your linguistic horizons every day."},
  {word:"Word730",def:"Vocabulary word #730: Keep expanding your linguistic horizons every day."},
];

// ─── NOTEBOOK PANEL (standalone tab) ──────────────────────────────────────
const NotebookPanel=()=>{
  const NB_KEY="zodibuddy_notebook_v1";
  // Pixel compression: store color table + indices instead of full hex per pixel
  const compressPixels=(pixels)=>{if(!pixels||typeof pixels!=="object")return pixels;
    // Check if already compressed
    if(pixels._ct)return pixels;
    const entries=Object.entries(pixels);if(entries.length===0)return pixels;
    // Build color table
    const colorSet=new Set(entries.map(([,c])=>c));
    if(colorSet.size>500)return pixels; // too many colors, don't compress (rare)
    const ct=[...colorSet];const colorIdx={};ct.forEach((c,i)=>{colorIdx[c]=i;});
    const pd={};entries.forEach(([k,c])=>{pd[k]=colorIdx[c];});
    return{_ct:ct,_pd:pd};
  };
  const decompressPixels=(pixels)=>{if(!pixels||typeof pixels!=="object")return pixels||{};
    if(!pixels._ct)return pixels; // not compressed
    const ct=pixels._ct;const pd=pixels._pd||{};
    const result={};Object.entries(pd).forEach(([k,i])=>{if(ct[i])result[k]=ct[i];});
    return result;
  };
  const readNb=()=>{try{const raw=JSON.parse(localStorage.getItem(NB_KEY))||{pages:[],archive:[],pwHash:null};
    // Decompress pixel data on read
    if(raw.pages)raw.pages.forEach(p=>{if(p.pixels)p.pixels=decompressPixels(p.pixels);});
    if(raw.archive)raw.archive.forEach(p=>{if(p.pixels)p.pixels=decompressPixels(p.pixels);});
    return raw;}catch{return{pages:[],archive:[],pwHash:null};}};
  const writeNb=(d)=>{
    // Compress pixel data on write
    const copy=JSON.parse(JSON.stringify(d));
    if(copy.pages)copy.pages.forEach(p=>{if(p.pixels&&!p.pixels._ct)p.pixels=compressPixels(p.pixels);});
    if(copy.archive)copy.archive.forEach(p=>{if(p.pixels&&!p.pixels._ct)p.pixels=compressPixels(p.pixels);});
    localStorage.setItem(NB_KEY,JSON.stringify(copy));
  };
  // Storage usage helper
  const getStorageUsage=()=>{let total=0;try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);const v=localStorage.getItem(k);total+=(k.length+v.length)*2;}}catch{}return total;};

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
  const[nbExpandedIdx,setNbExpandedIdx]=useState(null);
  const[nbPreviewMode,setNbPreviewMode]=useState(()=>{try{return localStorage.getItem("zobuddy_nb_preview")!=="false";}catch{return true;}});
  const togglePreviewMode=()=>{const nv=!nbPreviewMode;setNbPreviewMode(nv);try{localStorage.setItem("zobuddy_nb_preview",String(nv));}catch{}};

  // Delete/archive from within an open page
  const archiveCurrentPage=()=>{const idx=pageIdxRef.current;const d=readNb();if(!d.pages?.[idx])return;
    d.archive.push(d.pages[idx]);d.pages.splice(idx,1);saveNb(d);setNbView("toc");};
  const deleteCurrentPage=()=>{const idx=pageIdxRef.current;const d=readNb();if(!d.pages?.[idx])return;
    if(!confirm(`Delete "${d.pages[idx].title||"Untitled"}"?`))return;
    d.pages.splice(idx,1);saveNb(d);setNbView("toc");};
  const[pageZoom,setPageZoom]=useState(1);
  const[pageDrawMode,setPageDrawMode]=useState(false);
  const[drawColor,setDrawColor]=useState("#fff");
  const[drawSize,setDrawSize]=useState(3);
  const[drawEraser,setDrawEraser]=useState(false);
  const[drawEraserSize,setDrawEraserSize]=useState(20);
  const[showDrawPicker,setShowDrawPicker]=useState(false);
  const[drawPaletteSearch,setDrawPaletteSearch]=useState("");
  const[pixelColor,setPixelColor]=useState("#f5576c");
  const[pixelEraser,setPixelEraser]=useState(false);
  // Vector art state
  const[vecImporting,setVecImporting]=useState(false);
  const[vecShowPicker,setVecShowPicker]=useState(false);
  const[vecPaletteSearch,setVecPaletteSearch]=useState("");
  const vecFileRef=React.useRef(null);
  const[saved,setSaved]=useState(false);
  const[renaming,setRenaming]=useState(false);
  const[renameVal,setRenameVal]=useState("");
  const startRename=()=>{const d=readNb();const page=d.pages?.[pageIdxRef.current];setRenameVal(page?.title||"");setRenaming(true);};
  const doRename=()=>{if(!renameVal.trim())return;save("title",renameVal.trim());setRenaming(false);syncState();};
  const switchPageType=(newType)=>{save("type",newType);syncState();};

  // ─── INLINE CHECKBOX — single tap: toggle if on checkbox line, else insert ⬜
  const handleCheckbox=()=>{
    const el=textareaRef.current;if(!el)return;
    const pos=el.selectionStart;const val=el.value;
    const lineStart=val.lastIndexOf("\n",pos-1)+1;
    const lineEnd=val.indexOf("\n",pos);const le=lineEnd===-1?val.length:lineEnd;
    const line=val.slice(lineStart,le);
    // Support both old (☐☑) and new (⬜✅) checkbox formats
    const findCheck=(str,chars)=>{for(const ch of chars){const i=str.indexOf(ch);if(i>=0)return{i,ch};}return null;};
    const uncheckedMatch=findCheck(line,["⬜","☐"]);
    const checkedMatch=findCheck(line,["✅","☑"]);
    if(uncheckedMatch||checkedMatch){
      let idx,wasDone,charLen;
      if(uncheckedMatch&&(!checkedMatch||uncheckedMatch.i<checkedMatch.i)){
        idx=lineStart+uncheckedMatch.i;wasDone=false;charLen=uncheckedMatch.ch.length;
      }else{
        idx=lineStart+checkedMatch.i;wasDone=true;charLen=checkedMatch.ch.length;
      }
      const replacement=wasDone?"⬜":"✅";
      const newVal=val.slice(0,idx)+replacement+val.slice(idx+charLen);
      el.value=newVal;textRef.current=newVal;el.selectionStart=el.selectionEnd=pos+(replacement.length-charLen);saveText();
    }else{
      // No checkbox on line — insert one at cursor
      const newVal=val.slice(0,pos)+"⬜ "+val.slice(pos);
      el.value=newVal;textRef.current=newVal;el.selectionStart=el.selectionEnd=pos+2;el.focus();saveText();
    }
  };

  // ─── TOC REORDER ───────────────────────────────────────────────
  const movePageInToc=(idx,dir)=>{const d=readNb();const ni=idx+dir;if(ni<0||ni>=d.pages.length)return;[d.pages[idx],d.pages[ni]]=[d.pages[ni],d.pages[idx]];saveNb(d);setNbExpandedIdx(ni);};

  const drawCanvasRef=React.useRef(null);
  const isDrawingRef=React.useRef(false);
  const saveTimerRef=React.useRef(null);
  const drawImgRef=React.useRef(null);
  const colorRef=React.useRef(drawColor);colorRef.current=drawColor;
  const sizeRef=React.useRef(drawSize);sizeRef.current=drawSize;
  const eraserRef=React.useRef(drawEraser);eraserRef.current=drawEraser;
  const eraserSizeRef=React.useRef(drawEraserSize);eraserSizeRef.current=drawEraserSize;
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
  const drawUndoStack=React.useRef([]); // ImageData snapshots
  const drawRedoStack=React.useRef([]);
  const pushDrawUndo=()=>{const c=drawCanvasRef.current;if(!c)return;try{const ctx=c.getContext("2d");drawUndoStack.current.push(ctx.getImageData(0,0,c.width,c.height));if(drawUndoStack.current.length>30)drawUndoStack.current.shift();drawRedoStack.current=[];}catch{}};
  const undoDraw=()=>{const c=drawCanvasRef.current;if(!c||!drawUndoStack.current.length)return;const ctx=c.getContext("2d");
    drawRedoStack.current.push(ctx.getImageData(0,0,c.width,c.height));
    const prev=drawUndoStack.current.pop();ctx.putImageData(prev,0,0);saveCanvas();};
  const redoDraw=()=>{const c=drawCanvasRef.current;if(!c||!drawRedoStack.current.length)return;const ctx=c.getContext("2d");
    drawUndoStack.current.push(ctx.getImageData(0,0,c.width,c.height));
    const next=drawRedoStack.current.pop();ctx.putImageData(next,0,0);saveCanvas();};
  const loadCanvas=()=>{const c=drawCanvasRef.current;if(!c)return;const ctx=c.getContext("2d");
    ctx.clearRect(0,0,c.width,c.height);drawImgRef.current=null;drawUndoStack.current=[];drawRedoStack.current=[];
    const d=readNb();const src=d.pages?.[pageIdxRef.current]?.drawData||null;
    if(src){drawImgRef.current=src;const img=new Image();img.onload=()=>ctx.drawImage(img,0,0);img.src=src;}};
  const drawPinchDist=React.useRef(null);
  const drawPendingDown=React.useRef(null);
  const drawStartPos=React.useRef(null);
  const onDown=React.useCallback((e)=>{
    if(e.touches&&e.touches.length>1){
      // Two fingers — cancel any pending dot, switch to pinch
      if(drawPendingDown.current){clearTimeout(drawPendingDown.current);drawPendingDown.current=null;}
      isDrawingRef.current=false;
      const t1=e.touches[0],t2=e.touches[1];
      drawPinchDist.current=Math.hypot(t1.clientX-t2.clientX,t1.clientY-t2.clientY);
      e.preventDefault();return;
    }
    const c=drawCanvasRef.current;if(!c)return;
    const r=c.getBoundingClientRect(),sx=c.width/r.width,sy=c.height/r.height;
    const t=e.touches?e.touches[0]:e;
    const x=(t.clientX-r.left)*sx,y=(t.clientY-r.top)*sy;
    drawStartPos.current={x,y};
    if(!e.touches){
      // Mouse: draw immediately
      e.preventDefault();
      const ctx=c.getContext("2d");pushDrawUndo();
      if(eraserRef.current){ctx.globalCompositeOperation="destination-out";ctx.lineWidth=eraserSizeRef.current;}
      else{ctx.globalCompositeOperation="source-over";ctx.strokeStyle=colorRef.current;ctx.fillStyle=colorRef.current;ctx.lineWidth=sizeRef.current;}
      ctx.lineCap="round";ctx.lineJoin="round";
      ctx.beginPath();ctx.arc(x,y,eraserRef.current?eraserSizeRef.current/2:sizeRef.current/2,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.moveTo(x,y);
      isDrawingRef.current=true;
    } else {
      // Touch: delay to check for second finger
      drawPendingDown.current=setTimeout(()=>{
        drawPendingDown.current=null;
        const ctx=c.getContext("2d");pushDrawUndo();
        if(eraserRef.current){ctx.globalCompositeOperation="destination-out";ctx.lineWidth=eraserSizeRef.current;}
        else{ctx.globalCompositeOperation="source-over";ctx.strokeStyle=colorRef.current;ctx.fillStyle=colorRef.current;ctx.lineWidth=sizeRef.current;}
        ctx.lineCap="round";ctx.lineJoin="round";
        ctx.beginPath();ctx.arc(x,y,eraserRef.current?eraserSizeRef.current/2:sizeRef.current/2,0,Math.PI*2);ctx.fill();
        ctx.beginPath();ctx.moveTo(x,y);
        isDrawingRef.current=true;
      },80);
    }
  },[]);
  const onMove=React.useCallback((e)=>{
    if(e.touches&&e.touches.length>1){
      // Pinch zoom
      if(drawPendingDown.current){clearTimeout(drawPendingDown.current);drawPendingDown.current=null;}
      isDrawingRef.current=false;
      const t1=e.touches[0],t2=e.touches[1];
      const dist=Math.hypot(t1.clientX-t2.clientX,t1.clientY-t2.clientY);
      if(drawPinchDist.current!==null){
        const scale=dist/drawPinchDist.current;
        if(Math.abs(scale-1)>0.01)setPageZoom(z=>Math.max(0.3,Math.min(8,z*scale)));
      }
      drawPinchDist.current=dist;
      e.preventDefault();return;
    }
    // Flush pending down on first move
    if(drawPendingDown.current){
      clearTimeout(drawPendingDown.current);drawPendingDown.current=null;
      const c=drawCanvasRef.current;if(!c)return;
      const ctx=c.getContext("2d");pushDrawUndo();
      const sp=drawStartPos.current;
      if(eraserRef.current){ctx.globalCompositeOperation="destination-out";ctx.lineWidth=eraserSizeRef.current;}
      else{ctx.globalCompositeOperation="source-over";ctx.strokeStyle=colorRef.current;ctx.fillStyle=colorRef.current;ctx.lineWidth=sizeRef.current;}
      ctx.lineCap="round";ctx.lineJoin="round";
      if(sp){ctx.beginPath();ctx.moveTo(sp.x,sp.y);}
      isDrawingRef.current=true;
    }
    if(!isDrawingRef.current)return;e.preventDefault();const c=drawCanvasRef.current;if(!c)return;const ctx=c.getContext("2d");
    const r=c.getBoundingClientRect(),sx=c.width/r.width,sy=c.height/r.height;const t=e.touches?e.touches[0]:e;
    ctx.lineTo((t.clientX-r.left)*sx,(t.clientY-r.top)*sy);ctx.stroke();},[]);
  const onUp=React.useCallback((e)=>{
    // Flush pending dot for single tap
    if(drawPendingDown.current){
      clearTimeout(drawPendingDown.current);drawPendingDown.current=null;
      const c=drawCanvasRef.current;if(c){
        const ctx=c.getContext("2d");pushDrawUndo();
        const sp=drawStartPos.current;
        if(eraserRef.current){ctx.globalCompositeOperation="destination-out";ctx.lineWidth=eraserSizeRef.current;}
        else{ctx.globalCompositeOperation="source-over";ctx.strokeStyle=colorRef.current;ctx.fillStyle=colorRef.current;ctx.lineWidth=sizeRef.current;}
        ctx.lineCap="round";ctx.lineJoin="round";
        if(sp){ctx.beginPath();ctx.arc(sp.x,sp.y,eraserRef.current?eraserSizeRef.current/2:sizeRef.current/2,0,Math.PI*2);ctx.fill();}
      }
    }
    drawPinchDist.current=null;drawStartPos.current=null;
    if(!isDrawingRef.current){saveCanvas();return;}isDrawingRef.current=false;
    const c=drawCanvasRef.current;if(c)c.getContext("2d").globalCompositeOperation="source-over";saveCanvas();},[]);
  const canvasCallbackRef=React.useCallback((node)=>{if(node){drawCanvasRef.current=node;
    node.addEventListener("touchstart",onDown,{passive:false});node.addEventListener("touchmove",onMove,{passive:false});
    node.addEventListener("touchend",onUp);node.addEventListener("mousedown",onDown);
    node.addEventListener("mousemove",onMove);node.addEventListener("mouseup",onUp);node.addEventListener("mouseleave",onUp);
    setTimeout(loadCanvas,50);}},[nbPageIdx,pageDrawMode]);

  // ─── PIXEL ART ──────────────────────────────────────────────────
  const pixCanvasRef=React.useRef(null);const pixIsPainting=React.useRef(false);const pixelUndoRef=React.useRef([]);const pixelRedoRef=React.useRef([]);
  const pixScrollRef=React.useRef(null);
  const pixPanStart=React.useRef(null); // for two-finger pan: {x, y, scrollLeft, scrollTop}
  // DMC embroidery thread color palette — full standard collection
  const PIXEL_PALETTE=[
    {n:"310",c:"#000000",nm:"Black"},{n:"3799",c:"#424240",nm:"Pewter Gray Vy Dk"},{n:"413",c:"#565656",nm:"Pewter Gray Dk"},{n:"317",c:"#6C6B6B",nm:"Pewter Gray"},
    {n:"414",c:"#8C8C8C",nm:"Steel Gray Dk"},{n:"318",c:"#A9A9A6",nm:"Steel Gray Lt"},{n:"415",c:"#D8D8D4",nm:"Pearl Gray"},{n:"762",c:"#ECECEC",nm:"Pearl Gray Vy Lt"},
    {n:"Blanc",c:"#FFFFFF",nm:"White"},{n:"Ecru",c:"#F0EADC",nm:"Ecru"},{n:"712",c:"#FFFCE6",nm:"Cream"},{n:"746",c:"#FFF8E7",nm:"Off White"},
    {n:"321",c:"#C7252C",nm:"Christmas Red"},{n:"666",c:"#E31D42",nm:"Christmas Red Bright"},{n:"304",c:"#B71F33",nm:"Christmas Red Md"},{n:"498",c:"#A7132B",nm:"Christmas Red Dk"},
    {n:"349",c:"#D21035",nm:"Coral Dk"},{n:"350",c:"#E04848",nm:"Coral Md"},{n:"351",c:"#E96A67",nm:"Coral"},{n:"352",c:"#FD9C97",nm:"Coral Lt"},
    {n:"353",c:"#FEC5BB",nm:"Peach Flesh"},{n:"948",c:"#FEE5D6",nm:"Peach Vy Lt"},{n:"754",c:"#F7C4A8",nm:"Peach Lt"},{n:"758",c:"#EEA988",nm:"Terra Cotta Vy Lt"},
    {n:"355",c:"#984333",nm:"Terra Cotta Dk"},{n:"356",c:"#C46950",nm:"Terra Cotta Md"},{n:"3830",c:"#BC6152",nm:"Terra Cotta"},{n:"3778",c:"#D88878",nm:"Terra Cotta Lt"},
    {n:"606",c:"#FA3104",nm:"Bright Orange Red"},{n:"608",c:"#FD6C20",nm:"Bright Orange"},{n:"740",c:"#FF8313",nm:"Tangerine"},{n:"741",c:"#FFA024",nm:"Tangerine Md"},
    {n:"742",c:"#FFD16B",nm:"Tangerine Lt"},{n:"743",c:"#FED77A",nm:"Yellow Md Lt"},{n:"744",c:"#FFE793",nm:"Yellow Pale"},{n:"307",c:"#FDED54",nm:"Lemon"},
    {n:"973",c:"#FFE502",nm:"Canary Bright"},{n:"444",c:"#FFD700",nm:"Lemon Dk"},{n:"725",c:"#FFC840",nm:"Topaz"},{n:"726",c:"#FDD755",nm:"Topaz Lt"},
    {n:"972",c:"#FFB515",nm:"Canary Deep"},{n:"970",c:"#F78B13",nm:"Pumpkin Lt"},{n:"946",c:"#EB5C0C",nm:"Burnt Orange Md"},{n:"900",c:"#D55A11",nm:"Burnt Orange Dk"},
    {n:"720",c:"#E35728",nm:"Orange Spice Dk"},{n:"721",c:"#F27842",nm:"Orange Spice Md"},{n:"722",c:"#F7A762",nm:"Orange Spice Lt"},{n:"402",c:"#F7A96C",nm:"Mahogany Vy Lt"},
    {n:"676",c:"#E4C77C",nm:"Old Gold Lt"},{n:"729",c:"#D3A638",nm:"Old Gold Md"},{n:"680",c:"#BC8D0C",nm:"Dark Old Gold"},{n:"783",c:"#CE9F13",nm:"Topaz Md"},
    {n:"3820",c:"#DFB038",nm:"Straw Dk"},{n:"3821",c:"#F0C848",nm:"Straw"},{n:"3822",c:"#F6D870",nm:"Straw Lt"},{n:"3852",c:"#CD9620",nm:"Straw Vy Dk"},
    {n:"300",c:"#6F3510",nm:"Mahogany Vy Dk"},{n:"301",c:"#B35F2E",nm:"Mahogany Md"},{n:"400",c:"#8D4126",nm:"Mahogany Dk"},{n:"3826",c:"#AD6530",nm:"Golden Brown"},
    {n:"975",c:"#7D4A18",nm:"Golden Brown Dk"},{n:"976",c:"#C28138",nm:"Golden Brown Md"},{n:"977",c:"#DC9B40",nm:"Golden Brown Lt"},{n:"3827",c:"#F7BE6E",nm:"Golden Brown Pale"},
    {n:"433",c:"#7A5120",nm:"Brown Md"},{n:"434",c:"#985F26",nm:"Brown Lt"},{n:"435",c:"#B37830",nm:"Brown Vy Lt"},{n:"436",c:"#CB9848",nm:"Tan"},
    {n:"437",c:"#DBBC80",nm:"Tan Lt"},{n:"738",c:"#DBBF95",nm:"Tan Vy Lt"},{n:"739",c:"#F1DCC1",nm:"Tan Ult Vy Lt"},{n:"543",c:"#F2DFC6",nm:"Beige Brown Ult Vy Lt"},
    {n:"898",c:"#492818",nm:"Coffee Brown Vy Dk"},{n:"801",c:"#653618",nm:"Coffee Brown Dk"},{n:"938",c:"#3C2212",nm:"Coffee Brown Ult Dk"},{n:"3371",c:"#1E120A",nm:"Black Brown"},
    {n:"420",c:"#A07240",nm:"Hazel Nut Brown Dk"},{n:"422",c:"#C09C6C",nm:"Hazel Nut Brown Lt"},{n:"869",c:"#835E2E",nm:"Hazel Nut Brown Vy Dk"},{n:"3828",c:"#B0885C",nm:"Hazel Nut Brown"},
    {n:"335",c:"#EE5570",nm:"Rose"},{n:"326",c:"#B33854",nm:"Rose Vy Dp"},{n:"309",c:"#B63060",nm:"Rose Dk"},{n:"899",c:"#F2546E",nm:"Rose Md"},
    {n:"956",c:"#FF7189",nm:"Geranium"},{n:"957",c:"#FD9BB3",nm:"Geranium Pale"},{n:"891",c:"#FF496C",nm:"Carnation Dk"},{n:"892",c:"#FF6883",nm:"Carnation Md"},
    {n:"893",c:"#FC8EA3",nm:"Carnation Lt"},{n:"894",c:"#FFB0C0",nm:"Carnation Vy Lt"},{n:"818",c:"#FFDFD8",nm:"Baby Pink"},{n:"776",c:"#FCB4B8",nm:"Pink Md"},
    {n:"961",c:"#CF5571",nm:"Dusty Rose Dk"},{n:"962",c:"#E87891",nm:"Dusty Rose Md"},{n:"3354",c:"#E4949E",nm:"Dusty Rose Lt"},{n:"963",c:"#FFD1DC",nm:"Dusty Rose Ult Vy Lt"},
    {n:"3350",c:"#BC4365",nm:"Dusty Rose Ult Dk"},{n:"150",c:"#AB5236",nm:"Dusty Rose Vy Dk"},{n:"151",c:"#F0A0B5",nm:"Dusty Rose Vy Lt"},{n:"152",c:"#E2A099",nm:"Shell Pink Md Lt"},
    {n:"221",c:"#883E3A",nm:"Shell Pink Vy Dk"},{n:"223",c:"#CC847C",nm:"Shell Pink Lt"},{n:"224",c:"#EBADA8",nm:"Shell Pink Vy Lt"},{n:"225",c:"#FFE0DA",nm:"Shell Pink Ult Vy Lt"},
    {n:"3685",c:"#88264A",nm:"Mauve Vy Dk"},{n:"3687",c:"#C76275",nm:"Mauve"},{n:"3688",c:"#E89DA5",nm:"Mauve Md"},{n:"3689",c:"#FCBCC4",nm:"Mauve Lt"},
    {n:"902",c:"#821132",nm:"Garnet Vy Dk"},{n:"814",c:"#7B0024",nm:"Garnet Dk"},{n:"815",c:"#880029",nm:"Garnet Md"},{n:"816",c:"#970028",nm:"Garnet"},
    {n:"817",c:"#BB0024",nm:"Coral Red Vy Dk"},{n:"3801",c:"#E7272A",nm:"Melon Vy Dk"},{n:"3705",c:"#FF6B84",nm:"Melon Dk"},{n:"3706",c:"#FFAAB8",nm:"Melon Md"},
    {n:"3708",c:"#FFC8D5",nm:"Melon Lt"},{n:"3712",c:"#F5A0A0",nm:"Salmon Md"},{n:"3328",c:"#E36D6D",nm:"Salmon Dk"},{n:"347",c:"#BF2D36",nm:"Salmon Vy Dk"},
    {n:"760",c:"#F5A5A0",nm:"Salmon"},{n:"761",c:"#FFC4C4",nm:"Salmon Lt"},{n:"3713",c:"#FFE0E0",nm:"Salmon Vy Lt"},{n:"3340",c:"#FF7E5B",nm:"Apricot Md"},
    {n:"3341",c:"#FCAB8B",nm:"Apricot"},{n:"967",c:"#FFCFCA",nm:"Apricot Vy Lt"},{n:"3824",c:"#FEACA8",nm:"Apricot Lt"},{n:"945",c:"#FDDEB5",nm:"Tawny"},
    {n:"950",c:"#EEC6A8",nm:"Desert Sand Lt"},{n:"951",c:"#FFE0B5",nm:"Tawny Lt"},{n:"3064",c:"#BC7C60",nm:"Desert Sand"},{n:"407",c:"#BC7F67",nm:"Sportsman Flesh Vy Dk"},
    {n:"3772",c:"#A06048",nm:"Desert Sand Dk"},{n:"3773",c:"#B87C64",nm:"Desert Sand Md"},{n:"3774",c:"#F0C8B0",nm:"Desert Sand Vy Lt"},{n:"3770",c:"#FFDEC8",nm:"Tawny Vy Lt"},
    {n:"915",c:"#820043",nm:"Plum Dk"},{n:"917",c:"#9B1868",nm:"Plum Md"},{n:"718",c:"#9C2463",nm:"Plum"},{n:"3607",c:"#C44080",nm:"Plum Lt"},
    {n:"3608",c:"#EA83B8",nm:"Plum Vy Lt"},{n:"3609",c:"#F4A4CC",nm:"Plum Ult Lt"},{n:"3804",c:"#D03068",nm:"Cyclamen Pink Dk"},{n:"3805",c:"#F3488E",nm:"Cyclamen Pink"},
    {n:"3806",c:"#FF83A8",nm:"Cyclamen Pink Lt"},{n:"600",c:"#CD2E5A",nm:"Cranberry Vy Dk"},{n:"601",c:"#D13366",nm:"Cranberry Dk"},{n:"602",c:"#E24777",nm:"Cranberry Md"},
    {n:"603",c:"#FF7393",nm:"Cranberry"},{n:"604",c:"#FF8FAB",nm:"Cranberry Lt"},{n:"3803",c:"#AB2444",nm:"Mauve Dk"},{n:"3831",c:"#B83448",nm:"Raspberry Dk"},
    {n:"3832",c:"#DB6472",nm:"Raspberry Md"},{n:"3833",c:"#EA8C94",nm:"Raspberry Lt"},
    {n:"315",c:"#814952",nm:"Antique Mauve Vy Dk"},{n:"316",c:"#B8758A",nm:"Antique Mauve Md"},{n:"778",c:"#DFB0AA",nm:"Antique Mauve Vy Lt"},{n:"3726",c:"#9C535C",nm:"Antique Mauve Dk"},
    {n:"3727",c:"#DBA0AC",nm:"Antique Mauve Lt"},{n:"3802",c:"#7B2B3A",nm:"Antique Mauve Vy Dk2"},
    {n:"208",c:"#835EA7",nm:"Lavender Vy Dk"},{n:"209",c:"#A37CC2",nm:"Lavender Dk"},{n:"210",c:"#C3A0D8",nm:"Lavender Md"},{n:"211",c:"#E2CDE9",nm:"Lavender Lt"},
    {n:"3837",c:"#6C3C7C",nm:"Lavender Ult Dk"},{n:"153",c:"#E6CCD9",nm:"Violet Vy Lt"},{n:"154",c:"#572433",nm:"Grape Vy Dk"},{n:"327",c:"#633564",nm:"Violet Dk"},
    {n:"550",c:"#5C2C6D",nm:"Violet Vy Dk"},{n:"552",c:"#8039A0",nm:"Violet Md"},{n:"553",c:"#A368B5",nm:"Violet"},{n:"554",c:"#DBB3D9",nm:"Violet Lt"},
    {n:"3834",c:"#724870",nm:"Grape Dk"},{n:"3835",c:"#9480A8",nm:"Grape Md"},{n:"3836",c:"#BA9CC0",nm:"Grape Lt"},{n:"3740",c:"#786074",nm:"Antique Violet Dk"},
    {n:"3041",c:"#956B7A",nm:"Antique Violet Md"},{n:"3042",c:"#B88FA2",nm:"Antique Violet Lt"},{n:"3743",c:"#D7C6D0",nm:"Antique Violet Vy Lt"},
    {n:"333",c:"#5C3C85",nm:"Blue Violet Vy Dk"},{n:"155",c:"#9891B6",nm:"Blue Violet Md Dk"},{n:"156",c:"#A3AED1",nm:"Blue Violet Md Lt"},{n:"340",c:"#ADA7D4",nm:"Blue Violet Md"},
    {n:"341",c:"#B8B4D8",nm:"Blue Violet Lt"},{n:"3746",c:"#7768A0",nm:"Blue Violet Dk"},{n:"3747",c:"#D0D0E8",nm:"Blue Violet Vy Lt"},
    {n:"3838",c:"#5C6EB0",nm:"Lavender Blue Dk"},{n:"3839",c:"#7B8DC4",nm:"Lavender Blue Md"},{n:"3840",c:"#B0C0E0",nm:"Lavender Blue Lt"},{n:"3807",c:"#606EA0",nm:"Cornflower Blue"},
    {n:"791",c:"#46427E",nm:"Cornflower Blue Vy Dk"},{n:"792",c:"#556DB0",nm:"Cornflower Blue Dk"},{n:"793",c:"#708DC4",nm:"Cornflower Blue Md"},{n:"794",c:"#8FAFD6",nm:"Cornflower Blue Lt"},
    {n:"158",c:"#4C526E",nm:"Cornflower Blue Vy Dk2"},{n:"157",c:"#BBD0E9",nm:"Cornflower Blue Vy Lt"},
    {n:"336",c:"#253B73",nm:"Navy Blue"},{n:"823",c:"#0C2555",nm:"Navy Blue Dk"},{n:"939",c:"#1B204B",nm:"Navy Blue Vy Dk"},{n:"311",c:"#1C3B6B",nm:"Navy Blue Md"},
    {n:"312",c:"#2B5B93",nm:"Navy Blue Lt"},{n:"322",c:"#5A8DBF",nm:"Navy Blue Vy Lt"},{n:"334",c:"#739EC3",nm:"Baby Blue Md"},{n:"3325",c:"#B3D2E8",nm:"Baby Blue Lt"},
    {n:"3755",c:"#93B8D8",nm:"Baby Blue"},{n:"775",c:"#D1E6F5",nm:"Baby Blue Vy Lt"},{n:"3841",c:"#CDDBEE",nm:"Baby Blue Pale"},{n:"3756",c:"#EEEEF6",nm:"Baby Blue Ult Vy Lt"},
    {n:"796",c:"#1B3B8E",nm:"Royal Blue Dk"},{n:"797",c:"#1E4497",nm:"Royal Blue"},{n:"820",c:"#0E4880",nm:"Royal Blue Vy Dk"},{n:"798",c:"#4672B8",nm:"Delft Blue Dk"},
    {n:"799",c:"#748EC4",nm:"Delft Blue Md"},{n:"800",c:"#C0D4E8",nm:"Delft Blue Pale"},{n:"809",c:"#949FD0",nm:"Delft Blue"},
    {n:"824",c:"#174F88",nm:"Blue Vy Dk"},{n:"825",c:"#2E6AA2",nm:"Blue Dk"},{n:"826",c:"#5395B7",nm:"Blue Md"},{n:"827",c:"#BDDBE5",nm:"Blue Vy Lt"},
    {n:"813",c:"#A1C5DB",nm:"Blue Lt"},{n:"828",c:"#C5E1ED",nm:"Blue Ult Vy Lt"},{n:"3842",c:"#326C98",nm:"Wedgewood Vy Dk"},{n:"517",c:"#3B7CB0",nm:"Wedgewood Dk"},
    {n:"518",c:"#4F93BB",nm:"Wedgewood Lt"},{n:"519",c:"#7EB7D0",nm:"Sky Blue"},{n:"3760",c:"#3E86A0",nm:"Wedgewood Md"},{n:"3761",c:"#ACD8E5",nm:"Sky Blue Lt"},
    {n:"995",c:"#26A0DA",nm:"Electric Blue Dk"},{n:"996",c:"#30C4F6",nm:"Electric Blue Md"},{n:"3843",c:"#14B0D4",nm:"Electric Blue"},
    {n:"3844",c:"#18A8C4",nm:"Turquoise Bright Dk"},{n:"3845",c:"#04C4C8",nm:"Turquoise Bright Md"},{n:"3846",c:"#06E0E0",nm:"Turquoise Bright Lt"},
    {n:"597",c:"#5BB3B3",nm:"Turquoise"},{n:"598",c:"#8ED4CC",nm:"Turquoise Lt"},{n:"3808",c:"#366870",nm:"Turquoise Ult Vy Dk"},{n:"3809",c:"#3F8F8B",nm:"Turquoise Vy Dk"},
    {n:"3810",c:"#48A5A5",nm:"Turquoise Dk"},{n:"3811",c:"#B5E0E0",nm:"Turquoise Vy Lt"},
    {n:"806",c:"#30AAB5",nm:"Peacock Blue Dk"},{n:"807",c:"#64BFC7",nm:"Peacock Blue"},{n:"3765",c:"#349598",nm:"Peacock Blue Vy Dk"},{n:"3766",c:"#99C8C8",nm:"Peacock Blue Lt"},
    {n:"958",c:"#3EBAA6",nm:"Seagreen Dk"},{n:"959",c:"#59C3B5",nm:"Seagreen Md"},{n:"964",c:"#A9E0D1",nm:"Seagreen Lt"},{n:"3812",c:"#2F9E7A",nm:"Seagreen Vy Dk"},
    {n:"3847",c:"#348A7C",nm:"Teal Green Dk"},{n:"3848",c:"#5EADA0",nm:"Teal Green Md"},{n:"3849",c:"#52BDA0",nm:"Teal Green Lt"},
    {n:"3850",c:"#378C84",nm:"Bright Green Dk"},{n:"3851",c:"#49B8A0",nm:"Bright Green Lt"},
    {n:"500",c:"#04695A",nm:"Blue Green Vy Dk"},{n:"501",c:"#396E5A",nm:"Blue Green Dk"},{n:"502",c:"#5B8D72",nm:"Blue Green"},{n:"503",c:"#7BAF93",nm:"Blue Green Md"},
    {n:"504",c:"#ACCCB9",nm:"Blue Green Vy Lt"},{n:"505",c:"#33826B",nm:"Jade Green"},{n:"3813",c:"#B0D8C0",nm:"Blue Green Lt"},
    {n:"561",c:"#2C7B5B",nm:"Jade Vy Dk"},{n:"562",c:"#538F72",nm:"Jade Md"},{n:"563",c:"#8FC4A8",nm:"Jade Lt"},{n:"564",c:"#A7D6BD",nm:"Jade Vy Lt"},
    {n:"943",c:"#1E9F6E",nm:"Aquamarine Md"},{n:"991",c:"#477B6C",nm:"Aquamarine Dk"},{n:"992",c:"#6FC4AC",nm:"Aquamarine Lt"},{n:"993",c:"#90D4BF",nm:"Aquamarine Vy Lt"},
    {n:"3814",c:"#508878",nm:"Aquamarine"},{n:"3815",c:"#477858",nm:"Celadon Green Dk"},{n:"3816",c:"#6AA080",nm:"Celadon Green"},{n:"3817",c:"#99C8A8",nm:"Celadon Green Lt"},
    {n:"163",c:"#4D9B5D",nm:"Celadon Green Md"},{n:"3818",c:"#115030",nm:"Emerald Green Ult Vy Dk"},
    {n:"909",c:"#197E2B",nm:"Emerald Green Vy Dk"},{n:"910",c:"#188C38",nm:"Emerald Green Dk"},{n:"911",c:"#1E9F43",nm:"Emerald Green Md"},{n:"912",c:"#1FB05A",nm:"Emerald Green Lt"},
    {n:"913",c:"#71C191",nm:"Nile Green Md"},{n:"954",c:"#88C9A0",nm:"Nile Green"},{n:"955",c:"#A2DBB8",nm:"Nile Green Lt"},{n:"966",c:"#B8DFB4",nm:"Baby Green Md"},
    {n:"699",c:"#056A14",nm:"Christmas Green"},{n:"700",c:"#077A1C",nm:"Christmas Green Bright"},{n:"701",c:"#239124",nm:"Christmas Green Lt"},{n:"702",c:"#47A737",nm:"Kelly Green"},
    {n:"703",c:"#7BB950",nm:"Chartreuse"},{n:"704",c:"#A4C538",nm:"Chartreuse Bright Lt"},{n:"907",c:"#C1D82E",nm:"Parrot Green Lt"},
    {n:"904",c:"#558028",nm:"Parrot Green Vy Dk"},{n:"905",c:"#5E8C23",nm:"Parrot Green Dk"},{n:"906",c:"#7DB833",nm:"Parrot Green Md"},
    {n:"895",c:"#1B552C",nm:"Hunter Green Vy Dk"},{n:"3345",c:"#1B5326",nm:"Hunter Green Dk"},{n:"3346",c:"#406B2E",nm:"Hunter Green"},{n:"3347",c:"#718F42",nm:"Yellow Green Md"},
    {n:"3348",c:"#CCDA97",nm:"Yellow Green Lt"},{n:"772",c:"#E1EFB4",nm:"Yellow Green Vy Lt"},
    {n:"890",c:"#144B2F",nm:"Pistachio Green Ult Dk"},{n:"319",c:"#205E2E",nm:"Pistachio Green Vy Dk"},{n:"367",c:"#618252",nm:"Pistachio Green Dk"},{n:"320",c:"#6BA368",nm:"Pistachio Green Md"},
    {n:"368",c:"#A6C89B",nm:"Pistachio Green Lt"},{n:"369",c:"#D5EBC8",nm:"Pistachio Green Vy Lt"},{n:"164",c:"#C8DDA4",nm:"Forest Green Lt"},
    {n:"986",c:"#1C6836",nm:"Forest Green Vy Dk"},{n:"987",c:"#588840",nm:"Forest Green Dk"},{n:"988",c:"#73A64A",nm:"Forest Green Md"},{n:"989",c:"#8FC25E",nm:"Forest Green"},
    {n:"580",c:"#8C8216",nm:"Moss Green Dk"},{n:"581",c:"#A7A138",nm:"Moss Green"},{n:"165",c:"#EFF4A5",nm:"Moss Green Vy Lt"},{n:"166",c:"#C0C840",nm:"Moss Green Md Lt"},
    {n:"3819",c:"#E0E068",nm:"Moss Green Lt"},
    {n:"730",c:"#827318",nm:"Olive Green Vy Dk"},{n:"731",c:"#918225",nm:"Olive Green Dk"},{n:"732",c:"#9D8E29",nm:"Olive Green"},{n:"733",c:"#BCAD46",nm:"Olive Green Md"},
    {n:"734",c:"#C7BC55",nm:"Olive Green Lt"},
    {n:"520",c:"#667453",nm:"Fern Green Dk"},{n:"522",c:"#97A67B",nm:"Fern Green"},{n:"523",c:"#9CAE84",nm:"Fern Green Lt"},{n:"524",c:"#C5CDA5",nm:"Fern Green Vy Lt"},
    {n:"934",c:"#313C26",nm:"Black Avocado Green"},{n:"935",c:"#424F32",nm:"Avocado Green Dk"},{n:"936",c:"#4C5B3A",nm:"Avocado Green Vy Dk"},{n:"937",c:"#527239",nm:"Avocado Green Md"},
    {n:"3362",c:"#546340",nm:"Pine Green Dk"},{n:"3363",c:"#728B5A",nm:"Pine Green Md"},{n:"3364",c:"#83A262",nm:"Pine Green"},
    {n:"3011",c:"#898A52",nm:"Khaki Green Dk"},{n:"3012",c:"#A5A55A",nm:"Khaki Green Md"},{n:"3013",c:"#B8B878",nm:"Khaki Green Lt"},
    {n:"3051",c:"#576036",nm:"Green Gray Dk"},{n:"3052",c:"#889466",nm:"Green Gray Md"},{n:"3053",c:"#9CA880",nm:"Green Gray"},
    {n:"924",c:"#566C6C",nm:"Gray Green Vy Dk"},{n:"926",c:"#98ACA7",nm:"Gray Green Md"},{n:"927",c:"#BDCCC8",nm:"Gray Green Lt"},{n:"928",c:"#DDE5DF",nm:"Gray Green Vy Lt"},
    {n:"3768",c:"#6B888C",nm:"Gray Green Dk"},
    {n:"930",c:"#45617A",nm:"Antique Blue Dk"},{n:"931",c:"#677E90",nm:"Antique Blue Md"},{n:"932",c:"#98AFBC",nm:"Antique Blue Lt"},{n:"3750",c:"#386880",nm:"Antique Blue Vy Dk"},
    {n:"3752",c:"#C4D0DD",nm:"Antique Blue Vy Lt"},{n:"3753",c:"#DBE5EE",nm:"Antique Blue Ult Vy Lt"},
    {n:"159",c:"#C7CDE0",nm:"Gray Blue Lt"},{n:"160",c:"#999FAE",nm:"Gray Blue Md"},{n:"161",c:"#767B8B",nm:"Gray Blue"},
    {n:"535",c:"#636363",nm:"Ash Gray Vy Lt"},{n:"844",c:"#545150",nm:"Beaver Gray Ult Dk"},{n:"645",c:"#6B685F",nm:"Beaver Gray Vy Dk"},{n:"646",c:"#8A877D",nm:"Beaver Gray Dk"},
    {n:"647",c:"#B0ADA5",nm:"Beaver Gray Md"},{n:"648",c:"#BDB9B1",nm:"Beaver Gray Lt"},{n:"3072",c:"#E6E6E0",nm:"Beaver Gray Vy Lt"},
    {n:"640",c:"#8C8271",nm:"Beige Gray Vy Dk"},{n:"642",c:"#A89E8C",nm:"Beige Gray Dk"},{n:"644",c:"#D1C8B5",nm:"Beige Gray Md"},{n:"822",c:"#E8DCC8",nm:"Beige Gray Lt"},
    {n:"3790",c:"#785C44",nm:"Beige Gray Ult Dk"},
    {n:"838",c:"#4B3418",nm:"Beige Brown Vy Dk"},{n:"839",c:"#5F421E",nm:"Beige Brown Dk"},{n:"840",c:"#8A6E44",nm:"Beige Brown Md"},{n:"841",c:"#A98E5E",nm:"Beige Brown Lt"},
    {n:"842",c:"#C8B588",nm:"Beige Brown Vy Lt"},
    {n:"610",c:"#7F6838",nm:"Drab Brown Dk"},{n:"611",c:"#967944",nm:"Drab Brown"},{n:"612",c:"#BC9D65",nm:"Drab Brown Lt"},{n:"613",c:"#D6C29A",nm:"Drab Brown Vy Lt"},
    {n:"632",c:"#8A5038",nm:"Desert Sand Ult Vy Dk"},{n:"779",c:"#6B503C",nm:"Cocoa Brown Dk"},
    {n:"3781",c:"#6B5840",nm:"Mocha Brown Dk"},{n:"3782",c:"#C8AA84",nm:"Mocha Brown Lt"},{n:"3787",c:"#685C4C",nm:"Brown Gray Dk"},
    {n:"3021",c:"#4F3E28",nm:"Brown Gray Vy Dk"},{n:"3022",c:"#8E8B72",nm:"Brown Gray Md"},{n:"3023",c:"#B0A98C",nm:"Brown Gray Lt"},{n:"3024",c:"#C8C4B4",nm:"Brown Gray Vy Lt"},
    {n:"3031",c:"#4B3620",nm:"Mocha Brown Vy Dk"},{n:"3032",c:"#B7A58C",nm:"Mocha Brown Md"},{n:"3033",c:"#E3D5B8",nm:"Mocha Brown Vy Lt"},
    {n:"3862",c:"#8A6A38",nm:"Mocha Beige Dk"},{n:"3863",c:"#A88C60",nm:"Mocha Beige Md"},{n:"3864",c:"#CBB890",nm:"Mocha Beige Lt"},
    {n:"3045",c:"#BC8E4B",nm:"Yellow Beige Dk"},{n:"3046",c:"#D8BC6C",nm:"Yellow Beige Md"},{n:"3047",c:"#E7D39C",nm:"Yellow Beige Lt"},{n:"167",c:"#A77B4A",nm:"Yellow Beige Vy Dk"},
    {n:"3078",c:"#FDF3BB",nm:"Golden Yellow Vy Lt"},{n:"677",c:"#F5E8B5",nm:"Old Gold Vy Lt"},{n:"745",c:"#FFF0B5",nm:"Yellow Lt Pale"},{n:"3823",c:"#FFF4C8",nm:"Yellow Ult Pale"},
    {n:"370",c:"#B8A56A",nm:"Mustard Md"},{n:"371",c:"#BFB276",nm:"Mustard"},{n:"372",c:"#CCBD83",nm:"Mustard Lt"},
    {n:"829",c:"#7E6B28",nm:"Golden Olive Vy Dk"},{n:"830",c:"#8D7D2A",nm:"Golden Olive Dk"},{n:"831",c:"#AA9130",nm:"Golden Olive Md"},{n:"832",c:"#BCA038",nm:"Golden Olive"},
    {n:"833",c:"#C9AD3C",nm:"Golden Olive Lt"},{n:"834",c:"#DABD48",nm:"Golden Olive Vy Lt"},
    {n:"918",c:"#824020",nm:"Red Copper Dk"},{n:"919",c:"#A64E22",nm:"Red Copper"},{n:"920",c:"#AC5B28",nm:"Copper Md"},{n:"921",c:"#C66E32",nm:"Copper"},
    {n:"922",c:"#E08044",nm:"Copper Lt"},
    {n:"3853",c:"#F29848",nm:"Autumn Gold Dk"},{n:"3854",c:"#F2B878",nm:"Autumn Gold Md"},{n:"3855",c:"#FAD8A0",nm:"Autumn Gold Lt"},
    {n:"3856",c:"#FFD0A0",nm:"Mahogany Ult Vy Lt"},{n:"3776",c:"#CC7830",nm:"Mahogany Lt"},{n:"3829",c:"#AA7B12",nm:"Old Gold Vy Dk"},
    {n:"3857",c:"#6C3420",nm:"Rosewood Dk"},{n:"3858",c:"#964040",nm:"Rosewood Md"},{n:"3859",c:"#BA8878",nm:"Rosewood Lt"},{n:"3779",c:"#F8A890",nm:"Rosewood Vy Lt"},
    {n:"3860",c:"#6C586C",nm:"Cocoa"},{n:"3861",c:"#A88C98",nm:"Cocoa Lt"},
    {n:"3865",c:"#FAFAF2",nm:"Winter White"},{n:"3866",c:"#F5EDE0",nm:"Mocha Brown Ult Vy Lt"},
    {n:"168",c:"#D1D1CE",nm:"Pewter Vy Lt"},{n:"169",c:"#848484",nm:"Pewter Lt"},
    {n:"162",c:"#DBE8F4",nm:"Blue Ult Vy Lt"},{n:"747",c:"#E5F5F5",nm:"Sky Blue Vy Lt"},
    {n:"3825",c:"#FBB88C",nm:"Pumpkin Pale"},
    {n:"3721",c:"#A04050",nm:"Shell Pink Dk"},{n:"3722",c:"#BC6460",nm:"Shell Pink Md"},
    {n:"3731",c:"#E57888",nm:"Dusty Rose Vy Dk2"},{n:"3733",c:"#E8879C",nm:"Dusty Rose"},
    {n:"3716",c:"#FFBDC1",nm:"Dusty Rose Md Vy Lt"},
    {n:"780",c:"#9D7312",nm:"Topaz Ult Vy Dk"},{n:"781",c:"#A87E0E",nm:"Topaz Vy Dk"},{n:"782",c:"#BA8F0F",nm:"Topaz Dk2"},
    {n:"727",c:"#FFF1AF",nm:"Topaz Vy Lt"},{n:"728",c:"#E4B85C",nm:"Topaz Dk"},
    {n:"868",c:"#A67440",nm:"Hazel Nut Brown Vy Dk"},
    {n:"B5200",c:"#FDFDFD",nm:"Snow White"},
  ];
  const PIXEL_COLORS=PIXEL_PALETTE.map(p=>p.c);
  // 36-color curated DMC subset for image-to-pixel conversion (broad spectrum coverage, manageable thread count)
  const DMC_CORE_36=[
    "310","414","318","762","Blanc","Ecru",       // black → grays → white
    "321","498","606","740","743","973",           // red, dark red, bright orange, tangerine, yellow, canary
    "725","300","433","436","738","3371",          // gold, mahogany, brown, tan, light tan, black brown
    "335","956","818","550","208","3607",          // rose, geranium, baby pink, violet dk, lavender, plum lt
    "336","797","826","519","996","3846",          // navy, royal blue, blue med, sky blue, electric blue, turquoise
    "699","702","909","955","320","895"            // green, kelly green, emerald dk, nile green lt, pistachio, hunter dk
  ];
  const DMC_CONVERT_PALETTE=DMC_CORE_36.map(n=>PIXEL_PALETTE.find(p=>p.n===n)).filter(Boolean);
  const PIXEL_SIZES=[{id:"16x16",label:"16×16",desc:"Icon",c:16,r:16},{id:"32x32",label:"32×32",desc:"Sprite",c:32,r:32},{id:"48x48",label:"48×48",desc:"Detailed",c:48,r:48},{id:"64x64",label:"64×64",desc:"Large",c:64,r:64},{id:"128x128",label:"128×128",desc:"HD",c:128,r:128},{id:"256x256",label:"256×256",desc:"Full",c:256,r:256},{id:"512x512",label:"512×512",desc:"Max",c:512,r:512}];
  const[pixelGridLines,setPixelGridLines]=useState(0);
  const[customPixelW,setCustomPixelW]=useState("100");
  const[customPixelH,setCustomPixelH]=useState("100");
  const[showPixNumbers,setShowPixNumbers]=useState(false);
  const[showPixPicker,setShowPixPicker]=useState(false);
  const[showMoreColors,setShowMoreColors]=useState(false);
  const[customColorCount,setCustomColorCount]=useState("48");
  const[showVecMoreColors,setShowVecMoreColors]=useState(false);
  const[vecCustomColorCount,setVecCustomColorCount]=useState("48");
  const[pixPaletteSearch,setPixPaletteSearch]=useState("");
  const[pixCustomLabels,setPixCustomLabels]=useState(()=>{try{return JSON.parse(localStorage.getItem("zobuddy_pix_labels"))||{};}catch{return{};}});
  const savePixLabels=(l)=>{setPixCustomLabels(l);try{localStorage.setItem("zobuddy_pix_labels",JSON.stringify(l));}catch{}};
  const getPixels=()=>{const d=readNb();return d.pages?.[nbPageIdx]?.pixels||{};};
  const getPixelDims=()=>{const d=readNb();const page=d.pages?.[nbPageIdx];const ps=page?.pixelSize||"32x32";
    const preset=PIXEL_SIZES.find(s=>s.id===ps);if(preset)return preset;
    const m=ps.match(/^(\d+)x(\d+)$/);if(m)return{id:ps,label:`${m[1]}×${m[2]}`,desc:"Custom",c:Number(m[1]),r:Number(m[2])};
    return PIXEL_SIZES[1];};
  const getPixelCellSize=()=>{const dims=getPixelDims();const m=Math.max(dims.c,dims.r);return m>200?Math.max(6,Math.floor(1200/m)):Math.max(10,Math.min(20,Math.floor(800/m)));};
  const getColorNum=(hex)=>{if(!hex)return"";const h=hex.toLowerCase();const p=PIXEL_PALETTE.find(p=>p.c===h);return p?String(p.n):(pixCustomLabels[h]||"");};
  const drawPixelGrid=()=>{const c=pixCanvasRef.current;if(!c)return;const ctx=c.getContext("2d");
    const dims=getPixelDims();const cs=getPixelCellSize();const pixels=getPixels();
    // Light background
    ctx.fillStyle="#f0f0f0";ctx.fillRect(0,0,c.width,c.height);
    // Draw pixels filling full cell
    Object.entries(pixels).forEach(([key,color])=>{const[r,cl]=key.split("-").map(Number);
      if(r<dims.r&&cl<dims.c){ctx.fillStyle=color;ctx.fillRect(cl*cs,r*cs,cs,cs);}});
    // Subtle grid lines on top — very light so they don't overwhelm
    if(cs>=4){ctx.globalAlpha=0.15;ctx.fillStyle="#888";
      for(let x=1;x<dims.c;x++)ctx.fillRect(x*cs,0,1,dims.r*cs);
      for(let y=1;y<dims.r;y++)ctx.fillRect(0,y*cs,dims.c*cs,1);
      ctx.globalAlpha=1;}
    // Section borders — slightly darker
    if(pixelGridLines>0){ctx.globalAlpha=0.5;ctx.fillStyle="#000";
      for(let x=0;x<=dims.c;x+=pixelGridLines)ctx.fillRect(x*cs,0,1,dims.r*cs);
      for(let y=0;y<=dims.r;y+=pixelGridLines)ctx.fillRect(0,y*cs,dims.c*cs,1);
      ctx.globalAlpha=1;}
    // Number overlay — rank by usage count (1=most pixels, 2=second, etc.)
    if(showPixNumbers){ctx.textAlign="center";ctx.textBaseline="middle";
      const fs=Math.max(3,Math.min(cs-1,11));ctx.font=`bold ${fs}px sans-serif`;
      // Build color rank map: count pixels per color, sort by count descending
      const colorCounts={};
      Object.values(pixels).forEach(color=>{colorCounts[color]=(colorCounts[color]||0)+1;});
      const ranked=Object.entries(colorCounts).sort((a,b)=>b[1]-a[1]);
      const rankMap={};ranked.forEach(([color],i)=>{rankMap[color]=String(i+1);});
      Object.entries(pixels).forEach(([key,color])=>{const[r,cl]=key.split("-").map(Number);
        if(r<dims.r&&cl<dims.c){const num=rankMap[color];if(num){
          const hr=parseInt(color.slice(1,3),16)||0,hg=parseInt(color.slice(3,5),16)||0,hb=parseInt(color.slice(5,7),16)||0;
          ctx.fillStyle=(hr*.299+hg*.587+hb*.114)>128?"rgba(0,0,0,.85)":"rgba(255,255,255,.85)";
          ctx.fillText(num,cl*cs+cs/2,r*cs+cs/2);}}});}
  };
  // ─── PRINT PIXEL ART (paint by number) ──────────────────────
  const printPixelArt=()=>{
    const dims=getPixelDims();const pixels=getPixels();
    const scale=Math.max(16,Math.min(40,Math.floor(2400/Math.max(dims.c,dims.r)))); // scale up for print
    const w=dims.c*scale,h=dims.r*scale;
    const tc=document.createElement("canvas");tc.width=w;tc.height=h;
    const ctx=tc.getContext("2d");
    // White background
    ctx.fillStyle="#fff";ctx.fillRect(0,0,w,h);
    // Draw colored pixels
    Object.entries(pixels).forEach(([key,color])=>{const[r,cl]=key.split("-").map(Number);
      if(r<dims.r&&cl<dims.c){ctx.fillStyle=color;ctx.fillRect(cl*scale,r*scale,scale,scale);}});
    // Grid lines
    ctx.strokeStyle="#ccc";ctx.lineWidth=0.5;
    for(let x=0;x<=dims.c;x++){ctx.beginPath();ctx.moveTo(x*scale,0);ctx.lineTo(x*scale,h);ctx.stroke();}
    for(let y=0;y<=dims.r;y++){ctx.beginPath();ctx.moveTo(0,y*scale);ctx.lineTo(w,y*scale);ctx.stroke();}
    // Section borders
    if(pixelGridLines>0){ctx.strokeStyle="#000";ctx.lineWidth=1.5;
      for(let x=0;x<=dims.c;x+=pixelGridLines){ctx.beginPath();ctx.moveTo(x*scale,0);ctx.lineTo(x*scale,h);ctx.stroke();}
      for(let y=0;y<=dims.r;y+=pixelGridLines){ctx.beginPath();ctx.moveTo(0,y*scale);ctx.lineTo(w,y*scale);ctx.stroke();}}
    // Numbers — ranked by usage count
    const colorCounts={};
    Object.values(pixels).forEach(color=>{colorCounts[color]=(colorCounts[color]||0)+1;});
    const ranked=Object.entries(colorCounts).sort((a,b)=>b[1]-a[1]);
    const rankMap={};ranked.forEach(([color],i)=>{rankMap[color]=String(i+1);});
    ctx.textAlign="center";ctx.textBaseline="middle";
    const fs=Math.max(6,Math.min(scale*0.6,14));ctx.font=`bold ${fs}px sans-serif`;
    Object.entries(pixels).forEach(([key,color])=>{const[r,cl]=key.split("-").map(Number);
      if(r<dims.r&&cl<dims.c){const num=rankMap[color];if(num){
        const hr=parseInt(color.slice(1,3),16)||0,hg=parseInt(color.slice(3,5),16)||0,hb=parseInt(color.slice(5,7),16)||0;
        ctx.fillStyle=(hr*.299+hg*.587+hb*.114)>128?"#000":"#fff";
        ctx.fillText(num,cl*scale+scale/2,r*scale+scale/2);}}});
    // Open in new window for printing
    const dataUrl=tc.toDataURL("image/png");
    const win=window.open("","_blank");
    if(win){const legendHtml=ranked.map(([color,count],i)=>{const p=PIXEL_PALETTE.find(p=>p.c===color);const label=p?`DMC ${p.n} — ${p.nm}`:`Custom`;return`<span style="display:inline-flex;align-items:center;gap:4px;margin:2px 0"><span style="width:16px;height:16px;border-radius:3px;background:${color};border:1px solid #ccc;display:inline-flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;color:${parseInt(color.slice(1,3),16)*.299+parseInt(color.slice(3,5),16)*.587+parseInt(color.slice(5,7),16)*.114>128?'#000':'#fff'}">${i+1}</span><b>#${i+1}</b> ${label} <span style="color:#888">(${count} px)</span></span>`;}).join("");
      win.document.write(`<html><head><title>Pixel Art - Paint by Number</title><style>@media print{body{margin:0}img{width:100%;height:auto;}}</style></head><body style="margin:0;background:#fff;display:flex;flex-direction:column;align-items:center;padding:8px"><h3 style="margin:4px 0;font-family:sans-serif">${nbData.pages[nbPageIdx]?.title||"Pixel Art"} — Paint by Number</h3><img src="${dataUrl}" style="max-width:100%;height:auto"/><div style="margin:8px 0;font-family:sans-serif;font-size:12px;display:flex;flex-wrap:wrap;gap:10px">${legendHtml}</div><button onclick="window.print()" style="padding:10px 30px;font-size:16px;margin:8px;cursor:pointer">🖨️ Print</button></body></html>`);win.document.close();}
  };
  // ─── IMAGE TO PIXEL ART ────────────────────────────────────────
  const[pixImporting,setPixImporting]=useState(false);
  const[pixImgCrop,setPixImgCrop]=useState(null);
  const[pixCropBox,setPixCropBox]=useState({x:0,y:0,w:100,h:100});
  const pixImgModeRef=React.useRef(0);const pixImgSrcRef=React.useRef(null);
  // paletteLimit: 0=full DMC palette (~438), 8/16/36=dynamic top-N from DMC
  const _pixImgConvert=(imgSrc,paletteLimit,crop)=>{
    setPixImporting(true);
    const img=new Image();
    img.onerror=()=>{alert("Failed to load image");setPixImporting(false);setPixImgCrop(null);};
    img.onload=()=>{
      try{
      const dims=getPixelDims();const tc=document.createElement("canvas");tc.width=dims.c;tc.height=dims.r;
      const tctx=tc.getContext("2d");tctx.imageSmoothingEnabled=true;tctx.imageSmoothingQuality="medium";
      let sx,sy,sw,sh;
      if(crop){sx=Math.round(img.width*crop.x/100);sy=Math.round(img.height*crop.y/100);sw=Math.max(1,Math.round(img.width*crop.w/100));sh=Math.max(1,Math.round(img.height*crop.h/100));}
      else{const ir=img.width/img.height,gr=dims.c/dims.r;sx=0;sy=0;sw=img.width;sh=img.height;
        if(ir>gr){const nw=img.height*gr;sx=(img.width-nw)/2;sw=nw;}else{const nh=img.width/gr;sy=(img.height-nh)/2;sh=nh;}}
      tctx.drawImage(img,sx,sy,sw,sh,0,0,dims.c,dims.r);
      const data=tctx.getImageData(0,0,dims.c,dims.r).data;
      const newPixels={};
      const htr=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
      const fullPal=PIXEL_PALETTE.map(p=>p.c);const fullRgb=fullPal.map(htr);
      const nearFull=(r,g,b)=>{let bi=0,bd=Infinity;fullRgb.forEach(([pr,pg,pb],i)=>{const d=(r-pr)**2+(g-pg)**2+(b-pb)**2;if(d<bd){bd=d;bi=i;}});return bi;};
      if(paletteLimit===0){
        // Full DMC: map every pixel to nearest DMC color from all 438
        for(let row=0;row<dims.r;row++)for(let col=0;col<dims.c;col++){const idx=(row*dims.c+col)*4;const r=data[idx],g=data[idx+1],b=data[idx+2],a=data[idx+3];if(a<30)continue;
          newPixels[`${row}-${col}`]=fullPal[nearFull(r,g,b)];}
      }else{
        // Dynamic N-color: find best N DMC threads for this image
        const votes=new Map();
        for(let row=0;row<dims.r;row++)for(let col=0;col<dims.c;col++){const idx=(row*dims.c+col)*4;const a=data[idx+3];if(a<30)continue;
          const bi=nearFull(data[idx],data[idx+1],data[idx+2]);votes.set(bi,(votes.get(bi)||0)+1);}
        const topN=[...votes.entries()].sort((a,b)=>b[1]-a[1]).slice(0,paletteLimit).map(e=>e[0]);
        const subPal=topN.map(i=>fullPal[i]);const subRgb=topN.map(i=>fullRgb[i]);
        const nearSub=(r,g,b)=>{let bi=0,bd=Infinity;subRgb.forEach(([pr,pg,pb],i)=>{const d=(r-pr)**2+(g-pg)**2+(b-pb)**2;if(d<bd){bd=d;bi=i;}});return subPal[bi];};
        for(let row=0;row<dims.r;row++)for(let col=0;col<dims.c;col++){const idx=(row*dims.c+col)*4;const r=data[idx],g=data[idx+1],b=data[idx+2],a=data[idx+3];if(a<30)continue;newPixels[`${row}-${col}`]=nearSub(r,g,b);}}
      const d=readNb();const pi=pageIdxRef.current;
      if(d.pages?.[pi]){d.pages[pi].pixels=newPixels;
        try{writeNb(d);setNbData({...d});}catch(e){alert("Save failed: "+e.message);}
      }else{alert("Page not found at index "+pi);}
      setTimeout(drawPixelGrid,50);setPixImporting(false);setPixImgCrop(null);
      }catch(err){alert("Error: "+err.message);setPixImporting(false);setPixImgCrop(null);}
    };img.src=imgSrc;
  };
  // All imports go through crop UI
  const pixFileInputRef=React.useRef(null);
  const pixImportCallbackRef=React.useRef(null);
  const importImage=(paletteLimit)=>{
    pixImportCallbackRef.current=(file)=>{
      pixImgModeRef.current=paletteLimit;
      const reader=new FileReader();reader.onload=(ev)=>{
        pixImgSrcRef.current=ev.target.result;
        // Initialize crop box matching grid aspect ratio, centered
        const dims=getPixelDims();const gridRatio=dims.c/dims.r;
        const img=new Image();img.onload=()=>{
          const imgRatio=img.width/img.height;
          let cw,ch;
          if(gridRatio>=imgRatio){cw=100;ch=Math.min(100,(cw/gridRatio)*(imgRatio));}
          else{ch=100;cw=Math.min(100,(ch*gridRatio)/(imgRatio));}
          const cx=(100-cw)/2,cy=(100-ch)/2;
          setPixCropBox({x:cx,y:cy,w:cw,h:ch});
          setPixImgCrop({src:ev.target.result});
        };img.src=ev.target.result;
      };reader.readAsDataURL(file);
    };
    if(pixFileInputRef.current)pixFileInputRef.current.click();
  };
  const confirmCrop=()=>{if(pixImgSrcRef.current)_pixImgConvert(pixImgSrcRef.current,pixImgModeRef.current,pixCropBox);};

  // pixStrokeAction: "place" or "erase" — locked at start of each stroke so dragging is consistent
  const pixStrokeAction=React.useRef(null);
  const pixPaintedCells=React.useRef(new Set()); // track cells already painted this stroke
  const setPixel=(row,col,color,erase)=>{const dims=getPixelDims();if(row<0||row>=dims.r||col<0||col>=dims.c)return;
    const key=`${row}-${col}`;
    // Skip if already painted this cell in current stroke
    if(pixPaintedCells.current.has(key))return;
    pixPaintedCells.current.add(key);
    const d=readNb();if(!d.pages?.[nbPageIdx])return;
    const pixels=d.pages[nbPageIdx].pixels||{};const old=pixels[key]||null;
    if(erase){delete pixels[key];}
    else{pixels[key]=color;}
    const newVal=pixels[key]||null;
    if(old!==newVal){pixelUndoRef.current.push({key,old,newVal});pixelRedoRef.current=[];}
    d.pages[nbPageIdx].pixels=pixels;writeNb(d);
    const c=pixCanvasRef.current;if(c){const ctx=c.getContext("2d");const cs=getPixelCellSize();
      if(pixels[key]){ctx.fillStyle=pixels[key];ctx.fillRect(col*cs,row*cs,cs,cs);}
      else{ctx.fillStyle="#f0f0f0";ctx.fillRect(col*cs,row*cs,cs,cs);
        ctx.strokeStyle="rgba(0,0,0,.08)";ctx.lineWidth=0.5;ctx.strokeRect(col*cs,row*cs,cs,cs);}}};
  const undoPixel=()=>{if(!pixelUndoRef.current.length)return;const entry=pixelUndoRef.current.pop();
    const{key,old}=entry;
    const d=readNb();if(!d.pages?.[nbPageIdx])return;const pixels=d.pages[nbPageIdx].pixels||{};
    const cur=pixels[key]||null;
    if(old)pixels[key]=old;else delete pixels[key];d.pages[nbPageIdx].pixels=pixels;writeNb(d);
    pixelRedoRef.current.push({key,old:cur,newVal:old});
    drawPixelGrid();};
  const redoPixel=()=>{if(!pixelRedoRef.current.length)return;const entry=pixelRedoRef.current.pop();
    const{key,old,newVal}=entry;
    const d=readNb();if(!d.pages?.[nbPageIdx])return;const pixels=d.pages[nbPageIdx].pixels||{};
    if(newVal)pixels[key]=newVal;else delete pixels[key];d.pages[nbPageIdx].pixels=pixels;writeNb(d);
    pixelUndoRef.current.push({key,old,newVal});
    drawPixelGrid();};
  const pixColorRef=React.useRef(pixelColor);pixColorRef.current=pixelColor;
  const pixEraserRef=React.useRef(pixelEraser);pixEraserRef.current=pixelEraser;
  const pixStartPos=React.useRef(null);const pixMoved=React.useRef(false);const pixCancelled=React.useRef(false);
  const pixLastCell=React.useRef(null);
  // Pinch zoom
  const pixPinchDist=React.useRef(null);
  const cellFromTouchFn=(t)=>{
    const c=pixCanvasRef.current;if(!c)return null;
    const r=c.getBoundingClientRect();const sx=c.width/r.width,sy=c.height/r.height;
    const dims=getPixelDims();const cs=getPixelCellSize();
    const col=Math.floor(((t.clientX-r.left)*sx)/cs);const row=Math.floor(((t.clientY-r.top)*sy)/cs);
    if(row>=0&&row<dims.r&&col>=0&&col<dims.c)return{row,col};return null;
  };
  const paintCellFn=(row,col)=>{setPixel(row,col,pixColorRef.current,pixEraserRef.current);};
  // Bresenham line between two cells to fill gaps during fast strokes
  const paintLineFn=(r0,c0,r1,c1)=>{
    const dr=Math.abs(r1-r0),dc=Math.abs(c1-c0);
    const sr=r0<r1?1:-1,sc=c0<c1?1:-1;
    let err=dc-dr,r=r0,c=c0;
    while(true){paintCellFn(r,c);if(r===r1&&c===c1)break;const e2=2*err;if(e2>-dr){err-=dr;c+=sc;}if(e2<dc){err+=dc;r+=sr;}}
  };
  // Use refs so event listeners always call the latest handler version
  const pixHandlerRef=React.useRef(null);
  const pixEndRef=React.useRef(null);
  const pixPendingStart=React.useRef(null); // delay first paint to avoid pinch-zoom accidents
  pixHandlerRef.current=(e,isStart)=>{
    if(e.touches&&e.touches.length>1){
      // Second finger arrived — cancel any pending paint and switch to pinch/pan mode
      if(pixPendingStart.current){clearTimeout(pixPendingStart.current);pixPendingStart.current=null;}
      pixIsPainting.current=false;pixCancelled.current=true;
      e.preventDefault(); // prevent default scroll since we handle it
      const t1=e.touches[0],t2=e.touches[1];
      const midX=(t1.clientX+t2.clientX)/2,midY=(t1.clientY+t2.clientY)/2;
      const dist=Math.hypot(t1.clientX-t2.clientX,t1.clientY-t2.clientY);
      // Pinch zoom
      if(pixPinchDist.current!==null){
        const scale=dist/pixPinchDist.current;
        if(Math.abs(scale-1)>0.01)setPageZoom(z=>Math.max(0.3,Math.min(8,z*scale)));
      }
      pixPinchDist.current=dist;
      // Two-finger pan (scroll the container)
      const sc=pixScrollRef.current;
      if(sc){
        if(pixPanStart.current){
          const dx=pixPanStart.current.x-midX;
          const dy=pixPanStart.current.y-midY;
          sc.scrollLeft=pixPanStart.current.scrollLeft+dx;
          sc.scrollTop=pixPanStart.current.scrollTop+dy;
        }
        pixPanStart.current={x:midX,y:midY,scrollLeft:sc.scrollLeft,scrollTop:sc.scrollTop};
      }
      return;
    }
    pixPinchDist.current=null;pixPanStart.current=null;
    const t=e.touches?e.touches[0]:e;
    if(isStart){
      pixIsPainting.current=true;pixCancelled.current=false;pixMoved.current=false;
      pixLastCell.current=null;
      pixPaintedCells.current=new Set();
      const cell=cellFromTouchFn(t);
      if(cell){pixLastCell.current=cell;pixStartPos.current=cell;}
      if(!e.touches){
        // Mouse: preventDefault and paint immediately
        e.preventDefault();
        if(cell)paintCellFn(cell.row,cell.col);
      } else {
        // Touch: DON'T preventDefault yet — if second finger arrives, browser handles pan
        pixPendingStart.current=setTimeout(()=>{
          pixPendingStart.current=null;
          if(pixIsPainting.current&&!pixCancelled.current&&cell){
            paintCellFn(cell.row,cell.col);
          }
        },80);
      }
      return;
    }
    if(!pixIsPainting.current||pixCancelled.current)return;
    e.preventDefault();
    // First move: flush pending start paint if still waiting
    if(pixPendingStart.current){clearTimeout(pixPendingStart.current);pixPendingStart.current=null;
      const startCell=pixStartPos.current;
      if(startCell)paintCellFn(startCell.row,startCell.col);
    }
    pixMoved.current=true;
    const cell=cellFromTouchFn(t);if(!cell)return;
    const last=pixLastCell.current;
    if(last&&(last.row!==cell.row||last.col!==cell.col)){
      paintLineFn(last.row,last.col,cell.row,cell.col);
    }else{paintCellFn(cell.row,cell.col);}
    pixLastCell.current=cell;
  };
  pixEndRef.current=(e)=>{
    // Flush pending start if tap ended before the delay
    if(pixPendingStart.current){clearTimeout(pixPendingStart.current);pixPendingStart.current=null;
      if(pixIsPainting.current&&!pixCancelled.current){
        const startCell=pixStartPos.current;
        if(startCell)paintCellFn(startCell.row,startCell.col);
      }
    }
    if(pixIsPainting.current&&!pixCancelled.current){
      if(e.changedTouches){
        const t=e.changedTouches[0];
        const cell=cellFromTouchFn(t);
        if(cell){
          const last=pixLastCell.current;
          if(last&&(last.row!==cell.row||last.col!==cell.col)){
            paintLineFn(last.row,last.col,cell.row,cell.col);
          }
        }
      }
    }
    pixPinchDist.current=null;pixLastCell.current=null;pixPanStart.current=null;
    pixPaintedCells.current=new Set();
    pixIsPainting.current=false;pixCancelled.current=false;
  };
  const pixCanvasCallbackRef=React.useCallback((node)=>{if(node){pixCanvasRef.current=node;
    node.addEventListener("touchstart",(e)=>pixHandlerRef.current(e,true),{passive:false});
    node.addEventListener("touchmove",(e)=>pixHandlerRef.current(e,false),{passive:false});
    node.addEventListener("touchend",(e)=>pixEndRef.current(e));
    node.addEventListener("mousedown",(e)=>pixHandlerRef.current(e,true));
    node.addEventListener("mousemove",(e)=>pixHandlerRef.current(e,false));
    node.addEventListener("mouseup",()=>{pixIsPainting.current=false;});
    node.addEventListener("mouseleave",()=>{pixIsPainting.current=false;});
    setTimeout(drawPixelGrid,50);}},[nbPageIdx]);

  // Redraw when grid section lines change
  useEffect(()=>{if(nbView==="page"&&nbData.pages?.[nbPageIdx]?.type==="pixel")drawPixelGrid();},[pixelGridLines]);

  // ─── PAGE CHANGE ────────────────────────────────────────────────
  useEffect(()=>{
    pageIdxRef.current=nbPageIdx;
    const d=readNb();const page=d.pages?.[nbPageIdx];
    textRef.current=page?.content||"";
    if(textareaRef.current)textareaRef.current.value=textRef.current;
    drawImgRef.current=null;drawCanvasRef.current=null;
    setPageDrawMode(false);setPageZoom(1);setRenaming(false);undoRef.current=[textRef.current];redoRef.current=[];pixelUndoRef.current=[];pixelRedoRef.current=[];drawUndoStack.current=[];drawRedoStack.current=[];
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
  const NOTE_BG_COLORS=[
    {c:"",l:"Black"},
    {c:"#ffffff",l:"White"},
  ];
  const getPageBg=(page)=>page?.bgColor||"";
  const isLightBg=(bg)=>{if(!bg)return false;const h=bg.replace("#","");if(h.length!==6)return false;const r=parseInt(h.slice(0,2),16),g=parseInt(h.slice(2,4),16),b=parseInt(h.slice(4,6),16);return(r*.299+g*.587+b*.114)>150;};
  const PageBg=({type,bgColor,children})=>{
    const bg=bgColor||"rgba(255,255,255,.02)";
    const light=isLightBg(bgColor);
    const lineColor=light?"rgba(0,0,0,.08)":"rgba(255,255,255,.06)";
    const dotColor=light?"rgba(0,0,0,.12)":"rgba(255,255,255,.08)";
    return(
    <div style={{position:"relative",background:bg,borderRadius:8,border:"1px solid "+(light?"rgba(0,0,0,.1)":"rgba(255,255,255,.06)"),minWidth:500,minHeight:800}}>
      {type==="lined"&&<svg style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none"}}>
        {Array.from({length:50},(_,i)=><line key={i} x1="0" y1={28+i*28} x2="100%" y2={28+i*28} stroke={lineColor} strokeWidth="1"/>)}</svg>}
      {type==="square"&&<svg style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none"}}>
        <defs><pattern id="sq8" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="0" cy="0" r="1" fill={dotColor}/><circle cx="24" cy="0" r="1" fill={dotColor}/><circle cx="0" cy="24" r="1" fill={dotColor}/><circle cx="24" cy="24" r="1" fill={dotColor}/></pattern></defs>
        <rect width="100%" height="100%" fill="url(#sq8)"/></svg>}
      {type==="hex"&&<svg style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none"}}>
        <defs><pattern id="hx8" width={hcol*2} height={hrow} patternUnits="userSpaceOnUse">
          <circle cx="0" cy="0" r="1.2" fill={dotColor}/><circle cx={hcol} cy="0" r="1.2" fill={dotColor}/>
          <circle cx={hcol*2} cy="0" r="1.2" fill={dotColor}/><circle cx={hcol*0.5} cy={hoff} r="1.2" fill={dotColor}/>
          <circle cx={hcol*1.5} cy={hoff} r="1.2" fill={dotColor}/></pattern></defs>
        <rect width="100%" height="100%" fill="url(#hx8)"/></svg>}
      {children}</div>);
  };
  const ts=(type,bgColor)=>({width:"100%",minHeight:800,padding:type==="lined"?"6px 14px":type==="square"?"2px 14px":type==="hex"?"13px 14px":"14px",
    background:"transparent",border:"none",color:isLightBg(bgColor)?"#1a1a2e":"#e8e0f0",fontSize:15,
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
      <input ref={pixFileInputRef} type="file" accept="image/*" style={{display:"none"}} onChange={(e)=>{const file=e.target.files?.[0];if(file&&pixImportCallbackRef.current)pixImportCallbackRef.current(file);e.target.value="";}}/>
      <div style={{display:"flex",alignItems:"center",gap:6,padding:"8px 10px 4px",flexShrink:0}}>
        <button onClick={goToc} style={btn()}>←</button>
        <button onClick={undoPixel} style={btn({color:"#aaa"})}>↩</button>
        <button onClick={redoPixel} style={btn({color:"#aaa"})}>↪</button>
        <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,minWidth:0}}>
            <button onClick={()=>hasPrev&&goPrev()} style={{background:"none",border:"none",fontSize:16,color:hasPrev?"#a8b4f0":"#333",cursor:hasPrev?"pointer":"default",padding:"4px"}}>◀</button>
            {renaming?<input value={renameVal} onChange={e=>setRenameVal(e.target.value)} autoFocus
              onBlur={()=>{if(renameVal.trim()){save("title",renameVal.trim());syncState();}setRenaming(false);}}
              onKeyDown={e=>{if(e.key==="Enter"){e.target.blur();}}}
              style={{padding:"3px 8px",borderRadius:6,border:"1px solid rgba(102,126,234,.4)",background:"rgba(102,126,234,.1)",color:"#e8e0f0",fontSize:12,fontWeight:700,outline:"none",width:120}}/>
            :<span onClick={startRename} style={{fontSize:11,fontWeight:800,color:"#e8e0f0",cursor:"pointer",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:120}}>{nbPageIdx+1}. {page.title||"Untitled"}</span>}
            <button onClick={()=>hasNext&&goNext()} style={{background:"none",border:"none",fontSize:16,color:hasNext?"#a8b4f0":"#333",cursor:hasNext?"pointer":"default",padding:"4px"}}>▶</button>
          </div>
      </div>
      {/* Row 1: Color palette — primaries, complements, neutrals + expand */}
      <div style={{display:"flex",alignItems:"center",gap:4,padding:"2px 10px 4px",flexShrink:0,flexWrap:"wrap"}}>
        <button onClick={()=>setPixelEraser(e=>!e)} style={btn(pixelEraser?{background:"rgba(245,87,108,.25)",border:"1px solid rgba(245,87,108,.5)",color:"#f5576c",boxShadow:"0 0 8px rgba(245,87,108,.3)",padding:"4px 8px"}:{color:"#ccc",padding:"4px 8px"})}>
          {pixelEraser?"🧹":"✏️"}</button>
        <div style={{width:1,height:20,background:"rgba(255,255,255,.1)"}}/>
        {/* Primaries + complements + neutrals: Red,Blue,Yellow | Green,Orange,Purple | Black,Gray,White */}
        {[
          PIXEL_PALETTE.find(p=>p.n==="321"),  // Red
          PIXEL_PALETTE.find(p=>p.n==="797"),  // Blue
          PIXEL_PALETTE.find(p=>p.n==="973"),  // Yellow
          PIXEL_PALETTE.find(p=>p.n==="699"),  // Green (complement of Red)
          PIXEL_PALETTE.find(p=>p.n==="740"),  // Orange (complement of Blue)
          PIXEL_PALETTE.find(p=>p.n==="550"),  // Purple (complement of Yellow)
          PIXEL_PALETTE.find(p=>p.n==="310"),  // Black
          PIXEL_PALETTE.find(p=>p.n==="414"),  // Gray
          PIXEL_PALETTE.find(p=>p.n==="Blanc") // White
        ].filter(Boolean).map(p=>(<div key={p.n} onClick={()=>{setPixelColor(p.c);setPixelEraser(false);}} title={`DMC ${p.n} ${p.nm}`} style={{width:24,height:24,borderRadius:4,background:p.c,border:pixelColor===p.c&&!pixelEraser?"2px solid #feca57":"1px solid rgba(255,255,255,.15)",cursor:"pointer",opacity:pixelEraser?.4:1}}/>))}
        <button onClick={()=>{setShowPixPicker(v=>!v);setPixPaletteSearch("");}} style={btn({padding:"4px 8px",fontSize:11,color:showPixPicker?"#feca57":"#888"})}>{showPixPicker?"▼":"🎨"}</button>
      </div>
      {/* Full DMC color picker */}
      {showPixPicker&&<div style={{padding:"4px 10px 6px",flexShrink:0}}>
        <input value={pixPaletteSearch} onChange={e=>setPixPaletteSearch(e.target.value)} placeholder="Search DMC # or color name..." style={{width:"100%",padding:"5px 8px",borderRadius:6,border:"1px solid rgba(255,255,255,.12)",background:"rgba(255,255,255,.06)",color:"#e8e0f0",fontSize:11,outline:"none",marginBottom:4,boxSizing:"border-box"}}/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(12,1fr)",gap:2,maxHeight:180,overflowY:"auto",overflowX:"hidden"}}>
          {(pixPaletteSearch.trim()?PIXEL_PALETTE.filter(p=>{const q=pixPaletteSearch.toLowerCase();return p.n.toLowerCase().includes(q)||p.nm.toLowerCase().includes(q);}):PIXEL_PALETTE).map(p=>(<div key={p.n+p.c} onClick={()=>{setPixelColor(p.c);setPixelEraser(false);}} title={`DMC ${p.n} — ${p.nm}`} style={{position:"relative",aspectRatio:"1",borderRadius:3,background:p.c,border:pixelColor===p.c&&!pixelEraser?"2px solid #feca57":"1px solid rgba(255,255,255,.12)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",minWidth:0}}>
            <span style={{fontSize:6,fontWeight:700,color:(parseInt(p.c.slice(1,3),16)*.299+parseInt(p.c.slice(3,5),16)*.587+parseInt(p.c.slice(5,7),16)*.114)>128?"rgba(0,0,0,.5)":"rgba(255,255,255,.6)",lineHeight:1,textAlign:"center",overflow:"hidden"}}>{p.n}</span>
          </div>))}
        </div>
        <div style={{fontSize:10,marginTop:4,textAlign:"center",color:"rgba(232,224,240,.5)"}}>
          <span style={{fontWeight:700}}>DMC {PIXEL_PALETTE.find(p=>p.c===pixelColor)?.n||"—"}</span>
          <span style={{opacity:.6}}> — {PIXEL_PALETTE.find(p=>p.c===pixelColor)?.nm||"Custom"}</span>
        </div>
      </div>}
      {/* Row 2: Tools — zoom, import, grid, numbers */}
      <div style={{display:"flex",alignItems:"center",gap:3,padding:"0 10px 4px",flexShrink:0,flexWrap:"wrap"}}>
        <button onClick={()=>setPageZoom(z=>Math.max(0.3,z-0.2))} style={btn({padding:"3px 7px",fontSize:11})}>−</button>
        <span style={{fontSize:10,opacity:.4,minWidth:28,textAlign:"center"}}>{Math.round(pageZoom*100)}%</span>
        <button onClick={()=>setPageZoom(z=>Math.min(6,z+0.2))} style={btn({padding:"3px 7px",fontSize:11})}>+</button>
        <div style={{width:1,height:16,background:"rgba(255,255,255,.08)"}}/>
        <button onClick={()=>importImage(8)} disabled={pixImporting}
          style={btn({background:"rgba(102,126,234,.1)",border:"1px solid rgba(102,126,234,.2)",color:"#a8b4f0",fontSize:9,padding:"3px 6px"})}>{pixImporting?"...":"📷8"}</button>
        <button onClick={()=>importImage(16)} disabled={pixImporting}
          style={btn({background:"rgba(102,126,234,.1)",border:"1px solid rgba(102,126,234,.2)",color:"#a8b4f0",fontSize:9,padding:"3px 6px"})}>{pixImporting?"...":"📷16"}</button>
        <button onClick={()=>importImage(32)} disabled={pixImporting}
          style={btn({background:"rgba(102,126,234,.1)",border:"1px solid rgba(102,126,234,.2)",color:"#a8b4f0",fontSize:9,padding:"3px 6px"})}>{pixImporting?"...":"📷32"}</button>
        <button onClick={()=>setShowMoreColors(v=>!v)} style={btn({fontSize:9,padding:"3px 6px",color:showMoreColors?"#feca57":"#888"})}>{showMoreColors?"▼":"▶"}More</button>
        {showMoreColors&&<>
          <input value={customColorCount} onChange={e=>setCustomColorCount(e.target.value.replace(/\D/g,""))} style={{width:36,padding:"2px 4px",borderRadius:4,border:"1px solid rgba(102,126,234,.3)",background:"rgba(102,126,234,.06)",color:"#a8b4f0",fontSize:10,fontWeight:700,textAlign:"center",outline:"none"}}/>
          <button onClick={()=>{const n=Math.max(2,Math.min(438,Number(customColorCount)||32));importImage(n);}} disabled={pixImporting}
            style={btn({background:"rgba(102,126,234,.1)",border:"1px solid rgba(102,126,234,.2)",color:"#a8b4f0",fontSize:9,padding:"3px 6px"})}>{pixImporting?"...":"📷Go"}</button>
          <button onClick={()=>importImage(0)} disabled={pixImporting}
            style={btn({background:"rgba(240,147,251,.1)",border:"1px solid rgba(240,147,251,.2)",color:"#f093fb",fontSize:9,padding:"3px 6px"})}>{pixImporting?"...":"📷All"}</button>
        </>}
        <div style={{width:1,height:16,background:"rgba(255,255,255,.08)"}}/>
        <button onClick={()=>{setShowPixNumbers(v=>{const nv=!v;setTimeout(drawPixelGrid,10);return nv;});}} style={btn(showPixNumbers?{background:"rgba(254,202,87,.12)",border:"1px solid rgba(254,202,87,.4)",color:"#feca57",fontSize:10,padding:"3px 7px"}:{fontSize:10,padding:"3px 7px",color:"#888"})}># Nums</button>
        <span style={{fontSize:10,opacity:.3,fontWeight:700}}>Grid:</span>
        {[{v:0,l:"Off"},{v:5,l:"5"},{v:10,l:"10"},{v:20,l:"20"}].map(g=>(
          <button key={g.v} onClick={()=>setPixelGridLines(g.v)} style={{padding:"2px 5px",borderRadius:6,fontSize:10,fontWeight:700,border:pixelGridLines===g.v?"1px solid rgba(254,202,87,.5)":"1px solid rgba(255,255,255,.06)",background:pixelGridLines===g.v?"rgba(254,202,87,.12)":"transparent",color:pixelGridLines===g.v?"#feca57":"#666",cursor:"pointer"}}>{g.l}</button>))}
      </div>
      {/* Row 3: Actions — all labeled */}
      <div style={{display:"flex",alignItems:"center",gap:4,padding:"0 10px 4px",flexShrink:0,flexWrap:"wrap"}}>
        <button onClick={()=>{if(!confirm("Clear all pixels?"))return;const d=readNb();if(d.pages?.[nbPageIdx]){d.pages[nbPageIdx].pixels={};writeNb(d);drawPixelGrid();}}}
          style={btn({background:"rgba(245,87,108,.08)",border:"1px solid rgba(245,87,108,.2)",color:"#f5576c",fontSize:10,padding:"3px 8px"})}>🗑 Clear</button>
        <div style={{flex:1}}/>
        <button onClick={doSave} style={btn(saved?{background:"rgba(67,233,123,.12)",border:"1px solid rgba(67,233,123,.3)",color:"#43e97b",fontSize:10,padding:"3px 8px"}:{fontSize:10,padding:"3px 8px",color:"#888"})}>💾 {saved?"Saved":"Save"}</button>
        <button onClick={printPixelArt} style={btn({fontSize:10,padding:"3px 8px",color:"#888"})}>🖨 Print</button>
        <button onClick={archiveCurrentPage} style={btn({color:"#888",fontSize:10,padding:"3px 8px"})}>🗃 Archive</button>
        <button onClick={deleteCurrentPage} style={btn({color:"#888",fontSize:10,padding:"3px 8px"})}>🗑 Delete</button>
      </div>
      {/* Thread list for pixel art — ranked by usage with pixel counts for thread purchasing */}
      {showPixPicker&&(()=>{const pixels=getPixels();
        const colorCounts={};Object.values(pixels).forEach(color=>{colorCounts[color]=(colorCounts[color]||0)+1;});
        const ranked=Object.entries(colorCounts).sort((a,b)=>b[1]-a[1]);
        return ranked.length>0?<div style={{padding:"2px 10px 6px",flexShrink:0}}>
          <div style={{fontSize:10,fontWeight:700,color:"rgba(232,224,240,.4)",marginBottom:3}}>🧵 Thread List ({ranked.length} colors · {Object.keys(pixels).length} total pixels)</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:3,maxHeight:120,overflowY:"auto"}}>
            {ranked.map(([color,count],i)=>{const p=PIXEL_PALETTE.find(p=>p.c===color);return <div key={color} style={{display:"flex",alignItems:"center",gap:4,background:"rgba(255,255,255,.04)",borderRadius:5,padding:"2px 6px"}}>
              <div style={{width:14,height:14,borderRadius:2,background:color,border:"1px solid rgba(255,255,255,.15)",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <span style={{fontSize:7,fontWeight:800,color:parseInt(color.slice(1,3),16)*.299+parseInt(color.slice(3,5),16)*.587+parseInt(color.slice(5,7),16)*.114>128?"#000":"#fff"}}>{i+1}</span>
              </div>
              <span style={{fontSize:9,color:"#feca57",fontWeight:700}}>#{i+1}</span>
              {p&&<span style={{fontSize:9,color:"#e8e0f0",fontWeight:700}}>DMC {p.n}</span>}
              {p&&<span style={{fontSize:9,color:"rgba(232,224,240,.4)"}}>{p.nm}</span>}
              <span style={{fontSize:8,color:"rgba(232,224,240,.3)"}}>({count}px)</span>
            </div>;})}
          </div>
        </div>:null;
      })()}
      {/* Image crop UI */}
      {pixImgCrop&&(()=>{
        const dims=getPixelDims();const gridRatio=dims.c/dims.r;
        const imgRef=React.createRef();
        const onDrag=(e)=>{
          const touch=e.touches?e.touches[0]:e;
          const img=e.currentTarget.querySelector("img")||e.currentTarget;
          const rect=e.currentTarget.getBoundingClientRect();
          const px=((touch.clientX-rect.left)/rect.width)*100;
          const py=((touch.clientY-rect.top)/rect.height)*100;
          // Size crop to maintain grid aspect ratio, 60% of image width
          const cw=pixCropBox.w;const ch=Math.min(100,cw*(rect.width/rect.height)/gridRatio);
          const cx=Math.max(0,Math.min(100-cw,px-cw/2));
          const cy=Math.max(0,Math.min(100-ch,py-ch/2));
          setPixCropBox({x:cx,y:cy,w:cw,h:ch});
        };
        return <div style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,.95)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:16}}>
          <div style={{fontSize:16,fontWeight:800,color:"#e8e0f0",marginBottom:6}}>Drag to select area</div>
          <div style={{fontSize:11,color:"#888",marginBottom:8}}>Pinch or use slider to resize</div>
          <div style={{position:"relative",width:300,maxHeight:400,marginBottom:10,touchAction:"none"}}
            onTouchMove={onDrag} onMouseMove={(e)=>{if(e.buttons===1)onDrag(e);}}>
            <img src={pixImgCrop.src} style={{width:"100%",height:"auto",borderRadius:8,opacity:.4,display:"block",userSelect:"none",pointerEvents:"none"}}/>
            <div style={{position:"absolute",left:`${pixCropBox.x}%`,top:`${pixCropBox.y}%`,width:`${pixCropBox.w}%`,height:`${pixCropBox.h}%`,border:"2px solid #feca57",borderRadius:4,background:"rgba(254,202,87,.1)",pointerEvents:"none"}}/>
            {/* Dark overlay outside crop */}
            <div style={{position:"absolute",inset:0,pointerEvents:"none"}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:`${pixCropBox.y}%`,background:"rgba(0,0,0,.5)"}}/>
              <div style={{position:"absolute",bottom:0,left:0,right:0,height:`${100-pixCropBox.y-pixCropBox.h}%`,background:"rgba(0,0,0,.5)"}}/>
              <div style={{position:"absolute",top:`${pixCropBox.y}%`,left:0,width:`${pixCropBox.x}%`,height:`${pixCropBox.h}%`,background:"rgba(0,0,0,.5)"}}/>
              <div style={{position:"absolute",top:`${pixCropBox.y}%`,right:0,width:`${100-pixCropBox.x-pixCropBox.w}%`,height:`${pixCropBox.h}%`,background:"rgba(0,0,0,.5)"}}/>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,width:260}}>
            <span style={{fontSize:11,color:"#feca57",fontWeight:700,flexShrink:0}}>Size</span>
            <input type="range" min="20" max="100" value={pixCropBox.w} onChange={(e)=>{const nw=Number(e.target.value);setPixCropBox(p=>{const nh=Math.min(100,nw*1/gridRatio);return{...p,w:nw,h:nh,x:Math.min(p.x,100-nw),y:Math.min(p.y,100-nh)};});}}
              style={{flex:1,accentColor:"#feca57",filter:"contrast(1.3)"}}/>
            <span style={{fontSize:12,color:"#feca57",fontWeight:800,minWidth:36,textAlign:"right"}}>{Math.round(pixCropBox.w)}%</span>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={confirmCrop} style={{padding:"10px 24px",borderRadius:10,background:"linear-gradient(135deg,#667eea,#764ba2)",color:"#fff",border:"none",fontSize:15,fontWeight:700,cursor:"pointer"}}>Convert</button>
            <button onClick={()=>{setPixImgCrop(null);setPixImporting(false);}} style={{padding:"10px 24px",borderRadius:10,background:"rgba(255,255,255,.06)",color:"#aaa",border:"1px solid rgba(255,255,255,.1)",fontSize:15,fontWeight:700,cursor:"pointer"}}>Cancel</button>
          </div>
        </div>;
      })()}
      <div ref={el=>{if(el)pixScrollRef.current=el;}} style={{flex:1,overflow:"auto",WebkitOverflowScrolling:"touch"}}>
        <div style={{transform:`scale(${pageZoom})`,transformOrigin:"top left",width:cW/pageZoom,height:cH/pageZoom,minWidth:cW,minHeight:cH}}>
          <canvas ref={pixCanvasCallbackRef} width={cW} height={cH} style={{width:cW,height:cH,touchAction:"none",cursor:"crosshair",display:"block",imageRendering:"pixelated"}}/>
        </div></div></div>);
  }

  // ═══ VECTOR ART ENGINE ═══
  const traceImageToSvg=(imgSrc,colorCount,callback)=>{
    const img=new Image();
    img.onerror=()=>{alert("Failed to load image");callback(null);};
    img.onload=()=>{
      try{
      const maxDim=500;const scale=Math.min(1,maxDim/Math.max(img.width,img.height));
      const w=Math.round(img.width*scale),h=Math.round(img.height*scale);
      const tc=document.createElement("canvas");tc.width=w;tc.height=h;
      const tctx=tc.getContext("2d");
      // Step 1: Slight blur to reduce noise/texture before quantizing
      tctx.filter="blur(1.5px)";tctx.drawImage(img,0,0,w,h);tctx.filter="none";
      const data=tctx.getImageData(0,0,w,h).data;
      const htr=hex=>[parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)];
      const fullPal=PIXEL_PALETTE.map(p=>p.c);const fullRgb=fullPal.map(htr);
      const nearFull=(r,g,b)=>{let bi=0,bd=Infinity;fullRgb.forEach(([pr,pg,pb],i)=>{const d=(r-pr)**2+(g-pg)**2+(b-pb)**2;if(d<bd){bd=d;bi=i;}});return bi;};
      // Step 2: Quantize to DMC
      const grid=new Uint16Array(w*h);const votes=new Map();
      for(let y=0;y<h;y++)for(let x=0;x<w;x++){
        const idx=(y*w+x)*4;if(data[idx+3]<30){grid[y*w+x]=65535;continue;}
        const bi=nearFull(data[idx],data[idx+1],data[idx+2]);grid[y*w+x]=bi;votes.set(bi,(votes.get(bi)||0)+1);
      }
      const topN=[...votes.entries()].sort((a,b)=>b[1]-a[1]).slice(0,colorCount===0?votes.size:colorCount);
      const allowedSet=new Set(topN.map(e=>e[0]));
      const remap=new Uint16Array(fullPal.length);
      for(let i=0;i<fullPal.length;i++){
        if(allowedSet.has(i)){remap[i]=i;continue;}
        let bd=Infinity,bi=topN[0][0];const[r,g,b]=fullRgb[i];
        topN.forEach(([ci])=>{const[pr,pg,pb]=fullRgb[ci];const d=(r-pr)**2+(g-pg)**2+(b-pb)**2;if(d<bd){bd=d;bi=ci;}});
        remap[i]=bi;
      }
      for(let i=0;i<grid.length;i++){if(grid[i]!==65535)grid[i]=remap[grid[i]];}
      // Step 3: Mode filter — replace each pixel with the most common color in its 3x3 neighborhood
      // This cleans up isolated pixels and makes regions more uniform
      const clean=new Uint16Array(w*h);
      for(let pass=0;pass<3;pass++){
        const src=pass===0?grid:clean;
        for(let y=0;y<h;y++)for(let x=0;x<w;x++){
          const counts=new Map();
          for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
            const ny=y+dy,nx=x+dx;
            if(ny>=0&&ny<h&&nx>=0&&nx<w){const v=src[ny*w+nx];if(v!==65535)counts.set(v,(counts.get(v)||0)+1);}
          }
          let best=src[y*w+x],bestC=0;
          counts.forEach((c,v)=>{if(c>bestC){bestC=c;best=v;}});
          clean[y*w+x]=best;
        }
        if(pass<2)for(let i=0;i<w*h;i++)grid[i]=clean[i];
      }
      // Step 4: Render as SVG — draw flat colored regions back-to-front
      // Use canvas-based rendering for clean output (no jagged path tracing)
      const svgCanvas=document.createElement("canvas");svgCanvas.width=w;svgCanvas.height=h;
      const sctx=svgCanvas.getContext("2d");
      const usedColors=[...new Set(Array.from(clean).filter(v=>v!==65535))];
      usedColors.sort((a,b)=>(votes.get(b)||0)-(votes.get(a)||0));
      // Paint each color layer
      usedColors.forEach(ci=>{
        sctx.fillStyle=fullPal[ci];
        for(let y=0;y<h;y++){
          let x=0;
          while(x<w){
            if(clean[y*w+x]===ci){
              let xe=x+1;while(xe<w&&clean[y*w+xe]===ci)xe++;
              sctx.fillRect(x,y,xe-x,1);
              x=xe;
            }else x++;
          }
        }
      });
      // Convert to data URL and build a simple SVG with embedded image for clean display
      const pngUrl=svgCanvas.toDataURL("image/png");
      // Also build a proper layered SVG with path data for each color region
      let paths="";
      usedColors.forEach(ci=>{
        // Build horizontal run-length spans merged into rectangles
        const rects=[];
        for(let y=0;y<h;y++){
          let x=0;
          while(x<w){
            if(clean[y*w+x]===ci){let xe=x+1;while(xe<w&&clean[y*w+xe]===ci)xe++;rects.push({x,y,w:xe-x,h:1});x=xe;}else x++;
          }
        }
        // Merge vertically adjacent identical-width rects
        const merged=[];
        rects.forEach(r=>{
          const last=merged[merged.length-1];
          if(last&&last.x===r.x&&last.w===r.w&&last.y+last.h===r.y){last.h++;}
          else merged.push({...r});
        });
        merged.forEach(r=>{paths+=`<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="${fullPal[ci]}"/>`;});
      });
      const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w*2}" height="${h*2}">${paths}</svg>`;
      // Recount after cleaning
      const finalVotes=new Map();
      for(let i=0;i<clean.length;i++){const v=clean[i];if(v!==65535)finalVotes.set(v,(finalVotes.get(v)||0)+1);}
      const colorInfo=[...finalVotes.entries()].sort((a,b)=>b[1]-a[1]).map(([ci,count])=>({color:fullPal[ci],dmc:PIXEL_PALETTE[ci],count}));
      callback({svg,width:w,height:h,colors:colorInfo,pngUrl});
      }catch(err){alert("Error: "+err.message);callback(null);}
    };img.src=imgSrc;
  };
  const vecSvgRef=React.useRef(""); // keep full SVG in memory only (not localStorage)
  const vecConvert=(paletteLimit)=>{
    vecFileRef.current?.click();
    const handler=(e)=>{
      const file=e.target.files?.[0];if(!file)return;e.target.value="";
      setVecImporting(true);
      const reader=new FileReader();reader.onload=(ev)=>{
        traceImageToSvg(ev.target.result,paletteLimit,(result)=>{
          setVecImporting(false);
          if(!result)return;
          vecSvgRef.current=result.svg;
          const d=readNb();const pi=pageIdxRef.current;
          if(d.pages?.[pi]){
            d.pages[pi].vectorPng=result.pngUrl||"";
            d.pages[pi].vectorColors=result.colors;
            delete d.pages[pi].vectorSvg;
            try{writeNb(d);setNbData({...d});}catch(err){alert("Save failed — image may be too large. Try fewer colors.");}
          }
        });
      };reader.readAsDataURL(file);
    };
    const input=vecFileRef.current;
    if(input){input.onchange=handler;}
  };

  // ═══ VECTOR PAGE ═══
  if(nbView==="page"&&nbData.pages[nbPageIdx]?.type==="vector"){
    const page=nbData.pages[nbPageIdx];
    const hasPrev=nbPageIdx>0,hasNext=nbPageIdx<nbData.pages.length-1;
    const vecSvg=vecSvgRef.current||page.vectorSvg||"";
    const vecPng=page.vectorPng||"";
    const vecColors=page.vectorColors||[];
    const hasVecContent=vecSvg||vecPng;
    return(<div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <input ref={vecFileRef} type="file" accept="image/*" style={{display:"none"}}/>
      {/* Row 1: nav */}
      <div style={{display:"flex",alignItems:"center",gap:6,padding:"8px 10px 4px",flexShrink:0}}>
        <button onClick={goToc} style={btn()}>←</button>
        <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,minWidth:0}}>
          <button onClick={()=>hasPrev&&goPrev()} style={{background:"none",border:"none",fontSize:16,color:hasPrev?"#a8b4f0":"#333",cursor:hasPrev?"pointer":"default",padding:"4px"}}>◀</button>
          {renaming?<input value={renameVal} onChange={e=>setRenameVal(e.target.value)} autoFocus
            onBlur={()=>{if(renameVal.trim()){save("title",renameVal.trim());syncState();}setRenaming(false);}}
            onKeyDown={e=>{if(e.key==="Enter"){e.target.blur();}}}
            style={{padding:"3px 8px",borderRadius:6,border:"1px solid rgba(102,126,234,.4)",background:"rgba(102,126,234,.1)",color:"#e8e0f0",fontSize:12,fontWeight:700,outline:"none",width:120}}/>
          :<span onClick={startRename} style={{fontSize:11,fontWeight:800,color:"#e8e0f0",cursor:"pointer",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:120}}>{nbPageIdx+1}. {page.title||"Untitled"}</span>}
          <button onClick={()=>hasNext&&goNext()} style={{background:"none",border:"none",fontSize:16,color:hasNext?"#a8b4f0":"#333",cursor:hasNext?"pointer":"default",padding:"4px"}}>▶</button>
        </div>
        <button onClick={doSave} style={btn(saved?{background:"rgba(67,233,123,.15)",border:"1px solid rgba(67,233,123,.3)",color:"#43e97b"}:{color:"#aaa"})}>{saved?"Saved ✓":"Save"}</button>
      </div>
      {/* Row 2: import options */}
      <div style={{display:"flex",alignItems:"center",gap:3,padding:"2px 10px 4px",flexShrink:0,flexWrap:"wrap"}}>
        <span style={{fontSize:10,opacity:.4,fontWeight:700}}>Convert:</span>
        <button onClick={()=>vecConvert(8)} disabled={vecImporting}
          style={btn({background:"rgba(102,126,234,.1)",border:"1px solid rgba(102,126,234,.2)",color:"#a8b4f0",fontSize:9,padding:"3px 6px"})}>{vecImporting?"...":"📷8"}</button>
        <button onClick={()=>vecConvert(16)} disabled={vecImporting}
          style={btn({background:"rgba(102,126,234,.1)",border:"1px solid rgba(102,126,234,.2)",color:"#a8b4f0",fontSize:9,padding:"3px 6px"})}>{vecImporting?"...":"📷16"}</button>
        <button onClick={()=>vecConvert(32)} disabled={vecImporting}
          style={btn({background:"rgba(102,126,234,.1)",border:"1px solid rgba(102,126,234,.2)",color:"#a8b4f0",fontSize:9,padding:"3px 6px"})}>{vecImporting?"...":"📷32"}</button>
        <button onClick={()=>setShowVecMoreColors(v=>!v)} style={btn({fontSize:9,padding:"3px 6px",color:showVecMoreColors?"#feca57":"#888"})}>{showVecMoreColors?"▼":"▶"}More</button>
        {showVecMoreColors&&<>
          <input value={vecCustomColorCount} onChange={e=>setVecCustomColorCount(e.target.value.replace(/\D/g,""))} style={{width:36,padding:"2px 4px",borderRadius:4,border:"1px solid rgba(102,126,234,.3)",background:"rgba(102,126,234,.06)",color:"#a8b4f0",fontSize:10,fontWeight:700,textAlign:"center",outline:"none"}}/>
          <button onClick={()=>{const n=Math.max(2,Math.min(438,Number(vecCustomColorCount)||32));vecConvert(n);}} disabled={vecImporting}
            style={btn({background:"rgba(102,126,234,.1)",border:"1px solid rgba(102,126,234,.2)",color:"#a8b4f0",fontSize:9,padding:"3px 6px"})}>{vecImporting?"...":"📷Go"}</button>
          <button onClick={()=>vecConvert(0)} disabled={vecImporting}
            style={btn({background:"rgba(240,147,251,.1)",border:"1px solid rgba(240,147,251,.2)",color:"#f093fb",fontSize:9,padding:"3px 6px"})}>{vecImporting?"...":"📷All"}</button>
        </>}
        <div style={{flex:1}}/>
        <button onClick={()=>setPageZoom(z=>Math.max(0.3,z-0.2))} style={btn({padding:"3px 7px",fontSize:11})}>−</button>
        <span style={{fontSize:10,opacity:.4,minWidth:28,textAlign:"center"}}>{Math.round(pageZoom*100)}%</span>
        <button onClick={()=>setPageZoom(z=>Math.min(6,z+0.2))} style={btn({padding:"3px 7px",fontSize:11})}>+</button>
      </div>
      {/* Row 3: palette + actions */}
      <div style={{display:"flex",alignItems:"center",gap:3,padding:"0 10px 4px",flexShrink:0,flexWrap:"wrap"}}>
        <button onClick={()=>{setVecShowPicker(v=>!v);setVecPaletteSearch("");}} style={btn({padding:"3px 7px",fontSize:10,color:vecShowPicker?"#feca57":"#888"})}>{vecShowPicker?"▼ Palette":"🎨 Palette"}</button>
        <div style={{flex:1}}/>
        {hasVecContent&&<button onClick={()=>{
          const win=window.open("","_blank");
          if(win){const legendHtml=vecColors.map((c,i)=>`<span style="display:inline-flex;align-items:center;gap:4px"><span style="width:14px;height:14px;border-radius:3px;background:${c.color};border:1px solid #ccc;display:inline-block"></span><b>#${i+1}</b> DMC ${c.dmc?.n||"?"} ${c.dmc?.nm||""} <span style="color:#888">(${c.count}px)</span></span>`).join("");
            const imgHtml=vecSvg?`<div style="max-width:100%;overflow:auto">${vecSvg}</div>`:`<img src="${vecPng}" style="max-width:100%;height:auto"/>`;
            win.document.write(`<html><head><title>${page.title||"Vector Art"}</title><style>@media print{body{margin:0}}</style></head><body style="margin:0;background:#fff;display:flex;flex-direction:column;align-items:center;padding:12px"><h3 style="margin:4px 0;font-family:sans-serif">${page.title||"Vector Art"}</h3>${imgHtml}<div style="margin:8px 0;font-family:sans-serif;font-size:12px;display:flex;flex-wrap:wrap;gap:10px">${legendHtml}</div><button onclick="window.print()" style="padding:10px 30px;font-size:16px;margin:8px;cursor:pointer">🖨️ Print</button></body></html>`);win.document.close();}
        }} style={btn({fontSize:10,padding:"3px 8px",color:"#888"})}>🖨 Print</button>}
        {vecSvg&&<button onClick={()=>{const blob=new Blob([vecSvg],{type:"image/svg+xml"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=(page.title||"vector")+".svg";a.click();URL.revokeObjectURL(url);}}
          style={btn({fontSize:10,padding:"3px 8px",color:"#888"})}>💾 SVG</button>}
        <button onClick={archiveCurrentPage} style={btn({color:"#888",padding:"3px 7px",fontSize:10})}>🗃️</button>
        <button onClick={deleteCurrentPage} style={btn({color:"#888",padding:"3px 7px",fontSize:10})}>🗑️</button>
      </div>
      {/* Palette picker + thread list — hidden until expanded */}
      {vecShowPicker&&<div style={{padding:"4px 10px 6px",flexShrink:0}}>
        <input value={vecPaletteSearch} onChange={e=>setVecPaletteSearch(e.target.value)} placeholder="Search DMC # or color name..." style={{width:"100%",padding:"5px 8px",borderRadius:6,border:"1px solid rgba(255,255,255,.12)",background:"rgba(255,255,255,.06)",color:"#e8e0f0",fontSize:11,outline:"none",marginBottom:4,boxSizing:"border-box"}}/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(12,1fr)",gap:2,maxHeight:150,overflowY:"auto",overflowX:"hidden"}}>
          {(vecPaletteSearch.trim()?PIXEL_PALETTE.filter(p=>{const q=vecPaletteSearch.toLowerCase();return p.n.toLowerCase().includes(q)||p.nm.toLowerCase().includes(q);}):PIXEL_PALETTE).map(p=>(<div key={p.n+p.c} title={`DMC ${p.n} — ${p.nm}`} style={{aspectRatio:"1",borderRadius:3,background:p.c,border:"1px solid rgba(255,255,255,.12)",minWidth:0}}/>))}
        </div>
        {vecColors.length>0&&<div style={{marginTop:6}}>
          <div style={{fontSize:10,fontWeight:700,color:"rgba(232,224,240,.4)",marginBottom:3}}>🧵 Thread List ({vecColors.length} colors)</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:3,maxHeight:100,overflowY:"auto"}}>
            {vecColors.map((c,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:4,background:"rgba(255,255,255,.04)",borderRadius:5,padding:"2px 6px"}}>
              <div style={{width:12,height:12,borderRadius:2,background:c.color,border:"1px solid rgba(255,255,255,.15)",flexShrink:0}}/>
              <span style={{fontSize:9,color:"#feca57",fontWeight:700}}>#{i+1}</span>
              <span style={{fontSize:9,color:"#e8e0f0",fontWeight:700}}>DMC {c.dmc?.n||"?"}</span>
              <span style={{fontSize:9,color:"rgba(232,224,240,.4)"}}>{c.dmc?.nm||""}</span>
              <span style={{fontSize:8,color:"rgba(232,224,240,.3)"}}>({c.count}px)</span>
            </div>)}
          </div>
        </div>}
      </div>}
      {/* Image display */}
      <div style={{flex:1,overflow:"auto",WebkitOverflowScrolling:"touch",display:"flex",alignItems:"flex-start",justifyContent:"center",padding:12}}>
        {vecSvg?<div style={{transform:`scale(${pageZoom})`,transformOrigin:"top center"}} dangerouslySetInnerHTML={{__html:vecSvg}}/>
        :vecPng?<img src={vecPng} style={{transform:`scale(${pageZoom})`,transformOrigin:"top center",maxWidth:"100%",height:"auto",borderRadius:4}}/>
        :<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flex:1,opacity:.3}}>
          <div style={{fontSize:48,marginBottom:12}}>✏️</div>
          <div style={{fontSize:14,fontWeight:700}}>Upload an image to convert to vector art</div>
          <div style={{fontSize:12,marginTop:4}}>Choose a color count above and select an image</div>
        </div>}
      </div>
    </div>);
  }

  // ═══ TEXT PAGE ═══
  if(nbView==="page"&&nbData.pages[nbPageIdx]&&nbData.pages[nbPageIdx].type!=="pixel"&&nbData.pages[nbPageIdx].type!=="vector"){
    const page=nbData.pages[nbPageIdx];const existingDraw=getDrawData();
    const hasPrev=nbPageIdx>0,hasNext=nbPageIdx<nbData.pages.length-1;
    return(<div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{display:"flex",alignItems:"center",gap:6,padding:"8px 10px 4px",flexShrink:0}}>
        <button onClick={goToc} style={btn()}>←</button>
        {!pageDrawMode&&<><button onClick={undo} style={btn({color:"#aaa"})}>↩</button><button onClick={redo} style={btn({color:"#aaa"})}>↪</button></>}
        {pageDrawMode&&<><button onClick={undoDraw} style={btn({color:"#aaa"})}>↩</button><button onClick={redoDraw} style={btn({color:"#aaa"})}>↪</button></>}
        <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,minWidth:0}}>
          <button onClick={()=>hasPrev&&goPrev()} style={{background:"none",border:"none",fontSize:16,color:hasPrev?"#a8b4f0":"#333",cursor:hasPrev?"pointer":"default",padding:"4px"}}>◀</button>
          {renaming?<input value={renameVal} onChange={e=>setRenameVal(e.target.value)} autoFocus
              onBlur={()=>{if(renameVal.trim()){save("title",renameVal.trim());syncState();}setRenaming(false);}}
              onKeyDown={e=>{if(e.key==="Enter"){e.target.blur();}}}
              style={{padding:"3px 8px",borderRadius:6,border:"1px solid rgba(102,126,234,.4)",background:"rgba(102,126,234,.1)",color:"#e8e0f0",fontSize:12,fontWeight:700,outline:"none",width:120}}/>
          :<span onClick={startRename} style={{fontSize:11,fontWeight:800,color:"#e8e0f0",cursor:"pointer",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:120}}>{nbPageIdx+1}. {page.title||"Untitled"}</span>}
          <button onClick={()=>hasNext&&goNext()} style={{background:"none",border:"none",fontSize:16,color:hasNext?"#a8b4f0":"#333",cursor:hasNext?"pointer":"default",padding:"4px"}}>▶</button>
        </div>
        <button onClick={doSave} style={btn(saved?{background:"rgba(67,233,123,.15)",border:"1px solid rgba(67,233,123,.3)",color:"#43e97b"}:{color:"#aaa"})}>{saved?"Saved ✓":"Save"}</button>
      </div>
      {/* Row 2: draw toggle + bg colors + Style selection */}
      {!pageDrawMode&&<div style={{display:"flex",alignItems:"center",gap:4,padding:"2px 10px 4px",flexShrink:0,flexWrap:"wrap"}}>
        <button onClick={()=>{saveAll();setPageZoom(1);setPageDrawMode(true);}} style={btn({color:"#aaa",padding:"4px 8px"})}>🎨</button>
        <div style={{width:1,height:16,background:"rgba(255,255,255,.08)"}}/>
        <span style={{fontSize:10,opacity:.4,fontWeight:700}}>Background:</span>
        {NOTE_BG_COLORS.map(bg=>(
          <div key={bg.c||"default"} onClick={()=>{save("bgColor",bg.c);syncState();}} title={bg.l}
            style={{width:16,height:16,borderRadius:3,background:bg.c||"rgba(255,255,255,.02)",border:(page.bgColor||"")===(bg.c)?"2px solid #feca57":"1px solid rgba(255,255,255,.15)",cursor:"pointer",boxSizing:"border-box"}}/>))}
        <div style={{flex:1}}/>
        <span style={{fontSize:10,opacity:.4,fontWeight:700}}>Style:</span>
        {[{id:"blank",l:"Blank"},{id:"lined",l:"Lined"},{id:"square",l:"Grid"},{id:"hex",l:"Hex"}].map(t=>(
          <button key={t.id} onClick={()=>switchPageType(t.id)} style={{padding:"2px 6px",borderRadius:6,fontSize:10,fontWeight:700,border:page.type===t.id?"1px solid rgba(102,126,234,.5)":"1px solid rgba(255,255,255,.06)",background:page.type===t.id?"rgba(102,126,234,.15)":"transparent",color:page.type===t.id?"#a8b4f0":"#666",cursor:"pointer"}}>{t.l}</button>))}
      </div>}
      {/* Row 3: checkbox + zoom + print + archive + delete */}
      {!pageDrawMode&&<div style={{display:"flex",alignItems:"center",gap:4,padding:"0 10px 4px",flexShrink:0,flexWrap:"wrap"}}>
        <button onClick={handleCheckbox} style={btn({color:"#aaa",padding:"4px 8px",fontSize:11})}>☑</button>
        <div style={{flex:1}}/>
        <button onClick={()=>setPageZoom(z=>Math.max(0.3,z-0.2))} style={btn({padding:"3px 7px",fontSize:11})}>−</button>
        <span style={{fontSize:10,opacity:.4,minWidth:28,textAlign:"center"}}>{Math.round(pageZoom*100)}%</span>
        <button onClick={()=>setPageZoom(z=>Math.min(4,z+0.2))} style={btn({padding:"3px 7px",fontSize:11})}>+</button>
        <div style={{width:1,height:16,background:"rgba(255,255,255,.08)"}}/>
        <button onClick={()=>{const title=nbData.pages[nbPageIdx]?.title||"Note";const content=textRef.current||"";const drawSrc=getDrawData();const bg=page.bgColor||"#fff";const light=isLightBg(page.bgColor);const textColor=light?"#1a1a2e":"#333";const win=window.open("","_blank");if(win){win.document.write(`<html><head><title>${title}</title><style>@media print{body{margin:0;padding:0}.page{page-break-inside:avoid}}body{font-family:'Nunito',sans-serif;padding:20px;max-width:700px;margin:0 auto}</style></head><body><h2 style="margin:0 0 12px">${title}</h2><div class="page" style="position:relative;border:1px solid #ddd;border-radius:8px;overflow:hidden;min-height:400px;background:${bg}"><pre style="white-space:pre-wrap;word-break:break-word;font-family:inherit;font-size:15px;line-height:1.6;padding:16px;margin:0;color:${textColor}">${content.replace(/</g,"&lt;")}</pre>${drawSrc?`<img src="${drawSrc}" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:fill;pointer-events:none"/>`:""}</div><button onclick="window.print()" style="padding:10px 30px;font-size:16px;margin:12px;cursor:pointer">🖨️ Print</button></body></html>`);win.document.close();}}}
          style={btn({color:"#888",padding:"3px 7px",fontSize:11})}>🖨</button>
        <button onClick={archiveCurrentPage} style={btn({color:"#888",padding:"3px 7px",fontSize:11})}>🗃️</button>
        <button onClick={deleteCurrentPage} style={btn({color:"#888",padding:"3px 7px",fontSize:11})}>🗑️</button>
      </div>}
      {pageDrawMode&&<div style={{display:"flex",flexDirection:"column",gap:4,padding:"2px 10px 6px",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:4,flexWrap:"wrap"}}>
          <button onClick={()=>{saveAll();setPageDrawMode(false);}} style={btn({background:"rgba(102,126,234,.15)",border:"1px solid rgba(102,126,234,.3)",color:"#a8b4f0",padding:"4px 8px"})}>🔡</button>
          <button onClick={()=>setDrawEraser(e=>!e)} style={btn(drawEraser?{background:"rgba(245,87,108,.25)",border:"1px solid rgba(245,87,108,.5)",color:"#f5576c",padding:"4px 8px"}:{color:"#ccc",padding:"4px 8px"})}>
            {drawEraser?"🧹":"✏️"}</button>
          <div style={{width:1,height:20,background:"rgba(255,255,255,.1)"}}/>
          {[
            {c:"#FFFFFF",l:"White"},{c:"#000000",l:"Black"},{c:"#8C8C8C",l:"Gray"},
            {c:"#C72B3B",l:"Red"},{c:"#13477D",l:"Blue"},{c:"#FFE502",l:"Yellow"},
            {c:"#056517",l:"Green"},{c:"#FF8313",l:"Orange"},{c:"#5C184E",l:"Purple"}
          ].map(p=>(
            <div key={p.c} onClick={()=>{setDrawColor(p.c);setDrawEraser(false);}} title={p.l} style={{width:24,height:24,borderRadius:5,background:p.c,border:drawColor===p.c&&!drawEraser?"2px solid #feca57":"1px solid rgba(255,255,255,.15)",cursor:"pointer",opacity:drawEraser?.4:1}}/>))}
          <button onClick={()=>{setShowDrawPicker(v=>!v);setDrawPaletteSearch("");}} style={btn({padding:"4px 8px",fontSize:11,color:showDrawPicker?"#feca57":"#888"})}>{showDrawPicker?"▼":"🎨"}</button>
          <div style={{flex:1}}/>
          <button onClick={()=>setPageZoom(z=>Math.max(0.3,z-0.2))} style={btn({padding:"4px 6px",fontSize:14})}>−</button>
          <span style={{fontSize:10,opacity:.4,minWidth:28,textAlign:"center"}}>{Math.round(pageZoom*100)}%</span>
          <button onClick={()=>setPageZoom(z=>Math.min(4,z+0.2))} style={btn({padding:"4px 6px",fontSize:14})}>+</button>
        </div>
        {/* Full DMC palette for drawing */}
        {showDrawPicker&&<div style={{padding:"4px 0 4px"}}>
          <input value={drawPaletteSearch} onChange={e=>setDrawPaletteSearch(e.target.value)} placeholder="Search DMC # or color name..." style={{width:"100%",padding:"5px 8px",borderRadius:6,border:"1px solid rgba(255,255,255,.12)",background:"rgba(255,255,255,.06)",color:"#e8e0f0",fontSize:11,outline:"none",marginBottom:4,boxSizing:"border-box"}}/>
          <div style={{display:"grid",gridTemplateColumns:"repeat(12,1fr)",gap:2,maxHeight:150,overflowY:"auto",overflowX:"hidden"}}>
            {(drawPaletteSearch.trim()?PIXEL_PALETTE.filter(p=>{const q=drawPaletteSearch.toLowerCase();return p.n.toLowerCase().includes(q)||p.nm.toLowerCase().includes(q);}):PIXEL_PALETTE).map(p=>(<div key={p.n+p.c} onClick={()=>{setDrawColor(p.c);setDrawEraser(false);}} title={`DMC ${p.n} — ${p.nm}`} style={{aspectRatio:"1",borderRadius:3,background:p.c,border:drawColor===p.c&&!drawEraser?"2px solid #feca57":"1px solid rgba(255,255,255,.12)",cursor:"pointer",minWidth:0}}/>))}
          </div>
        </div>}
        {drawEraser?<div style={{display:"flex",alignItems:"center",gap:4}}>
          {[6,10,16,20,28,36,48].map(s=>(<div key={s} onClick={()=>setDrawEraserSize(s)}
            style={{width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:8,
              background:drawEraserSize===s?"rgba(245,87,108,.18)":"transparent",border:drawEraserSize===s?"1px solid rgba(245,87,108,.4)":"1px solid transparent",cursor:"pointer"}}>
            <div style={{width:Math.max(Math.round(s/2.5),3),height:Math.max(Math.round(s/2.5),3),borderRadius:"50%",background:"rgba(245,87,108,.7)"}}/></div>))}
        </div>:<div style={{display:"flex",alignItems:"center",gap:4}}>
          {[1,2,3,4,6,8,10,12].map(s=>(<div key={s} onClick={()=>setDrawSize(s)}
            style={{width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:8,
              background:drawSize===s?"rgba(255,255,255,.12)":"transparent",border:drawSize===s?`1px solid ${drawColor}`:"1px solid transparent",cursor:"pointer"}}>
            <div style={{width:Math.max(s,2),height:Math.max(s,2),borderRadius:"50%",background:drawColor}}/></div>))}
        </div>}
        <div style={{display:"flex",alignItems:"center",gap:4}}>
          <button onClick={()=>{const c=drawCanvasRef.current;if(!c)return;const dataUrl=c.toDataURL("image/png");const title=nbData.pages[nbPageIdx]?.title||"Drawing";const content=textRef.current||"";const win=window.open("","_blank");if(win){win.document.write(`<html><head><title>${title}</title><style>@media print{body{margin:0;padding:0}.page{page-break-inside:avoid}}body{font-family:'Nunito',sans-serif;padding:20px;max-width:700px;margin:0 auto}</style></head><body><h2 style="margin:0 0 12px">${title}</h2><div class="page" style="position:relative;border:1px solid #eee;border-radius:8px;overflow:hidden;min-height:400px">${content?`<pre style="white-space:pre-wrap;word-break:break-word;font-family:inherit;font-size:15px;line-height:1.6;padding:16px;margin:0">${content.replace(/</g,"&lt;")}</pre>`:""}<img src="${dataUrl}" style="position:${content?"absolute":"relative"};top:0;left:0;width:100%;${content?"height:100%;object-fit:fill":"height:auto"};pointer-events:none"/></div><button onclick="window.print()" style="padding:10px 30px;font-size:16px;margin:12px;cursor:pointer">🖨️ Print</button></body></html>`);win.document.close();}}}
            style={btn({fontSize:10,padding:"3px 8px",color:"#888"})}>🖨 Print</button>
        </div>
      </div>}
      <div style={{flex:1,overflow:"auto",WebkitOverflowScrolling:"touch"}}>
        <div style={{transform:pageDrawMode?undefined:`scale(${pageZoom})`,transformOrigin:"top left",width:pageDrawMode?undefined:`${100/pageZoom}%`}}>
          <PageBg type={page.type} bgColor={page.bgColor}>
            {!pageDrawMode&&<div style={{position:"relative"}}>
              {existingDraw&&<img src={existingDraw} style={{position:"absolute",top:0,left:0,width:"100%",height:800,pointerEvents:"none",opacity:.7,zIndex:2}}/>}
              <textarea ref={(el)=>{if(el){
                const curIdx=String(pageIdxRef.current);
                if(el.dataset.loadedIdx!==curIdx){
                  const d=readNb();const content=d.pages?.[pageIdxRef.current]?.content||"";
                  textRef.current=content;el.value=content;el.dataset.loadedIdx=curIdx;
                }
                textareaRef.current=el;}}
              } onInput={onTextInput} onBlur={()=>saveText()} placeholder="Start writing..." style={{...ts(page.type,page.bgColor),position:"relative",zIndex:1}}/>
            </div>}
            {pageDrawMode&&<div style={{position:"relative"}}>
              {(()=>{const baseTs=ts(page.type,page.bgColor);const scaledPadding=(()=>{
                const p=baseTs.padding;if(typeof p==="number")return `${p*pageZoom}px`;
                const parts=p.split(" ").map(v=>parseFloat(v)*pageZoom+"px");return parts.join(" ");
              })();return <div style={{position:"absolute",top:0,left:0,width:500*pageZoom,minHeight:800*pageZoom,
                padding:scaledPadding,fontSize:`${(baseTs.fontSize||15)*pageZoom}px`,
                lineHeight:typeof baseTs.lineHeight==="string"&&baseTs.lineHeight.endsWith("px")?`${parseFloat(baseTs.lineHeight)*pageZoom}px`:baseTs.lineHeight,
                fontFamily:baseTs.fontFamily||"'Nunito',sans-serif",
                color:"rgba(232,224,240,.4)",whiteSpace:"pre-wrap",wordBreak:"break-word",pointerEvents:"none",zIndex:0,
                boxSizing:"border-box"}}>{textRef.current}</div>;})()}
              <canvas ref={canvasCallbackRef} width={500} height={800}
                style={{width:500*pageZoom,height:800*pageZoom,touchAction:"pan-x pan-y pinch-zoom",background:"transparent",display:"block",position:"relative",zIndex:1}}/>
            </div>}
          </PageBg>
        </div></div></div>);
  }

  // ═══ TABLE OF CONTENTS ═══
  return(<div style={{flex:1,overflowY:"auto",padding:"8px 12px"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
      <span style={{fontSize:16,fontWeight:900,color:"#e8e0f0"}}>📓 Notes & Doodles</span>
      <div style={{display:"flex",gap:4}}>
        <button onClick={togglePreviewMode} style={btn({fontSize:11,padding:"4px 8px",color:nbPreviewMode?"#a8b4f0":"#888",background:nbPreviewMode?"rgba(102,126,234,.12)":"transparent"})}>{nbPreviewMode?"👁":"👁‍🗨"}</button>
        <button onClick={()=>setNbView("archive")} style={btn({fontSize:11,padding:"4px 8px",color:"#888"})}>🗃️ {nbData.archive.length}</button>
        <button onClick={()=>setNbView("newpw")} style={btn({fontSize:11,padding:"4px 8px",color:"#888"})}>{nbData.pwHash?"🔐":"🔓"}</button>
      </div></div>
    <div style={{background:"rgba(102,126,234,.06)",border:"1px solid rgba(102,126,234,.15)",borderRadius:12,padding:"10px 12px",marginBottom:10}}>
      <input value={nbNewTitle} onChange={e=>setNbNewTitle(e.target.value)} placeholder="Page title" style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid rgba(255,255,255,.08)",background:"rgba(255,255,255,.04)",color:"#e8e0f0",fontSize:14,outline:"none",marginBottom:6}}/>
      <div style={{display:"flex",gap:4,marginBottom:6}}>
        {[{id:"lined",label:"📝 Note"},{id:"pixel",label:"🟨 Pixel Art"},{id:"vector",label:"✏️ Vector Art"}].map(t=>(
          <button key={t.id} onClick={()=>setNbNewType(t.id)}
            style={{flex:1,padding:"7px 2px",borderRadius:8,border:nbNewType===t.id?"1px solid rgba(102,126,234,.5)":"1px solid rgba(255,255,255,.08)",
              background:nbNewType===t.id?"rgba(102,126,234,.15)":"rgba(255,255,255,.03)",color:nbNewType===t.id?"#a8b4f0":"#888",fontSize:12,fontWeight:700,cursor:"pointer"}}>{t.label}</button>))}
      </div>
      {nbNewType==="pixel"&&<div style={{marginBottom:6}}>
        <div style={{fontSize:11,opacity:.4,marginBottom:4}}>Grid size:</div>
        <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
          {PIXEL_SIZES.map(s=>(<button key={s.id} onClick={()=>setNbPixelSize(s.id)}
            style={{padding:"4px 8px",borderRadius:6,border:nbPixelSize===s.id?"1px solid rgba(254,202,87,.5)":"1px solid rgba(255,255,255,.08)",
              background:nbPixelSize===s.id?"rgba(254,202,87,.12)":"rgba(255,255,255,.03)",color:nbPixelSize===s.id?"#feca57":"#888",fontSize:10,fontWeight:700,cursor:"pointer"}}>{s.label}<div style={{fontSize:9,opacity:.5}}>{s.desc}</div></button>))}
          <button onClick={()=>setNbPixelSize("custom")}
            style={{padding:"4px 8px",borderRadius:6,border:nbPixelSize==="custom"?"1px solid rgba(254,202,87,.5)":"1px solid rgba(255,255,255,.08)",
              background:nbPixelSize==="custom"?"rgba(254,202,87,.12)":"rgba(255,255,255,.03)",color:nbPixelSize==="custom"?"#feca57":"#888",fontSize:10,fontWeight:700,cursor:"pointer"}}>✏️<div style={{fontSize:9,opacity:.5}}>Custom</div></button>
        </div>
        {nbPixelSize==="custom"&&<div style={{display:"flex",gap:4,alignItems:"center",marginTop:6}}>
          <input value={customPixelW} onChange={e=>setCustomPixelW(e.target.value.replace(/\D/g,""))} placeholder="W" style={{width:56,padding:"5px 8px",borderRadius:6,border:"1px solid rgba(254,202,87,.3)",background:"rgba(254,202,87,.06)",color:"#feca57",fontSize:13,fontWeight:700,textAlign:"center",outline:"none"}}/>
          <span style={{color:"#888",fontSize:13}}>×</span>
          <input value={customPixelH} onChange={e=>setCustomPixelH(e.target.value.replace(/\D/g,""))} placeholder="H" style={{width:56,padding:"5px 8px",borderRadius:6,border:"1px solid rgba(254,202,87,.3)",background:"rgba(254,202,87,.06)",color:"#feca57",fontSize:13,fontWeight:700,textAlign:"center",outline:"none"}}/>
          <span style={{fontSize:10,opacity:.3}}>max 512</span>
        </div>}
      </div>}
      <button onClick={()=>{const title=nbNewTitle.trim()||`Page ${nbData.pages.length+1}`;
        const np={title,type:nbNewType,content:"",drawData:null,pixels:{},created:Date.now()};
        if(nbNewType==="pixel"){
          if(nbPixelSize==="custom"){const w=Math.max(4,Math.min(512,Number(customPixelW)||32));const h=Math.max(4,Math.min(512,Number(customPixelH)||32));np.pixelSize=`${w}x${h}`;}
          else np.pixelSize=nbPixelSize;
        }
        const d=readNb();d.pages.push(np);saveNb(d);setNbNewTitle("");
        const newIdx=d.pages.length-1;pageIdxRef.current=newIdx;
        drawImgRef.current=null;drawCanvasRef.current=null;textRef.current="";
        setNbPageIdx(newIdx);setNbView("page");}}
        style={{width:"100%",background:"linear-gradient(135deg,#667eea,#764ba2)",color:"#fff",border:"none",borderRadius:10,padding:"8px",fontSize:14,fontWeight:700,cursor:"pointer"}}>+ Add Page</button>
    </div>
    {nbData.pages.length===0&&<div style={{textAlign:"center",opacity:.3,padding:20}}>No pages yet</div>}
    {nbData.pages.map((p,i)=>{
      const isExpanded=nbPreviewMode&&nbExpandedIdx===i;
      const openPage=()=>{drawImgRef.current=null;drawCanvasRef.current=null;pageIdxRef.current=i;setNbPageIdx(i);setNbView("page");};
      return(<div key={i} style={{background:isExpanded?"rgba(255,255,255,.05)":"rgba(255,255,255,.03)",border:isExpanded?"1px solid rgba(102,126,234,.2)":"1px solid rgba(255,255,255,.06)",borderRadius:10,padding:"10px 12px",marginBottom:4,cursor:"pointer"}}>
        <div onClick={()=>{if(nbPreviewMode)setNbExpandedIdx(isExpanded?null:i);else openPage();}} style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:13,fontWeight:800,color:"rgba(102,126,234,.6)",minWidth:28}}>{i+1}.</span>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:14,fontWeight:700,color:"#e8e0f0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.title||"Untitled"}</div>
            <div style={{fontSize:11,opacity:.3}}>{p.type==="pixel"?"🟨 "+(p.pixelSize||"32x32"):p.type==="vector"?"✏️ Vector Art":`📝 ${p.type}`}{p.drawData?" + 🎨":""}</div></div>
          {nbPreviewMode&&<span style={{fontSize:14,opacity:.3,transition:"transform .2s",transform:isExpanded?"rotate(90deg)":"none"}}>▶</span>}
        </div>
        {isExpanded&&<div onClick={openPage} style={{marginTop:8,paddingTop:8,borderTop:"1px solid rgba(255,255,255,.06)",cursor:"pointer"}}>
          {/* Preview — combined text + drawing overlay, matching actual note layout */}
          {p.type!=="pixel"&&p.type!=="vector"&&(p.content||p.drawData)?<div style={{position:"relative",marginBottom:8,borderRadius:6,border:"1px solid rgba(255,255,255,.06)",background:"rgba(255,255,255,.02)",overflow:"hidden",aspectRatio:"500/300"}}>
            {/* Text layer */}
            {p.content&&<div style={{position:"absolute",inset:0,fontSize:11,color:"rgba(232,224,240,.5)",lineHeight:1.5,padding:"8px 10px",whiteSpace:"pre-wrap",wordBreak:"break-word",overflow:"hidden"}}>{p.content.slice(0,400)}</div>}
            {/* Drawing layer on top */}
            {p.drawData&&<img src={p.drawData} style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",objectFit:"fill",opacity:.8,pointerEvents:"none"}}/>}
            {/* Fade at bottom */}
            <div style={{position:"absolute",bottom:0,left:0,right:0,height:24,background:"linear-gradient(transparent,rgba(30,25,50,.9))"}}/>
          </div>:null}
          {p.type!=="pixel"&&p.type!=="vector"&&!p.content&&!p.drawData&&<div style={{fontSize:12,opacity:.25,marginBottom:8,fontStyle:"italic"}}>Empty page</div>}
          {p.type==="vector"&&(p.vectorPng||p.vectorSvg)?<div style={{marginBottom:8}}>
            <img src={p.vectorPng||""} style={{width:"100%",maxHeight:160,objectFit:"contain",borderRadius:6,border:"1px solid rgba(255,255,255,.06)"}}/>
            {p.vectorColors&&<div style={{fontSize:10,opacity:.35,marginTop:4}}>{p.vectorColors.length} colors</div>}
          </div>:p.type==="vector"?<div style={{fontSize:12,opacity:.25,marginBottom:8,fontStyle:"italic"}}>No image converted yet</div>:null}
          {p.type==="pixel"&&<div style={{marginBottom:8}}><div style={{fontSize:12,opacity:.35,marginBottom:4}}>{Object.keys(p.pixels||{}).length} pixels · {p.pixelSize||"32x32"}</div>
            {Object.keys(p.pixels||{}).length>0&&(()=>{const dims=PIXEL_SIZES.find(s=>s.id===(p.pixelSize||"32x32"))||(()=>{const m=(p.pixelSize||"").match(/^(\d+)x(\d+)$/);return m?{c:+m[1],r:+m[2]}:{c:32,r:32};})();
              const ps=Math.max(1,Math.floor(200/Math.max(dims.c,dims.r)));
              return <canvas ref={el=>{if(!el)return;const ctx=el.getContext("2d");ctx.fillStyle="#111";ctx.fillRect(0,0,el.width,el.height);
                Object.entries(p.pixels||{}).forEach(([k,color])=>{const[r,c]=k.split("-").map(Number);ctx.fillStyle=color;ctx.fillRect(c*ps,r*ps,ps,ps);});
              }} width={dims.c*ps} height={dims.r*ps} style={{width:Math.min(200,dims.c*ps),height:"auto",borderRadius:4,border:"1px solid rgba(255,255,255,.06)",imageRendering:"pixelated"}}/>;
            })()}</div>}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:4}}>
          <div style={{display:"flex",gap:2}}>
            <button onClick={(e)=>{e.stopPropagation();movePageInToc(i,-1);}} disabled={i===0} style={{padding:"4px 8px",borderRadius:6,background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.08)",color:i===0?"rgba(255,255,255,.15)":"#aaa",fontSize:12,cursor:i===0?"default":"pointer",fontWeight:700}}>▲</button>
            <button onClick={(e)=>{e.stopPropagation();movePageInToc(i,1);}} disabled={i===nbData.pages.length-1} style={{padding:"4px 8px",borderRadius:6,background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.08)",color:i===nbData.pages.length-1?"rgba(255,255,255,.15)":"#aaa",fontSize:12,cursor:i===nbData.pages.length-1?"default":"pointer",fontWeight:700}}>▼</button>
          </div>
          <div style={{flex:1}}/>
          <button onClick={(e)=>{e.stopPropagation();const d=readNb();d.archive.push(d.pages[i]);d.pages.splice(i,1);saveNb(d);setNbExpandedIdx(null);}}
            style={{padding:"6px 12px",borderRadius:8,background:"rgba(254,202,87,.08)",border:"1px solid rgba(254,202,87,.15)",color:"#feca57",fontSize:12,fontWeight:700,cursor:"pointer"}}>🗃️</button>
          <button onClick={(e)=>{e.stopPropagation();if(!confirm(`Delete "${p.title}"?`))return;const d=readNb();d.pages.splice(i,1);saveNb(d);setNbExpandedIdx(null);}}
            style={{padding:"6px 12px",borderRadius:8,background:"rgba(245,87,108,.08)",border:"1px solid rgba(245,87,108,.15)",color:"#f5576c",fontSize:12,fontWeight:700,cursor:"pointer"}}>🗑️</button>
        </div></div>}
      </div>);})}
  </div>);
};

// ─── LEARN PANEL (inline tab — no notebook) ──────────────────────────────
const LearnPanel=()=>{
  const[learnTab,setLearnTab]=useState("picks");
  const[expanded,setExpanded]=useState(null);
  const[teaserRevealed,setTeaserRevealed]=useState(false);
  const[apiTrivia,setApiTrivia]=useState(null);
  const[apiFact,setApiFact]=useState(null);
  const[apiWord,setApiWord]=useState(null);
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

  // Fave Sites - custom + default
  const DEFAULT_NEWS=[{name:"AP News",url:"https://apnews.com",icon:"🔵",color:"#60a5fa",cat:"News"},{name:"Reuters",url:"https://reuters.com",icon:"🟠",color:"#fb923c",cat:"News"},{name:"NPR",url:"https://npr.org/sections/news",icon:"🔴",color:"#f5576c",cat:"News"},{name:"BBC News",url:"https://bbc.com/news",icon:"⚪",color:"#e8e0f0",cat:"News"},{name:"The Guardian",url:"https://theguardian.com/international",icon:"🔵",color:"#38bdf8",cat:"News"},{name:"PBS NewsHour",url:"https://pbs.org/newshour",icon:"🟣",color:"#a78bfa",cat:"News"}];
  const[newsSources,setNewsSources]=useState(()=>{try{return JSON.parse(localStorage.getItem("zodibuddy_news_v1"))||DEFAULT_NEWS;}catch{return DEFAULT_NEWS;}});
  const[showAddNews,setShowAddNews]=useState(false);
  const[newNewsName,setNewNewsName]=useState("");
  const[newNewsUrl,setNewNewsUrl]=useState("");
  const[newNewsCat,setNewNewsCat]=useState("");
  const[sitesCatFilter,setSitesCatFilter]=useState("all");
  const siteCategories=useMemo(()=>{const cats=new Set();newsSources.forEach(s=>{if(s.cat)cats.add(s.cat);});return["all",...Array.from(cats).sort()];},[newsSources]);
  const filteredSites=useMemo(()=>sitesCatFilter==="all"?newsSources:newsSources.filter(s=>s.cat===sitesCatFilter),[newsSources,sitesCatFilter]);
  const saveNewsSources=(s)=>{setNewsSources(s);try{localStorage.setItem("zodibuddy_news_v1",JSON.stringify(s));}catch{}};
  const addNewsSource=()=>{if(!newNewsName.trim()||!newNewsUrl.trim())return;
    const url=newNewsUrl.trim().startsWith("http")?newNewsUrl.trim():"https://"+newNewsUrl.trim();
    const cat=newNewsCat.trim()||"Other";
    saveNewsSources([...newsSources,{name:newNewsName.trim(),url,icon:"🌐",color:"#a8b4f0",cat,custom:true}]);setNewNewsName("");setNewNewsUrl("");setNewNewsCat("");setShowAddNews(false);};
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

  useEffect(()=>{let c=false;(async()=>{setApiLoading(true);try{
    // Pick a dynamic word pool for API lookup — interesting/uncommon words that rotate daily
    const dictWords=["ephemeral","serendipity","eloquence","resilience","luminous","crescendo","catalyst","metamorphosis","sagacity","effervescent","halcyon","numinous","apricity","petrichor","sonder","vellichor","ataraxia","querencia","eudaimonia","phosphenes","limerence","selcouth","trouvaille","ineffable","mellifluous","sonorous","ebullience","scintilla","redolent","susurrus","ethereal","resplendent","verdant","incandescent","gossamer","diaphanous","dulcet","beguile","surreptitious","felicity","quintessence","insouciance","panacea","labyrinthine","sempiternal","iridescent","opulent","zephyr","euphoria","reverie","palimpsest","solitude","wanderlust","sanguine","elixir","bucolic","cerulean","lagniappe","conflate"];
    const todaySeed=(()=>{const d=new Date();return d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate();})();
    const apiWordPick=dictWords[todaySeed%dictWords.length];
    const _cb=Date.now();
    const[tr,fr,wr]=await Promise.allSettled([
    fetch(`https://opentdb.com/api.php?amount=3&type=multiple&encode=url3986&_=${_cb}`).then(r=>r.json()),
    fetch(`https://uselessfacts.jsph.pl/api/v2/facts/random?language=en&_=${_cb}`).then(r=>r.json()),
    fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${apiWordPick}`).then(r=>r.json())]);
    if(!c){if(tr.status==="fulfilled"&&tr.value?.results?.length>0)setApiTrivia(tr.value.results.map(q=>({question:decodeURIComponent(q.question),answer:decodeURIComponent(q.correct_answer),category:decodeURIComponent(q.category)})));
    if(fr.status==="fulfilled"&&fr.value?.text)setApiFact(fr.value.text);
    if(wr.status==="fulfilled"&&Array.isArray(wr.value)&&wr.value[0]?.meanings?.length>0){const w=wr.value[0];const def=w.meanings[0]?.definitions?.[0]?.definition||"";const phonetic=w.phonetic||w.phonetics?.find(p=>p.text)?.text||"";if(def)setApiWord({word:w.word.charAt(0).toUpperCase()+w.word.slice(1),def,phonetic,partOfSpeech:w.meanings[0]?.partOfSpeech||""});}
    }}catch{}if(!c)setApiLoading(false);})();return()=>{c=true;};},[]);

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
        <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
          {onFav&&<button onClick={e=>{e.stopPropagation();onFav();}} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",padding:"6px 8px",margin:"-6px 0",opacity:isFav?1:.3}}>{isFav?"⭐":"☆"}</button>}
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
        {[{id:"picks",label:"🌱 Picks"},{id:"news",label:"⭐ Fave Sites"},{id:"flash",label:"📒 Flashcards"}].map(t=>(
          <button key={t.id} onClick={()=>setLearnTab(t.id)}
            style={{flex:1,padding:"7px 2px",borderRadius:10,border:learnTab===t.id?"1px solid rgba(102,126,234,.4)":"1px solid rgba(255,255,255,.06)",
              background:learnTab===t.id?"rgba(102,126,234,.12)":"rgba(255,255,255,.03)",
              color:learnTab===t.id?"#a8b4f0":"#777",fontSize:12,fontWeight:700,cursor:"pointer"}}>{t.label}</button>
        ))}
      </div>
      {learnTab==="picks"&&<div style={{flex:1,overflowY:"auto",padding:"0 14px 14px"}}>
        <Card icon="💬" title="Daily Quote" color="rgba(254,202,87)" id="quote" onFav={()=>toggleSimpleFav("quotes",{q:quote.text,a:quote.author},x=>x.q===quote.text)} isFav={isSimpleFav("quotes",x=>x.q===quote.text)}><div style={{fontSize:16,fontStyle:"italic",lineHeight:1.5,opacity:.8}}>"{quote.text}"</div><div style={{fontSize:14,opacity:.4,marginTop:4}}>— {quote.author}</div></Card>
        <Card icon="🧠" title={apiFact?"Random Fact":"Fun Fact"} color="rgba(67,233,123)" id="fact" onFav={()=>toggleSimpleFav("facts",{text:displayFact},x=>x.text===displayFact)} isFav={isSimpleFav("facts",x=>x.text===displayFact)}>{apiLoading&&!apiFact?<div style={{fontSize:14,opacity:.4}}>Loading...</div>:<div style={{fontSize:16,lineHeight:1.5,opacity:.75}}>{displayFact}</div>}</Card>
        <Card icon="🧩" title={apiTrivia?"Trivia: "+apiTrivia[0].category:"Brain Teaser"} color="rgba(192,132,252)" id="teaser">
          <div style={{fontSize:16,lineHeight:1.5,opacity:.8,marginBottom:6}}>{displayTrivia.question}</div>
          {teaserRevealed?<div style={{fontSize:16,fontWeight:700,color:"#a78bfa"}}>💡 {displayTrivia.answer}</div>
          :<button onClick={e=>{e.stopPropagation();setTeaserRevealed(true);}} style={{background:"rgba(167,139,250,.15)",border:"1px solid rgba(167,139,250,.3)",borderRadius:8,padding:"6px 14px",fontSize:15,color:"#a78bfa",cursor:"pointer",fontWeight:700}}>Reveal Answer</button>}
          {apiTrivia&&apiTrivia.length>1&&teaserRevealed&&<div style={{marginTop:10,borderTop:"1px solid rgba(255,255,255,.06)",paddingTop:8}}>{apiTrivia.slice(1).map((q,i)=>(<div key={i} style={{marginBottom:8}}><div style={{fontSize:14,opacity:.7,marginBottom:2}}>{q.question}</div><div style={{fontSize:13,color:"#a78bfa",fontWeight:700}}>→ {q.answer}</div></div>))}</div>}
        </Card>
        <Card icon="📖" title="Word of the Day" color="rgba(96,165,250)" id="word" onFav={()=>{const w=apiWord||word;toggleSimpleFav("words",{word:w.word,def:w.def},x=>x.word===w.word);}} isFav={isSimpleFav("words",x=>x.word===(apiWord||word).word)}>{(()=>{const w=apiWord||word;return(<><div style={{fontSize:18,fontWeight:900,color:"#60a5fa"}}>{w.word}</div>{w.phonetic&&<div style={{fontSize:13,opacity:.35,marginTop:1,fontStyle:"italic"}}>{w.phonetic}{w.partOfSpeech?` • ${w.partOfSpeech}`:""}</div>}<div style={{fontSize:15,opacity:.6,marginTop:3,lineHeight:1.4}}>{w.def}</div>{apiWord&&<div style={{fontSize:10,opacity:.2,marginTop:6}}>via Free Dictionary API</div>}</>);})()}</Card>
        <Card icon={mindful.icon} title={`${mindful.type} — Mindfulness`} color="rgba(56,189,248)" id="mind" onFav={()=>toggleSimpleFav("mindful",{type:mindful.type,practice:mindful.practice,icon:mindful.icon},x=>x.practice===mindful.practice)} isFav={isSimpleFav("mindful",x=>x.practice===mindful.practice)}><div style={{fontSize:16,lineHeight:1.6,opacity:.8}}>{mindful.practice}</div></Card>
        <Card icon={finTip.icon} title="Money Tip" color="rgba(245,87,108)" id="fin" onFav={()=>toggleSimpleFav("tips",{tip:finTip.tip,icon:finTip.icon},x=>x.tip===finTip.tip)} isFav={isSimpleFav("tips",x=>x.tip===finTip.tip)}><div style={{fontSize:16,lineHeight:1.5,opacity:.8}}>{finTip.tip}</div></Card>
        <Card icon="🎤" title="TED Talk" color="rgba(240,147,251)" link={ted.url} onFav={()=>toggleTedFav(ted)} isFav={isTedFav(ted)}><div style={{fontSize:16,fontWeight:700,lineHeight:1.3}}>{ted.title}</div><div style={{fontSize:14,opacity:.5,marginTop:2}}>{ted.speaker} • {ted.cat}</div></Card>
        <Card icon="📚" title="Book Pick" color="rgba(251,191,36)" link={`https://openlibrary.org/search?q=${encodeURIComponent(book.title+" "+book.author)}`} onFav={()=>toggleBookFav(book)} isFav={isBookFav(book)}><div style={{fontSize:16,fontWeight:700}}>{book.title}</div><div style={{fontSize:14,opacity:.5}}>{book.author} • {book.cat}</div><div style={{fontSize:14,opacity:.4,fontStyle:"italic",marginTop:2}}>"{book.why}"</div></Card>
        <Card icon={course.icon} title="Free Course" color="rgba(34,211,238)" link={course.url} onFav={()=>toggleCourseFav(course)} isFav={isCourseFav(course)}><div style={{fontSize:16,fontWeight:700}}>{course.name}</div><div style={{fontSize:14,opacity:.5}}>{course.source} • {course.cat}</div></Card>
      </div>}
      {learnTab==="news"&&<div style={{flex:1,overflowY:"auto",padding:"0 14px 14px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{fontSize:14,opacity:.4}}>Tap any site to visit</div>
          <button onClick={()=>setShowAddNews(!showAddNews)} style={{background:showAddNews?"rgba(102,126,234,.15)":"rgba(255,255,255,.06)",border:showAddNews?"1px solid rgba(102,126,234,.3)":"1px solid rgba(255,255,255,.08)",borderRadius:8,padding:"4px 10px",fontSize:12,color:showAddNews?"#a8b4f0":"#888",cursor:"pointer",fontWeight:700}}>{showAddNews?"Cancel":"+ Add Site"}</button>
        </div>
        {showAddNews&&<div style={{background:"rgba(102,126,234,.06)",border:"1px solid rgba(102,126,234,.15)",borderRadius:12,padding:"10px 12px",marginBottom:10}}>
          <input value={newNewsName} onChange={e=>setNewNewsName(e.target.value)} placeholder="Site name (e.g. CNN)" style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid rgba(255,255,255,.08)",background:"rgba(255,255,255,.04)",color:"#e8e0f0",fontSize:14,outline:"none",marginBottom:6}}/>
          <input value={newNewsUrl} onChange={e=>setNewNewsUrl(e.target.value)} placeholder="URL (e.g. cnn.com)" style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid rgba(255,255,255,.08)",background:"rgba(255,255,255,.04)",color:"#e8e0f0",fontSize:14,outline:"none",marginBottom:6}}/>
          <div style={{display:"flex",gap:6,marginBottom:8,alignItems:"center"}}><span style={{fontSize:12,opacity:.4}}>Category:</span>
            <input value={newNewsCat} onChange={e=>setNewNewsCat(e.target.value)} placeholder="e.g. News, Tech, Sports" list="site-cats" style={{flex:1,padding:"8px 10px",borderRadius:8,border:"1px solid rgba(255,255,255,.08)",background:"rgba(255,255,255,.04)",color:"#e8e0f0",fontSize:14,outline:"none"}}/>
            <datalist id="site-cats">{siteCategories.filter(c=>c!=="all").map(c=><option key={c} value={c}/>)}</datalist></div>
          <button onClick={addNewsSource} style={{width:"100%",background:"linear-gradient(135deg,#667eea,#764ba2)",color:"#fff",border:"none",borderRadius:10,padding:"8px",fontSize:14,fontWeight:700,cursor:"pointer"}}>Add Site</button>
        </div>}
        {siteCategories.length>1&&<div style={{display:"flex",gap:3,marginBottom:8,overflowX:"auto"}}>
          {siteCategories.map(cat=>(<button key={cat} onClick={()=>setSitesCatFilter(cat)} style={{padding:"4px 10px",borderRadius:6,border:sitesCatFilter===cat?"1px solid rgba(102,126,234,.4)":"1px solid rgba(255,255,255,.06)",background:sitesCatFilter===cat?"rgba(102,126,234,.12)":"rgba(255,255,255,.02)",color:sitesCatFilter===cat?"#a8b4f0":"#666",fontSize:11,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>{cat==="all"?"All":cat}</button>))}
        </div>}
        {filteredSites.map((s,i)=>{
          const realIdx=newsSources.indexOf(s);
          const isFav=isSimpleFav("news",x=>x.name===s.name);
          return(<div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
            <a href={s.url} target="_blank" rel="noopener noreferrer"
              style={{flex:1,display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:14,
                background:`${s.color}08`,border:`1px solid ${s.color}20`,textDecoration:"none",color:"#fff",cursor:"pointer"}}>
              <span style={{fontSize:22}}>{s.icon}</span>
              <div style={{flex:1}}><div style={{fontSize:15,fontWeight:800}}>{s.name}</div>{s.cat&&<div style={{fontSize:11,opacity:.35,marginTop:1}}>{s.cat}</div>}</div>
              <span style={{fontSize:14,opacity:.3}}>↗</span>
            </a>
            <button onClick={(e)=>{e.stopPropagation();toggleSimpleFav("news",{name:s.name,url:s.url,icon:s.icon},x=>x.name===s.name);}}
              style={{background:"none",border:"none",fontSize:18,cursor:"pointer",padding:"4px",opacity:isFav?1:.3}}>{isFav?"⭐":"☆"}</button>
            <button onClick={(e)=>{e.stopPropagation();deleteNewsSource(realIdx);}}
              style={{background:"none",border:"none",fontSize:14,cursor:"pointer",padding:"4px",color:"#f5576c",opacity:.4}}>✕</button>
          </div>);
        })}
        {filteredSites.length===0&&<div style={{textAlign:"center",opacity:.3,padding:20}}>{newsSources.length===0?"No sites yet. Add one above!":"No sites in this category."}</div>}
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
                {fcFlipped===c.id&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:8,paddingTop:8,borderTop:"1px solid rgba(255,255,255,.06)"}}>
                  <button onClick={()=>{setFcEditId(c.id);setFcEditTerm(c.term);setFcEditDef(c.def);setFcEditCat(c.cat||"");}} style={{padding:"5px 14px",borderRadius:8,background:"rgba(102,126,234,.1)",border:"1px solid rgba(102,126,234,.2)",color:"#a8b4f0",fontSize:12,fontWeight:700,cursor:"pointer"}}>Edit</button>
                  <button onClick={()=>archiveCard(c.id)} style={{padding:"5px 14px",borderRadius:8,background:"rgba(254,202,87,.08)",border:"1px solid rgba(254,202,87,.15)",color:"#feca57",fontSize:12,fontWeight:700,cursor:"pointer"}}>🗃️ Archive</button>
                  <button onClick={()=>deleteCard(c.id)} style={{padding:"5px 14px",borderRadius:8,background:"rgba(245,87,108,.08)",border:"1px solid rgba(245,87,108,.15)",color:"#f5576c",fontSize:12,fontWeight:700,cursor:"pointer"}}>Delete</button>
                </div>}
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
  // Auto-save journal text with debounce
  const journalSaveTimerRef=React.useRef(null);
  useEffect(()=>{
    if(!journalAuth||journalSetup)return;
    clearTimeout(journalSaveTimerRef.current);
    journalSaveTimerRef.current=setTimeout(()=>{
      if(journalText.trim()!==((activeJournal.entries||{})[journalViewDate]||"")){
        updateActiveJournal(j=>{const entries={...(j.entries||{})};if(journalText.trim())entries[journalViewDate]=journalText;else delete entries[journalViewDate];return{entries};});
      }
    },2000);
    return()=>clearTimeout(journalSaveTimerRef.current);
  },[journalText]);
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
  const BACKUP_KEYS=["zodibuddies_v1","zodibuddy_planner_v1","zodibuddy_clean_v1","zodibuddy_workout_v1","zodibuddy_budget_v1","zodibuddy_journal_v1","zodibuddy_notebook_v1","zodibuddy_flashcards_v1","zodibuddy_fc_archive_v1","zodibuddy_learnfavs_v1","zodibuddy_news_v1","zo_best_bubbles","zo_best_breakout","zo_best_breakout_time","zo_best_memory","zo_best_mines","zo_best_lineup","zo_best_nback"];
  // ── Daily auto-backup: keeps last 3 days in localStorage ──
  useEffect(()=>{
    try{
      const autoKey=`zobuddy_autobackup_${today}`;
      if(localStorage.getItem(autoKey))return; // already backed up today
      const backup={_zobuddy_backup:true,_version:14,_date:new Date().toISOString(),_auto:true};
      BACKUP_KEYS.forEach(k=>{try{const v=localStorage.getItem(k);if(v)backup[k]=JSON.parse(v);}catch{try{backup[k]=localStorage.getItem(k);}catch{}}});
      localStorage.setItem(autoKey,JSON.stringify(backup));
      // Prune: keep only last 3 auto-backups
      const allKeys=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k?.startsWith("zobuddy_autobackup_"))allKeys.push(k);}
      allKeys.sort();while(allKeys.length>3){localStorage.removeItem(allKeys.shift());}
    }catch{}
  },[]);
  const exportBackup=()=>{
    const backup={_zobuddy_backup:true,_version:14,_date:new Date().toISOString()};
    BACKUP_KEYS.forEach(k=>{try{const v=localStorage.getItem(k);if(v)backup[k]=JSON.parse(v);}catch{try{backup[k]=localStorage.getItem(k);}catch{}}});
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
      const allKeys=["zodibuddies_v1","zodibuddy_planner_v1","zodibuddy_clean_v1","zodibuddy_workout_v1","zodibuddy_budget_v1","zodibuddy_journal_v1","zodibuddy_notebook_v1","zodibuddy_flashcards_v1","zodibuddy_fc_archive_v1","zodibuddy_learnfavs_v1","zodibuddy_news_v1","zo_best_bubbles","zo_best_breakout","zo_best_breakout_time","zo_best_memory","zo_best_mines","zo_best_lineup","zo_best_nback"];
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
  // Auto-save planner editing as you type
  const plannerSaveTimer=React.useRef(null);
  React.useEffect(()=>{
    if(!editingSlot)return;
    clearTimeout(plannerSaveTimer.current);
    plannerSaveTimer.current=setTimeout(()=>{
      if(editingSlot)setSlotText(editingSlot.date,editingSlot.slot,editingText);
    },2000);
    return()=>clearTimeout(plannerSaveTimer.current);
  },[editingText]);
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
  const[activeTab,setActiveTab]=useState(()=>{try{return localStorage.getItem("zobuddy_last_tab")||"buddy";}catch{return"buddy";}});
  useEffect(()=>{try{localStorage.setItem("zobuddy_last_tab",activeTab);}catch{}},[activeTab]);
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
  const animalData=appState?getAnimalData(appState):{color:"#8b5cf6",accent:"#a78bfa"};
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

  // Settings search state (must be before early returns to satisfy React hooks rules)
  const[searchQuery,setSearchQuery]=useState("");
  const[searchResults,setSearchResults]=useState([]);

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

  // ─── TAB BAR ────────────────────────────────────────────────────
  const tabBorderColor="rgba(102,126,234,.3)";
  const TabBar=(
    <div style={{flexShrink:0,margin:"0 4px"}}>
      <div style={{display:"flex",alignItems:"stretch",background:"#07071a",borderRadius:"14px 14px 0 0",border:`1px solid ${tabBorderColor}`,borderBottom:"none",overflow:"hidden"}}>
        {[{id:"buddy",icon:"🐾",label:"Buddy"},{id:"planner",icon:"📅",label:"Planner"},{id:"budget",icon:"💰",label:"Budget"},{id:"learn",icon:"🎓",label:"Learn"},{id:"notebook",icon:"📓",label:"Notepad"}].map((tab,i)=>{
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
        <div style={{marginBottom:12}}>
          <div style={{fontSize:12,fontWeight:700,opacity:.3,marginBottom:4}}>💾 STORAGE</div>
          {(()=>{const used=getStorageUsage();const max=5*1024*1024;const pct=Math.min(100,Math.round(used/max*100));const mb=(used/1024/1024).toFixed(1);
            return(<div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:3}}>
                <span style={{color:"#e8e0f0",opacity:.6}}>{mb} MB / 5 MB</span>
                <span style={{color:pct>80?"#f5576c":pct>60?"#feca57":"#43e97b",fontWeight:700}}>{pct}%</span>
              </div>
              <div style={{height:6,borderRadius:3,background:"rgba(255,255,255,.06)",overflow:"hidden"}}>
                <div style={{height:"100%",borderRadius:3,width:`${pct}%`,background:pct>80?"#f5576c":pct>60?"#feca57":"#43e97b",transition:"width .3s"}}/>
              </div>
              {pct>80&&<div style={{fontSize:10,color:"#f5576c",marginTop:4}}>Storage nearly full — delete unused pixel art pages to free space</div>}
            </div>);})()}
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
              const keys=["zodibuddies_v1","zodibuddy_planner_v1","zodibuddy_clean_v1","zodibuddy_workout_v1","zodibuddy_budget_v1","zodibuddy_journal_v1","zodibuddy_notebook_v1","zodibuddy_flashcards_v1","zodibuddy_fc_archive_v1","zodibuddy_learnfavs_v1","zodibuddy_news_v1","zo_best_bubbles","zo_best_breakout","zo_best_breakout_time","zo_best_memory","zo_best_mines","zo_best_lineup","zo_best_nback"];
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
                  const allKeys=["zodibuddies_v1","zodibuddy_planner_v1","zodibuddy_clean_v1","zodibuddy_workout_v1","zodibuddy_budget_v1","zodibuddy_journal_v1","zodibuddy_notebook_v1","zodibuddy_flashcards_v1","zodibuddy_fc_archive_v1","zodibuddy_learnfavs_v1","zodibuddy_news_v1","zo_best_bubbles","zo_best_breakout","zo_best_breakout_time","zo_best_memory","zo_best_mines","zo_best_lineup","zo_best_nback"];
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
      <div style={{padding:"8px 16px 0"}}>
        {/* ── Buddy Card (styled like stats card) ── */}
        <div style={{borderRadius:16,padding:2,background:allDoneToday?`linear-gradient(135deg,${animalData.color},${animalData.accent},#feca57,${animalData.color})`:"rgba(255,255,255,.08)",backgroundSize:"300% 300%",animation:allDoneToday?"holoShift 4s ease infinite":"none",boxShadow:allDoneToday?(streak>=30?"0 0 30px rgba(103,232,249,.6)":streak>=21?"0 0 25px rgba(251,191,36,.5)":streak>=14?"0 0 20px rgba(192,132,252,.4)":streak>=7?"0 0 15px rgba(96,165,250,.3)":"0 8px 32px rgba(0,0,0,.5)"):"0 8px 32px rgba(0,0,0,.5)"}}>
          <div style={{borderRadius:14,background:"linear-gradient(160deg,#0d0d2b 0%,#1a1040 30%,#0f1a3a 60%,#0d0d2b 100%)",padding:"12px 14px",position:"relative",overflow:"hidden"}}>
            {allDoneToday&&<div style={{position:"absolute",inset:0,borderRadius:14,background:"linear-gradient(105deg,transparent 30%,rgba(255,255,255,.03) 45%,rgba(255,255,255,.08) 50%,rgba(255,255,255,.03) 55%,transparent 70%)",backgroundSize:"200% 200%",animation:"holoShimmer 3s ease-in-out infinite",pointerEvents:"none",zIndex:1}}/>}
            <div style={{position:"relative",zIndex:2}}>
              {/* Name + Level row */}
              <div onClick={()=>{clearTimeout(devTimer.t);setDevTaps(p=>{const n=p+1;if(n>=5){setDevStreak(prev=>prev!==null?null:0);return 0;}devTimer.t=setTimeout(()=>setDevTaps(0),1500);return n;});}} style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",cursor:"default"}}>
                <div style={{fontSize:16,fontWeight:900,background:"linear-gradient(135deg,#f093fb,#f5576c,#feca57)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",lineHeight:1.2}}>{appState?.buddyName||"Zobuddy"}</div>
                <div style={{fontSize:12,opacity:.35}}>Day {days} • Lv.{level.level} {level.name}</div>
              </div>
              {devStreak!==null&&<div style={{margin:"4px auto",maxWidth:220}}>
                <div style={{fontSize:11,opacity:.4,textAlign:"center",marginBottom:2}}>🔧 Dev: Streak preview ({devStreak}d)</div>
                <input type="range" min="0" max="35" value={devStreak} onChange={e=>setDevStreak(Number(e.target.value))} style={{width:"100%",height:4,appearance:"auto",opacity:.6}}/>
              </div>}

              {/* Buddy display */}
              <div style={{margin:"8px -4px 6px",borderRadius:12,background:`linear-gradient(180deg,${animalData.color}12 0%,${animalData.accent}08 50%,transparent 100%)`,border:`1px solid ${animalData.accent}18`,padding:"4px 0",display:"flex",alignItems:"center",justifyContent:"center",minHeight:140}}>
                <div style={{position:"relative"}}>
                  {negCount>0&&!allDoneToday&&<div style={{textAlign:"center",position:"absolute",top:-2,left:"50%",transform:"translateX(-50%)",zIndex:3,whiteSpace:"nowrap"}}><span style={{fontSize:11,color:"#f5576c",opacity:.7}}>⚠️ {negCount} effect{negCount>1?"s":""} active</span></div>}
                  <BuddyDisplay animal={appState?.animal} state={{...(appState||{}),_roaming:isRoaming&&!fullBack,auraStreak:streak}} size={130}/>
                </div>
              </div>

              {/* All Goals Completed */}
              {allDoneToday&&<div style={{textAlign:"center",marginBottom:6}}>
                <span style={{background:"rgba(67,233,123,.15)",border:"1px solid rgba(67,233,123,.3)",borderRadius:20,padding:"4px 14px",fontSize:14,fontWeight:800,color:"#43e97b",boxShadow:"0 0 12px rgba(67,233,123,.3)"}}>✅ All Goals Completed</span>
              </div>}

              {/* HP bar */}
              <div style={{marginBottom:8}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:2}}>
                  <span style={{fontWeight:800,opacity:.4}}>{mood} HP</span>
                  <span style={{fontWeight:800,color:hp>=80?"#43e97b":hp>=50?"#feca57":"#f5576c"}}>{hp}%</span>
                </div>
                <HealthBar percent={hp} small/>
              </div>

              {/* Stats grid */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:4,marginBottom:6}}>
                {[{l:"POWER",v:duelStats.power,c:"#feca57"},{l:"STREAK",v:`${streak}d`,c:streak>=3?"#f5576c":"#555"},{l:"TODAY",v:`${doneToday.length}/${totalHabits}`,c:"#60a5fa"}].map(s=>(
                  <div key={s.l} style={{background:"rgba(255,255,255,.04)",borderRadius:8,padding:"5px 2px",textAlign:"center",border:"1px solid rgba(255,255,255,.06)"}}>
                    <div style={{fontSize:14,fontWeight:900,color:s.c}}>{s.v}</div>
                    <div style={{fontSize:9,fontWeight:700,opacity:.3,letterSpacing:1,marginTop:1}}>{s.l}</div>
                  </div>))}
              </div>
              {duelCode&&<div style={{background:"rgba(255,255,255,.04)",borderRadius:8,padding:"4px 8px",textAlign:"center",border:"1px solid rgba(255,255,255,.06)",marginBottom:6}}>
                <span style={{fontSize:9,fontWeight:700,opacity:.3,letterSpacing:1}}>CODE </span>
                <span style={{fontSize:13,fontWeight:900,color:"#feca57",letterSpacing:2,fontFamily:"monospace"}}>{duelCode}</span>
              </div>}

              {/* Level progress */}
              {nextLv&&<div>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:11,opacity:.3,marginBottom:2}}><span>Next: {nextLv.name}</span><span>{streak}/{nextLv.auraDays}d</span></div>
                <div style={{height:3,borderRadius:2,background:"rgba(255,255,255,.05)",overflow:"hidden"}}><div style={{height:"100%",borderRadius:2,background:"linear-gradient(90deg,#667eea,#f093fb)",width:`${Math.min(100,(streak/nextLv.auraDays)*100)}%`,transition:"width .5s"}}/></div>
              </div>}
            </div>
          </div>
        </div>
      </div>

      {/* Goals */}
      <div style={{padding:"8px 16px 0"}}>
        <div style={{background:"rgba(255,255,255,.03)",borderRadius:12,border:"1px solid rgba(255,255,255,.06)",padding:"8px 10px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
            <span style={{fontSize:12,fontWeight:700,opacity:.3,letterSpacing:1}}>GOALS</span>
            {canEditHabits?<button onClick={()=>openEditGoals()} style={{background:"rgba(102,126,234,.12)",border:"1px solid rgba(102,126,234,.25)",borderRadius:6,padding:"2px 8px",fontSize:12,color:"#a8b4f0",cursor:"pointer",fontWeight:700}}>✏️ Edit</button>
            :<span style={{fontSize:11,opacity:.2}}>🔒 Locked</span>}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>{visibleHabits.map(hId=><HabitChip key={hId} hId={hId}/>)}</div>
          {overflowHabits.length>0&&<>
            <button onClick={()=>setShowMore(!showMore)} style={{...S.btnS,width:"100%",marginTop:4,textAlign:"center",fontSize:13,padding:"5px 0"}}>
              {showMore?"▲ Hide":`▼ +${overflowHabits.length} more (${overflowHabits.filter(h=>doneToday.includes(h)).length}/${overflowHabits.length} done)`}
            </button>
            {showMore&&<div style={{maxHeight:120,overflowY:"auto",display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,marginTop:4,padding:2}}>{overflowHabits.map(hId=><HabitChip key={hId} hId={hId}/>)}</div>}
          </>}
        </div>
      </div>

      {/* Daily Quest */}
      {dailyQuestInfo&&<div style={{margin:"6px 16px 0",padding:"8px 12px",borderRadius:10,background:"linear-gradient(135deg,rgba(254,202,87,.06),rgba(255,165,0,.03))",border:"1px solid rgba(254,202,87,.12)"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:15}}>{dailyQuestInfo.icon}</span>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:800,color:"#feca57"}}>⭐ Daily Quest</div>
            <div style={{fontSize:12,opacity:.5}}>{dailyQuestInfo.name}</div>
            {dailyQuestId&&<div style={{fontSize:12,color:"#43e97b",marginTop:1}}>✅ In your goals — 3x HP!</div>}
          </div>
          {dailyQuestDone&&<span style={{fontSize:14,color:"#43e97b",fontWeight:800}}>✅</span>}
          {questNotInGoals&&canEditHabits&&<button onClick={addDailyQuest} style={{background:"linear-gradient(135deg,#43e97b,#38f9d7)",color:"#1a1a2e",border:"none",borderRadius:8,padding:"6px 12px",fontSize:13,fontWeight:800,cursor:"pointer",whiteSpace:"nowrap"}}>+ Add</button>}
        </div>
      </div>}

      {/* Action buttons */}
      <div style={{display:"flex",gap:6,padding:"10px 16px 14px"}}>
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

class ErrorBoundary extends React.Component {
  constructor(props){super(props);this.state={hasError:false,error:null};}
  static getDerivedStateFromError(error){return{hasError:true,error};}
  componentDidCatch(error,info){console.error("Zobuddy Error:",error,info);}
  render(){
    if(this.state.hasError){
      return React.createElement("div",{style:{padding:20,color:"#fff",background:"#0a0a1a",minHeight:"100vh",fontFamily:"monospace"}},
        React.createElement("h2",{style:{color:"#f5576c"}},"Something went wrong"),
        React.createElement("pre",{style:{fontSize:12,whiteSpace:"pre-wrap",color:"#feca57",marginTop:10}},String(this.state.error)),
        React.createElement("button",{onClick:()=>{this.setState({hasError:false,error:null});},style:{marginTop:16,padding:"10px 20px",background:"#667eea",color:"#fff",border:"none",borderRadius:10,fontSize:16}},"Try Again"),
        React.createElement("button",{onClick:()=>{localStorage.removeItem("zodibuddies_v1");window.location.reload();},style:{marginTop:8,marginLeft:8,padding:"10px 20px",background:"#f5576c",color:"#fff",border:"none",borderRadius:10,fontSize:16}},"Reset App")
      );
    }
    return this.props.children;
  }
}

root.render(React.createElement(ErrorBoundary,null,React.createElement(SpiritAnimals)));
