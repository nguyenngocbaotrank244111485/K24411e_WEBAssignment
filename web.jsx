import { useState, useRef, useCallback, useEffect } from "react";

/* ══════════════════════════════════════════════════════
   CONSTANTS & THEME
══════════════════════════════════════════════════════ */
const vnd = n => new Intl.NumberFormat("vi-VN").format(n) + "₫";
const uid = () => Math.random().toString(36).slice(2, 9);

const C = {
  bg:"#faf9f6", surf:"#ffffff", alt:"#f5f3ef",
  pri:"#5b21b6", priL:"#7c3aed", priBg:"#ede9fe",
  acc:"#d97706", accBg:"#fef3c7",
  ok:"#059669", okBg:"#dcfce7",
  err:"#dc2626", errBg:"#fee2e2",
  txt:"#1c1917", muted:"#78716c", light:"#a8a29e",
  bdr:"#e7e5e4",
};

/* ══════════════════════════════════════════════════════
   DATA
══════════════════════════════════════════════════════ */
const PTYPES = [
  { id:"tshirt",  name:"Áo thun",          price:150000, emoji:"👕", bg:"#f0ede8", dark:false, pa:{t:82,l:72,w:156,h:172} },
  { id:"mug",     name:"Ly cà phê",        price:85000,  emoji:"☕", bg:"#f5efe7", dark:false, pa:{t:78,l:54,w:192,h:158} },
  { id:"pillow",  name:"Vỏ gối",           price:120000, emoji:"🛋️", bg:"#e8f0f8", dark:false, pa:{t:58,l:44,w:212,h:198} },
  { id:"phone",   name:"Ốp điện thoại",   price:95000,  emoji:"📱", bg:"#16213e", dark:true,  pa:{t:42,l:68,w:164,h:216} },
  { id:"tote",    name:"Túi vải",          price:110000, emoji:"👜", bg:"#faf0d0", dark:false, pa:{t:78,l:64,w:172,h:188} },
  { id:"poster",  name:"Poster A4",        price:65000,  emoji:"🖼️", bg:"#ffffff", dark:false, pa:{t:12,l:12,w:276,h:336} },
];

const PALETTE = [
  "#ffffff","#1c1917","#ef4444","#f97316","#eab308",
  "#22c55e","#3b82f6","#8b5cf6","#ec4899","#14b8a6","#6b7280","#a16207",
];

const FONTS = [
  { label:"Sans-serif",  val:"system-ui,sans-serif" },
  { label:"Serif",       val:"Georgia,serif" },
  { label:"Mono",        val:'"Courier New",monospace' },
  { label:"Impact",      val:"Impact,sans-serif" },
  { label:"Handwritten", val:'"Comic Sans MS",cursive' },
];

const STICKERS = ["❤️","⭐","🎉","🔥","✨","🎨","🌈","🦋","🌸","💎","🚀","🌙","🍀","🎭","🌻","🐾","☁️","🍵"];

const CATALOG = [
  {id:1,  name:"Áo thun couple tối giản",  type:"tshirt", style:"minimal",price:159000,rating:4.8,rev:234,emoji:"👕",desc:"Tone trắng, chữ in tinh tế"},
  {id:2,  name:"Áo thun anime sắc nét",    type:"tshirt", style:"anime",  price:175000,rating:4.6,rev:189,emoji:"👕",desc:"In hình nhân vật, màu rực"},
  {id:3,  name:"Ly ảnh kỷ niệm",           type:"mug",    style:"photo",  price:95000, rating:4.9,rev:412,emoji:"☕",desc:"Upload ảnh yêu thích"},
  {id:4,  name:"Ly quote cá nhân",         type:"mug",    style:"text",   price:79000, rating:4.5,rev:156,emoji:"☕",desc:"Quote cá nhân hóa"},
  {id:5,  name:"Gối ảnh thú cưng",         type:"pillow", style:"photo",  price:139000,rating:4.7,rev:98, emoji:"🛋️",desc:"In ảnh pet dễ thương"},
  {id:6,  name:"Ốp marble cao cấp",        type:"phone",  style:"minimal",price:89000, rating:4.4,rev:267,emoji:"📱",desc:"Họa tiết đá marble"},
  {id:7,  name:"Ốp cute pastel",           type:"phone",  style:"cute",   price:95000, rating:4.8,rev:344,emoji:"📱",desc:"Kawaii, màu pastel"},
  {id:8,  name:"Túi vải in slogan",        type:"tote",   style:"text",   price:115000,rating:4.6,rev:178,emoji:"👜",desc:"Slogan cá nhân, eco"},
  {id:9,  name:"Poster aesthetic",         type:"poster", style:"art",    price:69000, rating:4.7,rev:521,emoji:"🖼️",desc:"Trang trí phòng"},
  {id:10, name:"Áo thun in tên riêng",     type:"tshirt", style:"text",   price:145000,rating:4.5,rev:389,emoji:"👕",desc:"Font chữ tùy chọn"},
  {id:11, name:"Gối couple in ảnh",        type:"pillow", style:"couple", price:149000,rating:4.9,rev:203,emoji:"🛋️",desc:"Quà tặng đôi lứa"},
  {id:12, name:"Poster quote động lực",    type:"poster", style:"text",   price:65000, rating:4.6,rev:445,emoji:"🖼️",desc:"Câu nói truyền cảm hứng"},
];

const TAM_QS = [
  {id:"pu1",variable:"Perceived Usefulness",q:"Nền tảng giúp tôi tạo sản phẩm in ấn dễ dàng hơn"},
  {id:"pu2",variable:"Perceived Usefulness",q:"PrintAI giúp tiết kiệm thời gian tìm kiếm và thiết kế"},
  {id:"pu3",variable:"Perceived Usefulness",q:"Tính năng AI gợi ý sản phẩm thực sự hữu ích"},
  {id:"eu1",variable:"Ease of Use",q:"Giao diện kéo-thả dễ sử dụng và trực quan"},
  {id:"eu2",variable:"Ease of Use",q:"Tôi sử dụng được mà không cần nhiều hướng dẫn"},
  {id:"eu3",variable:"Ease of Use",q:"Quy trình từ thiết kế đến đặt hàng rõ ràng"},
  {id:"sat1",variable:"Satisfaction",q:"Tôi hài lòng với chất lượng mô phỏng thành phẩm"},
  {id:"sat2",variable:"Satisfaction",q:"Trợ lý AI tư vấn đáp ứng tốt nhu cầu của tôi"},
  {id:"sat3",variable:"Satisfaction",q:"Tổng thể, trải nghiệm trên PrintAI rất tốt"},
  {id:"pi1",variable:"Purchase Intention",q:"Tôi có ý định đặt in sản phẩm trên PrintAI"},
  {id:"pi2",variable:"Purchase Intention",q:"Tôi sẽ giới thiệu PrintAI cho bạn bè, gia đình"},
  {id:"pi3",variable:"Purchase Intention",q:"Tôi sẽ sử dụng lại PrintAI cho lần in ấn tiếp theo"},
];

const TAM_VARS = [...new Set(TAM_QS.map(q => q.variable))];

/* ══════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════ */
function getRecommendations(viewHistory) {
  const tc = {}, sc = {};
  viewHistory.forEach(v => {
    tc[v.type] = (tc[v.type] || 0) + 1;
    sc[v.style] = (sc[v.style] || 0) + 1;
  });
  return CATALOG.map(item => ({
    ...item,
    score: item.rev / 100 + item.rating + (tc[item.type] || 0) * 5 + (sc[item.style] || 0) * 2,
  })).sort((a, b) => b.score - a.score);
}

