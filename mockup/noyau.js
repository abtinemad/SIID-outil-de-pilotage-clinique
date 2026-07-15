// @ts-check
// ══ noyau.js — le moteur du nœud, source unique ═══════════════════════════════════
// Extraction pure du CORE (jadis dupliqué dans continuum_mockup.html, app_mockup.html,
// dessin/01_file_active.html entre /*==CORE==*/ … /*==/CORE==*/). Aucune refonte : le
// corps ci-dessous est le CORE, extrait tel quel — aucune ligne de logique changée.
// Il n'existe plus de « canonique » ailleurs à recopier : ce fichier EST la source.
//
// Dépendances sortantes (le noyau ne les déclare pas — l'hôte les fournit) :
//   • refreshStatics — INJECTÉE (voir setRefreshStatics). No-op par défaut (Node).
//   • document       — ambient navigateur (applyRedGrad/setRed/setInk). Jamais atteint
//                      en Node : ces fonctions ne sont appelées que par l'hôte, jamais
//                      au chargement. (window/matchMedia n'est PAS utilisé ici : c'est
//                      l'hôte, pas le noyau, qui lit le dark-mode.)
//   • SET, POOL      — configuration : déclarés ici aux valeurs canoniques, exportés
//                      pour qu'un hôte les ajuste (mutation de propriétés).

/** @typedef {number[]} Pt  Un point [x, y] dans le repère 420×420. */
/**
 * @typedef {{plume:boolean, w:number, gap:number, contrast:number, nib:number, ptr?:number, ptex?:boolean}} SetConf
 *   Réglages de tracé de l'atelier. plume=false → trait simple ; true → ruban à plume.
 */

// refreshStatics : injectée par l'hôte. Les appels internes (setRed/setInk) ne changent pas.
let refreshStatics = () => {};
/**
 * Injecte la fonction que le noyau rappelle après un changement d'encre/rouge.
 * L'hôte (navigateur) la fournit ; en Node elle reste un no-op.
 * @param {() => void} fn
 */
