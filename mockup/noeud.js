// ═════════════════════════════════════════════════════════════════════════════════════
//  noeud.js — le nœud riche (labels + morph 2/3/5 + œil complet), MULTI-INSTANCE.
//
//  Extrait tel quel d'app_mockup.html (render/œil/labels/oudjat/scouter/dashboard/flip).
//  Chaque nœud a SA forme (creerForme, noyau.js) → aucune fuite entre instances. Le module
//  lit la géométrie via forme.* (jamais les exports globaux), ne connaît AUCUN id de page
//  (#guichet/#tag/#hint/#strate) ni donnée patient (PASSE/FILE). Il émet des événements ;
//  la page décide. Témoin : mockup/testnoeud.mjs doit rester VERT.
//
//  API : creerNoeud(svgEl) → { setStrate(s), onStrateChange(cb), onLobe(cb), onEye(cb),
//        onEyeLong(cb), signaler(eyeState,gestType), setGrain(d), axes(), setEpaisseur(w),
//        detruire() }
// ═════════════════════════════════════════════════════════════════════════════════════
import { creerForme, CX, CY, N, TAU, INK, RED, lerp, clamp, smooth, easeAngle, f1, xNodes, composeScene, SET, POOL } from './noyau.js';

export function creerNoeud(svgEl, opts){
  "use strict";
  opts = opts || {};
  // Une seule source d'encre pour ce que PEINT le module (overs + monture oudjat). Défaut = INK
  // (constante noyau) → un hôte qui ne passe rien reste identique. Le FIL, lui, garde sa couleur
  // du CSS de la page (le module ne la force pas ; le CSS l'emporterait de toute façon).
  var encre = (opts.encre != null) ? opts.encre : INK;
  // opts.labels===false → le nœud se monte SANS labels (la file active). Défaut true : comportement actuel inchangé.
  var showLabels = (opts.labels !== false);
  var reduce = (typeof window!=='undefined' && window.matchMedia) ? window.matchMedia("(prefers-reduced-motion:reduce)").matches : false;
  var NS = "http://www.w3.org/2000/svg";
  var q = function(id){ return svgEl.querySelector('#'+id); };
  var fil=q('fil'), filR=q('filR'), grp=q('grp'), pt=q('pt'), ptHalo=q('ptHalo'),
      ptPup=q('ptPup'), ptIris=q('ptIris'), ptClipC=q('ptClipC'), ptCatch=q('ptCatch'),
      scouterG=q('scouter'), montureG=q('scMonture'), oudjatG=q('oudjat'),
      labels=q('labels'), eyeG=q('eyeG'), holesG=q('holes'), oversG=q('overs');
  var forme = creerForme();
  var densites=[0,0,0,0,0];                         // dernier d de setGrain (lu par angleMort)
  var cbStrate=function(){}, cbLobe=function(){}, cbEye=function(){}, cbEyeLong=function(){};
  var _prevLc=-1, rafId=0, mort=false;
  var LAB2=["Continuité","Fragmentation"];                 // bilobé : gauche(C)=Continuité, droit(O)=Fragmentation
  var LAB3=["Affective","Vigilante","Réflexive"];          // trilobé PAR INDICE DE BUILD : idx1=Vigilante (la plus grande, bas-droite ; = read/scouter, forme.ASYM[3]/DASH_MODE)
  var LAB5=["Familiale","Sociale","Professionnelle","Amoureuse","Soi"];
  var labelNodes=[], labelPaths=[], labelTP=[], soinN=null;
  var LSIZE={2:20, 3:16, 5:12};   // taille de police des labels PAR STRATE (bilobé plus grand : deux mots seuls)
  var labelScale=1;               // multiplicateur global (atelier)
  var LAB2POS={cont:{arc:-110, ins:5, flip:false}, frag:{arc:0, ins:5, flip:true}};   // bilobé, calage à l'œil : arc = position le long de la boucle · ins = retrait radial (hors du fil) · flip = sens de lecture (les deux boucles du ∞ sont parcourues en sens opposés)
  var curOff=[], curIns=[], curFlip=[];   // décalage (arc), retrait (radial), sens de lecture — par label
  function petalsFor(Q){                                   // pétales d'une forme quelconque : creux de rayon = séparateurs, pointe = max, rang horaire depuis le haut
    var n=Q.length, R=[], rmn=1e9, rmx=-1e9, i;
    for(i=0;i<n;i++){ var r=Math.hypot(Q[i][0]-CX,Q[i][1]-CY); R.push(r); if(r<rmn)rmn=r; if(r>rmx)rmx=r; }
    var thr=rmn+(rmx-rmn)*0.45, sep=[];
    for(i=0;i<n;i++){ var a=R[(i-1+n)%n], b=R[i], c=R[(i+1)%n]; if(b<=a && b<=c && b<thr) sep.push(i); }
    var ang=[], tipAt=[], tips=[];
    for(var k=0;k<sep.length;k++){ var i0=sep[k], i1=sep[(k+1)%sep.length], tr=-1, tip=Q[i0], kk=i0, g=0, step=0, ts=0;
      do{ if(R[kk]>tr){tr=R[kk];tip=Q[kk];ts=step;} kk=(kk+1)%n; step++; }while(kk!==i1 && ++g<n);
      tipAt[k]=ts; tips[k]=tip;
      var aa=Math.atan2(tip[1]-CY,tip[0]-CX)+Math.PI/2; while(aa<0)aa+=2*Math.PI; while(aa>=2*Math.PI)aa-=2*Math.PI;
      ang.push({k:k,a:aa}); }
    var srt=ang.slice().sort(function(A,B){return A.a-B.a;}), rank=[];
    for(var s=0;s<srt.length;s++) rank[srt[s].k]=s;
    return {sep:sep, rank:rank, tipAt:tipAt, tips:tips};
  }
  var PET_BY={2:petalsFor(forme.KF[0]), 3:petalsFor(forme.KF[1]), 5:petalsFor(forme.KF[2])};
  var curPET=null, curLc=0;
  // angle de build par lobe (pour aligner le mot trilobé sur l'identité réelle du lobe : Vigilante = idx1)
  function buildAngles(L){ var az=forme.ASYM[L], out=[]; for(var i=0;i<L;i++){ out.push((i/L)*2*Math.PI - Math.PI/2 + (az?az.a[i]:0)); } return out; }
  function buildIdxOf(tip,L){ var ta=Math.atan2(tip[1]-CY,tip[0]-CX), ANGL=buildAngles(L), bi=0, bd=1e9;
    for(var i=0;i<L;i++){ var d=Math.abs(Math.atan2(Math.sin(ta-ANGL[i]),Math.cos(ta-ANGL[i]))); if(d<bd){bd=d;bi=i;} } return bi; }
  // quel mot pour le pétale k : 5=rang horaire (inchangé) ; 3=indice de build (Vigilante=idx1) ; 2=côté x (gauche=Continuité)
  function wordFor(lc, PET, k){
    if(lc===5){ var li=(PET.rank[k]-2+5)%5; return {w:LAB5[li], soi:(li===4)}; }
    if(lc===3){ return {w:LAB3[buildIdxOf(PET.tips[k],3)], soi:false}; }
    return {w:(PET.tips[k][0]<CX?LAB2[0]:LAB2[1]), soi:false};
  }
  function buildLabels(lc){
    while(labels.firstChild) labels.removeChild(labels.firstChild);
    labelNodes=[]; labelPaths=[]; labelTP=[]; soinN=null;
    curLc = lc; curOff=[]; curIns=[]; curFlip=[];
    if(!showLabels){ curPET = null; return; }   // opts.labels===false : aucun label construit (#labels reste vide), à aucune strate ; le rendu L447 se garde sur `&& curPET`
    curPET = PET_BY[lc] || PET_BY[5];
    for(var k0=0;k0<curPET.sep.length;k0++){
      var wf=wordFor(lc, curPET, k0);
      if(lc===2){ var _p=(curPET.tips[k0][0]<CX)?LAB2POS.cont:LAB2POS.frag; curOff[k0]=_p.arc; curIns[k0]=_p.ins; curFlip[k0]=_p.flip; }
      else { curOff[k0]=0; curIns[k0]=0; curFlip[k0]=false; }
      var pth=document.createElementNS(NS,"path"); pth.setAttribute("id","lpath"+k0); pth.setAttribute("fill","none"); pth.setAttribute("stroke","none");
      labels.appendChild(pth); labelPaths.push(pth);
      var tx=document.createElementNS(NS,"text"); tx.setAttribute("text-anchor","middle");
      var tp=document.createElementNS(NS,"textPath"); tp.setAttribute("href","#lpath"+k0);
      tp.setAttributeNS("http://www.w3.org/1999/xlink","xlink:href","#lpath"+k0);
      if(wf.soi){ tp.appendChild(document.createTextNode("Soi")); var _nn=document.createElementNS(NS,"tspan"); _nn.textContent="n"; _nn.setAttribute("id","soinN"); tp.appendChild(_nn); soinN=_nn; }
      else tp.appendChild(document.createTextNode(wf.w));
      tx.appendChild(tp); labels.appendChild(tx); labelNodes.push(tx); labelTP.push(tp);
    }
  }
  // pool de patchs dessus-dessous (trous dans le masque + brins de dessus)
  var holeEls=[], inkEls=[];
  for(var k1=0;k1<POOL;k1++){
    var h=document.createElementNS(NS,"path"); holesG.appendChild(h); holeEls.push(h);
    var o=document.createElementNS(NS,"path"); oversG.appendChild(o); inkEls.push(o);
  }

  function applyScene(sc){
    if(sc.mode==="stroke"){
      fil.style.display=""; filR.style.display="none";
      fil.setAttribute("d", sc.baseD); fil.setAttribute("stroke-width", f1(sc.w));
    } else {
      fil.style.display="none"; filR.style.display="";
      filR.setAttribute("d", sc.baseD);
    }
    for(var k=0;k<POOL;k++){
      var h=holeEls[k], o=inkEls[k];
      if(k<sc.holes.length){
        h.setAttribute("d", sc.holes[k]); o.setAttribute("d", sc.inks[k]);
        if(sc.mode==="stroke"){
          h.setAttribute("fill","none"); h.setAttribute("stroke","#000");
          h.setAttribute("stroke-width", f1(sc.holeW[k])); h.setAttribute("stroke-linecap","butt");
          o.setAttribute("fill","none"); o.setAttribute("stroke",encre);
          o.setAttribute("stroke-width", f1(sc.inkW[k])); o.setAttribute("stroke-linecap","round"); o.setAttribute("stroke-linejoin","round");
        } else {
          h.setAttribute("fill","#000"); h.setAttribute("stroke","#000"); h.setAttribute("stroke-width","0.7"); h.setAttribute("stroke-linejoin","round");
          o.setAttribute("fill",encre); o.setAttribute("stroke",encre); o.setAttribute("stroke-width","0.7"); o.setAttribute("stroke-linejoin","round");
        }
      } else { h.setAttribute("d",""); o.setAttribute("d",""); }
    }
  }
  var ptRad=8.5, pupR=3, blinkStart=-99, blinkDur=0.3, nextBlink=2.5, pupFade=1;
  var wFixed=(opts.epaisseur != null) ? opts.epaisseur : 12, wData=10, EYE=(opts.eye != null) ? opts.eye : 2.5, eyeK=1, clickPulse=0; // épaisseur fixe (opts.epaisseur) / données ; œil neutre (opts.eye) + dynamique
  var irisThick=0.5, eyeX=0, eyeY=0, eyePlaced=false;   // iris (socle 0.5, figé) ; position lissée de l'œil (anti-téléportation)
  var eyeState='repos', eyeStateT=0, pupDil=0, glowS=1, bounceT=-9, bounceDur=1.3, gestType='none', spinAcc=0, interroNode=-1;   // SIGNALÉTIQUE VIGIE : état tenu + geste ponctuel + accumulateur de spin (gelable) + nœud d'accroche interro
  var flipping=false, flipStart=0, flipDur=1.7, flipAxis=0, inspFade=0, lastInter=0, IDLE_IN=14;  // retournement (2 tours) + inspection (boucle tenue) + horloge d'inactivite

  // §19 v2 — GARDIEN DE L'ANGLE MORT : la plus petite boucle restée (hors celle qu'on tient),
  // = le moins-documenté. Lit la taille de lobe (forme.ASYM[5].s), jamais un état de la personne.
  // §19 v2 — GARDIEN DE L'ANGLE MORT. Il lit `densites` : le volume de fragments rangés
  // par axe, jamais la constante d'asymétrie de la marque (qui désignait toujours le même
  // lobe, pour tous les patients — une garde décorative).
  // Si les cinq axes sont à zéro, il n'y a pas d'angle mort : tout l'est. L'œil circule
  // et ne désigne rien. Le silence de l'outil est une position (§15).
  function angleMort(held){
    var d=densites, b=-1, bv=1e9, tot=0, i;
    for(i=0;i<d.length;i++) tot+=d[i];
    if(tot===0) return -1;
    for(i=0;i<d.length;i++){ if(i===held) continue; if(d[i]<bv){ bv=d[i]; b=i; } }
    return b;
  }
  var gx=0, gy=0, aimScreen=3.927, cursorAngle=3.927, pointerActive=false, nibBase=225*Math.PI/180, spinDeg=0, reflBase=3.93;
  function refreshPoint(){
    var r=8.5*EYE; ptRad=r; pupR=r*0.36;
    pt.setAttribute("r", r.toFixed(2));
    pt.setAttribute("fill", SET.ptex ? "url(#ptSphere)" : RED);
    ptHalo.setAttribute("r", (r*1.06).toFixed(2)); // filet papier : sépare l'œil du fil
    ptHalo.setAttribute("fill", "#E9ECEF");
    ptPup.setAttribute("fill", INK);
    ptPup.setAttribute("opacity", SET.ptex ? "1" : "0"); // plat = pas de pupille
  }

  // ---- state ----
  var targetS=0, currentS=0, T=0, hop=0, HOP_FIL=0.0010, CENTER_R=75, ptParked=null;   // HOP_FIL : vitesse de l'œil sur le fil (baissé = plus lent) · CENTER_R : rayon de la zone-clic centrale (retour repos) — à régler à l'œil
  // DASHBOARD (Vigie) : l'œil entre dans une boucle (barycentre) et en ressort. Passage = franchir le fil, comme une corde à sauter.
  var dashLobe=-1, moveT=-9, moveFrom=[210,210], moveTo=[210,210], moveKind='over', moveDur=0.62; var eyeUnder=false;
  // ── TOUR DE NOTIF (porté de la veilleuse page-side · pas 2a) : gated bilobe. État SÉPARÉ (ne réutilise pas eyeState). ──
  var NT_OVER=0.5, NT_UNDER=-0.42, NT_LIFT=18, NT_GONFLE=0.8, NT_MS=2000;   // corde à sauter : over enfle+saute · under rétrécit · settle = gonflement final (×1,8 → repos)
  var NT_FLASH_A=0.55, NT_FLASH_K=4.5, NT_ATT_FLASH_MS=1800, NT_FREMI_AMP=1.2, NT_FREMI_HZ=13, NT_RETOUR_MS=5000;   // attente : flash net + frémi HF + re-tour
  var notifTour=false, notifTourT0=0, ntAttenteT0=0, notifStartXY=[CX,CY], ntFlash=1;
  // ── DICTÉE (porté de la veilleuse page-side · pas 2b) : vagues TRANSVERSES, pilotées par l'API (aucun gating de strate). ──
  var OND_AMP=14, OND_HZ=9, OND_ONDES=16, OND_EASE=0.12;   // amplitude (unités) · vitesse · nb de crêtes · douceur (ease du gate 0→1)
  var ondAmp=0, ondTarget=false;
  // ── VEILLEUSE (bilobe, en motion) : clic COURT → notif (cbEye) · clic LONG ≥500ms → oudjat (cbEyeLong). En reduce : clic direct oudjat (inchangé). ──
  var NT_LONG_MS=500, _ntTimer=0, _ntHandled=false, _ntDownXY=null;
  var NT_BOUNCE_DEG=8, NT_BOUNCE_MS=0.55;   // oudjat 'on' : petit rebond à l'ARRIVÉE du tour (ampleur °, durée) — un peu plus tenu
  var DASH_MODE=['compose','read','compose'];   // §19 : « deux lobes composent, un seul lit ». Le mode est la nature du lobe, non une humeur
                                                 // de l'œil : la lentille est l'organe de la seule Vigilante (idx1), pas un réglage disponible partout.
  var SCOUT={size:0.66, posX:-0.20, posY:0.02, dur:0.7, oriMin:-1, oriMax:12, montRest:-2, flipFrom:50};
  var scoutT=-9, wasScouting=false;   // mode DANS le lobe (§19, bloc B) : composer / lire. read=Vigilante = la boucle À DROITE (la plus grande, idx de tri 1 ; le tri top→droite→gauche interdit droite ET idx 2). Entrer dans le lobe read → scrutin (scouter).
  // ---- OUDJAT (2-lobes) : clic sur un lobe -> l'oeil parcourt le fil (sens selon le cote) -> la monture se pose ----
  var OUDJAT={size:1.0, ori:0, orbitDur:3.6};   // se regle a l'oeil : size = echelle relative au globe ; ori = inclinaison ; orbitDur = duree du tour (plus lente, solennelle)
  var oudjatPhase='off', oudjatT=-9, oudjatDir=1, oudjatStartIdx=0, oudjatOp=0, OUD_PUPX=737.5049, OUD_PUPY=693.7131;
  var FRQ=Math.round(0.2*N/TAU); // phase de frémissement périodique → le fil reste fermé au pixel près

  function livePts(){
    var pts=forme.shapeAt(currentS), pulse=reduce?1:(1+0.012*Math.sin(T*1.4)), out=[];
    for(var i=0;i<pts.length;i++){
      var x=pts[i][0]-CX, y=pts[i][1]-CY;
      if(!reduce){ var fr=1+0.010*Math.sin(T*2.1 + i*TAU*FRQ/N); x*=fr; y*=fr; }
      out.push([CX+x*pulse, CY+y*pulse]);
    }
    if(ondAmp>0.001 && !reduce){ var b=out.slice(),a,c,tx,ty,tl,nx,ny,d,M=out.length;   // DICTÉE : onde TRANSVERSE (normale au fil) → amplitude uniforme sur TOUT le ∞, nœud compris
      for(i=0;i<M;i++){ a=b[(i-1+M)%M];c=b[(i+1)%M];tx=c[0]-a[0];ty=c[1]-a[1];tl=Math.hypot(tx,ty)||1;
        nx=-ty/tl;ny=tx/tl;d=ondAmp*OND_AMP*Math.sin(T*OND_HZ + i*OND_ONDES*TAU/N);
        out[i]=[b[i][0]+nx*d,b[i][1]+ny*d]; } }
    return out;
  }

  // barycentre d'un lobe (Dashboard) : dans le CORPS du lobe, à mi-chemin centre→nœud. Robuste 3/5 lobes, suit la respiration du fil.
  function dashBary(k){ var nd=nodesic(); if(!nd.length) return [CX,CY]; k=clamp(k,0,nd.length-1); return [CX+2.25*(nd[k][0]-CX), CY+2.25*(nd[k][1]-CY)]; }   // 2.25 : DANS le corps de la boucle (le nœud/croisement est près du centre ; l'œil saute dans la boucle, pas sur le nœud)
  // point rouge : circule d'un nœud à l'autre, ou se pose (parked)
  function redXY(){
    var nodes=nodesic();
    if(nodes.length===0) return [CX,CY];
    if(interroNode>=0 && interroNode<nodes.length && Math.round(currentS)===1 && eyeState==='interro') return nodes[interroNode];   // INTERRO : accroché, ne circule plus entre les nœuds
    if(ptParked!==null && ptParked<nodes.length) return nodes[ptParked];
    if(Math.round(currentS)===1) return (dashLobe>=0 ? dashBary(dashLobe) : [CX,CY]);   // DASHBOARD (Vigie) : au CENTRE il veille (méta) ; entré dans une boucle, il se tient au barycentre du lobe
    if(reduce) return nodes[0];
    if(oudjatPhase==='on' && Math.round(currentS)===0) return (nodesic()[0] || [CX,CY]);   // oudjat posé : l'œil sur le nœud (la monture s'y pose) — glisse via le lissage existant
    var lp=livePts(), M=lp.length;                   // l'œil parcourt TOUT le fil, pas seulement la portion centrale entre les nœuds
    hop += HOP_FIL;
    var f=(hop%1)*M, i=Math.floor(f)%M, t=smooth(f-i), j=(i+1)%M;
    return [ lerp(lp[i][0],lp[j][0],t), lerp(lp[i][1],lp[j][1],t) ];
  }
  // nœuds avec la même respiration que le fil (pour rester posés dessus)
  function nodesic(){
    var nd=forme.nodesAt(currentS), pulse=reduce?1:(1+0.012*Math.sin(T*1.4)), out=[];
    for(var i=0;i<nd.length;i++){ var x=nd[i][0]-CX, y=nd[i][1]-CY; out.push([CX+x*pulse, CY+y*pulse]); }
    return out;
  }
  function render(){
    if(mort) return;
    T+=0.016;
    ondAmp += ((ondTarget?1:0) - ondAmp) * OND_EASE;   // DICTÉE : gate 0→1 (parle), retombe en douceur — lu par livePts
    currentS += (targetS-currentS)*0.06;
    if(Math.abs(targetS-currentS)<0.001) currentS=targetS;
    // OUDJAT - machine d'etat (2-lobes) : off -> orbit -> on ; quitter le 2-lobes reinitialise
    if(Math.round(currentS)!==0 && oudjatPhase!=='off') oudjatPhase='off';
    if(oudjatPhase==='orbit' && (T-oudjatT)>=OUDJAT.orbitDur){ oudjatPhase='on'; oudjatT=T; }
    oudjatOp += (((oudjatPhase==='on')?1:0)-oudjatOp)*(reduce?1:0.14);   // la monture apparaît dès le début du redressement, s'aligne avec le fil

    // rotation continue 360° : le logo flotte, le sens n'importe pas tant que c'est cohérent
    var scouting = (Math.round(currentS)===1 && dashLobe>=0 && DASH_MODE[dashLobe]==='read' && !flipping);   // SCOUTER : entré dans la boucle Vigilante (read) → l'œil scrute, spin gelé (il se gare)
    var interroLock = (Math.round(currentS)===1 && eyeState==='interro' && !flipping);   // INTERRO (démo atelier) : on fige le nœud et on accroche l'œil dessus
    if(oudjatPhase==='on'){ var _uT=Math.round(spinAcc/360)*360; spinAcc += (_uT-spinAcc)*0.06; }   // OUDJAT pose : la marque se redresse et se pose (repos)
    else if(!reduce && !interroLock && !scouting) spinAcc += 0.096;                            // 6°/s — gelé pendant l'interro OU le scrutin (l'œil s'arrête pour scruter)
    if(reduce){ spinDeg = 0; }                                           // témoin : inchangé
    else if(Math.round(currentS)===0){                                    // BILOBE (veilleuse) : off au repos, TOUR COMPLET pendant l'oudjat
      if(oudjatPhase==='off') spinDeg = 0;
      else if(oudjatPhase==='orbit'){ var _ot=Math.min(1,(T-oudjatT)/OUDJAT.orbitDur);
        spinDeg = 360*(1-Math.pow(1-_ot,3)); }                                          // TOUR COMPLET 0→360, easeOut (ralentit à l'arrivée)
      else { var _bt=(T-oudjatT);                                                       // 'on' = arrivée du tour : petit rebond puis blocage
        spinDeg = (_bt<NT_BOUNCE_MS)
          ? NT_BOUNCE_DEG*Math.sin(Math.PI*_bt/NT_BOUNCE_MS)*(1-_bt/NT_BOUNCE_MS)       // rebond amorti : petit dépassement (au-delà de 360) puis retour
          : 0;                                                                          // BLOCAGE horizontal (0 = 360)
      }
    } else { spinDeg = spinAcc%360; }                                     // currentS>0 : inchangé
    var spinRad=spinDeg*Math.PI/180;
    // direction de visée UNIQUE (partagée par le bec du fil et la lumière du reflet) :
    // suit la souris si le pointeur survole, sinon revient au bec réglé + dérive douce.
    var aimTarget = pointerActive ? cursorAngle : (nibBase + (reduce?0:0.30*Math.sin(T*0.13)));
    aimScreen = easeAngle(aimScreen, aimTarget, reduce?1:(pointerActive?0.12:0.05));
    SET.nib = aimScreen - spinRad;   // bec en repère local (compense la rotation) → nervure fixe à l'écran

    // épaisseur du fil : FIXE (12) en interface/dashboard, pilotée par les DONNÉES (fin→14) en vue patient
    var pat = smooth(currentS-1);            // 0 interface/dashboard → 1 patient
    SET.w = wFixed + (wData - wFixed)*pat;
    // taille de l'œil : neutre + survol + clic (pulse) + boucle déployée (on concentre le regard)
    if(!reduce) clickPulse *= 0.90;
    var eyeTarget = 1 + (pointerActive?0.05:0) + (ptParked!==null?0.20:0) + clickPulse;
    eyeK += (eyeTarget - eyeK)*(reduce?1:0.12);
    ptRad = 8.5*EYE*eyeK;
    var _gp=T-bounceT;                                   // GESTE ping (notif) : bref pop d'échelle (l'œil enfle puis revient)
    if(Math.round(currentS)===1 && gestType==='ping' && _gp>=0 && _gp<bounceDur){ ptRad *= 1 + 0.16*Math.exp(-_gp*5.5); }
    var _rmS=T-moveT;                                    // CORDE À SAUTER (échelle) : par-dessus (over) → l'œil enfle (vient vers l'utilisateur) ; par-dessous (under) → il rétrécit (recule derrière le fil)
    if(_rmS>=0 && _rmS<moveDur){ var _ra=Math.sin(Math.PI*(_rmS/moveDur)); ptRad *= 1 + _ra*(moveKind==='over'?0.5:-0.42); }
    pupR = ptRad*0.36;

    applyScene(composeScene(livePts(), 1));
    grp.setAttribute("transform","rotate("+spinDeg.toFixed(2)+" "+CX+" "+CY+")");

    // regard : cible = curseur (converti en repère local) si pointeur, sinon dérive autonome
    var gtx, gty;
    // L'œil ne suit PAS la souris (vue patient) : il fait son travail — dérive autonome + angle mort.
    gtx=0.60*Math.sin(T*0.6); gty=0.48*Math.sin(T*0.44+1.2);
    // Posé sur une boucle (concentration) → le regard s'ouvre par moments vers l'angle mort.
    // Le corps ne bouge pas ; seul le regard dérive, puis revient. Élargir, jamais détourner.
    if(ptParked!==null && SET.ptex){
      var _am=angleMort(ptParked);
      // ── Ce que l'œil désigne, il le DIT ─────────────────────────────────────────────
      // Un voyant lit la désignation dans l'inclinaison du regard. Un lecteur d'écran ne
      // recevait rien : l'angle mort était réservé aux yeux. Il ne l'est plus.
      // Ce n'est pas une conclusion — l'œil nomme l'axe vers lequel il se tourne, exactement
      // ce que le dessin montre déjà. Et quand il ne désigne rien, il ne dit rien : le
      // silence de l'outil est une position (§15), pas une chaîne vide à annoncer.
      designer(_am);
      if(_am>=0){
        var _nd=nodesic(), _an=_nd[_am], _p0=_nd[ptParked];
        var _da=Math.atan2(_an[1]-_p0[1], _an[0]-_p0[0]);
        var _g=Math.sin(T*0.5); _g = _g>0 ? _g*_g*_g : 0;        // coup d'œil bref, récurrent (~13 s), doux
        var _amp=0.5*_g;
        gtx = gtx*(1-_g) + Math.cos(_da)*_amp;
        gty = gty*(1-_g) + Math.sin(_da)*_amp;
      }
    } else designer(-1);
    var ek=reduce?1:0.08; gx+=(gtx-gx)*ek; gy+=(gty-gy)*ek;

    if(interroLock){
      if(interroNode<0){ var _nn=nodesic(),_bd=1e9,_bi=0; for(var _q=0;_q<_nn.length;_q++){var _dx=_nn[_q][0]-eyeX,_dy=_nn[_q][1]-eyeY,_dd=_dx*_dx+_dy*_dy; if(_dd<_bd){_bd=_dd;_bi=_q;}} interroNode=_bi; }   // accroche sur le nœud le plus proche
      if(gestType==='bounce' && T-bounceT>5.0) bounceT=T;                                                          // re-saut périodique (re-appel ~5 s)
    } else interroNode=-1;
    var _tgt=redXY();
    if(!eyePlaced){ eyeX=_tgt[0]; eyeY=_tgt[1]; eyePlaced=true; }
    var _ke=reduce?1:0.14; eyeX+=(_tgt[0]-eyeX)*_ke; eyeY+=(_tgt[1]-eyeY)*_ke;
    var _rmP=T-moveT;                                    // CORDE À SAUTER (trajectoire) : arc de moveFrom→moveTo + lift screen-up (contre-rotation du spin, comme le saut). L'arc ÉCRASE le lissage le temps du passage.
    if(_rmP>=0 && _rmP<moveDur){ var _u=_rmP/moveDur, _e=smooth(_u), _a=Math.sin(Math.PI*_u), _lift=(moveKind==='over'?22:13)*_a;
      eyeX=lerp(moveFrom[0],moveTo[0],_e) - _lift*Math.sin(spinRad);
      eyeY=lerp(moveFrom[1],moveTo[1],_e) - _lift*Math.cos(spinRad); }
    // RETOUR AU CENTRE : l'œil passe SOUS le fil — on remonte le calque du fil par-dessus l'œil le temps de l'animation
    // ORBITE OUDJAT : l'oeil chevauche le fil, un tour complet du ∞ ; sens selon le lobe clique (derive de la tangente)
    if(oudjatPhase==='orbit'){
      var _ou=Math.min(1,(T-oudjatT)/OUDJAT.orbitDur), _oe=smooth(_ou), _olp=livePts(), _oN=_olp.length;
      var _oi=(((oudjatStartIdx+oudjatDir*Math.round(_oe*_oN))%_oN)+_oN)%_oN;
      eyeX=_olp[_oi][0]; eyeY=_olp[_oi][1];
    }
    var _underNow=(_rmP>=0 && _rmP<moveDur && moveKind==='under');
    if(_underNow!==eyeUnder){ if(_underNow) grp.insertBefore(eyeG, grp.firstChild); else grp.insertBefore(eyeG, oversG.nextSibling); eyeUnder=_underNow; }
    // ── TOUR DE NOTIF : porté de render2 (veilleuse) · gated bilobe. Écrase eyeX/eyeY, ptRad, z ; flash via ntFlash (glow, plus bas). ──
    ntFlash=1;
    if(notifTour && Math.round(currentS)===0){
      var _ntBase=ptRad, _ntLp=livePts(), _ntN=_ntLp.length;
      var _ntNd=nodesic(), _ntC=_ntNd.length?_ntNd[0]:[CX,CY];        // nœud = le crossing du bilobe (centre)
      if(ntAttenteT0===0){                                            // NOTIF : le TOUR — WP = [départ, gaucheC, droiteC, gaucheC, droiteC, nœud]
        var _prog=(Date.now()-notifTourT0)/NT_MS;
        var _Lx=0,_Ly=0,_Lc=0,_Rx=0,_Ry=0,_Rc=0,_q;                   // barycentres gauche/droite depuis livePts() (comme render2)
        for(_q=0;_q<_ntN;_q++){ if(_ntLp[_q][0]<_ntC[0]-4){_Lx+=_ntLp[_q][0];_Ly+=_ntLp[_q][1];_Lc++;} else if(_ntLp[_q][0]>_ntC[0]+4){_Rx+=_ntLp[_q][0];_Ry+=_ntLp[_q][1];_Rc++;} }
        var _leftC=_Lc?[_Lx/_Lc,_Ly/_Lc]:_ntC, _rightC=_Rc?[_Rx/_Rc,_Ry/_Rc]:_ntC;
        var _WP=[notifStartXY,_leftC,_rightC,_leftC,_rightC,_ntC];
        var _KIND=["enter","under","over","under","settle"];          // entrer A · A→B dessous · B→A saute · A→B dessous COMPLET · remonte sur le nœud
        var _seg=Math.min(4,Math.floor(_prog*5)), _lt=smooth(_prog*5-_seg), _kind=_KIND[_seg];
        var _raw=[lerp(_WP[_seg][0],_WP[_seg+1][0],_lt), lerp(_WP[_seg][1],_WP[_seg+1][1],_lt)];
        var _ra=Math.sin(Math.PI*_lt);
        ptRad=_ntBase;
        if(_kind==="over"){ ptRad=_ntBase*(1+_ra*NT_OVER); _raw[1]-=NT_LIFT*_ra; }   // par-dessus : enfle + SAUTE (arc écran-haut)
        else if(_kind==="under"){ ptRad=_ntBase*(1+_ra*NT_UNDER); }                    // par-dessous : rétréci, derrière le fil
        if(_kind==="settle"){ var _gp=smooth((_prog-0.8)/0.2); ptRad=_ntBase*(1+NT_GONFLE*(1-_gp)); }   // émerge de l'autre côté puis REMONTE avec le gonflement
        eyeX=_raw[0]; eyeY=_raw[1];
        var _ntUnder=(_kind==="under");                               // z : SOUS le fil sur les deux passes complètes ; la remontée repasse par-dessus
        if(_ntUnder!==eyeUnder){ if(_ntUnder) grp.insertBefore(eyeG, grp.firstChild); else grp.insertBefore(eyeG, oversG.nextSibling); eyeUnder=_ntUnder; }
        if(_prog>=1){ ntAttenteT0=Date.now(); eyeX=_ntC[0]; eyeY=_ntC[1]; ptRad=_ntBase; if(eyeUnder){ grp.insertBefore(eyeG, oversG.nextSibling); eyeUnder=false; } }   // posé sur le nœud → ATTENTE
      } else {                                                        // ATTENTE : posé sur le nœud + frémi HF + flash + re-tour
        var _att=Date.now()-ntAttenteT0, _fs=_att/1000;
        eyeX=_ntC[0]+NT_FREMI_AMP*Math.sin(2*Math.PI*NT_FREMI_HZ*_fs);
        eyeY=_ntC[1]+NT_FREMI_AMP*Math.sin(2*Math.PI*NT_FREMI_HZ*_fs*1.07+1.3);
        ptRad=_ntBase;
        var _fl=(_att%NT_ATT_FLASH_MS)/1000; ntFlash=1+NT_FLASH_A*Math.exp(-_fl*NT_FLASH_K);   // flash net périodique
        if(_att>=NT_RETOUR_MS){ notifTourT0=Date.now(); ntAttenteT0=0; notifStartXY=[eyeX,eyeY]; }   // re-joue le tour tout seul, jusqu'à consultation
      }
    }
    var P=[eyeX,eyeY];
    // GESTE (Vigie) : saut sur place amorti — couche ponctuelle, superposée à l'état tenu. Déplace tout l'œil (globe+pupille+halo).
    var _bt=T-bounceT;
    if(Math.round(currentS)===1 && gestType==='bounce' && _bt>=0 && _bt<bounceDur){
      var _bmag=ptRad*0.55*Math.abs(Math.sin(Math.PI*_bt/0.42))*Math.exp(-_bt*1.5);   // plus haut, décroît plus lentement → 3 sauts bien lisibles
      P[0] += -_bmag*Math.sin(spinRad);   // saut VERTICAL à l'écran : contre-rotation du spin du nœud (sinon il part de côté)
      P[1] += -_bmag*Math.cos(spinRad);
    }
    ptHalo.setAttribute("cx",P[0].toFixed(1)); ptHalo.setAttribute("cy",P[1].toFixed(1)); ptHalo.setAttribute("r",(ptRad*1.06).toFixed(2));
    pt.setAttribute("cx",P[0].toFixed(1)); pt.setAttribute("cy",P[1].toFixed(1)); pt.setAttribute("r",ptRad.toFixed(2));
    ptClipC.setAttribute("cx",P[0].toFixed(1)); ptClipC.setAttribute("cy",P[1].toFixed(1)); ptClipC.setAttribute("r",ptRad.toFixed(2));
    var bf=1, cxp=P[0], cyp=P[1], breath=1, rx=pupR, ry=pupR, pupAng=0, pupVis=true, pbreath=pupR, gzv=1;
    // pbreath/gzv sont lus par le bloc IRIS (plus bas), qui vit HORS de la branche vivante (SET.ptex && !reduce) :
    // sans socle, ils sont undefined en reduced-motion → ptIris rx/ry NaN. Défauts = état « œil de face, pupille centrée ».
    if(SET.ptex && !reduce){
      // regard porté par un vecteur 3D (rgx,rgy,gzv). Trois états, distingués par le signe de gzv :
      //  · repos (aucune boucle)  → gzv>0 : l'œil FAIT FACE à l'utilisateur (dérive douce). Vers l'intérieur seulement après longue inactivité.
      //  · boucle tenue           → gzv<0 : l'œil regarde vers l'INTÉRIEUR de l'écran (le nœud, la boucle), effleurant les limbes.
      //  · clic                   → deux tours de globe, puis bascule vers l'état ci-dessus.
      var rgx=gx, rgy=gy, rad2=rgx*rgx+rgy*rgy;
      if(rad2>0.9){ var kk=Math.sqrt(0.9/rad2); rgx*=kk; rgy*=kk; rad2=0.9; }
      gzv=Math.sqrt(1-rad2);                              // défaut : face à l'utilisateur
      var idleFor=T-lastInter;                                // temps écoulé depuis la dernière interaction
      var _ci=Math.atan2(P[1]-CY, P[0]-CX);                   // azimuth : de l'œil vers l'EXTÉRIEUR — vers la boucle tenue, pas le centre (repère local)
      var wantInsp=((ptParked!==null || (dashLobe>=0 && Math.round(currentS)===1)) && !flipping)?1:0;   // regard SITUÉ : boucle patient tenue OU entré dans une boucle Dashboard
      inspFade += (wantInsp-inspFade)*0.03;
      var _interroPose=(Math.round(currentS)===1 && eyeState==='interro' && !flipping);   // posture interrogative : Vigie + état interro
      if(flipping){
        var el=T-flipStart, ax=Math.cos(flipAxis), ay=Math.sin(flipAxis);
        if(el<flipDur){                                      // DEUX tours propres (sens aléatoire) → l'œil traverse les limbes 4 fois
          var fa=(el/flipDur)*4*Math.PI, planar=Math.sin(fa)*0.92;
          rgx=planar*ax; rgy=planar*ay; gzv=Math.cos(fa);
        } else {                                             // nystagmus post-rotatoire amorti (bien visible), puis l'inspection prend le relais vers l'intérieur
          var st=el-flipDur;
          if(st>=0.9){ flipping=false; }
          else { var osc=Math.sin(st*20)*0.40*Math.exp(-st*4.5);
                 rgx=gx+osc*ax; rgy=gy+osc*ay;
                 var _r2=Math.min(0.9,rgx*rgx+rgy*rgy); gzv=Math.sqrt(1-_r2); }
        }
      } else if(scouting){                                   // SCOUTER (lobe Vigilante) : navette entre les deux nœuds de composition — l'écart montré, tenus à l'écart, JAMAIS un milieu (Q1)
        var _vnd=nodesic(), _vc0=-1, _vc1=-1;
        for(var _vq=0;_vq<DASH_MODE.length && _vq<_vnd.length;_vq++){ if(DASH_MODE[_vq]==='compose'){ if(_vc0<0)_vc0=_vq; else _vc1=_vq; } }
        if(_vc0>=0 && _vc1>=0){
          var _vg0=dashBary(_vc0), _va0=Math.atan2(_vg0[1]-P[1], _vg0[0]-P[0]);   // direction (repère local) vers un lobe de composition
          var _vg1=dashBary(_vc1), _va1=Math.atan2(_vg1[1]-P[1], _vg1[0]-P[0]);   // vers l'autre
          var _vT=Math.max(0,(T-moveT)-moveDur);                        // temps depuis que l'œil est assis (après la corde à sauter)
          var _vU=(_vT%2.2)/2.2, _vP0=_vU<0.5;                          // aller-retour, période 2.2 s ; un demi-cycle par pôle
          var _vSub=(_vU%0.5)/0.5, _vSeg=_vSub<0.78?0:(_vSub-0.78)/0.22; // fixation (78 %) puis saccade rapide — jamais de repos au milieu
          var _vFrom=_vP0?_va0:_va1, _vTo=_vP0?_va1:_va0;
          var _vD=Math.atan2(Math.sin(_vTo-_vFrom),Math.cos(_vTo-_vFrom)); // écart signé le plus court
          var _vAng=_vFrom+_vD*smooth(_vSeg);
          var _vJit=0.014*Math.sin(_vT*44)*(1-_vSeg);                   // micro-nystagmus pendant la fixation seulement
          rgx=Math.cos(_vAng)*0.34+_vJit; rgy=Math.sin(_vAng)*0.34+_vJit*0.6;
          var _vR2=Math.min(0.5,rgx*rgx+rgy*rgy); gzv=Math.sqrt(1-_vR2);
        }
      } else if(_interroPose){                               // POSTURE INTERROGATIVE : APPEL (3 sauts + darts assertifs) puis SCRUTIN (lecture saccadée de l'utilisateur)
        var _et=T-eyeStateT;
        if(_et<1.3){                                         // APPEL : darts marqués, alternés, calés sur les 3 sauts (« il t'appelle »)
          var _k=Math.floor(_et/0.42), _ph=(_et-_k*0.42)/0.42, _dir=(_k%2===0)?1:-1;
          rgx=0.18*_dir*(1-_ph); rgy=-0.12*(1-_ph);
          var _ir2=Math.min(0.5,rgx*rgx+rgy*rgy); gzv=Math.sqrt(1-_ir2);
        } else {                                             // SCRUTIN : lecture gauche→droite, ligne par ligne, descend, recommence — comme on lit une page — + micro-nystagmus
          var _st=_et-1.3, _cols=5, _rows=4, _fix=0.24;
          var _cell=Math.floor(_st/_fix)%(_cols*_rows), _col=_cell%_cols, _row=Math.floor(_cell/_cols);
          var _tgx=-0.20+0.40*_col/(_cols-1), _tgy=-0.13+0.26*_row/(_rows-1);
          var _jit=0.012*Math.sin(_st*46);                   // nystagmus fin pendant la fixation
          rgx=_tgx+_jit; rgy=_tgy+_jit*0.6;
          var _ir2b=Math.min(0.45,rgx*rgx+rgy*rgy); gzv=Math.sqrt(1-_ir2b);
        }
      } else if(inspFade>0.002){                             // BOUCLE TENUE : regard vers l'intérieur, balayant la boucle, effleurant le limbe puis passant derrière
        var az=_ci+0.35*Math.sin(T*0.23);                    // léger balayage autour de la direction de la boucle
        var _depth=0.30*Math.sin(T*0.31)+0.06;               // gzv cible ∈ [−0.24,+0.36] : pupille majoritairement AU LIMBE, pointée vers la boucle ; plonge derrière par intermittence
        var _lat=Math.sqrt(Math.max(0,1-_depth*_depth));
        rgx=rgx*(1-inspFade)+Math.cos(az)*_lat*inspFade;
        rgy=rgy*(1-inspFade)+Math.sin(az)*_lat*inspFade;
        gzv=gzv*(1-inspFade)+_depth*inspFade;
      } else if(idleFor>IDLE_IN){                             // REPOS PROLONGÉ : l'œil s'autorise par moments à regarder vers l'intérieur, puis revient
        var _ramp=Math.min(1,(idleFor-IDLE_IN)/6), _dv=Math.sin(T*0.11+2.0);
        if(_dv>0.72){ var _dd=(_dv-0.72)/0.28*_ramp; gzv=gzv*(1-_dd)+(-0.9)*_dd; }
      }
      breath=1+0.24*Math.sin(T*0.7);
      if(T>nextBlink){ blinkStart=T; nextBlink=T+2.2+Math.random()*3.6; }
      var bt=T-blinkStart;
      if(bt<blinkDur){ bf = bt<blinkDur*0.34 ? 1-bt/(blinkDur*0.34) : (bt-blinkDur*0.34)/(blinkDur*0.66); }
      var _gl=Math.hypot(rgx,rgy,gzv)||1; rgx/=_gl; rgy/=_gl; gzv/=_gl;   // regard = point unitaire sur la sphère → projection exacte (toutes animations), jamais de coupe
      // SIGNALÉTIQUE (Vigie, 3-lobes uniquement) : la pupille se dilate selon l'état émis par le Lien. Ailleurs → aucun effet (patient contemplatif).
      var _sig=(Math.round(currentS)===1), _dilT=0;
      if(_sig){
        if(eyeState==='eveil')       _dilT=0.30;      // éveil : pupille DILATÉE (attention large)
        else if(eyeState==='interro'){ var _ei=T-eyeStateT; _dilT=(_ei<0.5)?0.35:-0.28; }   // interro : DILATE (surprise) puis CONTRACTE (focus/scrutin)
      }
      pupDil += (_dilT-pupDil)*0.10;                        // dilatation lissée
      pbreath=pupR*breath*(1+pupDil);                   // rayon pupillaire effectif (socle × dilatation)
      // canal COULEUR : la luminosité du globe module selon l'état (éclaircir / pulser / scintiller). Gaté Vigie.
      var _glowT=1;
      if(_sig){ if(eyeState==='eveil') _glowT=1.10; else if(eyeState==='interro') _glowT=1.0+0.05*Math.sin(T*2.2); }
      glowS += (_glowT-glowS)*0.12;                        // base lissée (repos/éveil/interro)
      var glow=glowS;
      if(_sig && eyeState==='notif'){ var _n2=T-eyeStateT; glow=1+0.55*Math.exp(-_n2*4.5); }   // FLASH net (le globe s'illumine d'un coup puis retombe)
      var _gEff=glow*ntFlash;   // ntFlash : flash net de l'ATTENTE notif (≡ render2) ; vaut 1 le reste du temps
      pt.style.filter = (Math.abs(_gEff-1)>0.002) ? ("brightness("+_gEff.toFixed(3)+")") : "";
      pupVis = gzv>0.02;                                    // visible seulement sur la face avant
      rx=Math.max(0.01,pbreath*Math.max(0,gzv)*bf); ry=Math.max(0.01,pbreath*bf);
      var _pe=pbreath+irisThick+ptRad*0.16, _cosR=Math.sqrt(Math.max(0,1-(_pe/ptRad)*(_pe/ptRad)));   // rayon effectif = iris + marge PROPORTIONNELLE (ptRad*0.16) → gap constant quelle que soit la taille de l'oeil, aucune coupe au limbe
      pupFade = (gzv>0)?1:0;                                                              // face avant visible / face arrière occultée par le globe — pas de fondu
      cxp=P[0]+rgx*ptRad*_cosR; cyp=P[1]+rgy*ptRad*_cosR; pupAng=Math.atan2(rgy,rgx)*180/Math.PI;   // projection sphérique : le centre est tiré de cosρ → le bord effleure le limbe sans le franchir
      ptPup.setAttribute("cx",cxp.toFixed(1)); ptPup.setAttribute("cy",cyp.toFixed(1));
      ptPup.setAttribute("rx",rx.toFixed(2)); ptPup.setAttribute("ry",ry.toFixed(2));
      ptPup.setAttribute("transform","rotate("+pupAng.toFixed(1)+" "+cxp.toFixed(1)+" "+cyp.toFixed(1)+")");
      ptPup.setAttribute("opacity", pupFade.toFixed(3));
    } else {
      ptPup.setAttribute("cx",P[0].toFixed(1)); ptPup.setAttribute("cy",P[1].toFixed(1));
      ptPup.setAttribute("rx",pupR.toFixed(2)); ptPup.setAttribute("ry",pupR.toFixed(2));
      ptPup.setAttribute("transform",""); ptPup.setAttribute("opacity","1"); pupFade=1;
    }
    // iris (option) : anneau coloré SOUS la pupille, centré sur ELLE (synchronisé, il bouge avec la
    // pupille), réglable (0 = invisible), clippé à l'œil.
    if(SET.ptex && irisThick>0.05 && pupVis){
      ptIris.setAttribute("cx",cxp.toFixed(1)); ptIris.setAttribute("cy",cyp.toFixed(1));
      var _iro=Math.min(pbreath+irisThick, ptRad-0.6);                              // rayon de l'iris, suit la pupille dilatée, borné au globe
      ptIris.setAttribute("rx",Math.max(0.01,_iro*Math.max(0,gzv)*bf).toFixed(2)); ptIris.setAttribute("ry",Math.max(0.01,_iro*bf).toFixed(2));   // foreshortenée comme la pupille
      ptIris.setAttribute("transform","rotate("+pupAng.toFixed(1)+" "+cxp.toFixed(1)+" "+cyp.toFixed(1)+")");
      ptIris.setAttribute("opacity",pupFade.toFixed(3));
    } else ptIris.setAttribute("opacity","0");
    // reflet spéculaire : UNE seule source de lumière, imaginée dans la direction de la souris (ou de
    // l'inclinaison du bec au repos). Le point brillant orbite vers la lumière sur la cornée — aucun
    // mélange (donc aucun saut), aucun clignement. C'est de la lumière, pas du regard.
    if(SET.ptex){
      var _Ld = aimScreen - spinRad;                       // direction de la lumière, repère du globe (dans grp)
      var _off = ptRad*0.52;                               // le highlight se pose vers la lumière, sur la cornée
      var glx = P[0] + Math.cos(_Ld)*_off;
      var gly = P[1] + Math.sin(_Ld)*_off;
      ptCatch.setAttribute("cx",glx.toFixed(1)); ptCatch.setAttribute("cy",gly.toFixed(1));
      ptCatch.setAttribute("r",(pupR*0.34).toFixed(2));
      ptCatch.setAttribute("opacity","0.95");
    } else ptCatch.setAttribute("opacity","0");

    if(scouting && !wasScouting) scoutT=T;
    wasScouting=scouting;
    if(scouting){
      var _scr=spinDeg*Math.PI/180, _sdx=P[0]-CX, _sdy=P[1]-CY;
      var _scX=CX+_sdx*Math.cos(_scr)-_sdy*Math.sin(_scr)+SCOUT.posX*ptRad;
      var _scY=CY+_sdx*Math.sin(_scr)+_sdy*Math.cos(_scr)+SCOUT.posY*ptRad;
      var _eu=reduce?1:Math.min(1,(T-scoutT)/SCOUT.dur);
      var _es=1-Math.pow(1-_eu,3);
      var _k=SCOUT.size*ptRad/462;
      var _ori=reduce?2:(SCOUT.oriMin+(SCOUT.oriMax-SCOUT.oriMin)*(0.5+0.5*Math.sin(T*0.45)));
      var _mt=reduce?SCOUT.montRest:(SCOUT.flipFrom+(SCOUT.montRest-SCOUT.flipFrom)*_es);
      scouterG.setAttribute("transform","translate("+_scX.toFixed(1)+" "+_scY.toFixed(1)+") rotate("+_ori.toFixed(2)+") scale("+_k.toFixed(4)+") translate(-542 -877)");
      montureG.setAttribute("transform","translate(1005 877) rotate("+_mt.toFixed(2)+") scale(1.21) translate(-1005 -877)");
      scouterG.setAttribute("opacity","1");
    } else if(scouterG.getAttribute("opacity")!=="0"){ scouterG.setAttribute("opacity","0"); }
    // OUDJAT - la monture se pose sur l'oeil (hors #grp) : enregistree par sa pupille sur P, epinglee a l'orientation du fil
    if(oudjatOp>0.001){
      oudjatG.firstChild.setAttribute('fill', encre);                     // suit l'encre du fil (opts.encre)
      var _osr=spinDeg*Math.PI/180, _odx=P[0]-CX, _ody=P[1]-CY;
      var _oX=CX+_odx*Math.cos(_osr)-_ody*Math.sin(_osr);                 // P (repere local) -> ecran, comme le scouter
      var _oY=CY+_odx*Math.sin(_osr)+_ody*Math.cos(_osr);
      var _ok=OUDJAT.size*ptRad/173.79;                                   // echelle : pupille oudjat (rx≈173.79) calee sur le globe
      oudjatG.setAttribute('transform','translate('+_oX.toFixed(1)+' '+_oY.toFixed(1)+') rotate('+(spinDeg+OUDJAT.ori).toFixed(2)+') scale('+_ok.toFixed(4)+') translate('+(-OUD_PUPX)+' '+(-OUD_PUPY)+')');
      oudjatG.setAttribute('opacity', oudjatOp.toFixed(3));
    } else if(oudjatG.getAttribute('opacity')!=='0'){ oudjatG.setAttribute('opacity','0'); }

    // LABELS par strate (toujours visibles, comme le pentalobe) : opacité par plateau, jeu rebâti dans le creux du morph (aucun pop)
    var _rs=Math.round(currentS), _tlc=[2,3,5][_rs], lo;
    if(_rs===0)      lo=1-smooth((currentS-0.15)/0.30);                                   // bilobé : plein à s=0, éteint vers 0.45
    else if(_rs===1) lo=smooth((currentS-0.60)/0.15)*(1-smooth((currentS-1.40)/0.15));    // trilobé : fenêtre autour de s=1
    else             lo=smooth((currentS-1.55)/0.35);                                     // pentalobe : comme avant (plein vers s=2)
    lo=clamp(lo,0,1);
    if(_tlc!==curLc) buildLabels(_tlc);   // rebâtit au changement de strate (frontière s=0.5/1.5 : lo≈0, aucun pop)
    labels.setAttribute("opacity", lo.toFixed(3));
    labels.setAttribute("font-size", ((LSIZE[curLc]||12)*labelScale).toFixed(2));
    if(lo>0.02 && curPET){
      var PET=curPET, lp=livePts(), n=lp.length, INSET=13;    // retrait de base ; +curIns[k] par label
      var sr=spinDeg*Math.PI/180, cs=Math.cos(sr), sn=Math.sin(sr);
      for(var k=0;k<PET.sep.length;k++){
        var i0=PET.sep[k], i1=PET.sep[(k+1)%PET.sep.length], AR=[], idx=i0, g=0, dx, dy, ex, ey, rr, kf;
        var LIN=INSET+(curIns[k]||0);
        do{ dx=lp[idx][0]-CX; dy=lp[idx][1]-CY; ex=CX+dx*cs-dy*sn; ey=CY+dx*sn+dy*cs;
            rr=Math.hypot(ex-CX,ey-CY)||1; kf=(rr-LIN)/rr; AR.push([CX+(ex-CX)*kf, CY+(ey-CY)*kf]); idx=(idx+1)%n; }while(idx!==i1 && ++g<n);
        dx=lp[i1][0]-CX; dy=lp[i1][1]-CY; ex=CX+dx*cs-dy*sn; ey=CY+dx*sn+dy*cs;
        rr=Math.hypot(ex-CX,ey-CY)||1; kf=(rr-LIN)/rr; AR.push([CX+(ex-CX)*kf, CY+(ey-CY)*kf]);
        // lissage 3 points : adoucit les cassures près du croisement (torsion abandonnée)
        var SM=AR.slice(), a;
        for(a=1;a<AR.length-1;a++) SM[a]=[(AR[a-1][0]+AR[a][0]+AR[a+1][0])/3,(AR[a-1][1]+AR[a][1]+AR[a+1][1])/3];
        AR=SM;
        var f=Math.min(PET.tipAt[k], AR.length-1);                            // ancré au bord le plus loin du centre (la pointe) — figé, suit le nœud sans coulisser
        if(curFlip[k]){ AR.reverse(); f=AR.length-1-f; }    // inverse le sens de lecture (le tip reste le point d'ancrage)
        var d="M"+AR[0][0].toFixed(1)+" "+AR[0][1].toFixed(1), sofar=0;
        for(a=1;a<AR.length;a++){ d+="L"+AR[a][0].toFixed(1)+" "+AR[a][1].toFixed(1);
          if(a<=f) sofar+=Math.hypot(AR[a][0]-AR[a-1][0],AR[a][1]-AR[a-1][1]); }
        labelPaths[k].setAttribute("d", d);
        labelTP[k].setAttribute("startOffset", (sofar + (curOff[k]||0)).toFixed(1));
      }
      if(soinN){                                             // le "n" de Soin : respire calmement (Soi <-> Soin), en rouge
        var _nf = reduce ? 1 : 0.5 + 0.5*Math.sin(T*0.7);    // respiration douce (~9 s)
        soinN.setAttribute("opacity", _nf.toFixed(2));
      }
    }

    var lc=forme.lobeCount(currentS);
    if(lc!==_prevLc){ _prevLc=lc; cbStrate(Math.round(currentS), lc, ctxDe(lc)); }

    rafId = requestAnimationFrame(render);
  }
  // 2-LOBES : le toggle oudjat (orbite → pose ; re-appui → la monture se lève), EXTRAIT pour être réutilisé par le long-press.
  function _oudjatToggle(e){
    var _r=svgEl.getBoundingClientRect();
    var _mx=(e.clientX-_r.left)/_r.width*420, _my=(e.clientY-_r.top)/_r.height*420;
    var _sr=spinDeg*Math.PI/180, _cc=Math.cos(-_sr), _ss=Math.sin(-_sr), _dx=_mx-CX, _dy=_my-CY;
    _mx=CX+_dx*_cc-_dy*_ss; _my=CY+_dx*_ss+_dy*_cc;                     // de-rotation du spin
    var _side=(_mx < (CX-10))?-1:1;                                     // < croisement (CX-10) = lobe gauche (C) ; sinon lobe droit (O)
    if(oudjatPhase==='off'){
      var _lp=livePts(), _nd=(nodesic()[0]||[CX,CY]), _bi=0, _bd=1e9;
      for(var _i=0;_i<_lp.length;_i++){ var _ex=_lp[_i][0]-_nd[0], _ey=_lp[_i][1]-_nd[1], _d2=_ex*_ex+_ey*_ey; if(_d2<_bd){_bd=_d2;_bi=_i;} }
      var _tx=_lp[(_bi+1)%_lp.length][0]-_lp[_bi][0];                   // tangente.x au point de depart
      oudjatDir=(_side>0)?(_tx>=0?1:-1):(_tx>=0?-1:1);                  // partir VERS le lobe clique -> droite/gauche = sens opposes
      oudjatStartIdx=_bi; oudjatPhase='orbit'; oudjatT=T;
    } else { oudjatPhase='off'; oudjatT=T; }
  }
  svgEl.addEventListener("click",function(e){
    lastInter=T;
    // 2-LOBES (veilleuse) : en MOTION, le pointer gère (clic court=notif / long=oudjat). En REDUCE, raccourci direct (inchangé, témoin sauf).
    if(Math.round(currentS)===0){
      if(reduce){ blinkStart=T; clickPulse=0.15; if(oudjatPhase==='off'){ oudjatPhase='on'; oudjatT=T; } else { oudjatPhase='off'; oudjatT=T; } }
      return;
    }
    blinkStart=T; clickPulse=0.15; // clin d'œil + petit sursaut vivant quand on touche le regard (pentalobe/trilobe)
    if(!reduce){ flipping=true; flipStart=T; flipAxis=Math.random()*2*Math.PI; }   // le clic fait tournoyer l'œil (sens aléatoire) — TOUTES les vues
    if(forme.lobeCount(currentS)<3) return;            // interface (2 lobes) : rien à viser
    var r=svgEl.getBoundingClientRect();
    var mx=(e.clientX-r.left)/r.width*420, my=(e.clientY-r.top)/r.height*420;
    // le groupe est tourné de spinDeg : ramener le clic dans le repère des nœuds (dé-tourner de -spinRad)
    var spinRad=spinDeg*Math.PI/180;
    var _cc=Math.cos(-spinRad), _ss=Math.sin(-spinRad), _mdx=mx-CX, _mdy=my-CY;
    mx=CX+_mdx*_cc-_mdy*_ss; my=CY+_mdx*_ss+_mdy*_cc;
    // nœud/lobe le plus proche du clic
    var nd=nodesic(), best=0, bd=1e9;
    for(var i=0;i<nd.length;i++){ var d=Math.hypot(nd[i][0]-mx,nd[i][1]-my); if(d<bd){bd=d;best=i;} }
    if(Math.round(currentS)===1){                // DASHBOARD (Vigie) : ENTRER dans la boucle (barycentre) / re-clic même boucle → RESSORTIR au centre. Passage = corde à sauter.
      if(Math.hypot(mx-CX,my-CY) < CENTER_R){    // clic dans la zone centrale (triangle) → RESSORTIR au repos, quelle que soit la boucle proche
        if(dashLobe>=0){ moveFrom=[eyeX,eyeY]; moveTo=[CX,CY]; moveKind='under'; moveT=T; dashLobe=-1; lastInter=T; cbLobe(-1,null); }
        return;
      }
      var newLobe=(dashLobe===best)?-1:best;
      moveFrom=[eyeX,eyeY]; moveTo=(newLobe>=0)?dashBary(newLobe):[CX,CY];
      moveKind=(newLobe>=0)?'over':'under';      // entrer = par-DESSUS (saute la corde) ; ressortir = par-DESSOUS (passe sous la corde)
      moveT=T; dashLobe=newLobe; lastInter=T; cbLobe(dashLobe, null); return;
    }
    if(forme.lobeCount(currentS)<5) return;            // (vue patient uniquement au-delà)
    if(Math.hypot(mx-CX,my-CY) < CENTER_R){            // clic dans la zone centrale (losange) → retour au parcours du fil (repos), quelle que soit la boucle proche
      if(ptParked!==null){ ptParked=null; cbLobe(-1,null); }
      return;
    }
    ptParked=(ptParked===best)?null:best;        // PATIENT : l'œil se pose sur le nœud (bord), lecture du fil
    var _pb = ptParked!==null ? buildDuNoeud(ptParked) : -1;
    cbLobe(_pb, _pb>=0 ? axeDuBuild(_pb) : null);
  });
  // ── VEILLEUSE (bilobe, en MOTION) : clic COURT (notif) vs LONG ≥500ms (oudjat). N'agit QUE sur le bilobe non-reduce ; le "click" ci-dessus gère le reste. ──
  svgEl.addEventListener("pointerdown",function(e){
    if(Math.round(currentS)!==0 || reduce) return;                 // seulement bilobe en motion
    blinkStart=T; clickPulse=0.15; lastInter=T;                    // clin d'œil + sursaut au CONTACT
    _ntHandled=false; _ntDownXY=[e.clientX,e.clientY];
    var _ex=e.clientX, _ey=e.clientY;                              // capture pour le timer
    if(_ntTimer) clearTimeout(_ntTimer);
    _ntTimer=setTimeout(function(){ _ntTimer=0;
      if(Math.round(currentS)===0 && !reduce){ _oudjatToggle({clientX:_ex,clientY:_ey}); cbEyeLong(); _ntHandled=true; }   // LONG → oudjat (+ hook page pour plus tard)
    }, NT_LONG_MS);
  });
  svgEl.addEventListener("pointermove",function(e){
    if(!_ntTimer || !_ntDownXY) return;
    if(Math.hypot(e.clientX-_ntDownXY[0], e.clientY-_ntDownXY[1])>10){ clearTimeout(_ntTimer); _ntTimer=0; _ntHandled=true; }   // drag → annule (ni court ni long)
  });
  svgEl.addEventListener("pointerup",function(e){
    if(Math.round(currentS)!==0 || reduce) return;
    if(_ntTimer){ clearTimeout(_ntTimer); _ntTimer=0; }
    if(!_ntHandled){ cbEye(); }                                    // COURT → notif (la page câble consulter)
    _ntHandled=false;
  });
  // la souris pilote la direction de visée (regard + bec + lumière) quand elle survole le nœud
  svgEl.addEventListener("mousemove",function(e){
    var r=svgEl.getBoundingClientRect();
    cursorAngle=Math.atan2(e.clientY-(r.top+r.height/2), e.clientX-(r.left+r.width/2));
    pointerActive=true; lastInter=T;
  });
  svgEl.addEventListener("mouseleave",function(){ pointerActive=false; });
  // ── Mapping des indices ───────────────────────────────────────────────────────
  // Trois indexations coexistent dans le moteur : indice de build (ASYM), indice de
  // nœud (ptParked, angleMort), rang horaire de pétale (labels). Elles coïncident au
  // pentalobe — on ne le suppose pas, on le calcule.
  function axeDuBuild(b){
    var P=PET_BY[5];
    for(var k=0;k<P.sep.length;k++) if(buildIdxOf(P.tips[k],5)===b) return LAB5[(P.rank[k]-2+5)%5];
    return "?";
  }
  function buildDuNoeud(i){ var nd=forme.KN[2]; return i>=0&&i<nd.length ? buildIdxOf(nd[i],5) : -1; }

  // La désignation de l'œil, rendue au lecteur d'écran. Écrite seulement quand elle change :
  // la boucle de rendu tourne à 60 Hz, le DOM n'a pas à en savoir autant.
  var _amDit = null;
  function designer(am){
    var v = (am>=0) ? ("l’œil se tourne vers " + axeDuBuild(buildDuNoeud(am))) : "";
    if(v===_amDit) return;
    _amDit = v;
    if(v){ pt.setAttribute("role","img"); pt.setAttribute("aria-label", v); }
    else { pt.removeAttribute("role"); pt.removeAttribute("aria-label"); }
  }

  // ── carte des axes (build-index → nom), DEPUIS la forme de l'instance ──
  function axes(){ return [axeDuBuild(0),axeDuBuild(1),axeDuBuild(2),axeDuBuild(3),axeDuBuild(4)]; }
  function ctxDe(lc){ return lc<=2 ? "institutionnel" : (lc===3 ? "métabolisation" : "récolte"); }
  // ── strate : REMPLACE l'ancien select() interne ──
  function setStrate(s){ targetS=s; ptParked=null; dashLobe=-1; eyePlaced=false; lastInter=T; }
  // ── signalétique du Lien (Gap 1) ──
  function signaler(eyeState_, gestType_){
    eyeState = eyeState_ || 'repos'; eyeStateT = T;
    if(gestType_){ gestType = gestType_; bounceT = T; } else gestType = 'none';
  }
  // ── TOUR DE NOTIF (pas 2a) : démarre le tour (bilobe uniquement) · consulter → arrêt, repos ──
  function signalerNotif(){ if(Math.round(currentS)!==0) return; notifTour=true; notifTourT0=Date.now(); ntAttenteT0=0; notifStartXY=[eyeX,eyeY]; }
  function consulter(){ notifTour=false; ntAttenteT0=0; ntFlash=1; if(pt&&pt.style) pt.style.filter=""; if(eyeUnder){ grp.insertBefore(eyeG, oversG.nextSibling); eyeUnder=false; } }
  // ── DICTÉE (pas 2b) : allume/éteint les vagues transverses (ease piloté par la boucle) ──
  function setOndulation(on){ ondTarget = !!on; }
  // ── densité par lobe (page → forme) : écrit la forme de CETTE instance, relabellise ──
  function setGrain(d){
    densites = (d && d.slice) ? d.slice() : [0,0,0,0,0];
    forme.setGrainPenta(densites);
    PET_BY[5] = petalsFor(forme.KF[2]);
    if(curLc===5) buildLabels(5);
  }
  function setEpaisseur(w){ wData = (typeof w==='number') ? w : wFixed; }

  // ── init : labels + œil + boucle RAF ──
  refreshPoint();
  buildLabels(2);
  setStrate(2);
  rafId = requestAnimationFrame(render);

  return {
    setStrate: setStrate,
    onStrateChange: function(cb){ cbStrate = cb || function(){}; },
    onLobe: function(cb){ cbLobe = cb || function(){}; },
    onEye: function(cb){ cbEye = cb || function(){}; },
    onEyeLong: function(cb){ cbEyeLong = cb || function(){}; },
    signaler: signaler,
    signalerNotif: signalerNotif,
    consulter: consulter,
    setOndulation: setOndulation,
    setGrain: setGrain,
    axes: axes,
    setEpaisseur: setEpaisseur,
    detruire: function(){ mort = true; if(rafId) cancelAnimationFrame(rafId); }
  };
}