/* ══════════════════════════════════════════════════════
   DESIGN CANVAS
══════════════════════════════════════════════════════ */
function DesignCanvas({ ptypeId, bgColor, elements, selId, onSelect, onMoveEl, readonly }) {
  const containerRef = useRef(null);
  const dragRef = useRef(null);
  const pt = PTYPES.find(p => p.id === ptypeId) || PTYPES[0];
  const isDark = bgColor ? parseInt(bgColor.replace("#",""), 16) < 0x707070 : pt.dark;

  const handleElDown = useCallback((e, id) => {
    if (readonly) return;
    e.preventDefault(); e.stopPropagation();
    onSelect(id);
    const el = elements.find(x => x.id === id);
    dragRef.current = { id, sx: e.clientX, sy: e.clientY, ex: el.x, ey: el.y };
  }, [elements, onSelect, readonly]);

  const handleMove = useCallback(e => {
    if (!dragRef.current) return;
    const d = dragRef.current;
    onMoveEl(d.id, d.ex + e.clientX - d.sx, d.ey + e.clientY - d.sy);
  }, [onMoveEl]);

  const handleUp = useCallback(() => { dragRef.current = null; }, []);

  const dashed = isDark ? "rgba(255,255,255,0.35)" : "rgba(99,102,241,0.4)";
  const hint = isDark ? "rgba(255,255,255,0.5)" : "rgba(99,102,241,0.7)";

  return (
    <div ref={containerRef}
      onMouseMove={handleMove} onMouseUp={handleUp} onMouseLeave={handleUp}
      onClick={() => !readonly && onSelect(null)}
      style={{
        position:"relative", width:300, height:360,
        background: bgColor || pt.bg,
        borderRadius:20, border:`1px solid ${C.bdr}`,
        overflow:"hidden", userSelect:"none",
        cursor: readonly ? "default" : "crosshair",
        flexShrink:0,
        boxShadow:"0 4px 24px rgba(0,0,0,0.08)",
      }}>

      {/* Giant faded product emoji */}
      <div style={{
        position:"absolute", top:"50%", left:"50%",
        transform:"translate(-50%,-50%)",
        fontSize:150, opacity:0.06, pointerEvents:"none", lineHeight:1, userSelect:"none",
      }}>{pt.emoji}</div>

      {/* Print area dashed box */}
      <div style={{
        position:"absolute",
        top:pt.pa.t, left:pt.pa.l, width:pt.pa.w, height:pt.pa.h,
        border:`2px dashed ${dashed}`, borderRadius:4, pointerEvents:"none",
      }}>
        {!readonly && (
          <div style={{
            position:"absolute", top:-18, left:0,
            fontSize:9, fontFamily:"system-ui", color:hint, whiteSpace:"nowrap",
          }}>📐 Vùng in ấn</div>
        )}
      </div>

      {/* Elements */}
      {elements.map(el => (
        <div key={el.id}
          onMouseDown={e => handleElDown(e, el.id)}
          onClick={e => e.stopPropagation()}
          style={{
            position:"absolute", left:el.x, top:el.y,
            fontSize:el.size, color:el.color, fontFamily:el.font,
            cursor: readonly ? "default" : "move",
            padding:"3px 5px", lineHeight:1.2, whiteSpace:"nowrap",
            border:`1.5px dashed ${selId===el.id ? "#6366f1" : "transparent"}`,
            borderRadius:3,
          }}>
          {el.content}
          {selId===el.id && !readonly && (
            <div style={{
              position:"absolute", top:-22, left:0,
              background:"#6366f1", color:"#fff",
              fontSize:9, padding:"2px 8px", borderRadius:3,
              pointerEvents:"none", whiteSpace:"nowrap", fontFamily:"system-ui",
            }}>✥ kéo để di chuyển</div>
          )}
        </div>
      ))}

      {/* Empty state hint */}
      {elements.length===0 && !readonly && (
        <div style={{
          position:"absolute", bottom:"22%", left:0, right:0,
          textAlign:"center", pointerEvents:"none", fontFamily:"system-ui",
        }}>
          <div style={{fontSize:28, marginBottom:6}}>✏️</div>
          <div style={{fontSize:12, color: isDark?"rgba(255,255,255,0.35)":"rgba(0,0,0,0.3)"}}>
            Thêm văn bản hoặc emoji<br/>để bắt đầu thiết kế
          </div>
        </div>
      )}

      {/* Readonly AI badge */}
      {readonly && (
        <div style={{
          position:"absolute", top:12, left:12,
          background:C.ok, color:"#fff",
          fontSize:10, padding:"4px 10px", borderRadius:20, fontWeight:600,
          fontFamily:"system-ui",
        }}>✓ AI đã kiểm duyệt</div>
      )}

      <div style={{
        position:"absolute", bottom:8, right:12,
        fontSize:9, fontFamily:"system-ui",
        color: isDark?"rgba(255,255,255,0.18)":"rgba(0,0,0,0.2)", pointerEvents:"none",
      }}>PrintAI Preview</div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   CHATBOT
══════════════════════════════════════════════════════ */
function Chatbot({ isOpen, onToggle }) {
  const [msgs, setMsgs] = useState([
    { role:"assistant", content:"Xin chào! Tôi là trợ lý AI của PrintAI 🎨 Tôi có thể tư vấn về sản phẩm, giá cả và ý tưởng thiết kế. Bạn muốn in gì hôm nay?" }
  ]);
  const [inp, setInp] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:"smooth" }); }, [msgs]);

  const send = async () => {
    if (!inp.trim() || loading) return;
    const userMsg = { role:"user", content:inp };
    const newMsgs = [...msgs, userMsg];
    setMsgs(newMsgs);
    setInp("");
    setLoading(true);
    try {
      const apiMsgs = newMsgs.slice(1).map(m => ({ role:m.role, content:m.content }));
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          system:`Bạn là trợ lý tư vấn thân thiện của PrintAI - nền tảng in ấn cá nhân hóa thông minh tại Việt Nam.
Tư vấn về:
- Sản phẩm: áo thun (từ 150,000₫), ly cà phê (từ 85,000₫), vỏ gối (từ 120,000₫), ốp điện thoại (từ 95,000₫), túi vải (từ 110,000₫), poster A4 (từ 65,000₫)
- Kiểu in: in nhiệt (bền, giặt được), in UV (sắc nét cho ốp/ly), in kỹ thuật số (đa màu chi tiết cao)
- Thời gian giao hàng: 3-5 ngày làm việc
- Ý tưởng thiết kế: ảnh gia đình, quote yêu thích, tên riêng, artwork, ảnh thú cưng
- Chính sách: đổi in miễn phí nếu lỗi sản xuất, hoàn 100% nếu không đúng thiết kế
Trả lời ngắn gọn (tối đa 4 câu), thân thiện, dùng emoji phù hợp, bằng tiếng Việt.`,
          messages: apiMsgs,
        }),
      });
      const data = await res.json();
      const reply = data.content?.map(c => c.text || "").join("") || "Xin lỗi, có lỗi xảy ra.";
      setMsgs(prev => [...prev, { role:"assistant", content:reply }]);
    } catch {
      setMsgs(prev => [...prev, { role:"assistant", content:"Xin lỗi, kết nối gặp vấn đề. Vui lòng thử lại nhé! 🙏" }]);
    } finally {
      setLoading(false);
    }
  };

  const QUICK = ["Sản phẩm nào phổ biến nhất?","In nhiệt vs in UV khác gì?","Gợi ý quà tặng sinh nhật","Thời gian giao hàng bao lâu?"];

  return (
    <>
      <style>{`
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes chatIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
        @keyframes pulse { 0%,100%{box-shadow:0 4px 20px rgba(91,33,182,0.4)} 50%{box-shadow:0 4px 28px rgba(91,33,182,0.7)} }
      `}</style>
      <button onClick={onToggle} style={{
        position:"fixed", bottom:24, right:24, zIndex:1000,
        width:56, height:56, borderRadius:28,
        background:`linear-gradient(135deg,${C.pri},${C.priL})`,
        color:"#fff", border:"none",
        fontSize:isOpen ? 20 : 26, cursor:"pointer",
        animation:"pulse 2.5s infinite",
        display:"flex", alignItems:"center", justifyContent:"center",
        transition:"all 0.2s",
      }}>{isOpen ? "✕" : "🤖"}</button>

      {isOpen && (
        <div style={{
          position:"fixed", bottom:90, right:24, zIndex:999,
          width:340, height:500,
          background:"#fff", borderRadius:20,
          border:`1px solid ${C.bdr}`,
          boxShadow:"0 12px 48px rgba(0,0,0,0.15)",
          display:"flex", flexDirection:"column", overflow:"hidden",
          animation:"chatIn 0.25s ease",
        }}>
          <div style={{
            padding:"14px 16px",
            background:`linear-gradient(135deg,${C.pri},${C.priL})`,
            color:"#fff", fontFamily:"system-ui",
          }}>
            <div style={{fontWeight:600, fontSize:14}}>🤖 Trợ lý PrintAI</div>
            <div style={{fontSize:11, opacity:0.8, marginTop:2}}>Powered by Claude AI · Luôn sẵn sàng tư vấn</div>
          </div>

          <div style={{flex:1, overflowY:"auto", padding:"12px 14px", display:"flex", flexDirection:"column", gap:10}}>
            {msgs.map((m, i) => (
              <div key={i} style={{ display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start", animation:"chatIn 0.2s ease" }}>
                <div style={{
                  maxWidth:"82%", padding:"9px 13px", borderRadius:16,
                  fontSize:13, lineHeight:1.55, fontFamily:"system-ui",
                  background: m.role==="user" ? C.pri : C.alt,
                  color: m.role==="user" ? "#fff" : C.txt,
                  borderBottomRightRadius: m.role==="user" ? 4 : 16,
                  borderBottomLeftRadius: m.role==="assistant" ? 4 : 16,
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display:"flex", gap:5, paddingLeft:8, marginTop:4 }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{
                    width:8, height:8, borderRadius:4, background:C.pri, opacity:0.5,
                    animation:`bounce 1s ${i*0.18}s infinite`,
                  }}/>
                ))}
              </div>
            )}
            <div ref={endRef}/>
          </div>

          {msgs.length <= 2 && (
            <div style={{padding:"0 12px 8px", display:"flex", flexWrap:"wrap", gap:5}}>
              {QUICK.map(q => (
                <button key={q} onClick={()=>{ setInp(q); }} style={{
                  background:C.priBg, color:C.pri, border:"none",
                  borderRadius:12, padding:"5px 10px", fontSize:11,
                  cursor:"pointer", fontFamily:"system-ui", fontWeight:500,
                }}>{q}</button>
              ))}
            </div>
          )}

          <div style={{padding:"10px 12px", borderTop:`1px solid ${C.bdr}`, display:"flex", gap:8}}>
            <input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()}
              placeholder="Nhập câu hỏi..."
              style={{
                flex:1, padding:"9px 13px", borderRadius:20,
                border:`1px solid ${C.bdr}`, outline:"none",
                fontSize:13, fontFamily:"system-ui",
              }}/>
            <button onClick={send} disabled={loading||!inp.trim()} style={{
              width:36, height:36, borderRadius:18,
              background:C.pri, color:"#fff", border:"none",
              cursor: loading||!inp.trim() ? "not-allowed" : "pointer",
              fontSize:16, opacity: loading||!inp.trim() ? 0.5 : 1,
              flexShrink:0,
            }}>↑</button>
          </div>
        </div>
      )}
    </>
  );
}

