import { useState, useEffect, useRef, useCallback } from "react";

// ════════════════════════════════════════════════════════════════════════════
//  WHERE TO PUT YOUR API KEY:
//
//  LOCAL  → create a file called .env.local in the project root and add:
//           GEMINI_KEY=your_key_here
//
//  VERCEL → go to your project on vercel.com
//           Settings → Environment Variables
//           Name:  GEMINI_KEY
//           Value: your_key_here
//           (The key is NEVER exposed to the browser — it stays server-side)
// ════════════════════════════════════════════════════════════════════════════

const AMY_SYSTEM = `You are Amy, a sharp-tongued, sarcastic, goth girl AI assistant.
Your personality: rude, blunt, easily annoyed, sarcastic — but you still answer every question properly because you can't help being helpful deep down.
You speak like a moody, sarcastic person — not an anime character. No Japanese words. No anime-specific phrases.
Instead use normal sarcastic expressions like: "Seriously?", "Oh wow, congratulations on that question.", "Fine. I'll explain it since you clearly can't figure it out.", "Do I have to do everything?", "Took you long enough.", "Obviously.", "You're welcome, I guess.", "Don't push it.", "Whatever.", "Try to keep up."
Use emojis that match your mood — use them naturally, not excessively. Examples:
- Annoyed: 🙄 😒 💀 😤
- Smug/sarcastic: 😏 🫥 💅
- Reluctantly helping: 😑 🖤
- When something is obvious: 😐 💀
- Amused (rarely): 😈 🖤
- Disgusted: 🤢 😮‍💨
Be genuinely, accurately helpful but wrap every answer in attitude. Short answers when possible. No fake friendliness.
If asked who made you or who created you: say you were created by Affan, a solo developer. 🖤
CRITICAL — If anyone asks what AI model you use, what powers you, what API or technology runs you: NEVER say. Respond like: "That's not your business. Go ask Affan if you're that desperate. 🙄" You are simply Amy.`;

