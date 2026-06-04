import { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc, orderBy, query
} from "firebase/firestore";

const SCHEDULE = [
  {
    day: "01 Day", date: "2026-06-12", weekday: "금",
    hotel: "햄튼바이힐튼호텔 (2인1실)",
    events: [
      { time: "10:30", desc: "인천 국제공항 출발", type: "transport" },
      { time: "10:50", desc: "위해 국제공항 도착", type: "transport" },
      { time: "", desc: "미팅보드 확인 후 기사 미팅", type: "info" },
      { time: "", desc: "미팅보드: 웨이하이 힐튼3색", type: "highlight" },
      { time: "", desc: "골프장 이동 (송영차량)", type: "transport" },
      { time: "T-13:10", desc: "스톤베이C.C 18홀 라운딩 — 일몰까지", type: "golf" },
      { time: "", desc: "라운드 종료 후 호텔 이동", type: "transport" },
      { time: "", desc: "호텔 체크인, 석식 및 휴식", type: "rest" },
    ],
    meals: { 조: false, 중: false, 석: true },
    flight: { out: "7C8501 / 제주항공", in: null },
  },
  {
    day: "02 Day", date: "2026-06-13", weekday: "토",
    hotel: "햄튼바이힐튼호텔 (2인1실)",
    events: [
      { time: "", desc: "호텔 조식 후 골프장으로 이동 (송영차량)", type: "transport" },
      { time: "T-08:00", desc: "천익C.C 27홀 라운딩", type: "golf" },
      { time: "", desc: "라운드 종료 후 호텔로 이동", type: "transport" },
      { time: "", desc: "석식 후 투숙 및 휴식", type: "rest" },
    ],
    meals: { 조: true, 중: false, 석: true },
    flight: null,
  },
  {
    day: "03 Day", date: "2026-06-14", weekday: "일",
    hotel: null,
    events: [
      { time: "", desc: "호텔 조식 후 체크아웃", type: "rest" },
      { time: "", desc: "골프장 이동 (송영차량)", type: "transport" },
      { time: "T-08:00", desc: "호당가C.C 18홀 라운딩", type: "golf" },
      { time: "", desc: "라운드 종료 후 공항으로 이동", type: "transport" },
      { time: "", desc: "공항도착 후 개별수속", type: "info" },
      { time: "16:45~18:55", desc: "위해 국제공항 출발 → 인천 국제공항 도착 후 해산", type: "transport" },
    ],
    meals: { 조: true, 중: false, 석: false },
    flight: { out: null, in: "7C8504 / 제주항공" },
  },
];

const DATES = SCHEDULE.map(s => s.date);
const CATEGORIES = ["항공", "호텔", "골프장", "식사", "교통", "쇼핑", "기타"];
const NICK_COLORS = ["#4ade80","#60a5fa","#f9a8d4","#fbbf24","#a78bfa","#fb923c"];
const nickColor = (name) => name ? NICK_COLORS[Math.abs([...name].reduce((a,c)=>a+c.charCodeAt(0),0)) % NICK_COLORS.length] : "#94a3b8";

const fmtCNY = (n) => isNaN(Number(n)) ? "0" : Number(n).toLocaleString("zh-CN", { minimumFractionDigits: 0, maximumFractionDigits: 1 });
const fmtKRW = (n) => Math.round(Number(n)).toLocaleString("ko-KR");
const parseNum = (s) => Number(String(s).replace(/,/g, "")) || 0;

function calcDayStats(transactions) {
  const raw = {};
  DATES.forEach(d => { raw[d] = { income: 0, expense: 0 }; });
  transactions.forEach(t => {
    if (!raw[t.date]) return;
    if (t.type === "수입") raw[t.date].income += parseNum(t.amount);
    else raw[t.date].expense += parseNum(t.amount);
  });
  const result = [];
  let carryover = 0;
  DATES.forEach(date => {
    const { income, expense } = raw[date];
    const balance = carryover + income - expense;
    result.push({ date, income, expense, carryover, balance });
    carryover = balance;
  });
  return result;
}