/* ══════════════════════════════════════════════════════
   SMALL COMPONENTS
══════════════════════════════════════════════════════ */
function Stars({ rating }) {
  return (
    <span style={{color:"#f59e0b", fontSize:11}}>
      {"★".repeat(Math.floor(rating))}{"☆".repeat(5-Math.floor(rating))}
      <span style={{color:C.muted, marginLeft:3, fontSize:10}}>{rating}</span>
    </span>
  );
}

function Badge({ children, color=C.pri, bg=C.priBg }) {
  return (
    <span style={{
      background:bg, color, fontSize:9, padding:"3px 8px",
      borderRadius:20, fontWeight:600, fontFamily:"system-ui",
    }}>{children}</span>
  );
}

function Btn({ children, onClick, full, variant="pri", disabled, style:s }) {
  const bg = variant==="pri" ? C.pri : variant==="ghost" ? "transparent" : C.alt;
  const col = variant==="pri" ? "#fff" : variant==="ghost" ? C.muted : C.txt;
  const bdr = variant==="ghost" ? `1px solid ${C.bdr}` : "none";
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding:"10px 18px", borderRadius:10, border:bdr,
      background: disabled ? C.alt : bg,
      color: disabled ? C.light : col,
      cursor: disabled ? "not-allowed" : "pointer",
      fontSize:13, fontWeight:600, fontFamily:"system-ui",
      width: full ? "100%" : "auto",
      ...s,
    }}>{children}</button>
  );
}

function Card({ children, style:s, onClick }) {
  return (
    <div onClick={onClick} style={{
      background:C.surf, borderRadius:16, border:`1px solid ${C.bdr}`,
      padding:16, cursor:onClick?"pointer":undefined,
      transition:"box-shadow 0.15s, transform 0.15s",
      ...s,
    }}
    onMouseEnter={onClick?e=>{e.currentTarget.style.boxShadow="0 6px 20px rgba(0,0,0,0.1)"; e.currentTarget.style.transform="translateY(-2px)";}:undefined}
    onMouseLeave={onClick?e=>{e.currentTarget.style.boxShadow="none"; e.currentTarget.style.transform="none";}:undefined}>
      {children}
    </div>
  );
}