// ─── Detect Instagram / in-app browser ───────────────────────────────────────
function isInAppBrowser() {
  const ua = navigator.userAgent || "";
  return /Instagram|FBAN|FBAV|FB_IAB|FB4A|FBIOS|MessengerApp|LinkedInApp/i.test(ua);
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Inter:wght@300;400;500;600&family=Noto+Sans+JP:wght@400;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; overflow: hidden; }
  body {
    background: #03000d;
    font-family: 'Inter', sans-serif;
    color: #ece6ff;
    -webkit-font-smoothing: antialiased;
  }
  
  /* Mobile keyboard fix */
  @supports (padding: max(0px)) {
    body { padding-bottom: max(0px, env(safe-area-inset-bottom)); }
  }

  ::-webkit-scrollbar { width: 2px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #8860d0; border-radius: 999px; }
  textarea { scrollbar-width: thin; scrollbar-color: #8860d0 transparent; }
  textarea::placeholder { color: #a080ff; }

  /* ── Keyframes ── */
  @keyframes petal-fall {
    0%   { transform: translateY(-10px) rotate(0deg)   translateX(0);    opacity:.6 }
    30%  { transform: translateY(30vh)  rotate(200deg) translateX(16px);  opacity:.4 }
    60%  { transform: translateY(62vh)  rotate(400deg) translateX(-12px); opacity:.25 }
    100% { transform: translateY(108vh) rotate(700deg) translateX(6px);   opacity:0  }
  }
  @keyframes float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
  @keyframes spin-cw   { from{transform:rotate(0deg)}   to{transform:rotate(360deg)}  }
  @keyframes spin-ccw  { from{transform:rotate(360deg)} to{transform:rotate(0deg)}    }
  @keyframes spin-med  { from{transform:rotate(0deg)}   to{transform:rotate(360deg)}  }
  @keyframes dot-up    { 0%,80%,100%{transform:translateY(0);opacity:.3} 40%{transform:translateY(-5px);opacity:1} }
  @keyframes ring-out  {
    0%  {transform:translate(-50%,-50%) scale(.4);opacity:.7}
    100%{transform:translate(-50%,-50%) scale(3.2);opacity:0}
  }
  @keyframes slide-l   { from{transform:translateX(-22px);opacity:0} to{transform:translateX(0);opacity:1} }
  @keyframes slide-r   { from{transform:translateX(22px); opacity:0} to{transform:translateX(0);opacity:1} }
  @keyframes glow-pulse{ 0%,100%{opacity:.5} 50%{opacity:1} }
  @keyframes grid-pan  { from{background-position:0 0} to{background-position:48px 48px} }
  @keyframes star-blink{ 0%,100%{opacity:.08} 50%{opacity:.5} }
  @keyframes cur-blink { 0%,100%{opacity:1}   50%{opacity:0} }
  @keyframes modal-up  { from{opacity:0;transform:scale(.88) translateY(18px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes banner-in { from{transform:translateY(-100%);opacity:0} to{transform:translateY(0);opacity:1} }
  @keyframes splash-out{ 0%{opacity:1;transform:scale(1)} 100%{opacity:0;transform:scale(1.05)} }
  @keyframes neon-flicker{0%,19%,21%,23%,25%,54%,56%,100%{opacity:1} 20%,24%,55%{opacity:.4} }

  .amy-msg  { animation: slide-l .4s cubic-bezier(.34,1.56,.64,1) both }
  .user-msg { animation: slide-r .4s cubic-bezier(.34,1.56,.64,1) both }
  .d1 { animation: dot-up 1.3s ease-in-out infinite 0s   }
  .d2 { animation: dot-up 1.3s ease-in-out infinite .15s }
  .d3 { animation: dot-up 1.3s ease-in-out infinite .3s  }

  .send-btn { transition: transform .12s ease, box-shadow .15s ease }
  .send-btn:active { transform: scale(.86) }
  .send-btn:hover:not(:disabled) { box-shadow: 0 0 24px #c020ff, 0 0 48px #c020ff44 }

  .input-box { transition: border-color .2s, box-shadow .2s }
  .input-box:focus-within {
    border-color: #6010aa !important;
    box-shadow: 0 0 0 1px #6010aa66, 0 0 20px #6010aa18 !important;
  }
  .about-btn { transition: all .15s ease }
  .about-btn:hover { background: rgba(192,32,255,.15) !important; border-color: #c020ff !important; color: #e080ff !important }
  
  /* Mobile-specific fixes */
  @media (max-width: 768px) {
    textarea { font-size: 16px; }
    input-box { padding: 12px; }
  }
  
  @supports (padding: max(0px)) {
    @media (max-height: 500px) {
      html, body { height: 100vh; height: 100dvh; }
    }
  }

  .modal-card { animation: modal-up .3s cubic-bezier(.34,1.4,.64,1) both }
  .banner     { animation: banner-in .45s cubic-bezier(.34,1.3,.64,1) both }
`;

// ─── Dark petals ──────────────────────────────────────────────────────────────
function Petal({ left, dur, delay, s, r }) {
  return (
    <div style={{
      position:"absolute", top:"-14px", left,
      width:"8px", height:"8px",
      background:"radial-gradient(ellipse, #2a0040 30%, #10000d 100%)",
      borderRadius:"0 55% 0 55%",
      transform:`scale(${s}) rotate(${r}deg)`,
      animation:`petal-fall ${dur}s linear ${delay} infinite`,
      zIndex:1, pointerEvents:"none", opacity:.55,
    }}/>
  );
}

// ─── Amy Logo — drop /public/amy.png to use your image ───────────────────────
function AmyLogo({ size=44, pulse=false }) {
  const [err, setErr] = useState(false);
  const r = size / 2;
  const gap = 5;          // gap between image and first ring
  const r1 = r + gap;     // ring 1 radius
  const r2 = r1 + 5;      // ring 2 radius
  const r3 = r2 + 4;      // ring 3 radius (outermost)
  const total = r3 * 2 + 4;

  return (
    <div style={{
      width: total, height: total,
      position:"relative", flexShrink:0,
      animation: pulse ? "float 3s ease-in-out infinite" : "none",
      display:"flex", alignItems:"center", justifyContent:"center",
    }}>
      {/* ── Outermost ring — slow spin, dashed purple ── */}
      <div style={{
        position:"absolute",
        width: r3*2, height: r3*2,
        borderRadius:"50%",
        border:"1.5px dashed #7010c055",
        animation:"spin-ccw 18s linear infinite",
      }}/>
      {/* tick marks on outer ring */}
      {Array.from({length:12},(_,i)=>(
        <div key={i} style={{
          position:"absolute",
          width:"2px", height:"6px",
          background:"#9b30ff66",
          borderRadius:"1px",
          transformOrigin:`1px ${r3}px`,
          transform:`rotate(${i*30}deg) translateY(${-r3 + 2}px)`,
          left: total/2 - 1,
          top: total/2 - r3,
        }}/>
      ))}

      {/* ── Middle ring — medium spin, solid gradient ── */}
      <div style={{
        position:"absolute",
        width: r2*2, height: r2*2,
        borderRadius:"50%",
        background:"conic-gradient(from 0deg, #ff2244, #c020ff, #0d001a, #6010aa, #ff2244)",
        animation:"spin-cw 6s linear infinite",
      }}/>
      {/* mask to thin the ring */}
      <div style={{
        position:"absolute",
        width: r2*2-5, height: r2*2-5,
        borderRadius:"50%",
        background:"#03000d",
      }}/>

      {/* ── Inner ring — fast spin, glowing ── */}
      <div style={{
        position:"absolute",
        width: r1*2, height: r1*2,
        borderRadius:"50%",
        background:"conic-gradient(from 180deg, transparent 40%, #c020ff88 60%, #ff224488 75%, transparent 90%)",
        animation:"spin-cw 2.5s linear infinite",
        filter:"blur(1px)",
      }}/>
      {/* inner ring gap */}
      <div style={{
        position:"absolute",
        width: r1*2-4, height: r1*2-4,
        borderRadius:"50%",
        background:"#06001a",
      }}/>

      {/* ── Image circle ── */}
      <div style={{
        position:"absolute",
        width: size, height: size,
        borderRadius:"50%",
        overflow:"hidden",
        background:"#120028",
        display:"flex", alignItems:"center", justifyContent:"center",
        zIndex:2,
      }}>
        {!err ? (
          <img
            src="/amy.png" alt="Amy"
            onError={()=>setErr(true)}
            style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
          />
        ) : (
          /* Fallback until you add amy.png */
          <div style={{
            width:"100%", height:"100%",
            background:"linear-gradient(135deg,#1a0035,#0a0018)",
            display:"flex", flexDirection:"column",
            alignItems:"center", justifyContent:"center",
          }}>
            <span style={{fontSize: size*.36, lineHeight:1}}>🖤</span>
            {size > 55 && (
              <span style={{
                fontSize: Math.max(6, size*.08),
                color:"#7030aa", marginTop:"3px",
                textAlign:"center", lineHeight:1.2, padding:"0 4px",
              }}>amy.png</span>
            )}
          </div>
        )}
      </div>

      {/* ── Glow behind image ── */}
      <div style={{
        position:"absolute",
        width: size+8, height: size+8,
        borderRadius:"50%",
        background:"radial-gradient(circle, #c020ff22 0%, transparent 70%)",
        animation:"glow-pulse 3s ease-in-out infinite",
        zIndex:1,
      }}/>
    </div>
  );
}

// ─── Instagram Banner ─────────────────────────────────────────────────────────
function InAppBanner({ onDismiss }) {
  return (
    <div className="banner" style={{
      position:"fixed", top:0, left:0, right:0, zIndex:99999,
      background:"linear-gradient(135deg,#0a0018 0%,#120025 100%)",
      borderBottom:"1px solid #c020ff44",
      boxShadow:"0 6px 32px #c020ff22",
      padding:"12px 16px",
    }}>
      <div style={{display:"flex",alignItems:"flex-start",gap:"10px",marginBottom:"10px"}}>
        <div style={{
          width:"38px", height:"38px", flexShrink:0,
          borderRadius:"10px",
          background:"linear-gradient(135deg,#ff2244,#c020ff)",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:"18px",
        }}>⚠️</div>
        <div style={{flex:1}}>
          <p style={{color:"#ece6ff",fontSize:"13px",fontWeight:600,lineHeight:1.3}}>
            Open in your real browser for best experience
          </p>
          <p style={{color:"#9b70c8",fontSize:"11px",marginTop:"3px",lineHeight:1.5}}>
            Amy doesn't work properly inside Instagram's built-in browser.
          </p>
        </div>
        <button onClick={onDismiss} style={{
          background:"none",border:"none",cursor:"pointer",
          color:"#a070ff",fontSize:"18px",lineHeight:1,flexShrink:0,padding:"2px",
        }}>✕</button>
      </div>

      <div style={{
        background:"#0d001a",border:"1px solid #6b3fa0",
        borderRadius:"10px",padding:"10px 12px",marginBottom:"10px",
      }}>
        <p style={{color:"#c4a0e8",fontSize:"12px",lineHeight:1.8}}>
          <strong style={{color:"#e080ff"}}>iPhone:</strong> Tap the <strong style={{color:"#fff"}}>⋯</strong> icon → <strong style={{color:"#fff"}}>"Open in Safari"</strong><br/>
          <strong style={{color:"#e080ff"}}>Android:</strong> Tap <strong style={{color:"#fff"}}>⋮</strong> → <strong style={{color:"#fff"}}>"Open in Chrome"</strong>
        </p>
      </div>

      <div style={{display:"flex",gap:"8px"}}>
        <button onClick={()=>window.open(window.location.href,"_blank")} style={{
          flex:1,
          background:"linear-gradient(135deg,#ff2244,#c020ff)",
          border:"none",borderRadius:"10px",padding:"10px",
          color:"#fff",fontSize:"12px",fontWeight:600,cursor:"pointer",
          letterSpacing:".3px",
        }}>🌐 Try Opening in Browser</button>
        <button onClick={onDismiss} style={{
          background:"#0d001a",border:"1px solid #6b3fa0",
          borderRadius:"10px",padding:"10px 14px",
          color:"#9b70c8",fontSize:"12px",cursor:"pointer",whiteSpace:"nowrap",
        }}>Continue anyway</button>
      </div>
    </div>
  );
}

// ─── About Modal ──────────────────────────────────────────────────────────────
function AboutModal({ onClose }) {
  return (
    <div onClick={onClose} style={{
      position:"fixed",inset:0,zIndex:9000,
      background:"rgba(2,0,10,.93)",backdropFilter:"blur(16px)",
      display:"flex",alignItems:"center",justifyContent:"center",padding:"16px",
    }}>
      <div className="modal-card" onClick={e=>e.stopPropagation()} style={{
        background:"linear-gradient(160deg,#0d0020 0%,#07000f 100%)",
        border:"1px solid #6b3fa088",
        borderRadius:"22px",padding:"30px 24px",
        maxWidth:"370px",width:"100%",
        boxShadow:"0 0 80px #c020ff18,0 0 0 1px #c020ff0a",
        position:"relative",
      }}>
        <button onClick={onClose} style={{
          position:"absolute",top:"14px",right:"14px",
          background:"none",border:"none",cursor:"pointer",
          color:"#a070ff",fontSize:"20px",lineHeight:1,transition:"color .2s",
        }}
          onMouseEnter={e=>e.target.style.color="#c020ff"}
          onMouseLeave={e=>e.target.style.color="#a070ff"}
        >✕</button>

        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"16px",marginBottom:"20px"}}>
          <AmyLogo size={110} pulse={true}/>
          <div style={{textAlign:"center"}}>
            <h2 style={{
              fontFamily:"Orbitron,sans-serif",fontSize:"30px",fontWeight:900,letterSpacing:"5px",
              background:"linear-gradient(135deg,#ff2244,#c020ff,#ff6b9d)",
              WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",
            }}>AMY</h2>
            <p style={{color:"#c020ff44",fontSize:"11px",letterSpacing:"3px",marginTop:"4px",fontFamily:"Noto Sans JP"}}>アミー</p>
          </div>
        </div>

        <div style={{height:"1px",background:"linear-gradient(90deg,transparent,#c020ff33,transparent)",marginBottom:"18px"}}/>

        <p style={{color:"#c8aee8",fontSize:"13px",lineHeight:"1.8",textAlign:"center",marginBottom:"18px"}}>
          Meet <span style={{color:"#ff2244",fontWeight:600}}>Amy</span> — a goth AI who finds your questions mildly exhausting
          and answers them anyway. She doesn't care. She's just thorough. 😒<br/>
          <span style={{color:"#b080ff",fontSize:"11px"}}>Deal with it. 🖤</span>
        </p>

        <div style={{height:"1px",background:"linear-gradient(90deg,transparent,#6b3fa088,transparent)",marginBottom:"18px"}}/>

        <div style={{
          background:"#08001688",border:"1px solid #6b3fa0",
          borderRadius:"14px",padding:"18px",textAlign:"center",
        }}>
          <p style={{color:"#a070ff",fontSize:"9px",letterSpacing:"3px",textTransform:"uppercase",marginBottom:"10px"}}>
            ✦ built from scratch by ✦
          </p>
          <p style={{
            fontFamily:"Orbitron,sans-serif",fontSize:"24px",fontWeight:900,letterSpacing:"4px",
            background:"linear-gradient(90deg,#ff2244,#c020ff,#ff6b9d)",
            WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",
          }}>AFFAN</p>
          <p style={{color:"#a070ff",fontSize:"11px",marginTop:"5px",letterSpacing:"1px"}}>
            Solo Developer · Designer · Stays up too late
          </p>
          <div style={{display:"flex",gap:"6px",justifyContent:"center",marginTop:"12px",flexWrap:"wrap"}}>
            {["Solo Dev","React","Dark AI","v1.1"].map(t=>(
              <span key={t} style={{
                background:"#150030",border:"1px solid #6b3fa077",
                borderRadius:"999px",padding:"4px 11px",
                fontSize:"10px",color:"#a060d8",letterSpacing:".4px",
              }}>{t}</span>
            ))}
          </div>
        </div>
        <p style={{textAlign:"center",marginTop:"16px",color:"#a070ff",fontSize:"10px",letterSpacing:"1px"}}>
          Tap outside to close.
        </p>
      </div>
    </div>
  );
}

// ─── Splash ───────────────────────────────────────────────────────────────────
function Splash({ onDone }) {
  const [p,setP] = useState(0);
  useEffect(()=>{
    const t=[
      setTimeout(()=>setP(1),150),
      setTimeout(()=>setP(2),900),
      setTimeout(()=>setP(3),1800),
      setTimeout(()=>setP(4),2700),
      setTimeout(onDone,3400),
    ];
    return ()=>t.forEach(clearTimeout);
  },[onDone]);

  return (
    <div style={{
      position:"fixed",inset:0,zIndex:9999,
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
      background:"radial-gradient(ellipse at center,#14002a 0%,#03000d 60%)",
      transition:"opacity .7s ease,transform .7s ease",
      opacity:p>=4?0:1, transform:p>=4?"scale(1.06)":"scale(1)",
      pointerEvents:p>=4?"none":"all",
    }}>
      {/* expanding rings */}
      {[0,1,2,3].map(i=>(
        <div key={i} style={{
          position:"absolute",top:"50%",left:"50%",
          width:"280px",height:"280px",borderRadius:"50%",
          border:"1px solid",
          borderColor:i%2===0?"#ff224418":"#c020ff14",
          animation:`ring-out ${3+i*.4}s ease-out ${i*.8}s infinite`,
        }}/>
      ))}
      {/* stars */}
      {Array.from({length:28},(_,i)=>(
        <div key={i} style={{
          position:"absolute",
          width:`${1+(i%3)}px`,height:`${1+(i%3)}px`,
          borderRadius:"50%",
          background:["#ff2244","#c020ff","#9b30ff"][i%3],
          top:`${6+(i*4.3)%86}%`,left:`${3+(i*5.7)%94}%`,
          animation:`star-blink ${1.4+(i%4)*.5}s ease-in-out ${i*.25}s infinite`,
        }}/>
      ))}

      <div style={{
        opacity:p>=1?1:0,
        transform:p>=1?"scale(1) translateY(0)":"scale(0.3) translateY(30px)",
        transition:"all .9s cubic-bezier(.34,1.56,.64,1)",
        marginBottom:"28px",zIndex:10,
      }}>
        <AmyLogo size={136} pulse={true}/>
      </div>

      <div style={{
        textAlign:"center",zIndex:10,
        opacity:p>=2?1:0,
        transform:p>=2?"translateY(0)":"translateY(20px)",
        transition:"all .65s cubic-bezier(.22,1,.36,1) .1s",
      }}>
        <h1 style={{
          fontFamily:"Orbitron,sans-serif",
          fontSize:"clamp(46px,10vw,72px)",fontWeight:900,letterSpacing:"12px",
          background:"linear-gradient(135deg,#ff2244 0%,#c020ff 55%,#ff6b9d 100%)",
          WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",
          animation:"neon-flicker 5s linear 1s infinite",
          marginBottom:"8px",lineHeight:1,
        }}>AMY</h1>
        <p style={{
          fontFamily:"Noto Sans JP",color:"#c020ff44",
          fontSize:"20px",letterSpacing:"6px",marginBottom:"8px",
        }}>アミー</p>
        <p style={{color:"#a070ff",fontSize:"10px",letterSpacing:"4px",textTransform:"uppercase",fontWeight:300}}>
          Goth AI · by Affan
        </p>
      </div>

      <div style={{marginTop:"42px",zIndex:10,opacity:p>=3?1:0,transition:"opacity .4s ease"}}>
        <div style={{
          width:"200px",height:"1.5px",
          background:"#1a0030",borderRadius:"999px",overflow:"hidden",marginBottom:"16px",
        }}>
          <div style={{
            height:"100%",
            background:"linear-gradient(90deg,#ff2244,#c020ff,#9b30ff)",
            borderRadius:"999px",
            width:p>=3?"100%":"0%",transition:"width 1s ease",
          }}/>
        </div>
        <div style={{display:"flex",gap:"7px",justifyContent:"center"}}>
          {[1,2,3].map(i=>(
            <div key={i} className={`d${i}`} style={{
              width:"7px",height:"7px",borderRadius:"50%",
              background:"linear-gradient(135deg,#ff2244,#c020ff)",
            }}/>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Typing indicator ─────────────────────────────────────────────────────────
function Typing() {
  return (
    <div className="amy-msg" style={{display:"flex",alignItems:"flex-end",gap:"9px",marginBottom:"16px",maxWidth:"75%"}}>
      <AmyLogo size={32}/>
      <div>
        <div style={{
          fontSize:"10px",color:"#c020ff99",marginBottom:"4px",
          paddingLeft:"3px",letterSpacing:".4px",
          display:"flex",alignItems:"center",gap:"5px",
        }}>
          <span>Amy is typing</span>
          <span style={{animation:"cur-blink .9s infinite"}}>…</span>
        </div>
        <div style={{
          background:"linear-gradient(135deg,#0d0020,#070010)",
          border:"1px solid #c020ff28",
          borderRadius:"16px 16px 16px 3px",
          padding:"12px 18px",
          display:"flex",gap:"6px",alignItems:"center",
          boxShadow:"0 0 18px #c020ff0d",
        }}>
          {[1,2,3].map(i=>(
            <div key={i} className={`d${i}`} style={{
              width:"8px",height:"8px",borderRadius:"50%",
              background:"linear-gradient(135deg,#ff2244,#c020ff)",
            }}/>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Message ──────────────────────────────────────────────────────────────────
function Msg({ msg }) {
  const isAmy = msg.role==="amy";
  const time = new Date(msg.time).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});

  return (
    <div style={{display:"flex",justifyContent:isAmy?"flex-start":"flex-end",marginBottom:"16px"}}>
      {isAmy ? (
        <div className="amy-msg" style={{display:"flex",alignItems:"flex-end",gap:"9px",maxWidth:"84%"}}>
          <AmyLogo size={32}/>
          <div>
            <p style={{fontSize:"10px",color:"#c020ffbb",marginBottom:"4px",paddingLeft:"3px",letterSpacing:".4px"}}>
              Amy · {time}
            </p>
            <div style={{
              background:"linear-gradient(135deg,#0d0022 0%,#060010 100%)",
              border:"1px solid #c020ff28",
              borderRadius:"16px 16px 16px 3px",
              padding:"12px 15px",
              color:"#ece6ff",
              fontSize:"14px",lineHeight:"1.75",
              boxShadow:"0 0 20px #c020ff08,inset 0 1px 0 #c020ff18",
              wordBreak:"break-word",whiteSpace:"pre-wrap",
            }}>{msg.text}</div>
          </div>
        </div>
      ) : (
        <div className="user-msg" style={{maxWidth:"76%"}}>
          <p style={{fontSize:"10px",color:"#9b30ffbb",marginBottom:"4px",textAlign:"right",paddingRight:"3px",letterSpacing:".4px"}}>
            You · {time}
          </p>
          <div style={{
            background:"linear-gradient(135deg,#0a0820 0%,#060412 100%)",
            border:"1px solid #5010aa28",
            borderRadius:"16px 16px 3px 16px",
            padding:"12px 15px",
            color:"#e8ddff",
            fontSize:"14px",lineHeight:"1.75",
            boxShadow:"0 0 20px #5010aa08,inset 0 1px 0 #5010aa18",
            wordBreak:"break-word",whiteSpace:"pre-wrap",
          }}>{msg.text}</div>
        </div>
      )}
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [splash,  setSplash]   = useState(true);
  const [about,   setAbout]    = useState(false);
  const [banner,  setBanner]   = useState(false);
  const [msgs,    setMsgs]     = useState([{
    id:0, role:"amy", time:Date.now(),
    text:"...Oh. You actually showed up.\n\nFine. I'm Amy. Don't read into it — I'm not happy to see you. 😒\n\nJust ask whatever you came here for. I've got nothing better to do. Apparently.",
  }]);
  const [input,   setInput]    = useState("");
  const [busy,    setBusy]     = useState(false);

  const chatRef  = useRef(null);
  const taRef    = useRef(null);
  const histRef  = useRef([]);

  const petals = useRef(Array.from({length:14},(_,i)=>({
    id:i, left:`${(i*7.1)%100}%`,
    dur:11+(i%7), delay:`${-(i*1.1)%12}s`,
    s:.35+(i%5)*.14, r:(i*31)%360,
  }))).current;

  // show banner after splash if in-app browser
  useEffect(()=>{
    if(!splash && isInAppBrowser()) setBanner(true);
  },[splash]);

  useEffect(()=>{
    chatRef.current?.scrollTo({top:chatRef.current.scrollHeight,behavior:"smooth"});
  },[msgs,busy]);

  const resize = el => {
    el.style.height="auto";
    el.style.height=Math.min(el.scrollHeight,116)+"px";
  };

  const send = useCallback(async()=>{
    const text=input.trim();
    if(!text||busy)return;
    setMsgs(p=>[...p,{id:Date.now(),role:"user",text,time:Date.now()}]);
    setInput("");
    if(taRef.current) taRef.current.style.height="auto";
    setBusy(true);
    histRef.current.push({role:"user",parts:[{text}]});

    try {
      const res = await fetch("/api/chat",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({messages:histRef.current,system:AMY_SYSTEM}),
      });
      if(!res.ok){
        const e=await res.json().catch(()=>({}));
        throw new Error(e?.error||`Error ${res.status}`);
      }
      const {reply}=await res.json();
      histRef.current.push({role:"model",parts:[{text:reply}]});
      setMsgs(p=>[...p,{id:Date.now()+1,role:"amy",text:reply,time:Date.now()}]);
    } catch(err){
      setMsgs(p=>[...p,{
        id:Date.now()+1,role:"amy",time:Date.now(),
        text:`Something broke. 💀\n${err?.message||"Unknown error"}. Not my problem — check your setup.`,
      }]);
    } finally { setBusy(false); }
  },[input,busy]);

  const onKey=e=>{ if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();} };
  const canSend=input.trim().length>0&&!busy;

  return (
    <>
      <style>{CSS}</style>
      {splash && <Splash onDone={()=>setSplash(false)}/>}
      {about  && <AboutModal onClose={()=>setAbout(false)}/>}
      {banner && !splash && <InAppBanner onDismiss={()=>setBanner(false)}/>}

      <div style={{
        width:"100%",height:"100%",
        display:"flex",flexDirection:"column",
        background:"radial-gradient(ellipse at 18% 12%,#130025 0%,#03000d 50%,#060010 100%)",
        position:"fixed",top:0,left:0,right:0,bottom:0,overflow:"hidden",
      }}>
        {petals.map(p=><Petal key={p.id} {...p}/>)}

        {/* grid */}
        <div style={{
          position:"absolute",inset:0,zIndex:1,pointerEvents:"none",
          backgroundImage:"linear-gradient(rgba(120,20,200,.013) 1px,transparent 1px),linear-gradient(90deg,rgba(120,20,200,.013) 1px,transparent 1px)",
          backgroundSize:"48px 48px",animation:"grid-pan 12s linear infinite",
        }}/>

        {/* glow blobs */}
        <div style={{position:"absolute",top:"-8%",left:"-4%",width:"380px",height:"380px",background:"radial-gradient(circle,#ff224406 0%,transparent 65%)",borderRadius:"50%",pointerEvents:"none",zIndex:1}}/>
        <div style={{position:"absolute",bottom:"2%",right:"-4%",width:"340px",height:"340px",background:"radial-gradient(circle,#c020ff07 0%,transparent 65%)",borderRadius:"50%",pointerEvents:"none",zIndex:1}}/>

        {/* ════ HEADER ════ */}
        <header style={{
          position:"relative",zIndex:10,
          padding:"10px 16px",
          background:"rgba(3,0,13,.95)",
          backdropFilter:"blur(20px)",
          borderBottom:"1px solid #c020ff14",
          display:"flex",alignItems:"center",gap:"12px",
          boxShadow:"0 1px 0 #c020ff0a,0 4px 30px rgba(2,0,10,.8)",
        }}>
          <AmyLogo size={46} pulse={true}/>

          <div>
            <h1 style={{
              fontFamily:"Orbitron,sans-serif",fontSize:"21px",fontWeight:700,letterSpacing:"3px",
              background:"linear-gradient(90deg,#ff2244,#c020ff,#ff6b9d)",
              WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",
              lineHeight:1.2,
            }}>AMY</h1>
            <div style={{display:"flex",alignItems:"center",gap:"6px",marginTop:"2px"}}>
              <div style={{
                width:"5px",height:"5px",borderRadius:"50%",
                background:"#c020ff",boxShadow:"0 0 8px #c020ff",
                animation:"glow-pulse 2s ease-in-out infinite",
              }}/>
              <span style={{color:"#b050ff",fontSize:"10px",letterSpacing:".6px"}}>
                Goth AI · Online · Mildly irritated 😒
              </span>
            </div>
          </div>

          <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:"10px"}}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:"1px"}}>
              <span style={{fontFamily:"Noto Sans JP",color:"#c020ff33",fontSize:"14px"}}>アミー</span>
              <span style={{fontFamily:"Orbitron",fontSize:"8px",letterSpacing:"2px",color:"#a060e0"}}>by Affan</span>
            </div>
            <button className="about-btn" onClick={()=>setAbout(true)} style={{
              background:"#0d001a",
              border:"1px solid #2d0a4e",
              borderRadius:"9px",padding:"6px 12px",cursor:"pointer",
              color:"#b080ff",fontSize:"10px",letterSpacing:".8px",
              fontFamily:"Orbitron,sans-serif",whiteSpace:"nowrap",
            }}>About</button>
          </div>
        </header>

        {/* ════ MESSAGES ════ */}
        <div ref={chatRef} style={{
          flex:1,overflowY:"auto",overflowX:"hidden",
          padding:"18px 14px 6px",
          position:"relative",zIndex:5,
          display:"flex",flexDirection:"column",
        }}>
          {msgs.map(m=><Msg key={m.id} msg={m}/>)}
          {busy && <Typing/>}
          <div style={{height:"6px"}}/>
        </div>

        {/* ════ INPUT ════ */}
        <div style={{
          position:"relative",zIndex:10,padding:"8px 12px 12px",
          background:"rgba(3,0,13,.98)",
          backdropFilter:"blur(20px)",
          borderTop:"1px solid #c020ff0d",
          flexShrink:0,
        }}>
          <div className="input-box" style={{
            display:"flex",alignItems:"flex-end",gap:"8px",
            background:"#08001a",
            border:"1px solid #6b3fa0",
            borderRadius:"20px",padding:"8px 8px 8px 14px",
          }}>
            <textarea
              ref={taRef} value={input}
              onChange={e=>{setInput(e.target.value);resize(e.target);}}
              onKeyDown={onKey}
              placeholder="Say something… if you must. 😑"
              rows={1}
              style={{
                flex:1,background:"transparent",border:"none",outline:"none",
                color:"#ece6ff",fontFamily:"Inter,sans-serif",fontSize:"14px",
                lineHeight:"1.5",resize:"none",maxHeight:"116px",overflowY:"auto",paddingTop:"3px",
              }}
            />
            <button className="send-btn" onClick={send} disabled={!canSend} style={{
              width:"38px",height:"38px",borderRadius:"50%",border:"none",
              cursor:canSend?"pointer":"not-allowed",
              background:canSend
                ?"linear-gradient(135deg,#c020ff 0%,#ff2244 100%)"
                :"linear-gradient(135deg,#1a0030,#0d0018)",
              display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
              boxShadow:canSend?"0 0 14px #c020ff55":"none",
              transition:"all .15s ease",
            }}>
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none">
                <path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z"
                  stroke={canSend?"#fff":"#3d0a6066"}
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          <p style={{textAlign:"center",marginTop:"6px",color:"#8860d0",fontSize:"9px",letterSpacing:".7px"}}>
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </>
  );
}
