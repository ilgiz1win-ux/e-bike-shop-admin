// Big TAYAN car for the home hero: a white sedan in side view cruising along a gold-edged road.
// The car stays put while the world moves (road dashes, roadside posts, the ridges behind),
// so it reads as driving without leaving the frame. CSS classes .hd-* in tayan-car.css.
function tayanCar(id){
  const wheel=(cx)=>`<g class="hd-wheel" transform="translate(${cx} 90)">
      <circle r="23" fill="#141a17"/><circle r="16" fill="url(#${id}rim)"/>
      <g class="hd-spokes">${[0,72,144,216,288].map(a=>`<rect x="-2" y="-15" width="4" height="13" rx="2" fill="#5d6a63" transform="rotate(${a})"/>`).join("")}</g>
      <circle r="4" fill="#d6a649"/></g>`;
  return `<svg class="hd-svg" viewBox="0 0 360 130" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
  <defs>
    <linearGradient id="${id}body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#eef1ee"/><stop offset="1" stop-color="#c9d1cc"/></linearGradient>
    <linearGradient id="${id}glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1c5a44"/><stop offset="1" stop-color="#082a1e"/></linearGradient>
    <radialGradient id="${id}rim"><stop offset="0" stop-color="#e9eeea"/><stop offset="1" stop-color="#9aa6a0"/></radialGradient>
    <linearGradient id="${id}beam" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff6d6" stop-opacity=".75"/><stop offset="1" stop-color="#fff6d6" stop-opacity="0"/></linearGradient>
    <linearGradient id="${id}gold" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b9842f"/><stop offset=".5" stop-color="#f3cf7a"/><stop offset="1" stop-color="#b9842f"/></linearGradient>
  </defs>
  <!-- road -->
  <rect x="-20" y="108" width="400" height="22" fill="rgba(0,0,0,.18)"/>
  <rect x="-20" y="107" width="400" height="2.5" fill="url(#${id}gold)"/>
  <g class="hd-dashes"><rect x="-40" y="118" width="480" height="3" fill="url(#${id}dash)"/></g>
  <g class="hd-posts">${[0,90,180,270,360].map(x=>`<rect x="${x}" y="88" width="3" height="20" rx="1.5" fill="#d6a649" opacity=".55"/>`).join("")}</g>
  <!-- speed lines behind -->
  <g class="hd-speed" stroke="#f3cf7a" stroke-linecap="round" stroke-width="2.5">
    <path d="M4 66H34" opacity=".7"/><path d="M14 80H40" opacity=".5"/><path d="M0 94H26" opacity=".4"/>
  </g>
  <g class="hd-car">
    <!-- headlight beam on the road ahead -->
    <path class="hd-beam" d="M330 70L380 54V100L330 84Z" fill="url(#${id}beam)"/>
    <ellipse cx="190" cy="112" rx="150" ry="6" fill="rgba(0,0,0,.35)"/>
    <g class="hd-body">
      <path d="M44 92C40 92 38 89 38 85V76C38 66 46 60 58 58L104 52C120 36 140 27 166 26H214C236 26 254 34 272 50L312 56C326 58 334 66 334 78V85C334 89 331 92 327 92Z" fill="url(#${id}body)"/>
      <path d="M118 52C132 39 148 33 168 33H200V52Z" fill="url(#${id}glass)"/>
      <path d="M206 33H214C232 33 248 40 262 52H206Z" fill="url(#${id}glass)"/>
      <path d="M130 46C142 38 154 36 168 36" stroke="#9fd7bd" stroke-width="2" stroke-linecap="round" fill="none" opacity=".6"/>
      <path d="M56 74H318" stroke="url(#${id}gold)" stroke-width="3" stroke-linecap="round"/>
      <path d="M203 54V88M140 56V88" stroke="#c4ccc7" stroke-width="1.5"/>
      <rect x="168" y="62" width="14" height="3" rx="1.5" fill="#9aa6a0"/><rect x="230" y="62" width="14" height="3" rx="1.5" fill="#9aa6a0"/>
      <path class="hd-head" d="M318 62L332 64C333 67 333 70 332 72L318 70Z" fill="#fff8de"/>
      <path d="M40 66L48 64V74L40 75Z" fill="#e5484d"/>
    </g>
    <circle cx="96" cy="90" r="27" fill="#0d2a20"/><circle cx="274" cy="90" r="27" fill="#0d2a20"/>
    ${wheel(96)}${wheel(274)}
  </g>
  <pattern id="${id}dashp" width="48" height="3" patternUnits="userSpaceOnUse"><rect width="26" height="3" rx="1.5" fill="#f3cf7a" opacity=".8"/></pattern>
  </svg>`.replace(`url(#${id}dash)`,`url(#${id}dashp)`);
}