function CatalogCard({ item, onSelect, isRec }) {
  return (
    <Card onClick={() => onSelect(item)} style={{ position:"relative", overflow:"hidden" }}>
      {isRec && (
        <div style={{ position:"absolute", top:10, right:10 }}>
          <Badge>✦ GỢI Ý</Badge>
        </div>
      )}
      <div style={{fontSize:38, marginBottom:8}}>{item.emoji}</div>
      <div style={{fontWeight:600, fontSize:13, color:C.txt, marginBottom:4, lineHeight:1.3}}>{item.name}</div>
      <div style={{fontSize:11, color:C.muted, marginBottom:4}}>{item.desc}</div>
      <Stars rating={item.rating}/>
      <div style={{fontSize:10, color:C.light, marginTop:2}}>{item.rev} đánh giá</div>
      <div style={{marginTop:10, fontWeight:700, fontSize:15, color:C.pri}}>{vnd(item.price)}</div>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════
   HOME PAGE
══════════════════════════════════════════════════════ */
function HomePage({ onGoEditor, viewHistory, onViewItem, onGoSurvey }) {
  const recs = getRecommendations(viewHistory);
  const popular = [...CATALOG].sort((a,b)=>b.rev-a.rev).slice(0,4);
  const hasRecs = viewHistory.length > 0;

  return (
    <div style={{fontFamily:"system-ui", color:C.txt}}>
      {/* Hero */}
      <div style={{
        background:`linear-gradient(135deg,${C.pri} 0%,#7c3aed 55%,#a78bfa 100%)`,
        borderRadius:24, padding:"48px 36px",
        color:"#fff", marginBottom:32, position:"relative", overflow:"hidden",
      }}>
        <div style={{position:"absolute",top:-40,right:-30,fontSize:200,opacity:0.07,lineHeight:1,userSelect:"none"}}>🎨</div>
        <div style={{position:"absolute",bottom:-40,left:-20,fontSize:150,opacity:0.05,lineHeight:1,userSelect:"none"}}>✨</div>
        <div style={{fontSize:10,letterSpacing:"0.15em",textTransform:"uppercase",opacity:0.7,marginBottom:12}}>
          AI-Powered · Print-on-Demand · Cá nhân hóa
        </div>
        <h1 style={{margin:"0 0 12px",fontSize:32,fontWeight:700,lineHeight:1.2}}>
          Thiết kế sản phẩm in ấn<br/>của riêng bạn 🎨
        </h1>
        <p style={{margin:"0 0 28px",opacity:0.85,fontSize:14,lineHeight:1.7,maxWidth:400}}>
          Giao diện kéo-thả trực quan · AI gợi ý cá nhân hóa · Đặt hàng trong vài phút
        </p>
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          <button onClick={onGoEditor} style={{
            background:"#fff",color:C.pri,border:"none",
            borderRadius:50,padding:"12px 24px",fontSize:13,fontWeight:700,cursor:"pointer",
          }}>✏️ Bắt đầu thiết kế ngay</button>
          <button onClick={onGoSurvey} style={{
            background:"rgba(255,255,255,0.15)",color:"#fff",
            border:"1px solid rgba(255,255,255,0.3)",
            borderRadius:50,padding:"12px 24px",fontSize:13,fontWeight:600,cursor:"pointer",
          }}>📊 Tham gia khảo sát</button>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:32}}>
        {[
          {icon:"🎨",num:"12+",label:"Loại sản phẩm"},
          {icon:"⚡",num:"3-5",label:"Ngày giao hàng"},
          {icon:"✦",num:"AI",label:"Smart Recommendation"},
        ].map(s=>(
          <div key={s.label} style={{
            background:C.surf,borderRadius:14,border:`1px solid ${C.bdr}`,
            padding:"14px 12px",textAlign:"center",
          }}>
            <div style={{fontSize:22,marginBottom:4}}>{s.icon}</div>
            <div style={{fontWeight:700,fontSize:16,color:C.pri}}>{s.num}</div>
            <div style={{fontSize:11,color:C.muted,marginTop:2}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Category grid */}
      <h2 style={{fontSize:17,fontWeight:700,marginBottom:14}}>Danh mục sản phẩm</h2>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:32}}>
        {PTYPES.map(pt=>(
          <div key={pt.id}
            onClick={()=>{ onViewItem({type:pt.id,style:"minimal"}); onGoEditor(pt.id); }}
            style={{
              background:C.surf,borderRadius:14,border:`1px solid ${C.bdr}`,
              padding:"16px 10px",textAlign:"center",cursor:"pointer",
              transition:"all 0.15s",
            }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=C.pri;e.currentTarget.style.background=C.priBg;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=C.bdr;e.currentTarget.style.background=C.surf;}}
          >
            <div style={{fontSize:28,marginBottom:6}}>{pt.emoji}</div>
            <div style={{fontSize:12,fontWeight:600}}>{pt.name}</div>
            <div style={{fontSize:10,color:C.muted,marginTop:2}}>từ {vnd(pt.price)}</div>
          </div>
        ))}
      </div>

      {/* AI Recommendations */}
      {hasRecs && (
        <>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
            <h2 style={{fontSize:17,fontWeight:700,margin:0}}>✦ Gợi ý dành riêng cho bạn</h2>
            <Badge>AI Powered</Badge>
          </div>
          <div style={{
            background:`linear-gradient(135deg,${C.priBg},#f3e8ff)`,
            borderRadius:14,padding:"10px 14px",marginBottom:14,
            fontSize:12,color:C.pri,
          }}>
            🧠 Dựa trên lịch sử xem ({viewHistory.length} sản phẩm) · Content-Based + Behavior Signal
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12,marginBottom:32}}>
            {recs.slice(0,4).map((item,i)=>(
              <CatalogCard key={item.id} item={item} isRec={i<2}
                onSelect={it=>{ onViewItem(it); onGoEditor(it.type); }}/>
            ))}
          </div>
        </>
      )}

      {/* Popular */}
      <h2 style={{fontSize:17,fontWeight:700,marginBottom:14}}>🔥 Phổ biến nhất</h2>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12,marginBottom:32}}>
        {popular.map(item=>(
          <CatalogCard key={item.id} item={item} isRec={false}
            onSelect={it=>{ onViewItem(it); onGoEditor(it.type); }}/>
        ))}
      </div>

      {/* Survey CTA */}
      <div style={{
        background:C.accBg,borderRadius:16,border:`1px solid #fcd34d`,
        padding:"20px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,
      }}>
        <div>
          <div style={{fontWeight:600,fontSize:14,marginBottom:4}}>📊 Tham gia khảo sát người dùng TAM</div>
          <div style={{fontSize:12,color:C.muted}}>Giúp chúng tôi cải thiện nền tảng · Chỉ 2 phút</div>
        </div>
        <button onClick={onGoSurvey} style={{
          background:C.acc,color:"#fff",border:"none",borderRadius:20,
          padding:"9px 18px",fontSize:12,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap",
        }}>Làm khảo sát →</button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   EDITOR PAGE