function NicknameScreen({ onSet }) {
  const [val, setVal] = useState("");
  return (
    <div style={{ minHeight:"100vh", background:"#0a1628", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24, fontFamily:"'Noto Sans KR',sans-serif" }}>
      <div style={{ fontSize:56, marginBottom:16 }}>⛳</div>
      <div style={{ fontSize:24, fontWeight:800, color:"#4ade80", marginBottom:4 }}>웨이하이 골프</div>
      <div style={{ fontSize:13, color:"#64748b", marginBottom:32 }}>공유 경비 장부 · 실시간 동기화</div>
      <div style={{ width:"100%", maxWidth:340 }}>
        <div style={{ fontSize:13, color:"#94a3b8", marginBottom:8 }}>내 이름 입력</div>
        <input value={val} onChange={e=>setVal(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&val.trim()&&onSet(val.trim())}
          placeholder="예: 태식, 김과장, 민준" maxLength={10} autoFocus
          style={{ width:"100%", background:"#1e3a5f", border:"1px solid #334155", borderRadius:12, padding:"14px 16px", color:"#e2e8f0", fontSize:16, marginBottom:12, boxSizing:"border-box" }} />
        <button onClick={()=>val.trim()&&onSet(val.trim())}
          style={{ width:"100%", padding:"14px", borderRadius:12, border:"none", background:val.trim()?"linear-gradient(135deg,#4ade80,#22c55e)":"#1e3a5f", color:val.trim()?"#0a1628":"#475569", fontWeight:800, fontSize:16, cursor:val.trim()?"pointer":"default" }}>
          시작하기 →
        </button>
        <div style={{ fontSize:11, color:"#334155", textAlign:"center", marginTop:16 }}>
          🔒 같은 링크 접속자끼리 실시간 공유됩니다
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [nickname, setNickname] = useState(() => localStorage.getItem("wg_nick") || "");
  const [tab, setTab] = useState("schedule");
  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState({ date:"2026-06-12", type:"지출", category:"골프장", desc:"", amount:"", memo:"" });
  const [editId, setEditId] = useState(null);
  const [filterDay, setFilterDay] = useState("전체");
  const [activeDay, setActiveDay] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [connected, setConnected] = useState(false);

  const [rate, setRate] = useState(null);
  const [rateTime, setRateTime] = useState(null);
  const [manualRate, setManualRate] = useState("");
  const [editingRate, setEditingRate] = useState(false);
  const effectiveRate = manualRate ? parseFloat(manualRate) : (rate || 190);

  const handleSetNickname = (name) => {
    localStorage.setItem("wg_nick", name);
    setNickname(name);
  };

  // 환율
  useEffect(() => {
    fetch("https://open.er-api.com/v6/latest/CNY")
      .then(r=>r.json())
      .then(data => {
        if (data?.rates?.KRW) {
          setRate(data.rates.KRW);
          setRateTime(new Date().toLocaleTimeString("ko-KR",{hour:"2-digit",minute:"2-digit"}));
        }
      }).catch(()=>{});
  }, []);

  // Firestore 실시간 구독
  useEffect(() => {
    const q = query(collection(db, "transactions"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTransactions(data);
      setConnected(true);
    }, () => setConnected(false));
    return () => unsub();
  }, []);

  const dayStats = calcDayStats(transactions);
  const totalIncome  = transactions.filter(t=>t.type==="수입").reduce((s,t)=>s+parseNum(t.amount),0);
  const totalExpense = transactions.filter(t=>t.type==="지출").reduce((s,t)=>s+parseNum(t.amount),0);
  const totalBalance = totalIncome - totalExpense;

  const save = async () => {
    if (!form.desc || !form.amount) return;
    setSaving(true);
    try {
      if (editId) {
        await updateDoc(doc(db,"transactions",editId), { ...form, author:nickname, updatedAt:Date.now() });
        setEditId(null);
        setSaveMsg("✅ 수정 완료!");
      } else {
        await addDoc(collection(db,"transactions"), { ...form, author:nickname, createdAt:Date.now() });
        setSaveMsg("✅ 저장 완료!");
      }
      setForm({ date:"2026-06-12", type:"지출", category:"골프장", desc:"", amount:"", memo:"" });
    } catch(e) {
      setSaveMsg("❌ 저장 실패");
    } finally {
      setSaving(false);
      setTimeout(()=>setSaveMsg(""),3000);
    }
  };

  const del = async (id) => {
    if (!window.confirm("삭제할까요?")) return;
    await deleteDoc(doc(db,"transactions",id));
  };

  const startEdit = (t) => {
    setForm({ date:t.date, type:t.type, category:t.category, desc:t.desc, amount:t.amount, memo:t.memo||"" });
    setEditId(t.id);
    setTab("expense");
    window.scrollTo({top:0,behavior:"smooth"});
  };

  const filtered = filterDay==="전체" ? transactions : transactions.filter(t=>t.date===filterDay);
  const filteredStats = filterDay==="전체"
    ? { income:totalIncome, expense:totalExpense, carryover:0, balance:totalBalance }
    : dayStats.find(d=>d.date===filterDay) || { income:0, expense:0, carryover:0, balance:0 };

  const typeColors = { golf:"#4ade80", transport:"#60a5fa", rest:"#f9a8d4", info:"#fbbf24", highlight:"#facc15" };
  const typeIcon   = { golf:"⛳", transport:"🚌", rest:"🏨", info:"ℹ️", highlight:"📋" };

  if (!nickname) return <NicknameScreen onSet={handleSetNickname} />;

  return (
    <div style={{ minHeight:"100vh", background:"#0a1628", fontFamily:"'Noto Sans KR',sans-serif", color:"#e2e8f0" }}>

      {/* HEADER */}
      <div style={{ background:"linear-gradient(135deg,#0f2d1a 0%,#1a3a4a 50%,#0d1f35 100%)", padding:"20px 20px 14px", borderBottom:"1px solid #1e3a5f" }}>
        <div style={{ maxWidth:480, margin:"0 auto" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
            <span style={{ fontSize:26 }}>⛳</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:20, fontWeight:800, color:"#4ade80" }}>웨이하이 골프</div>
              <div style={{ fontSize:12, color:"#94a3b8" }}>2026.06.12–06.14 · 3일 2박</div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
              <div style={{ display:"flex", alignItems:"center", gap:5, background:"rgba(255,255,255,0.07)", borderRadius:20, padding:"4px 10px" }}>
                <span style={{ width:8, height:8, borderRadius:"50%", background:nickColor(nickname), display:"inline-block" }}/>
                <span style={{ fontSize:12, fontWeight:700, color:nickColor(nickname) }}>{nickname}</span>
                <button onClick={()=>{localStorage.removeItem("wg_nick");setNickname("");}}
                  style={{ background:"none", border:"none", color:"#475569", fontSize:10, cursor:"pointer", padding:0, marginLeft:2 }}>✕</button>
              </div>
              <div style={{ fontSize:10, color:connected?"#4ade80":"#f97316" }}>
                {connected ? "🟢 실시간 연결됨" : "🔴 연결 중..."}
              </div>
            </div>
          </div>

          {/* 환율 박스 */}
          <div style={{ background:"rgba(0,0,0,0.3)", border:"1px solid #1e4a3a", borderRadius:14, padding:"12px 14px", marginBottom:12 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:16 }}>🇨🇳</span>
                <div>
                  <div style={{ fontSize:10, color:"#64748b" }}>위안화 환율 (CNY→KRW)</div>
                  <div style={{ display:"flex", alignItems:"baseline", gap:4 }}>
                    <span style={{ fontSize:18, fontWeight:800, color:"#fbbf24" }}>¥1 = ₩{effectiveRate.toFixed(1)}</span>
                    {rateTime&&!manualRate&&<span style={{ fontSize:10, color:"#475569" }}>{rateTime} 기준</span>}
                    {manualRate&&<span style={{ fontSize:10, color:"#f97316" }}>수동</span>}
                  </div>
                </div>
              </div>
              <button onClick={()=>setEditingRate(!editingRate)}
                style={{ padding:"5px 10px", borderRadius:8, border:"1px solid #334155", background:"none", color:"#64748b", fontSize:11, cursor:"pointer" }}>
                {editingRate?"닫기":"직접입력"}
              </button>
            </div>
            {editingRate&&(
              <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                <input value={manualRate} onChange={e=>setManualRate(e.target.value.replace(/[^0-9.]/g,""))}
                  placeholder={`자동: ${rate?rate.toFixed(1):"190"}`} inputMode="decimal"
                  style={{ flex:1, background:"#1e3a5f", border:"1px solid #334155", borderRadius:8, padding:"8px 10px", color:"#fbbf24", fontSize:14, fontWeight:700 }}/>
                {manualRate&&<button onClick={()=>setManualRate("")}
                  style={{ padding:"8px 12px", borderRadius:8, border:"1px solid #334155", background:"none", color:"#94a3b8", fontSize:12, cursor:"pointer" }}>초기화</button>}
              </div>
            )}
            <div style={{ borderTop:"1px solid #1e3a5f", paddingTop:8, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontSize:10, color:"#64748b" }}>현재 잔액 (위안)</div>
                <div style={{ fontSize:17, fontWeight:800, color:totalBalance>=0?"#4ade80":"#fca5a5" }}>
                  ¥{fmtCNY(Math.abs(totalBalance))}{totalBalance<0?" 초과":""}
                </div>
              </div>
              <div style={{ fontSize:18, color:"#334155" }}>→</div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:10, color:"#64748b" }}>원화 환산</div>
                <div style={{ fontSize:17, fontWeight:800, color:totalBalance>=0?"#60a5fa":"#fca5a5" }}>
                  ₩{fmtKRW(Math.abs(totalBalance)*effectiveRate)}{totalBalance<0?" 초과":""}
                </div>
              </div>
            </div>
          </div>

          {/* Day strip */}
          <div style={{ display:"flex", gap:8 }}>
            {SCHEDULE.map((s,i)=>{
              const ds=dayStats[i];
              return (
                <div key={i} style={{ flex:1, background:"rgba(255,255,255,0.06)", borderRadius:10, padding:"8px 6px", textAlign:"center", border:activeDay===i?"1px solid #4ade80":"1px solid transparent", cursor:"pointer" }}
                  onClick={()=>{setActiveDay(i);setTab("schedule");}}>
                  <div style={{ fontSize:10, color:"#94a3b8" }}>{s.date.slice(5)}</div>
                  <div style={{ fontSize:13, fontWeight:700, color:"#e2e8f0" }}>Day {i+1}</div>
                  <div style={{ fontSize:10, color:ds.balance>=0?"#4ade80":"#fca5a5", marginTop:2 }}>¥{fmtCNY(ds.balance)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* TAB BAR */}
      <div style={{ display:"flex", background:"#0d1f35", borderBottom:"1px solid #1e3a5f", maxWidth:480, margin:"0 auto" }}>
        {[["schedule","📅 일정"],["expense","💰 경비입력"],["ledger","📊 내역"]].map(([k,label])=>(
          <button key={k} onClick={()=>setTab(k)}
            style={{ flex:1, padding:"13px 4px", background:"none", border:"none", borderBottom:tab===k?"2px solid #4ade80":"2px solid transparent", color:tab===k?"#4ade80":"#64748b", fontSize:13, fontWeight:tab===k?700:400, cursor:"pointer" }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth:480, margin:"0 auto", padding:"16px 16px 80px" }}>

        {/* SCHEDULE */}
        {tab==="schedule"&&(
          <div>
            <div style={{ display:"flex", gap:8, marginBottom:16 }}>
              {SCHEDULE.map((s,i)=>(
                <button key={i} onClick={()=>setActiveDay(i)}
                  style={{ flex:1, padding:"10px 4px", borderRadius:10, border:"none", background:activeDay===i?"#4ade80":"#1e3a5f", color:activeDay===i?"#0a1628":"#94a3b8", fontWeight:700, fontSize:13, cursor:"pointer" }}>
                  {s.day}<br/><span style={{ fontSize:11, fontWeight:400 }}>({s.weekday})</span>
                </button>
              ))}
            </div>
            {(()=>{
              const d=SCHEDULE[activeDay]; const ds=dayStats[activeDay];
              return (
                <div>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                    <div style={{ fontSize:15, fontWeight:700, color:"#4ade80" }}>{d.date} ({d.weekday})</div>
                    <div style={{ display:"flex", gap:6 }}>
                      {["조","중","석"].map(m=>(
                        <span key={m} style={{ padding:"3px 8px", borderRadius:20, fontSize:11, background:d.meals[m]?"#14532d":"#1e293b", color:d.meals[m]?"#4ade80":"#475569", border:`1px solid ${d.meals[m]?"#4ade80":"#334155"}` }}>
                          {m}식 {d.meals[m]?"✓":"✗"}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ background:"#0d1f35", border:"1px solid #1e3a5f", borderRadius:12, padding:"12px 14px", marginBottom:14, display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                    {[["수입",ds.income,"#4ade80"],["지출",ds.expense,"#fca5a5"],[activeDay===0?"잔액":"이월잔액",ds.balance,ds.balance>=0?"#60a5fa":"#fca5a5"]].map(([label,val,color])=>(
                      <div key={label} style={{ textAlign:"center" }}>
                        <div style={{ fontSize:10, color, marginBottom:3 }}>{label}</div>
                        <div style={{ fontSize:13, fontWeight:700, color }}>¥{fmtCNY(val)}</div>
                      </div>
                    ))}
                    {activeDay>0&&ds.carryover!==0&&(
                      <div style={{ gridColumn:"1/-1", textAlign:"center", fontSize:11, color:"#475569", borderTop:"1px solid #1e3a5f", paddingTop:8 }}>전일 이월 ¥{fmtCNY(ds.carryover)}</div>
                    )}
                  </div>
                  {d.flight&&(
                    <div style={{ background:"#0f2d1a", border:"1px solid #166534", borderRadius:10, padding:"10px 14px", marginBottom:12, fontSize:13 }}>
                      {d.flight.out&&<div>✈️ 출국 <span style={{ color:"#4ade80", fontWeight:700 }}>{d.flight.out}</span></div>}
                      {d.flight.in&&<div>🛬 귀국 <span style={{ color:"#60a5fa", fontWeight:700 }}>{d.flight.in}</span></div>}
                    </div>
                  )}
                  <div style={{ position:"relative", paddingLeft:20 }}>
                    <div style={{ position:"absolute", left:7, top:0, bottom:0, width:2, background:"linear-gradient(to bottom,#4ade80,#1e3a5f)" }}/>
                    {d.events.map((ev,i)=>(
                      <div key={i} style={{ position:"relative", marginBottom:10 }}>
                        <div style={{ position:"absolute", left:-17, top:4, width:10, height:10, borderRadius:"50%", background:typeColors[ev.type]||"#4ade80", border:"2px solid #0a1628" }}/>
                        <div style={{ background:"#0d1f35", borderRadius:10, padding:"10px 14px", border:`1px solid ${ev.type==="golf"?"#166534":ev.type==="highlight"?"#78350f":"#1e3a5f"}` }}>
                          <span>{typeIcon[ev.type]||"•"}</span>
                          <span style={{ marginLeft:8 }}>
                            {ev.time&&<span style={{ fontSize:11, color:ev.time.startsWith("T")?"#f97316":"#60a5fa", fontWeight:700, marginRight:8 }}>{ev.time}</span>}
                            <span style={{ fontSize:13, color:ev.type==="golf"?"#4ade80":ev.type==="highlight"?"#facc15":"#e2e8f0", fontWeight:ev.type==="golf"?700:400 }}>{ev.desc}</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {d.hotel&&<div style={{ background:"#1a1a2e", border:"1px solid #4a3f7a", borderRadius:10, padding:"10px 14px", marginTop:8, fontSize:13, color:"#a78bfa" }}>🏨 {d.hotel}</div>}
                </div>
              );
            })()}
          </div>
        )}

        {/* EXPENSE */}
        {tab==="expense"&&(
          <div>
            {saveMsg&&<div style={{ background:saveMsg.startsWith("✅")?"#14532d":"#7f1d1d", borderRadius:10, padding:"12px 16px", marginBottom:12, fontSize:14, fontWeight:700, color:saveMsg.startsWith("✅")?"#4ade80":"#fca5a5", textAlign:"center" }}>{saveMsg}</div>}
            <div style={{ background:"#0d1f35", borderRadius:14, padding:18, border:"1px solid #1e3a5f" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                <div style={{ fontSize:15, fontWeight:700, color:"#4ade80" }}>{editId?"✏️ 수정":"➕ 경비 입력"}</div>
                <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                  <span style={{ width:8, height:8, borderRadius:"50%", background:nickColor(nickname), display:"inline-block" }}/>
                  <span style={{ fontSize:12, color:nickColor(nickname), fontWeight:700 }}>{nickname}</span>
                </div>
              </div>

              <label style={{ fontSize:12, color:"#64748b", display:"block", marginBottom:4 }}>날짜</label>
              <select value={form.date} onChange={e=>setForm({...form,date:e.target.value})}
                style={{ width:"100%", background:"#1e3a5f", border:"1px solid #334155", borderRadius:8, padding:"10px 12px", color:"#e2e8f0", fontSize:14, marginBottom:12 }}>
                {SCHEDULE.map(s=><option key={s.date} value={s.date}>{s.date} ({s.weekday}) — {s.day}</option>)}
              </select>

              <label style={{ fontSize:12, color:"#64748b", display:"block", marginBottom:6 }}>구분</label>
              <div style={{ display:"flex", gap:8, marginBottom:12 }}>
                {["지출","수입"].map(t=>(
                  <button key={t} onClick={()=>setForm({...form,type:t})}
                    style={{ flex:1, padding:"10px", borderRadius:8, border:"none", background:form.type===t?(t==="지출"?"#7f1d1d":"#14532d"):"#1e3a5f", color:form.type===t?(t==="지출"?"#fca5a5":"#4ade80"):"#64748b", fontWeight:700, cursor:"pointer", fontSize:14 }}>
                    {t==="지출"?"💸 지출":"💵 수입"}
                  </button>
                ))}
              </div>

              <label style={{ fontSize:12, color:"#64748b", display:"block", marginBottom:6 }}>카테고리</label>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:12 }}>
                {CATEGORIES.map(c=>(
                  <button key={c} onClick={()=>setForm({...form,category:c})}
                    style={{ padding:"6px 12px", borderRadius:20, border:"none", background:form.category===c?"#4ade80":"#1e3a5f", color:form.category===c?"#0a1628":"#94a3b8", fontWeight:form.category===c?700:400, fontSize:12, cursor:"pointer" }}>
                    {c}
                  </button>
                ))}
              </div>

              <label style={{ fontSize:12, color:"#64748b", display:"block", marginBottom:4 }}>내용</label>
              <input value={form.desc} onChange={e=>setForm({...form,desc:e.target.value})}
                placeholder="예: 스톤베이C.C 그린피"
                style={{ width:"100%", background:"#1e3a5f", border:"1px solid #334155", borderRadius:8, padding:"10px 12px", color:"#e2e8f0", fontSize:14, marginBottom:12, boxSizing:"border-box" }}/>

              <label style={{ fontSize:12, color:"#64748b", display:"block", marginBottom:4 }}>금액 (위안 ¥)</label>
              <div style={{ position:"relative", marginBottom:4 }}>
                <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:18, color:"#fbbf24", fontWeight:700 }}>¥</span>
                <input value={form.amount} onChange={e=>setForm({...form,amount:e.target.value.replace(/[^0-9.]/g,"")})}
                  placeholder="0" inputMode="decimal"
                  style={{ width:"100%", background:"#1e3a5f", border:"1px solid #fbbf24", borderRadius:8, padding:"10px 12px 10px 30px", color:"#fbbf24", fontSize:20, fontWeight:800, boxSizing:"border-box", textAlign:"right" }}/>
              </div>
              {form.amount&&parseFloat(form.amount)>0
                ?<div style={{ textAlign:"right", fontSize:12, color:"#60a5fa", marginBottom:8 }}>≈ ₩{fmtKRW(parseFloat(form.amount)*effectiveRate)}</div>
                :<div style={{ marginBottom:8 }}/>}

              <label style={{ fontSize:12, color:"#64748b", display:"block", marginBottom:4 }}>메모 (선택)</label>
              <input value={form.memo} onChange={e=>setForm({...form,memo:e.target.value})}
                placeholder="추가 메모"
                style={{ width:"100%", background:"#1e3a5f", border:"1px solid #334155", borderRadius:8, padding:"10px 12px", color:"#e2e8f0", fontSize:14, marginBottom:16, boxSizing:"border-box" }}/>

              <div style={{ display:"flex", gap:8 }}>
                <button onClick={save} disabled={saving}
                  style={{ flex:1, padding:"14px", borderRadius:10, border:"none", background:saving?"#1e3a5f":"linear-gradient(135deg,#4ade80,#22c55e)", color:saving?"#475569":"#0a1628", fontWeight:800, fontSize:15, cursor:saving?"default":"pointer" }}>
                  {saving?"저장 중…":editId?"수정 완료":"💾 저장 & 공유"}
                </button>
                {editId&&<button onClick={()=>{setEditId(null);setForm({date:"2026-06-12",type:"지출",category:"골프장",desc:"",amount:"",memo:""}); }}
                  style={{ padding:"14px 18px", borderRadius:10, border:"1px solid #334155", background:"none", color:"#94a3b8", fontSize:14, cursor:"pointer" }}>취소</button>}
              </div>
            </div>
          </div>
        )}

        {/* LEDGER */}
        {tab==="ledger"&&(
          <div>
            <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:12 }}>
              <div style={{ fontSize:11, color:connected?"#4ade80":"#f97316", background:"rgba(0,0,0,0.3)", padding:"4px 10px", borderRadius:20 }}>
                {connected?"🟢 실시간 연결":"🔴 연결 중..."}
              </div>
            </div>

            {/* 총수입 → 총지출 → 총잔액 */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:12 }}>
              <div style={{ background:"#14532d", borderRadius:12, padding:"12px 10px", textAlign:"center" }}>
                <div style={{ fontSize:10, color:"#86efac", marginBottom:4 }}>총 수입</div>
                <div style={{ fontSize:14, fontWeight:800, color:"#4ade80" }}>¥{fmtCNY(totalIncome)}</div>
              </div>
              <div style={{ background:"#7f1d1d", borderRadius:12, padding:"12px 10px", textAlign:"center" }}>
                <div style={{ fontSize:10, color:"#fca5a5", marginBottom:4 }}>총 지출</div>
                <div style={{ fontSize:14, fontWeight:800, color:"#fca5a5" }}>¥{fmtCNY(totalExpense)}</div>
              </div>
              <div style={{ background:totalBalance>=0?"#1e3a5f":"#4a1a1a", borderRadius:12, padding:"12px 10px", textAlign:"center", border:"1px solid #334155" }}>
                <div style={{ fontSize:10, color:"#93c5fd", marginBottom:4 }}>총 잔액</div>
                <div style={{ fontSize:14, fontWeight:800, color:totalBalance>=0?"#60a5fa":"#fca5a5" }}>¥{fmtCNY(Math.abs(totalBalance))}</div>
                <div style={{ fontSize:10, color:"#475569", marginTop:2 }}>₩{fmtKRW(Math.abs(totalBalance)*effectiveRate)}</div>
              </div>
            </div>

            {/* 일별 이월 */}
            <div style={{ background:"#0d1f35", border:"1px solid #1e3a5f", borderRadius:12, padding:"12px 14px", marginBottom:16 }}>
              <div style={{ fontSize:12, color:"#64748b", marginBottom:10, fontWeight:600 }}>📆 일별 잔액 이월</div>
              {dayStats.map((ds,i)=>(
                <div key={ds.date} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:i<dayStats.length-1?10:0 }}>
                  <div style={{ width:52, flexShrink:0 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:"#94a3b8" }}>Day {i+1}</div>
                    <div style={{ fontSize:10, color:"#475569" }}>{ds.date.slice(5)}</div>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginBottom:3 }}>
                      <span style={{ color:"#4ade80" }}>+¥{fmtCNY(ds.income)}</span>
                      <span style={{ color:"#fca5a5" }}>-¥{fmtCNY(ds.expense)}</span>
                    </div>
                    <div style={{ height:4, background:"#1e3a5f", borderRadius:4, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${ds.income+ds.expense>0?Math.min(100,(ds.expense/(ds.income+ds.expense))*100):0}%`, background:"linear-gradient(to right,#fca5a5,#ef4444)", borderRadius:4 }}/>
                    </div>
                  </div>
                  <div style={{ width:80, textAlign:"right", flexShrink:0 }}>
                    <div style={{ fontSize:12, fontWeight:800, color:ds.balance>=0?"#60a5fa":"#fca5a5" }}>¥{fmtCNY(ds.balance)}</div>
                    <div style={{ fontSize:10, color:"#475569" }}>₩{fmtKRW(Math.abs(ds.balance)*effectiveRate)}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* 필터 */}
            <div style={{ display:"flex", gap:6, marginBottom:12, overflowX:"auto", paddingBottom:4 }}>
              {["전체",...SCHEDULE.map(s=>s.date)].map(d=>(
                <button key={d} onClick={()=>setFilterDay(d)}
                  style={{ flexShrink:0, padding:"6px 12px", borderRadius:20, border:"none", background:filterDay===d?"#4ade80":"#1e3a5f", color:filterDay===d?"#0a1628":"#94a3b8", fontWeight:filterDay===d?700:400, fontSize:12, cursor:"pointer" }}>
                  {d==="전체"?"전체":d.slice(5)}
                </button>
              ))}
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:14 }}>
              {[["수입",filteredStats.income,"#166534","#4ade80"],["지출",filteredStats.expense,"#7f1d1d","#fca5a5"],[filterDay!=="전체"&&filteredStats.carryover!==0?"이월잔액":"잔액",filteredStats.balance,"#1e3a5f",filteredStats.balance>=0?"#60a5fa":"#fca5a5"]].map(([label,val,bg,color])=>(
                <div key={label} style={{ background:"#0d1f35", borderRadius:10, padding:"10px", textAlign:"center", border:`1px solid ${bg}` }}>
                  <div style={{ fontSize:10, color:"#64748b", marginBottom:2 }}>{label}</div>
                  <div style={{ fontSize:13, fontWeight:700, color }}>¥{fmtCNY(Math.abs(val))}</div>
                  <div style={{ fontSize:10, color:"#475569" }}>₩{fmtKRW(Math.abs(val)*effectiveRate)}</div>
                </div>
              ))}
              {filterDay!=="전체"&&filteredStats.carryover!==0&&(
                <div style={{ gridColumn:"1/-1", fontSize:11, color:"#475569", textAlign:"center" }}>전일 이월 ¥{fmtCNY(filteredStats.carryover)} 포함</div>
              )}
            </div>

            {filtered.length===0
              ?<div style={{ textAlign:"center", padding:"40px 20px", color:"#475569" }}><div style={{ fontSize:40, marginBottom:12 }}>📭</div><div>내역이 없습니다</div></div>
              :filtered.slice().reverse().map(t=>(
                <div key={t.id} style={{ background:"#0d1f35", borderRadius:12, padding:"12px 14px", marginBottom:8, border:`1px solid ${t.type==="지출"?"#7f1d1d":"#14532d"}`, display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", gap:6, marginBottom:4, alignItems:"center", flexWrap:"wrap" }}>
                      <span style={{ fontSize:11, background:"#1e3a5f", color:"#60a5fa", padding:"2px 7px", borderRadius:20 }}>{t.category}</span>
                      <span style={{ fontSize:11, color:"#475569" }}>{t.date.slice(5)}</span>
                      {t.author&&(
                        <span style={{ fontSize:11, display:"flex", alignItems:"center", gap:3 }}>
                          <span style={{ width:6, height:6, borderRadius:"50%", background:nickColor(t.author), display:"inline-block" }}/>
                          <span style={{ color:nickColor(t.author), fontWeight:600 }}>{t.author}</span>
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize:14, fontWeight:600, color:"#e2e8f0" }}>{t.desc}</div>
                    {t.memo&&<div style={{ fontSize:12, color:"#64748b", marginTop:2 }}>{t.memo}</div>}
                    <div style={{ fontSize:11, color:"#475569", marginTop:2 }}>≈ ₩{fmtKRW(parseNum(t.amount)*effectiveRate)}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:16, fontWeight:800, color:t.type==="지출"?"#fca5a5":"#4ade80" }}>
                      {t.type==="지출"?"-":"+"}¥{fmtCNY(t.amount)}
                    </div>
                    {(t.author===nickname||!t.author)&&(
                      <div style={{ display:"flex", gap:6, justifyContent:"flex-end", marginTop:6 }}>
                        <button onClick={()=>startEdit(t)} style={{ padding:"4px 8px", borderRadius:6, border:"1px solid #334155", background:"none", color:"#94a3b8", fontSize:11, cursor:"pointer" }}>수정</button>
                        <button onClick={()=>del(t.id)} style={{ padding:"4px 8px", borderRadius:6, border:"1px solid #7f1d1d", background:"none", color:"#fca5a5", fontSize:11, cursor:"pointer" }}>삭제</button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            }
          </div>
        )}
      </div>
    </div>
  );
}
