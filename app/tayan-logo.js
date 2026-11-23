// TAYAN mark as an animated inline SVG (one driver: CSS keyframes in app.css, classes .tl-*).
// Order: the tile appears, the gold arc draws, ridges rise, the gold peak fills in, the road draws,
// the car drives toward the viewer, the wordmark strokes write themselves, the motto rises, a sheen passes.
// Every element's resting style is its final look, so with reduced motion it simply shows the finished logo.
// Sky-blue + white look: every colour in an SVG string is mapped by its lightness onto one sky-blue ramp.
function tealize(svg){
  if(!document.documentElement.classList.contains("mono")) return svg;
  const S=[[0,[8,47,73]],[0.35,[3,105,161]],[0.6,[14,165,233]],[0.82,[186,230,253]],[1,[255,255,255]]], hx=n=>n.toString(16).padStart(2,"0");
  return svg.replace(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g,(m,h)=>{ if(h.length===3) h=h.split("").map(c=>c+c).join("");
    const r=parseInt(h.slice(0,2),16),g=parseInt(h.slice(2,4),16),b=parseInt(h.slice(4,6),16), L=(0.299*r+0.587*g+0.114*b)/255;
    for(let i=1;i<S.length;i++){ const [a,ca]=S[i-1],[e,cb]=S[i]; if(L<=e){ const k=e>a?(L-a)/(e-a):0; return "#"+[0,1,2].map(j=>hx(Math.round(ca[j]+(cb[j]-ca[j])*k))).join(""); } }
    return "#ffffff"; });
}
function tayanSVG(id, opts){
  const o=Object.assign({motto:"Ишеним менен жолго чык", loop:false}, opts||{});
  const g=id; // gradient ids must be unique per copy on the page
  const L=(d,k)=>`<path class="tl-w tl-w${k}" pathLength="1" d="${d}"/>`;
  // wordmark: T Λ Y A N drawn as strokes, cap line 346, baseline 410
  const T='M50 346H114M82 346V410', LAM='M128 410L166 346L204 410', Y='M220 346L254 382L288 346M254 382V410', A='M302 410L340 346L378 410M318 386H362', N='M396 410V346L456 410V346';
  return tealize(`<svg class="tayan-svg${o.loop?" tl-loop":""}" viewBox="0 0 512 512" role="img" aria-label="TAYAN. ${o.motto}">
  <defs>
    <linearGradient id="${g}bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#10583e"/><stop offset=".55" stop-color="#0a3d2b"/><stop offset="1" stop-color="#06291d"/></linearGradient>
    <radialGradient id="${g}hl" cx=".5" cy=".28" r=".6"><stop offset="0" stop-color="#1d7a55" stop-opacity=".55"/><stop offset="1" stop-color="#1d7a55" stop-opacity="0"/></radialGradient>
    <linearGradient id="${g}gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6d98e"/><stop offset=".5" stop-color="#d9a84c"/><stop offset="1" stop-color="#b9842f"/></linearGradient>
    <linearGradient id="${g}sheen" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff3cf" stop-opacity="0"/><stop offset=".5" stop-color="#fff3cf" stop-opacity=".45"/><stop offset="1" stop-color="#fff3cf" stop-opacity="0"/></linearGradient>
    <clipPath id="${g}tile"><rect width="512" height="512" rx="96"/></clipPath>
    <radialGradient id="${g}lamp"><stop offset="0" stop-color="#fffbe8"/><stop offset=".4" stop-color="#fff2c2" stop-opacity=".9"/><stop offset="1" stop-color="#fff2c2" stop-opacity="0"/></radialGradient>
  </defs>
  <g clip-path="url(#${g}tile)">
    <rect class="tl-tile" width="512" height="512" rx="96" fill="url(#${g}bg)"/>
    <rect width="512" height="512" fill="url(#${g}hl)"/>
    <!-- ram-horn ornament along the bottom edge -->
    <g class="tl-orn" fill="none" stroke="#1f7a55" stroke-width="4" stroke-linecap="round" opacity=".5">
      ${[44,140,236,332,428].map(x=>`<path d="M${x} 496c0-16 12-22 20-17 7 4 5 13-2 13M${x+40} 496c0-16-12-22-20-17-7 4-5 13 2 13"/>`).join("")}
      <path d="M24 474H488" stroke-width="2.5" opacity=".6"/>
    </g>
    <!-- far ridges -->
    <path class="tl-ridge tl-ridge-l" d="M0 300L54 252L84 270L132 228L186 290L0 300Z" fill="#14563d"/>
    <path class="tl-ridge tl-ridge-r" d="M330 292L398 238L432 258L470 232L512 256V300Z" fill="#14563d"/>
    <!-- sun arc -->
    <path class="tl-arc" pathLength="1" d="M176 236A128 128 0 1 1 424 246" fill="none" stroke="url(#${g}gold)" stroke-width="9" stroke-linecap="round"/>
    <!-- gold peak with snow cuts -->
    <g class="tl-peak">
      <path d="M104 276L202 198L226 212L296 116L334 168L350 156L432 250L456 276Z" fill="url(#${g}gold)"/>
      <path d="M296 116L282 186L258 214L296 172L318 212L334 168Z" fill="#0b4130"/>
      <path d="M202 198L214 228L226 212Z" fill="#0b4130" opacity=".8"/>
      <path d="M350 156L344 196L366 182Z" fill="#0b4130" opacity=".8"/>
    </g>
    <!-- road: two gold edges and a dashed centre line, coming toward the viewer from the bend -->
    <g fill="none" stroke-linecap="round">
      <path class="tl-road tl-road1" pathLength="1" d="M300 222C372 224 410 236 400 262C388 292 300 304 60 336" stroke="url(#${g}gold)" stroke-width="12"/>
      <path class="tl-road tl-road2" pathLength="1" d="M302 230C350 232 372 240 362 256C352 272 300 284 168 302" stroke="url(#${g}gold)" stroke-width="5"/>
      <path class="tl-dash" d="M304 226C362 228 392 238 382 259C372 280 300 294 112 320" stroke="#f3cf7a" stroke-width="4" stroke-dasharray="10 12"/>
    </g>
    <!-- car, front view -->
    <g class="tl-car">
      <path d="M150 288c0-16 6-26 18-30l10-18c4-6 10-8 18-8h28c8 0 14 2 18 8l10 18c12 4 18 14 18 30v12H150Z" fill="#f7f7f2"/>
      <path d="M184 240h52l10 18h-72Z" fill="#0b3527"/>
      <path d="M150 300h120v6c0 4-3 6-6 6H156c-3 0-6-2-6-6Z" fill="#d8dcd6"/>
      <rect x="192" y="282" width="36" height="6" rx="3" fill="#0b3527"/>
      <rect x="140" y="252" width="12" height="7" rx="3" fill="#f7f7f2"/><rect x="268" y="252" width="12" height="7" rx="3" fill="#f7f7f2"/>
      <ellipse class="tl-lamp" cx="168" cy="274" rx="22" ry="12" fill="url(#${g}lamp)"/>
      <ellipse class="tl-lamp" cx="252" cy="274" rx="22" ry="12" fill="url(#${g}lamp)"/>
      <path d="M160 272l14-3 2 5-14 2Z M260 272l-14-3-2 5 14 2Z" fill="#0b3527"/>
    </g>
    <!-- wordmark -->
    <g fill="none" stroke="#fbfaf5" stroke-width="19" stroke-linejoin="miter" stroke-linecap="butt">
      ${L(T,1)}${L(LAM,2)}${L(Y,3)}${L(A,4)}${L(N,5)}
    </g>
    <path class="tl-tri" d="M166 378L154 410H178Z" fill="url(#${g}gold)"/>
    <!-- motto -->
    <g class="tl-motto">
      <path d="M58 450H118M394 450H454" stroke="#d9a84c" stroke-width="3" stroke-linecap="round"/>
      <text x="256" y="457" text-anchor="middle" fill="#e9c068" font-family="Montserrat, 'Inter Display', system-ui, sans-serif" font-style="italic" font-weight="600" font-size="21">${o.motto}</text>
    </g>
    <!-- sheen -->
    <rect class="tl-sheen" x="-200" y="0" width="160" height="512" fill="url(#${g}sheen)" transform="skewX(-16)"/>
  </g></svg>`);
}