export function setRefreshStatics(fn){ refreshStatics = fn; }

  var CX=210, CY=210, N=440, TAU=Math.PI*2;
  var INK="#1F222A", RED="#AD333F";   // base encre@36 / rouge@85 (rampes) — resynchro à l'init
  // --- couleurs réglables à l'œil, mais SUR UNE RAMPE contrainte (la cohérence est tenue) ---
  // rouge : uniquement le sacré (profond, saturé — jamais corail ni alarme). encre : uniquement la température (reste quasi-noire).
  var RED_STOPS=["#781A28","#8E1C2B","#A62A38","#B23A44"], INK_STOPS=["#0E1014","#15191E","#2A2F38","#474D57","#6A6F79"];
  function _h2r(h){ h=h.replace("#",""); return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]; }
  function _mix(a,b,f){ var A=_h2r(a),B=_h2r(b); return "#"+[0,1,2].map(function(i){ return ("0"+Math.round(A[i]+(B[i]-A[i])*f).toString(16)).slice(-2); }).join(""); }
  function _ramp(st,t){ t=Math.max(0,Math.min(1,t)); var n=st.length-1,x=t*n,i=Math.min(n-1,Math.floor(x)); return _mix(st[i],st[i+1],x-i); }
  function applyRedGrad(){ var sp=document.querySelectorAll("#ptSphere stop");
    if(sp.length===3){ sp[0].setAttribute("stop-color",_mix(RED,"#ffffff",0.16)); sp[1].setAttribute("stop-color",RED); sp[2].setAttribute("stop-color",_mix(RED,"#000000",0.42)); } }
  /** Règle le rouge sacré sur la rampe RED_STOPS. @param {number} t 0..1 */
  function setRed(t){ RED=_ramp(RED_STOPS,t); document.documentElement.style.setProperty("--red",RED); applyRedGrad(); refreshStatics(); }
  /** Règle l'encre sur la rampe INK_STOPS. @param {number} t 0..1 */
  function setInk(t){ INK=_ramp(INK_STOPS,t); document.documentElement.style.setProperty("--ink",INK); refreshStatics(); }

  // ---- une boucle nouée ancrée à sa base (se croise à la base) ----
  // ---- une boucle VRILLÉE : le fil ne se pince jamais ----
  // On manipule un fil fermé qu'on tord sur lui-même (pense 3D) — on ne dessine pas une forme finale.
  // Le terme impair dlt·(2φ−1) décale l'entrée (−δ) et la sortie (+δ) : les deux brins, lisses,
  // se croisent EN L'AIR juste au-dessus de la base — transversalement, sans angle.
  function loopPoint(phi, B, outA, len, width, dlt){
    var rad = len*Math.sin(Math.PI*phi);
    var lat = width*Math.sin(2*Math.PI*phi) + dlt*(2*phi-1);
    return [ B[0] + rad*Math.cos(outA) - lat*Math.sin(outA),
             B[1] + rad*Math.sin(outA) + lat*Math.cos(outA) ];
  }
  // paramètres par nombre de lobes (amplitude qui rétrécit pour éviter les parasites)
  function geomFor(L){
    if(L<=2) return {baseR:10, len:140, width:70, dlt:14, ppl:Math.floor(N/2)-8, conn:8};
    if(L===3) return {baseR:44, len:120, width:66, dlt:12, ppl:Math.floor(N/3)-6, conn:6};
    return         {baseR:50, len:98,  width:44, dlt:9,  ppl:Math.floor(N/5)-5, conn:5};
  }
  // ── ASYM / build / KF / KN / KCO / shapeAt / nodesAt / lobeCount : désormais PAR INSTANCE.
  //    Construits dans creerForme() (plus bas) ; le DÉFAUT global les ré-exporte à l'identique.
  //    Les helpers sans état (geomFor, loopPoint, resample, buildKnot2, selfX, xNodes…) restent
  //    ici, partagés — ils prennent leur donnée en argument, jamais un singleton de forme.

  // ré-échantillonnage uniforme d'une polyligne fermée à M points
  function resample(pts, M){
    var closed=pts.concat([pts[0]]), len=[0], tot=0;
    for(var i=1;i<closed.length;i++){ tot+=Math.hypot(closed[i][0]-closed[i-1][0],closed[i][1]-closed[i-1][1]); len.push(tot); }
    var out=[], step=tot/M, j=0;
    for(var m=0;m<M;m++){
      var d=m*step; while(j<len.length-1 && len[j+1]<d) j++;
      var seg=len[j+1]-len[j]||1, f=(d-len[j])/seg;
      out.push([ closed[j][0]+(closed[j+1][0]-closed[j][0])*f, closed[j][1]+(closed[j+1][1]-closed[j][1])*f ]);
    }
    return out;
  }

  // état 2 = le nœud à DEUX LOBES. §19 : ce nœud EST le C + O de CONTINUUM — donc la forme-interface
  // et la signature du wordmark sont un seul et même objet. Asymétrie (loi générale) : deux amandes
  // PLIÉES inégales (gauche plus grande = le C, droite plus petite = le O), aucune ronde, partageant
  // le nœud central. Un fil fermé, un croisement. Les lobes 3/5 sont latents : ils se déplient ensuite.
  function buildKnot2(sc, sym){
    var sL=(sc && sc[0])||1, sR=(sc && sc[1])||1;   // échelles par lobe (défaut 1 = forme d'origine)
    var Nx=CX-10, Ny=CY, pts=[];
    function drop(dir,w,h,lean,steps){
      for(var i=0;i<=steps;i++){ var t=-Math.PI/2+(i/steps)*Math.PI;
        var c=Math.cos(t), s=Math.sin(t), dd=1+s*s, yy=h*(s*c/dd*2);
        pts.push([Nx+dir*w*(c/dd*2)+lean*yy, Ny+yy]); }
    }
    // sym : les deux faces au même gabarit. L'asymétrie native (le C dominant le O) est celle de la
    // MARQUE ; sur l'instrument elle dirait « la Continuité est plus grande » — un verdict par la
    // forme. La veilleuse et le logo gardent le C et le O ; l'écran bilobe part d'un socle égal.
    drop(-1, 88*sL, 158*sL, -0.20, 180);
    if(sym) drop(+1, 88*sR, 158*sR, +0.20, 180);   // le miroir exact du gauche
    else    drop(+1, 96*sR, 116*sR, +0.05, 150);   // le O : plus rond, plus petit (la marque)
    for(var pass=0;pass<2;pass++){ var sm=[], n=pts.length;  // 2 passes 1-2-1 : le croisement reste franc (le pli) mais lissé
      for(var i=0;i<n;i++){ var a=pts[(i-1+n)%n], b=pts[i], c=pts[(i+1)%n];
        sm.push([(a[0]+2*b[0]+c[0])/4,(a[1]+2*b[1]+c[1])/4]); } pts=sm; }
    return { pts:resample(pts,N) };
  }

  // (les trois formes-clés K2/K3/K5, KF, KN, KCO sont construites PAR forme — voir creerForme)

  // signature CO — le fil est souple : devant le nom entier, il se donne la forme des lettres qu'il remplace.
  // Construction d'après le dessin manuscrit : un élastique REPLIÉ — une boucle rabattue sur l'autre.
  // §19 : la signature CO du wordmark EST le nœud à deux lobes (K2). Plus de buildCO séparé.
  // KCO est câblé sur K2 après lecture du croisement central (voir après selfX).

  function lerp(a,b,u){ return a+(b-a)*u; }
  function clamp(x,a,b){ return x<a?a:(x>b?b:x); }
  function smooth(x){ x=clamp(x,0,1); return x*x*(3-2*x); }
  function easeAngle(cur,tgt,k){ var d=((tgt-cur+Math.PI*3)%(Math.PI*2))-Math.PI; return cur+d*k; }
  function f1(x){ return x.toFixed(1); }

  // (shapeAt / nodesAt / lobeCount sont des méthodes de forme — voir creerForme)

  // ==== TRACÉ — réglages de l'atelier ====
  /** @type {SetConf} */
  var SET={ plume:true, w:12, gap:1.5, contrast:2.5, nib:225*Math.PI/180, ptr:1.3, ptex:true };
  var POOL=20; // patchs dessus-dessous simultanés (transitoires de morphose compris)

  // repère mobile : normales unitaires + angle de tangente (courbe fermée)
  function frameOf(P){
    var n=P.length, nx=new Array(n), ny=new Array(n), an=new Array(n);
    for(var i=0;i<n;i++){
      var A=P[(i-1+n)%n], B=P[(i+1)%n], tx=B[0]-A[0], ty=B[1]-A[1], L=Math.hypot(tx,ty)||1;
      tx/=L; ty/=L; nx[i]=-ty; ny[i]=tx; an[i]=Math.atan2(ty,tx);
    }
    return {nx:nx, ny:ny, an:an};
  }
  // plume à bec : largeur = f(angle tangente − angle du bec), lissée — largeur moyenne = wMean
  function widthsFor(an, wMean){
    var n=an.length, r=SET.contrast, wMin=2*wMean/(1+r), wMax=r*wMin, w=new Array(n), i;
    for(i=0;i<n;i++) w[i]=wMin+(wMax-wMin)*Math.abs(Math.sin(an[i]-SET.nib));
    for(var pass=0;pass<2;pass++){
      var s=w.slice();
      for(i=0;i<n;i++) w[i]=(s[(i-2+n)%n]+s[(i-1+n)%n]+s[i]+s[(i+1)%n]+s[(i+2)%n])/5;
    }
    return w;
  }
  // auto-intersections du fil (polyligne fermée) — rejet bbox + dédoublonnage des contacts rasants
  function selfX(P){
    var n=P.length, i, j;
    var bx0=new Array(n), bx1=new Array(n), by0=new Array(n), by1=new Array(n);
    for(i=0;i<n;i++){
      var A=P[i], B=P[(i+1)%n];
      bx0[i]=Math.min(A[0],B[0]); bx1[i]=Math.max(A[0],B[0]);
      by0[i]=Math.min(A[1],B[1]); by1[i]=Math.max(A[1],B[1]);
    }
    var X=[];
    for(i=0;i<n;i++){
      for(j=i+2;j<n;j++){
        if(i===0 && j===n-1) continue; // adjacents par le bouclage
        if(bx1[i]<bx0[j] || bx1[j]<bx0[i] || by1[i]<by0[j] || by1[j]<by0[i]) continue;
        var a=P[i], b=P[(i+1)%n], c=P[j], d=P[(j+1)%n];
        var r1x=b[0]-a[0], r1y=b[1]-a[1], r2x=d[0]-c[0], r2y=d[1]-c[1];
        var den=r1x*r2y-r1y*r2x; if(Math.abs(den)<1e-9) continue;
        var qx=c[0]-a[0], qy=c[1]-a[1];
        var t=(qx*r2y-qy*r2x)/den, u=(qx*r1y-qy*r1x)/den;
        // intervalle fermé : un croisement peut tomber pile sur un sommet (∞ : centre à t=π/2) ;
        // les doublons de sommet sont fusionnés par le dédoublonnage ci-dessous
        if(t<-0.001||t>1.001||u<-0.001||u>1.001) continue;
        var sn=Math.abs(den)/((Math.hypot(r1x,r1y)*Math.hypot(r2x,r2y))||1);
        X.push({i:i+t, j:j+u, x:a[0]+r1x*t, y:a[1]+r1y*t, s:sn});
      }
    }
    // fusion des croisements trop proches (naissance d'une boucle : contact rasant → grappe)
    var R=SET.w+2*SET.gap+3, out=[], k, m;
    X.sort(function(p,q){ return q.s-p.s; });
    for(k=0;k<X.length;k++){
      var cnd=X[k], dup=false;
      for(m=0;m<out.length;m++){ if(Math.hypot(out[m].x-cnd.x, out[m].y-cnd.y)<R){ dup=true; break; } }
      if(!dup) out.push(cnd);
      if(out.length>=POOL) break;
    }
    out.sort(function(p,q){ return p.j-q.j; });
    return out;
  }
  // les nœuds d'une forme = ses croisements réels, triés par angle depuis le haut (ordre des labels)
  function xNodes(P){
    var X=selfX(P), nd=[], i;
    for(i=0;i<X.length;i++) nd.push([X[i].x, X[i].y]);
    nd.sort(function(a,b){
      // coupure du tri décalée de ~3° avant le haut : le nœud du sommet (x=CX±ε) reste premier
      var aa=(Math.atan2(a[1]-CY,a[0]-CX)+Math.PI/2+0.05+TAU)%TAU,
          bb=(Math.atan2(b[1]-CY,b[0]-CX)+Math.PI/2+0.05+TAU)%TAU;
      return aa-bb; });
    return nd;
  }
  // (KN et KCO sont construits PAR forme depuis xNodes(KF) — voir creerForme)
  // tronçon de fil sur [a,b] (indices fractionnaires, avec bouclage) + largeurs/normales interpolées
  function slice(P, W, F, a, b){
    var n=P.length, sp=[], sw=[], sx=[], sy=[];
    function push(t){
      var fl=Math.floor(t), i=((fl%n)+n)%n, i2=(i+1)%n, f=t-fl;
      sp.push([P[i][0]+(P[i2][0]-P[i][0])*f, P[i][1]+(P[i2][1]-P[i][1])*f]);
      if(W){
        sw.push(W[i]+(W[i2]-W[i])*f);
        var vx=F.nx[i]+(F.nx[i2]-F.nx[i])*f, vy=F.ny[i]+(F.ny[i2]-F.ny[i])*f, L=Math.hypot(vx,vy)||1;
        sx.push(vx/L); sy.push(vy/L);
      }
    }
    push(a);
    for(var k=Math.floor(a)+1;k<=Math.floor(b);k++) push(k);
    if(b>Math.floor(b)) push(b);
    return {p:sp, w:sw, nx:sx, ny:sy};
  }
  function toOpen(pts){ var d="M"; for(var i=0;i<pts.length;i++) d+=f1(pts[i][0])+" "+f1(pts[i][1])+(i<pts.length-1?" L":""); return d; }
  function toClosed(pts){ return toOpen(pts)+" Z"; }
  // ruban à largeur variable : suite de quadrilatères partageant leurs sommets (sans couture)
  function ribbonD(p, w, nx, ny, extra, closed){
    var d="", n=p.length, last=closed?n:n-1;
    for(var k=0;k<last;k++){
      var k2=(k+1)%n, h0=(w[k]+extra)/2, h1=(w[k2]+extra)/2;
      d+="M"+f1(p[k][0]+nx[k]*h0)+" "+f1(p[k][1]+ny[k]*h0)
        +"L"+f1(p[k2][0]+nx[k2]*h1)+" "+f1(p[k2][1]+ny[k2]*h1)
        +"L"+f1(p[k2][0]-nx[k2]*h1)+" "+f1(p[k2][1]-ny[k2]*h1)
        +"L"+f1(p[k][0]-nx[k]*h0)+" "+f1(p[k][1]-ny[k]*h0)+"Z";
    }
    return d;
  }

  // compose une scène tracée : base + trous (masque) + brins de dessus.
  // Règle du dessus (doctrine de la torsion) : le fil qui REPASSE sur lui-même passe dessus
  // → au croisement (i,j), i<j, c'est le second passage (j) qui couvre le premier.
  function composeScene(P, kScale){
    var K=kScale||1, w0=SET.w*K, gap=SET.gap*K;
    var F=null, W=null, i;
    if(SET.plume){ F=frameOf(P); W=widthsFor(F.an, w0); }
    var sc={ mode:SET.plume?"ribbon":"stroke", w:w0,
             baseD:SET.plume ? ribbonD(P, W, F.nx, F.ny, 0, true) : toClosed(P),
             holes:[], holeW:[], inks:[], inkW:[] };
    var per=0; for(i=0;i<P.length;i++){ var Q=P[(i+1)%P.length]; per+=Math.hypot(Q[0]-P[i][0],Q[1]-P[i][1]); }
    var mean=per/P.length;
    var XS=selfX(P);
    for(i=0;i<XS.length;i++){
      var c=XS[i], n=P.length;
      var iU=((Math.round(c.i)%n)+n)%n, iO=((Math.round(c.j)%n)+n)%n;
      var wU=SET.plume?W[iU]:w0, wO=SET.plume?W[iO]:w0;
      var sn=Math.max(0.30, c.s);
      var halfPx=((wU+wO)/2+gap)/sn + wO*0.35;
      var hIdx=Math.min(halfPx/mean, n*0.05);
      var ext=(wO*0.9+1.2)/mean;
      var a=c.j-hIdx, b=c.j+hIdx;
      if(sc.mode==="stroke"){
        sc.holes.push(toOpen(slice(P,null,null,a,b).p));           sc.holeW.push(wO+2*gap);
        sc.inks.push(toOpen(slice(P,null,null,a-ext,b+ext).p));    sc.inkW.push(wO);
      } else {
        var sH=slice(P,W,F,a,b), sI=slice(P,W,F,a-ext,b+ext);
        sc.holes.push(ribbonD(sH.p,sH.w,sH.nx,sH.ny, 2*gap, false)); sc.holeW.push(0);
        sc.inks.push(ribbonD(sI.p,sI.w,sI.nx,sI.ny, 0, false));      sc.inkW.push(0);
      }
    }
    return sc;
  }

  // scène → SVG autonome (signature du wordmark, épreuves, export). uid : ids de masque uniques. vb : viewBox optionnel (cadrage serré).
  /**
   * Scène tracée → SVG autonome.
   * @param {Pt[]} P fil fermé
   * @param {Pt|null} node nœud à marquer (ou null)
   * @param {number} kScale échelle du trait
   * @param {string} uid préfixe d'id de masque (unicité)
   * @param {number} [ptR] rayon du point
   * @param {string} [vb] viewBox optionnel
   * @returns {string}
   */
  function sceneSVG(P, node, kScale, uid, ptR, vb){
    var sc=composeScene(P, kScale), mid=uid+"cut", k;
    var s='<svg xmlns="http://www.w3.org/2000/svg" viewBox="'+(vb||"0 0 420 420")+'">';
    s+='<defs><mask id="'+mid+'" maskUnits="userSpaceOnUse" x="-90" y="-90" width="600" height="600">'
      +'<rect x="-90" y="-90" width="600" height="600" fill="#fff"/>';
    for(k=0;k<sc.holes.length;k++){
      s+= sc.mode==="stroke"
        ? '<path d="'+sc.holes[k]+'" fill="none" stroke="#000" stroke-width="'+f1(sc.holeW[k])+'" stroke-linecap="butt"/>'
        : '<path d="'+sc.holes[k]+'" fill="#000" stroke="#000" stroke-width="0.7" stroke-linejoin="round"/>';
    }
    s+='</mask></defs>';
    s+= sc.mode==="stroke"
      ? '<path d="'+sc.baseD+'" fill="none" stroke="'+INK+'" stroke-width="'+f1(sc.w)+'" stroke-linecap="round" stroke-linejoin="round" mask="url(#'+mid+')"/>'
      : '<path d="'+sc.baseD+'" fill="'+INK+'" stroke="'+INK+'" stroke-width="0.7" stroke-linejoin="round" mask="url(#'+mid+')"/>';
    for(k=0;k<sc.inks.length;k++){
      s+= sc.mode==="stroke"
        ? '<path d="'+sc.inks[k]+'" fill="none" stroke="'+INK+'" stroke-width="'+f1(sc.inkW[k])+'" stroke-linecap="round" stroke-linejoin="round"/>'
        : '<path d="'+sc.inks[k]+'" fill="'+INK+'" stroke="'+INK+'" stroke-width="0.7" stroke-linejoin="round"/>';
    }
    if(node){
      var pr=(ptR||8.5)*(SET.ptr||1);
      s+='<circle cx="'+f1(node[0])+'" cy="'+f1(node[1])+'" r="'+f1(pr*1.10)+'" fill="#E9ECEF"/>';
      s+='<circle cx="'+f1(node[0])+'" cy="'+f1(node[1])+'" r="'+f1(pr)+'" fill="'+RED+'"/>';
      if(SET.ptex){
        s+='<circle cx="'+f1(node[0])+'" cy="'+f1(node[1])+'" r="'+f1(pr*0.36)+'" fill="'+INK+'"/>';
        s+='<circle cx="'+f1(node[0]-pr*0.34)+'" cy="'+f1(node[1]-pr*0.40)+'" r="'+f1(pr*0.36*0.34)+'" fill="#F4F1EC"/>';
      }
    }
    return s+'</svg>';
  }
  // ---- POLICE-FIL ----
  // Chaque glyphe est écrit du MÊME fil que le nœud : une polyligne monolinéaire, bouts ronds,
  // sans empattement. Métrique commune : haut=140, ligne de base=860 (cap-height 720).
  function wireGlyph(ch){
    var T=140, B=860, H=B-T;
    switch(ch){
      case "I": return { d:"M30 "+T+" L30 "+B, w:60 };
      case "T": return { d:"M0 "+T+" L420 "+T+" M210 "+T+" L210 "+B, w:420 };
      case "N": return { d:"M0 "+B+" L0 "+T+" L440 "+B+" L440 "+T, w:440 };
      case "U": var r=220; return { d:"M0 "+T+" L0 "+(B-r)+" A "+r+" "+r+" 0 0 0 440 "+(B-r)+" L440 "+T, w:440 };
      case "M": var ym=T+H*0.5; return { d:"M0 "+B+" L0 "+T+" L250 "+ym+" L500 "+T+" L500 "+B, w:500 };
      case ".": return { d:"", w:0, dot:true };
      default:  return { d:"", w:70 };
    }
  }
  // rend un glyphe en SVG autonome, épaisseur S (unités glyphe). CAP_EM cale la cap-height en em.
  var CAP_EM=0.72;
  function wireLetterSVG(ch, S){
    var g=wireGlyph(ch), pad=S/2+7, T=140, B=860;
    if(g.dot){
      var dr=S*0.62, vw=dr*2+2*pad, vh=vw, hpx=(vh/720*CAP_EM);
      return { svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="'+f1(-pad-dr)+' '+f1(B-dr-pad)+' '+f1(vw)+' '+f1(vh)+'" '
        +'style="height:'+hpx.toFixed(3)+'em;display:block;overflow:visible"><circle cx="0" cy="'+B+'" r="'+f1(dr)+'" fill="'+INK+'"/></svg>',
        ar:vw/vh };
    }
    var x0=-pad, y0=T-pad, vw=g.w+2*pad, vh=(B-T)+2*pad, hpx=(vh/720*CAP_EM);
    return { svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="'+f1(x0)+' '+f1(y0)+' '+f1(vw)+' '+f1(vh)+'" '
      +'style="height:'+hpx.toFixed(3)+'em;display:block;overflow:visible">'
      +'<path d="'+g.d+'" fill="none" stroke="'+INK+'" stroke-width="'+f1(S)+'" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      ar:vw/vh };
  }
  // croissant (lune) : reflet net posé au bord haut-gauche de la pupille. Cx,Cy = centre pupille, k = rayon.
  function crescD(Cx,Cy,k){
    if(k<0.2) return "";
    var Ax=Cx-0.42*k, Ay=Cy-0.46*k, rA=0.64*k;
    var Bx=Ax+0.32*k, By=Ay+0.34*k, rB=0.64*k;
    var dx=Bx-Ax, dy=By-Ay, d=Math.sqrt(dx*dx+dy*dy);
    if(d<1e-4||d>=rA+rB) return "";
    var a=(d*d+rA*rA-rB*rB)/(2*d), h=Math.sqrt(Math.max(0,rA*rA-a*a));
    var ux=dx/d, uy=dy/d, mx=Ax+a*ux, my=Ay+a*uy;
    var p1x=mx-h*uy, p1y=my+h*ux, p2x=mx+h*uy, p2y=my-h*ux;
    return "M"+p1x.toFixed(1)+" "+p1y.toFixed(1)+" A"+rA.toFixed(1)+" "+rA.toFixed(1)+" 0 1 0 "+p2x.toFixed(1)+" "+p2y.toFixed(1)
      +" A"+rB.toFixed(1)+" "+rB.toFixed(1)+" 0 0 1 "+p1x.toFixed(1)+" "+p1y.toFixed(1)+"Z";
  }

  // ══ Forme PAR INSTANCE (receveur explicite — cadrage Option B) ════════════════════
  // Chaque forme possède SES ASYM/KF/KN/KCO et ses méthodes liées (build/shapeAt/nodesAt/
  // lobeCount/setGrainPenta), qui lisent CETTE forme. Aucune variable ambient, aucun reset :
  // deux formes ne peuvent pas fuir l'une dans l'autre. Les helpers sans état (geomFor,
  // loopPoint, resample, buildKnot2, selfX, xNodes, lerp, clamp…) restent au module, partagés.
  function creerForme(opts){
    var SYM = !!(opts && opts.symetrique);   // socle bilobe égal (l'instrument) vs C/O (la marque)
    // ASYMÉTRIE — loi générale de la marque : aucun lobe n'est le clone d'un autre.
    // Propre à CETTE forme (littéral neuf, jamais l'objet partagé).
    var ASYM = {
      3: { s:[0.97, 1.12, 0.90], a:[0, 0.11, -0.07] },   // L1 (bas-droite) = Vigilante, la plus grande : la largeur du champ scruté, jamais un volume déposé (§18 bis)
      5: { s:[1.13, 0.89, 1.06, 0.87, 1.04], a:[0, 0.08, -0.05, 0.07, -0.05] }
    };
    // construit le fil (points) pour L lobes vrillés, asymétriques — nœuds réels lus ensuite sur le fil
    function build(L){
      var g=geomFor(L), pts=[], l, s, c;
      var az=ASYM[L], SC=function(i){ return az? az.s[i] : 1; }, AO=function(i){ return az? az.a[i] : 0; };
      var LEN=function(i){ return g.len*SC(i); }, DL=function(i){ return g.dlt*SC(i); };
      var WID=function(i){ return g.width*(0.55+0.45*SC(i)); }; // la largeur varie moins que la longueur
      var ANG=function(i){ return (i/L)*2*Math.PI - Math.PI/2 + AO(i); };
      for(l=0;l<L;l++){
        var ang=ANG(l), ln=LEN(l), wd=WID(l), dl=DL(l);
        var B=[CX+g.baseR*Math.cos(ang), CY+g.baseR*Math.sin(ang)];
        for(s=0;s<=g.ppl;s++) pts.push(loopPoint(s/g.ppl, B, ang, ln, wd, dl));
        // connecteur C¹ : sortie de CE lobe (longueur/torsion locales) → entrée du SUIVANT (les siennes)
        var m=(l+1)%L, angN=ANG(m), lnN=LEN(m), wdN=WID(m), dlN=DL(m);
        var BN=[CX+g.baseR*Math.cos(angN), CY+g.baseR*Math.sin(angN)];
        var od=[Math.cos(ang),Math.sin(ang)], ld=[-Math.sin(ang),Math.cos(ang)];
        var odN=[Math.cos(angN),Math.sin(angN)], ldN=[-Math.sin(angN),Math.cos(angN)];
        var kT=2*Math.PI*wd+2*dl, kTN=2*Math.PI*wdN+2*dlN;
        var P0=[B[0]+dl*ld[0],  B[1]+dl*ld[1]];
        var P3=[BN[0]-dlN*ldN[0], BN[1]-dlN*ldN[1]];
        var v0=[-Math.PI*ln*od[0]+kT*ld[0],   -Math.PI*ln*od[1]+kT*ld[1]];
        var v3=[ Math.PI*lnN*odN[0]+kTN*ldN[0], Math.PI*lnN*odN[1]+kTN*ldN[1]];
        var n0=Math.hypot(v0[0],v0[1]), n3=Math.hypot(v3[0],v3[1]);
        var dist=Math.hypot(P3[0]-P0[0],P3[1]-P0[1]), k=dist*0.28;
        var A=[P0[0]+v0[0]/n0*k, P0[1]+v0[1]/n0*k], D=[P3[0]-v3[0]/n3*k, P3[1]-v3[1]/n3*k];
        for(c=1;c<=g.conn+3;c++){ var t=c/(g.conn+4), u=1-t;
          pts.push([u*u*u*P0[0]+3*u*u*t*A[0]+3*u*t*t*D[0]+t*t*t*P3[0],
                    u*u*u*P0[1]+3*u*u*t*A[1]+3*u*t*t*D[1]+t*t*t*P3[1]]); }
      }
      // une passe de lissage 1-2-1 : arrondit sommets et raccords (le fil est souple, pas tendu)
      var sm=[], n=pts.length;
      for(var i2=0;i2<n;i2++){ var a=pts[(i2-1+n)%n], b=pts[i2], c2=pts[(i2+1)%n];
        sm.push([(a[0]+2*b[0]+c2[0])/4,(a[1]+2*b[1]+c2[1])/4]); }
      // ré-échantillonne à un nombre fixe de points (pour morpher entre états)
      return { pts:resample(sm, N) };
    }
    // trois formes-clés — propres à cette forme
    var K2=buildKnot2(undefined, SYM), K3=build(3), K5=build(5);
    var KF=[K2.pts, K3.pts, K5.pts];
    var KN=[ xNodes(KF[0]).slice(0,1), xNodes(KF[1]), xNodes(KF[2]) ];
    var KCO={ pts:K2.pts, nodes:KN[0].length?KN[0]:[[CX,CY]] }; // §19 : la signature EST le nœud 2-lobes
    // fil interpolé à s∈[0,2] — N points, fermeture par retour au premier (jamais de doublon)
    function shapeAt(s){
      s=clamp(s,0,2); var seg=s<=1?0:1, u=s<=1?s:s-1, A=KF[seg], B=KF[seg+1], out=[];
      for(var i=0;i<N;i++) out.push([lerp(A[i][0],B[i][0],u), lerp(A[i][1],B[i][1],u)]);
      return out;
    }
    // nœuds interpolés (nombre = celui de l'état le plus proche)
    function nodesAt(s){
      s=clamp(s,0,2);
      if(s<0.5) return KN[0];
      if(s<1.5) return KN[1];
      return KN[2];
    }
    function lobeCount(s){ return nodesAt(s).length; }
    // Le grain penta PAR INSTANCE : la densité par lobe module la TAILLE du 5-lobes et
    // reconstruit KF[2]/KN[2]. Corps équivalent au regenPentalobe d'app_mockup (hors labels/PET_BY,
    // qui restent côté page). `d` = densité par lobe ; absente/0 → grain canonique (neutre).
    var GRAIN = ASYM[5].s.slice(), K_AMP = 0.30, TAU_D = 4;
    function setGrainPenta(d){
      for(var i=0;i<5;i++) ASYM[5].s[i] = GRAIN[i]*(1 + K_AMP*(1-Math.exp(-((d&&d[i])||0)/TAU_D)));
      var K5b=build(5); KF[2]=K5b.pts; KN[2]=xNodes(KF[2]);
    }
    // Le grain BI PAR INSTANCE : la densité par face (Continuité, Fragmentation) écrit KF[0]/KN[0].
    // §19 : la MASSE, jamais le poids. MAIS au bilobe la matière REDISTRIBUE — elle ne fait pas
    // grossir (≠ pentalobe, dont les 5 axes SE PARTAGENT les fragments ; le ∞ est déjà pleine largeur).
    var ASYM2 = { s:[1,1] };                     // le bilobe n'est pas dans ASYM (il a sa propre fonction)
    var K_BI = 0.10;   // ≤ 0,11 mesuré : au-delà, le lobe gauche sort du viewBox (x<0)
    var K_GAIN = 0.22;                   // gain de la racine : le plafond K_BI est atteint à un ratio
                                         // de 0,40/0,60 — un déséquilibre réel, pas un frémissement.
                                         // Plus haut, l'échelle sature sur la plage normale (mesuré :
                                         // à 0.34, un ratio de 0,468 consommait déjà 85 % de la course).
    // Le bilobe est déjà pleine largeur et ses DEUX faces sont nourries par chaque dépôt : la
    // matière ne le fait pas grossir, elle se RÉPARTIT — une boucle prend ce que l'autre perd.
    // Le ∞ garde son emprise ; ce qui se lit, c'est de quel côté la matière tombe.
    function setGrainBi(d){                       // d = [densité Continuité, densité Fragmentation]
      var a=(d&&d[0])||0, b=(d&&d[1])||0, t=a+b;
      var ch = t>0 ? (a-b)/t : 0;          // −1 (tout à droite) .. +1 (tout à gauche)
      // racine : la même courbe que l'assiette de la balance. Le ratio de matière vit près de 0,5
      // (chaque dépôt nourrit les deux faces) : une loi linéaire ne montrerait rien.
      var k = Math.sign(ch) * Math.sqrt(Math.abs(ch)) * K_GAIN;
      if(k >  K_BI) k =  K_BI;             // saturation : la géométrie ne permet pas plus
      if(k < -K_BI) k = -K_BI;
      ASYM2.s[0] = 1+k; ASYM2.s[1] = 1-k;
      var K2b=buildKnot2(ASYM2.s, SYM); KF[0]=K2b.pts; KN[0]=xNodes(KF[0]).slice(0,1);
    }
    return { ASYM:ASYM, KF:KF, KN:KN, KCO:KCO, K2:K2, K3:K3, K5:K5,
             build:build, shapeAt:shapeAt, nodesAt:nodesAt, lobeCount:lobeCount,
             setGrainPenta:setGrainPenta, setGrainBi:setGrainBi };
  }
  export { creerForme };

  // ── Le DÉFAUT global : rétro-compatibilité totale ─────────────────────────────────
  // Tout appelant existant lit/écrit CE défaut, exactement comme avant (mêmes noms, même
  // usage). Seul le code multi-instance (le clone) appellera creerForme() pour sa propre forme.
  const _defaut = creerForme();
  const ASYM = _defaut.ASYM, build = _defaut.build,
        K2 = _defaut.K2, K3 = _defaut.K3, K5 = _defaut.K5,
        KF = _defaut.KF, KN = _defaut.KN, KCO = _defaut.KCO,
        shapeAt = _defaut.shapeAt, nodesAt = _defaut.nodesAt, lobeCount = _defaut.lobeCount;

// ── Export large : toute l'API des écrans + ce que le test touche (selfX, KF, KN).
//    Exporter large ne coûte rien en ES ; trier public/privé casserait un consommateur.
export {
  CX, CY, N, TAU,
  INK, RED, RED_STOPS, INK_STOPS,
  _h2r, _mix, _ramp, applyRedGrad, setRed, setInk,
  loopPoint, geomFor, ASYM, build, resample, buildKnot2,
  K2, K3, K5, KF, KN, KCO,
  lerp, clamp, smooth, easeAngle, f1,
  shapeAt, nodesAt, lobeCount,
  SET, POOL,
  frameOf, widthsFor, selfX, xNodes,
  slice, toOpen, toClosed, ribbonD,
  composeScene, sceneSVG,
  wireGlyph, CAP_EM, wireLetterSVG, crescD
};