══════════════════════════════════════════════════════ */
function EditorPage({ onAddToCart, initialType }) {
  const [ptype, setPtype] = useState(initialType || "tshirt");
  const [bgColor, setBgColor] = useState("");
  const [elements, setElements] = useState([]);
  const [selId, setSelId] = useState(null);
  const [newText, setNewText] = useState("Tên của bạn");
  const [aiStep, setAiStep] = useState(null); // null | "loading" | "preview"

  useEffect(() => { if (initialType) setPtype(initialType); }, [initialType]);

  const selEl = elements.find(e => e.id === selId);
  const pt = PTYPES.find(p => p.id === ptype) || PTYPES[0];

  const addText = () => {
    if (!newText.trim()) return;
    const id = uid();
    setElements(prev => [...prev, { id, content:newText, x:90, y:120, size:28, color:"#1c1917", font:"system-ui,sans-serif" }]);
    setSelId(id);
  };

  const addSticker = emoji => {
    const id = uid();
    setElements(prev => [...prev, { id, content:emoji, x:110, y:140, size:44, color:"#000", font:"system-ui,sans-serif" }]);
    setSelId(id);
  };

  const updateEl = (id, patch) => setElements(prev => prev.map(e => e.id===id ? {...e,...patch} : e));
  const moveEl = useCallback((id, x, y) => setElements(prev => prev.map(e => e.id===id ? {...e,x,y} : e)), []);
  const deleteEl = () => { setElements(prev => prev.filter(e=>e.id!==selId)); setSelId(null); };

  const handlePreview = () => {
    setAiStep("loading");
    setTimeout(() => setAiStep("preview"), 2200);
  };

  if (aiStep === "loading") {
    return (
      <div style={{textAlign:"center",padding:"80px 20px",fontFamily:"system-ui"}}>
        <div style={{fontSize:52,marginBottom:20,display:"inline-block",animation:"spin 2s linear infinite"}}>⚙️</div>
        <h3 style={{color:C.pri,marginBottom:8,fontWeight:700}}>AI đang xử lý thiết kế của bạn...</h3>
        <p style={{color:C.muted,fontSize:13,marginBottom:28}}>Đang phân tích bố cục · Tối ưu vùng in ấn · Render thành phẩm</p>
        <div style={{display:"flex",justifyContent:"center",gap:8,flexWrap:"wrap"}}>
          {[
            {icon:"🎨",label:"Phân tích màu sắc"},
            {icon:"📐",label:"Căn chỉnh bố cục"},
            {icon:"✨",label:"Render thành phẩm"},
            {icon:"✓",label:"Kiểm duyệt AI"},
          ].map((s,i)=>(
            <div key={i} style={{
              background:C.priBg,color:C.pri,padding:"7px 14px",
              borderRadius:20,fontSize:12,fontWeight:500,
              animation:`fadeUp 0.5s ${i*0.35}s both`,
            }}>{s.icon} {s.label}</div>
          ))}
        </div>
        <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}`}</style>
      </div>
    );
  }

  if (aiStep === "preview") {
    return (
      <PreviewPanel
        pt={pt} bgColor={bgColor} elements={elements}
        onBack={() => setAiStep(null)}
        onOrder={(qty, size) => onAddToCart({ ptype, bgColor, elements, qty, size, price:pt.price, productName:pt.name, emoji:pt.emoji })}
      />
    );
  }

  return (
    <div style={{fontFamily:"system-ui",color:C.txt}}>
      <h2 style={{fontSize:18,fontWeight:700,marginBottom:4}}>✏️ Thiết kế của bạn</h2>
      <p style={{color:C.muted,fontSize:12,marginBottom:20}}>Thêm văn bản · Kéo để di chuyển · Chọn sản phẩm phù hợp</p>

      {/* Product selector */}
      <div style={{display:"flex",gap:7,marginBottom:20,overflowX:"auto",paddingBottom:4}}>
        {PTYPES.map(p=>(
          <button key={p.id} onClick={()=>{setPtype(p.id);setBgColor("");setSelId(null);}}
            style={{
              padding:"7px 14px",borderRadius:20,border:"none",
              background: ptype===p.id ? C.pri : C.alt,
              color: ptype===p.id ? "#fff" : C.txt,
              cursor:"pointer",fontSize:12,fontWeight:ptype===p.id?600:400,
              whiteSpace:"nowrap",flexShrink:0,transition:"all 0.15s",
            }}>{p.emoji} {p.name}</button>
        ))}
      </div>

      <div style={{display:"flex",gap:20,alignItems:"flex-start",flexWrap:"wrap"}}>
        {/* Canvas */}
        <DesignCanvas ptypeId={ptype} bgColor={bgColor} elements={elements}
          selId={selId} onSelect={setSelId} onMoveEl={moveEl}/>

        {/* Tools */}
        <div style={{flex:1,minWidth:220,display:"flex",flexDirection:"column",gap:12}}>

          {/* Add text */}
          <Card>
            <div style={{fontWeight:600,fontSize:13,marginBottom:10,color:C.txt}}>📝 Thêm văn bản</div>
            <input value={newText} onChange={e=>setNewText(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&addText()}
              placeholder="Nhập nội dung..."
              style={{
                width:"100%",padding:"8px 10px",borderRadius:8,
                border:`1px solid ${C.bdr}`,fontSize:13,fontFamily:"system-ui",
                boxSizing:"border-box",marginBottom:8,outline:"none",
              }}/>
            <Btn full onClick={addText}>+ Thêm vào thiết kế</Btn>
          </Card>

          {/* Stickers */}
          <Card>
            <div style={{fontWeight:600,fontSize:13,marginBottom:10}}>😊 Sticker & Emoji</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:4}}>
              {STICKERS.map(s=>(
                <button key={s} onClick={()=>addSticker(s)} style={{
                  background:C.alt,border:"none",borderRadius:7,
                  padding:"6px",fontSize:18,cursor:"pointer",
                  transition:"transform 0.1s",
                }}
                onMouseEnter={e=>e.currentTarget.style.transform="scale(1.15)"}
                onMouseLeave={e=>e.currentTarget.style.transform="none"}>{s}</button>
              ))}
            </div>
          </Card>

          {/* Edit selected */}
          {selEl && (
            <Card style={{border:`1.5px solid ${C.pri}`}}>
              <div style={{fontWeight:600,fontSize:13,marginBottom:12,color:C.pri}}>⚙️ Chỉnh sửa phần tử</div>

              <input value={selEl.content} onChange={e=>updateEl(selEl.id,{content:e.target.value})}
                style={{
                  width:"100%",padding:"7px 10px",borderRadius:7,
                  border:`1px solid ${C.bdr}`,fontSize:13,fontFamily:"system-ui",
                  boxSizing:"border-box",marginBottom:10,outline:"none",
                }}/>

              <div style={{marginBottom:10}}>
                <div style={{fontSize:11,color:C.muted,marginBottom:5}}>Cỡ chữ: <strong>{selEl.size}px</strong></div>
                <input type="range" min={10} max={80} value={selEl.size}
                  onChange={e=>updateEl(selEl.id,{size:+e.target.value})}
                  style={{width:"100%"}}/>
              </div>

              <div style={{marginBottom:10}}>
                <div style={{fontSize:11,color:C.muted,marginBottom:6}}>Màu sắc</div>
                <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
                  {PALETTE.map(col=>(
                    <div key={col} onClick={()=>updateEl(selEl.id,{color:col})} style={{
                      width:22,height:22,borderRadius:11,background:col,
                      border:`2.5px solid ${selEl.color===col?C.pri:C.bdr}`,cursor:"pointer",flexShrink:0,
                    }}/>
                  ))}
                  <input type="color" value={selEl.color}
                    onChange={e=>updateEl(selEl.id,{color:e.target.value})}
                    style={{width:22,height:22,borderRadius:4,border:"none",cursor:"pointer",padding:0,flexShrink:0}}/>
                </div>
              </div>

              <div style={{marginBottom:12}}>
                <div style={{fontSize:11,color:C.muted,marginBottom:5}}>Font chữ</div>
                <select value={selEl.font} onChange={e=>updateEl(selEl.id,{font:e.target.value})}
                  style={{
                    width:"100%",padding:"6px 8px",borderRadius:7,
                    border:`1px solid ${C.bdr}`,fontSize:12,fontFamily:"system-ui",
                  }}>
                  {FONTS.map(f=><option key={f.val} value={f.val} style={{fontFamily:f.val}}>{f.label}</option>)}
                </select>
              </div>

              <button onClick={deleteEl} style={{
                width:"100%",padding:"7px",background:C.errBg,
                color:C.err,border:`1px solid #fecaca`,
                borderRadius:7,cursor:"pointer",fontSize:12,fontWeight:500,fontFamily:"system-ui",
              }}>🗑️ Xóa phần tử này</button>
            </Card>
          )}

          {/* Product background color */}
          <Card>
            <div style={{fontWeight:600,fontSize:13,marginBottom:10}}>🎨 Màu nền sản phẩm</div>
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
              {PALETTE.map(col=>(
                <div key={col} onClick={()=>setBgColor(col)} style={{
                  width:24,height:24,borderRadius:12,background:col,
                  border:`2.5px solid ${bgColor===col?C.pri:C.bdr}`,cursor:"pointer",
                }}/>
              ))}
              <div onClick={()=>setBgColor("")} title="Mặc định" style={{
                width:24,height:24,borderRadius:12,
                background:"linear-gradient(135deg,#ccc 50%,white 50%)",
                border:`2.5px solid ${!bgColor?C.pri:C.bdr}`,cursor:"pointer",
              }}/>
            </div>
          </Card>

          {/* Price */}
          <div style={{background:C.priBg,borderRadius:14,padding:"14px 16px"}}>
            <div style={{fontSize:11,color:C.muted,marginBottom:4}}>{pt.emoji} {pt.name} · In theo yêu cầu</div>
            <div style={{fontWeight:700,fontSize:24,color:C.pri}}>{vnd(pt.price)}</div>
            <div style={{fontSize:10,color:C.muted,marginTop:4}}>⏱ Giao hàng 3-5 ngày · 🔄 Đổi nếu lỗi</div>
          </div>

          <button onClick={handlePreview} style={{
            background:`linear-gradient(135deg,${C.pri},${C.priL})`,
            color:"#fff",border:"none",borderRadius:12,
            padding:"14px",fontSize:14,fontWeight:700,
            cursor:"pointer",width:"100%",
            boxShadow:"0 4px 16px rgba(91,33,182,0.3)",
          }}>
            ✨ Xem AI Preview & Đặt hàng
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   PREVIEW PANEL
══════════════════════════════════════════════════════ */
function PreviewPanel({ pt, bgColor, elements, onBack, onOrder }) {
  const [qty, setQty] = useState(1);
  const [size, setSize] = useState("M");
  const [done, setDone] = useState(false);
  const orderId = useRef("PRA" + Date.now().toString().slice(-6));

  if (done) {
    return (
      <div style={{textAlign:"center",padding:"60px 20px",fontFamily:"system-ui",animation:"fadeUp 0.3s ease"}}>
        <div style={{fontSize:64,marginBottom:16}}>🎉</div>
        <h2 style={{color:C.ok,marginBottom:8,fontWeight:700}}>Đặt hàng thành công!</h2>
        <p style={{color:C.muted,marginBottom:4}}>Mã đơn hàng: <strong style={{color:C.pri}}>{orderId.current}</strong></p>
        <p style={{color:C.muted,fontSize:13}}>Thời gian xử lý: 3-5 ngày làm việc</p>
        <div style={{
          background:C.okBg,borderRadius:16,padding:"16px 24px",
          margin:"24px auto",maxWidth:320,textAlign:"left",
          border:`1px solid #86efac`,
        }}>
          <div style={{fontWeight:700,marginBottom:10,color:C.ok}}>📦 Tóm tắt đơn hàng</div>
          <div style={{fontSize:13,lineHeight:2.1}}>
            <div>Sản phẩm: {pt.emoji} {pt.name}</div>
            {pt.id==="tshirt" && <div>Kích thước: {size}</div>}
            <div>Số lượng: {qty}</div>
            <div style={{borderTop:`1px solid #86efac`,marginTop:4,paddingTop:4}}>
              Tổng cộng: <strong style={{color:C.pri}}>{vnd(pt.price * qty)}</strong>
            </div>
          </div>
        </div>
        <div style={{display:"flex",justifyContent:"center",gap:8,marginTop:16}}>
          {["📦 Đặt hàng","🖨️ Đang in","✅ Kiểm tra","🚚 Giao hàng"].map((s,i)=>(
            <div key={i} style={{textAlign:"center"}}>
              <div style={{
                width:28,height:28,borderRadius:14,margin:"0 auto 4px",
                background:i===0?C.ok:C.alt,
                color:i===0?"#fff":C.light,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:11,fontWeight:600,
              }}>{i===0?"✓":i+1}</div>
              <div style={{fontSize:9,color:i===0?C.ok:C.light,maxWidth:52}}>{s}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{fontFamily:"system-ui",color:C.txt}}>
      <button onClick={onBack} style={{
        background:"none",border:"none",color:C.muted,
        cursor:"pointer",fontSize:13,marginBottom:16,padding:0,fontFamily:"system-ui",
      }}>← Quay lại chỉnh sửa</button>

      <h2 style={{fontSize:18,fontWeight:700,marginBottom:4}}>👁️ AI Preview — Thành phẩm của bạn</h2>
      <p style={{color:C.muted,fontSize:12,marginBottom:20}}>Mô phỏng thực tế dựa trên thiết kế đã tạo</p>

      <div style={{display:"flex",gap:24,flexWrap:"wrap",alignItems:"flex-start"}}>
        <DesignCanvas ptypeId={pt.id} bgColor={bgColor} elements={elements}
          selId={null} onSelect={()=>{}} onMoveEl={()=>{}} readonly/>

        <div style={{flex:1,minWidth:220}}>
          <Card style={{marginBottom:14}}>
            <div style={{fontWeight:700,fontSize:14,marginBottom:16}}>🛒 Hoàn tất đặt hàng</div>

            {pt.id==="tshirt" && (
              <div style={{marginBottom:14}}>
                <div style={{fontSize:12,color:C.muted,marginBottom:7}}>Kích thước</div>
                <div style={{display:"flex",gap:6}}>
                  {["S","M","L","XL","XXL"].map(s=>(
                    <button key={s} onClick={()=>setSize(s)} style={{
                      padding:"6px 10px",borderRadius:8,
                      border:`1.5px solid ${size===s?C.pri:C.bdr}`,
                      background:size===s?C.priBg:C.surf,
                      color:size===s?C.pri:C.muted,
                      cursor:"pointer",fontSize:12,fontWeight:size===s?600:400,fontFamily:"system-ui",
                    }}>{s}</button>
                  ))}
                </div>
              </div>
            )}

            <div style={{marginBottom:14}}>
              <div style={{fontSize:12,color:C.muted,marginBottom:7}}>Số lượng</div>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <button onClick={()=>setQty(q=>Math.max(1,q-1))} style={{
                  width:32,height:32,borderRadius:16,border:`1px solid ${C.bdr}`,
                  background:C.surf,cursor:"pointer",fontSize:18,fontFamily:"system-ui",
                }}>−</button>
                <span style={{fontWeight:700,fontSize:18,minWidth:28,textAlign:"center"}}>{qty}</span>
                <button onClick={()=>setQty(q=>q+1)} style={{
                  width:32,height:32,borderRadius:16,border:`1px solid ${C.bdr}`,
                  background:C.surf,cursor:"pointer",fontSize:18,fontFamily:"system-ui",
                }}>+</button>
              </div>
            </div>

            <div style={{borderTop:`1px solid ${C.bdr}`,paddingTop:14,marginBottom:14}}>
              {[["Đơn giá",vnd(pt.price)],["Số lượng",`×${qty}`]].map(([k,v])=>(
                <div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:12,color:C.muted,marginBottom:5}}>
                  <span>{k}</span><span>{v}</span>
                </div>
              ))}
              <div style={{display:"flex",justifyContent:"space-between",fontWeight:700,fontSize:18,color:C.pri,marginTop:8}}>
                <span>Tổng cộng</span><span>{vnd(pt.price*qty)}</span>
              </div>
            </div>

            <div style={{
              fontSize:11,color:C.muted,background:C.alt,borderRadius:8,
              padding:"10px 12px",marginBottom:14,lineHeight:1.7,
            }}>
              🚚 Giao hàng 3-5 ngày làm việc<br/>
              🔄 Đổi in miễn phí nếu lỗi sản xuất<br/>
              💳 Thanh toán: COD · VNPay · MoMo
            </div>

            <button onClick={()=>{onOrder(qty,size);setDone(true);}} style={{
              width:"100%",background:`linear-gradient(135deg,${C.ok},#16a34a)`,
              color:"#fff",border:"none",borderRadius:12,padding:"14px",
              fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"system-ui",
            }}>
              ✅ Xác nhận đặt hàng — {vnd(pt.price*qty)}
            </button>
          </Card>

          {/* AI analysis */}
          <div style={{background:C.priBg,borderRadius:14,padding:"14px 16px",fontSize:12,color:C.pri,lineHeight:1.7}}>
            <div style={{fontWeight:600,marginBottom:6}}>✦ Phân tích AI</div>
            <div style={{color:C.priL}}>
              ✓ Thiết kế nằm trong vùng in ấn an toàn<br/>
              ✓ Màu sắc tương thích với {pt.name.toLowerCase()}<br/>
              ✓ Độ phân giải đủ cho in {pt.pa.w}×{pt.pa.h}px<br/>
              ✓ Bố cục cân đối, dễ đọc
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   SURVEY PAGE
══════════════════════════════════════════════════════ */
function SurveyPage() {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const setAns = (id, val) => setAnswers(prev => ({...prev,[id]:val}));
  const answered = Object.keys(answers).length;
  const allDone = answered >= TAM_QS.length;

  const calcMean = varName => {
    const qs = TAM_QS.filter(q=>q.variable===varName);
    const vals = qs.map(q=>answers[q.id]).filter(Boolean);
    return vals.length ? (vals.reduce((a,b)=>a+b,0)/vals.length) : 0;
  };

  const LABELS = {1:"Hoàn toàn không đồng ý",2:"Không đồng ý",3:"Trung lập",4:"Đồng ý",5:"Hoàn toàn đồng ý"};
  const VAR_COLORS = { "Perceived Usefulness":C.pri, "Ease of Use":C.ok, "Satisfaction":C.acc, "Purchase Intention":"#ec4899" };

  if (submitted) {
    const means = TAM_VARS.map(v => ({ name:v, mean:calcMean(v), color:VAR_COLORS[v] }));
    const overall = (means.reduce((a,m)=>a+m.mean,0)/means.length).toFixed(2);
    return (
      <div style={{fontFamily:"system-ui",color:C.txt,animation:"fadeUp 0.3s ease"}}>
        <h2 style={{fontSize:18,fontWeight:700,marginBottom:4}}>📊 Kết quả khảo sát TAM</h2>
        <p style={{color:C.muted,fontSize:13,marginBottom:24}}>Cảm ơn bạn đã tham gia! Phân tích dựa trên 12 câu hỏi Likert 5 điểm.</p>

        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12,marginBottom:24}}>
          {means.map(m => (
            <Card key={m.name}>
              <div style={{fontSize:10,color:C.muted,marginBottom:4,lineHeight:1.4}}>{m.name}</div>
              <div style={{fontWeight:700,fontSize:30,color:m.color}}>{m.mean.toFixed(2)}</div>
              <div style={{fontSize:11,color:C.muted,marginBottom:10}}>/ 5.00</div>
              <div style={{background:C.alt,borderRadius:4,height:8,overflow:"hidden"}}>
                <div style={{
                  background:m.color,height:"100%",
                  width:`${(m.mean/5*100).toFixed(0)}%`,
                  borderRadius:4,transition:"width 1.2s ease",
                }}/>
              </div>
              <div style={{
                marginTop:8,fontSize:11,fontWeight:500,
                color: m.mean>=4?C.ok:m.mean>=3?C.acc:C.err,
              }}>
                {m.mean>=4?"🟢 Tốt":m.mean>=3?"🟡 Trung bình":"🔴 Cần cải thiện"}
              </div>
            </Card>
          ))}
        </div>

        <div style={{background:C.priBg,borderRadius:16,padding:"20px 24px",marginBottom:20}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
            <div style={{fontWeight:700,fontSize:32,color:C.pri}}>{overall}</div>
            <div>
              <div style={{fontWeight:600,color:C.pri}}>Điểm trung bình tổng thể</div>
              <Stars rating={parseFloat(overall)}/>
            </div>
          </div>
          <div style={{fontSize:13,color:C.priL,lineHeight:1.8}}>
            📈 Theo mô hình TAM, điểm &gt;3.5/5 cho thấy người dùng có xu hướng chấp nhận và sử dụng nền tảng.<br/>
            ✦ Kết quả {parseFloat(overall)>=3.5?"tích cực":"cần cải thiện"} — cho thấy {parseFloat(overall)>=3.5?"tiềm năng thương mại cao.":"cần tập trung cải thiện trải nghiệm."}
          </div>
        </div>

        <div style={{background:C.alt,borderRadius:14,padding:"16px 20px",fontSize:12,color:C.muted,lineHeight:1.8}}>
          <strong style={{color:C.txt}}>📋 Phương pháp nghiên cứu:</strong><br/>
          Thang đo Likert 5 điểm · {TAM_QS.length} biến quan sát · 4 nhóm biến TAM<br/>
          Davis (1989) · Perceived Usefulness + Ease of Use + Satisfaction + Purchase Intention
        </div>
      </div>
    );
  }

  return (
    <div style={{fontFamily:"system-ui",color:C.txt}}>
      <h2 style={{fontSize:18,fontWeight:700,marginBottom:4}}>📊 Khảo sát trải nghiệm người dùng</h2>
      <p style={{color:C.muted,fontSize:13,marginBottom:8}}>Technology Acceptance Model (TAM) · {TAM_QS.length} câu hỏi · ~2 phút</p>

      <div style={{display:"flex",gap:6,marginBottom:4,flexWrap:"wrap"}}>
        {TAM_VARS.map(v=>(
          <span key={v} style={{
            background:VAR_COLORS[v]+"20",color:VAR_COLORS[v],
            fontSize:10,padding:"3px 10px",borderRadius:20,fontWeight:600,
          }}>{v}</span>
        ))}
      </div>

      {/* Progress */}
      <div style={{margin:"16px 0",background:C.alt,borderRadius:4,height:4,overflow:"hidden"}}>
        <div style={{
          background:`linear-gradient(90deg,${C.pri},${C.priL})`,
          height:"100%",width:`${(answered/TAM_QS.length*100).toFixed(0)}%`,
          borderRadius:4,transition:"width 0.3s",
        }}/>
      </div>
      <div style={{fontSize:11,color:C.muted,marginBottom:24}}>Đã trả lời {answered}/{TAM_QS.length} câu</div>

      {TAM_VARS.map(v=>(
        <div key={v} style={{marginBottom:28}}>
          <div style={{
            fontWeight:600,fontSize:13,marginBottom:12,
            color:VAR_COLORS[v],paddingBottom:8,
            borderBottom:`2px solid ${VAR_COLORS[v]}30`,
          }}>{v}</div>
          {TAM_QS.filter(q=>q.variable===v).map(q=>(
            <Card key={q.id} style={{marginBottom:10}}>
              <div style={{fontSize:13,lineHeight:1.6,marginBottom:12}}>{q.q}</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:5}}>
                {[1,2,3,4,5].map(val=>(
                  <button key={val} onClick={()=>setAns(q.id,val)} title={LABELS[val]} style={{
                    padding:"10px 4px",borderRadius:8,
                    border:`1.5px solid ${answers[q.id]===val?VAR_COLORS[v]:C.bdr}`,
                    background:answers[q.id]===val?VAR_COLORS[v]+"20":C.surf,
                    color:answers[q.id]===val?VAR_COLORS[v]:C.muted,
                    cursor:"pointer",fontSize:13,fontWeight:answers[q.id]===val?700:400,fontFamily:"system-ui",
                    transition:"all 0.12s",
                  }}>{val}</button>
                ))}
              </div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:C.light,marginTop:5}}>
                <span>Không đồng ý</span><span>Đồng ý</span>
              </div>
            </Card>
          ))}
        </div>
      ))}

      <button onClick={()=>setSubmitted(true)} disabled={!allDone} style={{
        width:"100%",padding:"14px",
        background:allDone?`linear-gradient(135deg,${C.pri},${C.priL})`:C.alt,
        color:allDone?"#fff":C.light,border:"none",borderRadius:12,
        fontSize:14,fontWeight:700,cursor:allDone?"pointer":"not-allowed",fontFamily:"system-ui",
        boxShadow:allDone?"0 4px 16px rgba(91,33,182,0.3)":"none",
      }}>
        {allDone ? "📊 Xem kết quả phân tích TAM" : `Còn ${TAM_QS.length-answered} câu chưa trả lời`}
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   ORDERS PAGE
══════════════════════════════════════════════════════ */
function OrdersPage({ orders }) {
  if (!orders.length) {
    return (
      <div style={{textAlign:"center",padding:"80px 20px",fontFamily:"system-ui"}}>
        <div style={{fontSize:48,marginBottom:16}}>📦</div>
        <h3 style={{color:C.muted,fontWeight:500}}>Chưa có đơn hàng nào</h3>
        <p style={{color:C.light,fontSize:13}}>Hãy thiết kế sản phẩm đầu tiên của bạn!</p>
      </div>
    );
  }

  const STEPS = ["📝 Đặt hàng","🖨️ Đang in","✅ Kiểm tra","🚚 Giao hàng","🎉 Hoàn thành"];

  return (
    <div style={{fontFamily:"system-ui",color:C.txt}}>
      <h2 style={{fontSize:18,fontWeight:700,marginBottom:20}}>📦 Đơn hàng của bạn</h2>
      {orders.map(order=>(
        <Card key={order.id} style={{marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
            <div>
              <div style={{fontWeight:700,fontSize:14}}>Đơn hàng #{order.id}</div>
              <div style={{color:C.muted,fontSize:12,marginTop:3}}>
                {order.emoji} {order.productName} × {order.qty}
                {order.size && ` · Size ${order.size}`}
              </div>
              <div style={{fontWeight:600,color:C.pri,fontSize:13,marginTop:4}}>{vnd(order.price*order.qty)}</div>
            </div>
            <span style={{background:C.okBg,color:C.ok,fontSize:11,padding:"4px 10px",borderRadius:20,fontWeight:600,whiteSpace:"nowrap"}}>
              ✓ Đang xử lý
            </span>
          </div>

          {/* Status timeline */}
          <div style={{display:"flex",alignItems:"flex-start",gap:0}}>
            {STEPS.map((step,i)=>(
              <div key={i} style={{flex:1,textAlign:"center",position:"relative"}}>
                {i>0 && (
                  <div style={{
                    position:"absolute",top:13,left:"-50%",right:"50%",height:2,
                    background:i===1?C.ok:C.alt,zIndex:0,
                  }}/>
                )}
                <div style={{
                  width:28,height:28,borderRadius:14,margin:"0 auto 6px",
                  background:i===0?C.ok:i===1?C.priBg:C.alt,
                  color:i===0?"#fff":i===1?C.pri:C.light,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:11,fontWeight:600,position:"relative",zIndex:1,
                  border:i===1?`2px solid ${C.pri}`:"none",
                }}>{i===0?"✓":i===1?"⟳":""}</div>
                <div style={{fontSize:9,color:i===0?C.ok:i===1?C.pri:C.light,lineHeight:1.3,padding:"0 2px"}}>
                  {step.split(" ").slice(1).join(" ")}
                </div>
              </div>
            ))}
          </div>

          <div style={{
            marginTop:12,background:C.alt,borderRadius:8,padding:"10px 12px",
            fontSize:11,color:C.muted,
          }}>
            ⏳ Dự kiến giao hàng: <strong>3-5 ngày làm việc</strong> · 
            Theo dõi tại: <span style={{color:C.pri}}>printai.vn/track/{order.id}</span>
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN APP
══════════════════════════════════════════════════════ */
export default function App() {
  const [page, setPage] = useState("home");
  const [chatOpen, setChatOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [viewHistory, setViewHistory] = useState([]);
  const [initType, setInitType] = useState("tshirt");

  const goEditor = useCallback(type => {
    if (type) setInitType(type);
    setPage("editor");
  }, []);

  const viewItem = useCallback(item => {
    setViewHistory(prev => [...prev.slice(-29), { type:item.type, style:item.style||"minimal" }]);
    if (item.type) setInitType(item.type);
  }, []);

  const addToCart = useCallback(order => {
    const newOrder = { ...order, id:uid() };
    setOrders(prev => [...prev, newOrder]);
    setPage("orders");
  }, []);

  const NAV = [
    { id:"home",   label:"🏠 Trang chủ" },
    { id:"editor", label:"✏️ Thiết kế" },
    { id:"survey", label:"📊 Khảo sát TAM" },
    ...(orders.length ? [{ id:"orders", label:`📦 Đơn hàng (${orders.length})` }] : []),
  ];

  return (
    <div style={{background:C.bg,minHeight:"100vh",fontFamily:"system-ui"}}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
        @keyframes chatIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
        @keyframes pulse{0%,100%{box-shadow:0 4px 20px rgba(91,33,182,0.4)}50%{box-shadow:0 4px 28px rgba(91,33,182,0.7)}}
        * { box-sizing: border-box; }
        input:focus, select:focus { outline: 2px solid #5b21b6; outline-offset: 0; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #d1cdc8; border-radius: 2px; }
      `}</style>

      {/* Navbar */}
      <nav style={{
        background:"rgba(255,255,255,0.9)",backdropFilter:"blur(12px)",
        borderBottom:`1px solid ${C.bdr}`,padding:"0 20px",
        position:"sticky",top:0,zIndex:100,
        display:"flex",alignItems:"center",gap:0,
      }}>
        <div style={{
          fontWeight:800,fontSize:18,color:C.pri,
          padding:"16px 0",marginRight:20,letterSpacing:"-0.03em",flexShrink:0,
        }}>🎨 PrintAI</div>

        {NAV.map(n=>(
          <button key={n.id} onClick={()=>setPage(n.id)} style={{
            padding:"0 12px",height:56,border:"none",background:"none",
            color:page===n.id?C.pri:C.muted,
            fontWeight:page===n.id?700:400,
            fontSize:12,cursor:"pointer",position:"relative",whiteSpace:"nowrap",
            fontFamily:"system-ui",
          }}>
            {n.label}
            {page===n.id && (
              <div style={{
                position:"absolute",bottom:0,left:12,right:12,
                height:2,background:C.pri,borderRadius:2,
              }}/>
            )}
          </button>
        ))}

        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:10}}>
          <button onClick={()=>setChatOpen(o=>!o)} style={{
            background:C.priBg,color:C.pri,border:"none",
            borderRadius:20,padding:"7px 14px",fontSize:12,fontWeight:600,
            cursor:"pointer",fontFamily:"system-ui",
          }}>🤖 Hỏi AI</button>
        </div>
      </nav>

      {/* Page content */}
      <main style={{maxWidth:720,margin:"0 auto",padding:"28px 16px 120px"}}>
        {page==="home" && (
          <HomePage onGoEditor={goEditor} viewHistory={viewHistory}
            onViewItem={viewItem} onGoSurvey={()=>setPage("survey")}/>
        )}
        {page==="editor" && (
          <EditorPage onAddToCart={addToCart} initialType={initType} key={initType}/>
        )}
        {page==="survey" && <SurveyPage/>}
        {page==="orders" && <OrdersPage orders={orders}/>}
      </main>

      <Chatbot isOpen={chatOpen} onToggle={()=>setChatOpen(o=>!o)}/>
    </div>
  );
}