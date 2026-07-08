#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
patch_labels.py — mockup/continuum_mockup.html — labels par strate (bilobé/trilobé/pentalobe).

Ce que ça fait, en sept éditions, TOUTES hors du CORE :
  E1  lien Google Fonts : Spectral en poids 700 (le faux gras est évité).
  E2  --labelface : Spectral par défaut (au lieu du proxy Nunito).
  E3  atelier : nouveau curseur « échelle labels » (0.6–1.6, défaut 1).
  E4  select police : l'option Spectral devient celle sélectionnée.
  E5  création DOM : petals() 5-lobes  ->  petalsFor(Q) généralisé + LAB2/LAB3/LAB5
      + buildLabels/wordFor/buildIdxOf + LAB2POS (arc/ins/flip) + LSIZE par strate.
  E6  render : opacité par plateau + rebuild au changement de strate + inset par
      label (LIN) + flip du sens de lecture + startOffset décalé.
  E7  bindRange du curseur d'échelle.

Doctrine du patch :
  - le CORE (/*==CORE==*/ … /*==/CORE==*/) n'est JAMAIS touché : vérifié avant ET après ;
  - chaque ancre doit apparaître EXACTEMENT une fois, sinon on s'arrête sans rien écrire ;
  - anti-double-application : si les labels sont déjà là, on refuse ;
  - DRY-RUN PAR DÉFAUT : rien n'est écrit tant que --write n'est pas passé ;
  - ne commit pas, ne push pas.

Usage :
    python3 mockup/patch_labels.py            # dry-run : affiche le diff, n'écrit rien
    python3 mockup/patch_labels.py --write    # écrit, après ta relecture à froid
"""
import json, sys, os, difflib

F = os.path.join("mockup", "continuum_mockup.html")
if not os.path.exists(F):
    F = "continuum_mockup.html"
if not os.path.exists(F):
    sys.exit("continuum_mockup.html introuvable — lance depuis la racine du repo.")

WRITE = "--write" in sys.argv

EDITS = json.loads(r'''{"E1 fonts link": ["family=Spectral:wght@400;600&display=swap", "family=Spectral:wght@400;600;700&display=swap"], "E2 --labelface": ["    --labelface:var(--wordface);   /* police des labels (togglable dans l'atelier) */", "    --labelface:\"Spectral\",Georgia,serif;   /* police des labels (togglable dans l'atelier) */"], "E3 curseur échelle labels": ["          <label>bec <input type=\"range\" id=\"rB\" min=\"0\" max=\"360\" step=\"5\" value=\"225\"><output id=\"oB\">225°</output></label>\n        </div>", "          <label>bec <input type=\"range\" id=\"rB\" min=\"0\" max=\"360\" step=\"5\" value=\"225\"><output id=\"oB\">225°</output></label>\n        </div>\n        <div class=\"arow\">\n          <label>échelle labels <input type=\"range\" id=\"rL\" min=\"0.6\" max=\"1.6\" step=\"0.05\" value=\"1\"><output id=\"oL\">1</output></label>\n        </div>"], "E4 police par défaut": ["            <option data-face='\"Nunito\",\"Quicksand\",system-ui,sans-serif' selected>Nunito (ronde · la nôtre)</option>\n            <option data-face='\"Spectral\",Georgia,serif'>Spectral (serif douce)</option>", "            <option data-face='\"Nunito\",\"Quicksand\",system-ui,sans-serif'>Nunito (ronde · la nôtre)</option>\n            <option data-face='\"Spectral\",Georgia,serif' selected>Spectral (serif douce)</option>"], "E5 création DOM (généralisation)": ["  var LAB=[\"Familiale\",\"Sociale\",\"Professionnelle\",\"Amoureuse\",\"Soi\"];\n  var labelNodes=[], labelPaths=[], labelTP=[], soinN=null, _pet=null;\n  function petals(){                                   // 5 pétales (creux de rayon) + rang horaire depuis le haut — géométrie fixe, calculé une fois\n    if(_pet) return _pet;\n    var Q=KF[2], n=Q.length, R=[], rmn=1e9, rmx=-1e9, i;\n    for(i=0;i<n;i++){ var r=Math.hypot(Q[i][0]-CX,Q[i][1]-CY); R.push(r); if(r<rmn)rmn=r; if(r>rmx)rmx=r; }\n    var thr=rmn+(rmx-rmn)*0.45, sep=[];\n    for(i=0;i<n;i++){ var a=R[(i-1+n)%n], b=R[i], c=R[(i+1)%n]; if(b<=a && b<=c && b<thr) sep.push(i); }\n    var ang=[], tipAt=[];\n    for(var k=0;k<sep.length;k++){ var i0=sep[k], i1=sep[(k+1)%sep.length], tr=-1, tip=Q[i0], kk=i0, g=0, step=0, ts=0;\n      do{ if(R[kk]>tr){tr=R[kk];tip=Q[kk];ts=step;} kk=(kk+1)%n; step++; }while(kk!==i1 && ++g<n);\n      tipAt[k]=ts;\n      var aa=Math.atan2(tip[1]-CY,tip[0]-CX)+Math.PI/2; while(aa<0)aa+=2*Math.PI; while(aa>=2*Math.PI)aa-=2*Math.PI;\n      ang.push({k:k,a:aa}); }\n    var srt=ang.slice().sort(function(A,B){return A.a-B.a;}), rank=[];\n    for(var s=0;s<srt.length;s++) rank[srt[s].k]=s;\n    _pet={sep:sep, rank:rank, tipAt:tipAt}; return _pet;\n  }\n  var PET=petals();\n  for(var k0=0;k0<PET.sep.length;k0++){\n    var rnk=PET.rank[k0], li=(rnk-2+5)%5, word=LAB[li];\n    var pth=document.createElementNS(NS,\"path\"); pth.setAttribute(\"id\",\"lpath\"+k0); pth.setAttribute(\"fill\",\"none\"); pth.setAttribute(\"stroke\",\"none\");\n    labels.appendChild(pth); labelPaths.push(pth);\n    var tx=document.createElementNS(NS,\"text\"); tx.setAttribute(\"text-anchor\",\"middle\");\n    var tp=document.createElementNS(NS,\"textPath\"); tp.setAttribute(\"href\",\"#lpath\"+k0);\n    tp.setAttributeNS(\"http://www.w3.org/1999/xlink\",\"xlink:href\",\"#lpath\"+k0);\n    if(li===4){ tp.appendChild(document.createTextNode(\"Soi\")); var _nn=document.createElementNS(NS,\"tspan\"); _nn.textContent=\"n\"; _nn.setAttribute(\"id\",\"soinN\"); _nn.setAttribute(\"fill\",RED); tp.appendChild(_nn); soinN=_nn; }\n    else tp.appendChild(document.createTextNode(word));\n    tx.appendChild(tp); labels.appendChild(tx); labelNodes.push(tx); labelTP.push(tp);\n  }", "  var LAB2=[\"Continuité\",\"Fragmentation\"];                 // bilobé : gauche(C)=Continuité, droit(O)=Fragmentation\n  var LAB3=[\"Affective\",\"Vigilante\",\"Réflexive\"];          // trilobé PAR INDICE DE BUILD : idx1=Vigilante (la plus grande, bas-droite ; = read/scouter, ASYM[3]/DASH_MODE)\n  var LAB5=[\"Familiale\",\"Sociale\",\"Professionnelle\",\"Amoureuse\",\"Soi\"];\n  var labelNodes=[], labelPaths=[], labelTP=[], soinN=null;\n  var LSIZE={2:20, 3:16, 5:12};   // taille de police des labels PAR STRATE (bilobé plus grand : deux mots seuls)\n  var labelScale=1;               // multiplicateur global (atelier)\n  var LAB2POS={cont:{arc:-110, ins:5, flip:false}, frag:{arc:0, ins:5, flip:true}};   // bilobé, calage à l'œil : arc = position le long de la boucle · ins = retrait radial (hors du fil) · flip = sens de lecture (les deux boucles du ∞ sont parcourues en sens opposés)\n  var curOff=[], curIns=[], curFlip=[];   // décalage (arc), retrait (radial), sens de lecture — par label\n  function petalsFor(Q){                                   // pétales d'une forme quelconque : creux de rayon = séparateurs, pointe = max, rang horaire depuis le haut\n    var n=Q.length, R=[], rmn=1e9, rmx=-1e9, i;\n    for(i=0;i<n;i++){ var r=Math.hypot(Q[i][0]-CX,Q[i][1]-CY); R.push(r); if(r<rmn)rmn=r; if(r>rmx)rmx=r; }\n    var thr=rmn+(rmx-rmn)*0.45, sep=[];\n    for(i=0;i<n;i++){ var a=R[(i-1+n)%n], b=R[i], c=R[(i+1)%n]; if(b<=a && b<=c && b<thr) sep.push(i); }\n    var ang=[], tipAt=[], tips=[];\n    for(var k=0;k<sep.length;k++){ var i0=sep[k], i1=sep[(k+1)%sep.length], tr=-1, tip=Q[i0], kk=i0, g=0, step=0, ts=0;\n      do{ if(R[kk]>tr){tr=R[kk];tip=Q[kk];ts=step;} kk=(kk+1)%n; step++; }while(kk!==i1 && ++g<n);\n      tipAt[k]=ts; tips[k]=tip;\n      var aa=Math.atan2(tip[1]-CY,tip[0]-CX)+Math.PI/2; while(aa<0)aa+=2*Math.PI; while(aa>=2*Math.PI)aa-=2*Math.PI;\n      ang.push({k:k,a:aa}); }\n    var srt=ang.slice().sort(function(A,B){return A.a-B.a;}), rank=[];\n    for(var s=0;s<srt.length;s++) rank[srt[s].k]=s;\n    return {sep:sep, rank:rank, tipAt:tipAt, tips:tips};\n  }\n  var PET_BY={2:petalsFor(KF[0]), 3:petalsFor(KF[1]), 5:petalsFor(KF[2])};\n  var curPET=null, curLc=0;\n  // angle de build par lobe (pour aligner le mot trilobé sur l'identité réelle du lobe : Vigilante = idx1)\n  function buildAngles(L){ var az=ASYM[L], out=[]; for(var i=0;i<L;i++){ out.push((i/L)*2*Math.PI - Math.PI/2 + (az?az.a[i]:0)); } return out; }\n  function buildIdxOf(tip,L){ var ta=Math.atan2(tip[1]-CY,tip[0]-CX), ANGL=buildAngles(L), bi=0, bd=1e9;\n    for(var i=0;i<L;i++){ var d=Math.abs(Math.atan2(Math.sin(ta-ANGL[i]),Math.cos(ta-ANGL[i]))); if(d<bd){bd=d;bi=i;} } return bi; }\n  // quel mot pour le pétale k : 5=rang horaire (inchangé) ; 3=indice de build (Vigilante=idx1) ; 2=côté x (gauche=Continuité)\n  function wordFor(lc, PET, k){\n    if(lc===5){ var li=(PET.rank[k]-2+5)%5; return {w:LAB5[li], soi:(li===4)}; }\n    if(lc===3){ return {w:LAB3[buildIdxOf(PET.tips[k],3)], soi:false}; }\n    return {w:(PET.tips[k][0]<CX?LAB2[0]:LAB2[1]), soi:false};\n  }\n  function buildLabels(lc){\n    while(labels.firstChild) labels.removeChild(labels.firstChild);\n    labelNodes=[]; labelPaths=[]; labelTP=[]; soinN=null;\n    curPET = PET_BY[lc] || PET_BY[5]; curLc = lc;\n    curOff=[]; curIns=[]; curFlip=[];\n    for(var k0=0;k0<curPET.sep.length;k0++){\n      var wf=wordFor(lc, curPET, k0);\n      if(lc===2){ var _p=(curPET.tips[k0][0]<CX)?LAB2POS.cont:LAB2POS.frag; curOff[k0]=_p.arc; curIns[k0]=_p.ins; curFlip[k0]=_p.flip; }\n      else { curOff[k0]=0; curIns[k0]=0; curFlip[k0]=false; }\n      var pth=document.createElementNS(NS,\"path\"); pth.setAttribute(\"id\",\"lpath\"+k0); pth.setAttribute(\"fill\",\"none\"); pth.setAttribute(\"stroke\",\"none\");\n      labels.appendChild(pth); labelPaths.push(pth);\n      var tx=document.createElementNS(NS,\"text\"); tx.setAttribute(\"text-anchor\",\"middle\");\n      var tp=document.createElementNS(NS,\"textPath\"); tp.setAttribute(\"href\",\"#lpath\"+k0);\n      tp.setAttributeNS(\"http://www.w3.org/1999/xlink\",\"xlink:href\",\"#lpath\"+k0);\n      if(wf.soi){ tp.appendChild(document.createTextNode(\"Soi\")); var _nn=document.createElementNS(NS,\"tspan\"); _nn.textContent=\"n\"; _nn.setAttribute(\"id\",\"soinN\"); _nn.setAttribute(\"fill\",RED); tp.appendChild(_nn); soinN=_nn; }\n      else tp.appendChild(document.createTextNode(wf.w));\n      tx.appendChild(tp); labels.appendChild(tx); labelNodes.push(tx); labelTP.push(tp);\n    }\n  }\n  buildLabels(2);   // init sur Interface (2-lobes) ; le render rebâtit à chaque changement de strate"], "E6 render (état-conscient + LIN + flip)": ["    var lo=smooth((currentS-1.4)/0.5);\n    labels.setAttribute(\"opacity\", lo.toFixed(3));\n    if(lo>0.02){\n      var PET=petals(), lp=livePts(), n=lp.length, INSET=13;    // labels rentrés vers le cœur (hors du fil)\n      var sr=spinDeg*Math.PI/180, cs=Math.cos(sr), sn=Math.sin(sr);\n      for(var k=0;k<PET.sep.length;k++){\n        var i0=PET.sep[k], i1=PET.sep[(k+1)%PET.sep.length], AR=[], idx=i0, g=0, dx, dy, ex, ey, rr, kf;\n        do{ dx=lp[idx][0]-CX; dy=lp[idx][1]-CY; ex=CX+dx*cs-dy*sn; ey=CY+dx*sn+dy*cs;\n            rr=Math.hypot(ex-CX,ey-CY)||1; kf=(rr-INSET)/rr; AR.push([CX+(ex-CX)*kf, CY+(ey-CY)*kf]); idx=(idx+1)%n; }while(idx!==i1 && ++g<n);\n        dx=lp[i1][0]-CX; dy=lp[i1][1]-CY; ex=CX+dx*cs-dy*sn; ey=CY+dx*sn+dy*cs;\n        rr=Math.hypot(ex-CX,ey-CY)||1; kf=(rr-INSET)/rr; AR.push([CX+(ex-CX)*kf, CY+(ey-CY)*kf]);\n        // lissage 3 points : adoucit les cassures près du croisement (torsion abandonnée)\n        var SM=AR.slice(), a;\n        for(a=1;a<AR.length-1;a++) SM[a]=[(AR[a-1][0]+AR[a][0]+AR[a+1][0])/3,(AR[a-1][1]+AR[a][1]+AR[a+1][1])/3];\n        AR=SM;\n        var f=Math.min(PET.tipAt[k], AR.length-1);                            // ancré au bord le plus loin du centre (la pointe) — figé, suit le nœud sans coulisser\n        var d=\"M\"+AR[0][0].toFixed(1)+\" \"+AR[0][1].toFixed(1), sofar=0;\n        for(a=1;a<AR.length;a++){ d+=\"L\"+AR[a][0].toFixed(1)+\" \"+AR[a][1].toFixed(1);\n          if(a<=f) sofar+=Math.hypot(AR[a][0]-AR[a-1][0],AR[a][1]-AR[a-1][1]); }\n        labelPaths[k].setAttribute(\"d\", d);\n        labelTP[k].setAttribute(\"startOffset\", sofar.toFixed(1));\n      }\n      if(soinN){                                             // le \"n\" de Soin : respire calmement (Soi <-> Soin), en rouge\n        var _nf = reduce ? 1 : 0.5 + 0.5*Math.sin(T*0.7);    // respiration douce (~9 s)\n        soinN.setAttribute(\"opacity\", _nf.toFixed(2));\n      }", "    // LABELS par strate (toujours visibles, comme le pentalobe) : opacité par plateau, jeu rebâti dans le creux du morph (aucun pop)\n    var _rs=Math.round(currentS), _tlc=[2,3,5][_rs], lo;\n    if(_rs===0)      lo=1-smooth((currentS-0.15)/0.30);                                   // bilobé : plein à s=0, éteint vers 0.45\n    else if(_rs===1) lo=smooth((currentS-0.60)/0.15)*(1-smooth((currentS-1.40)/0.15));    // trilobé : fenêtre autour de s=1\n    else             lo=smooth((currentS-1.55)/0.35);                                     // pentalobe : comme avant (plein vers s=2)\n    lo=clamp(lo,0,1);\n    if(_tlc!==curLc) buildLabels(_tlc);   // rebâtit au changement de strate (frontière s=0.5/1.5 : lo≈0, aucun pop)\n    labels.setAttribute(\"opacity\", lo.toFixed(3));\n    labels.setAttribute(\"font-size\", ((LSIZE[curLc]||12)*labelScale).toFixed(2));\n    if(lo>0.02 && curPET){\n      var PET=curPET, lp=livePts(), n=lp.length, INSET=13;    // retrait de base ; +curIns[k] par label\n      var sr=spinDeg*Math.PI/180, cs=Math.cos(sr), sn=Math.sin(sr);\n      for(var k=0;k<PET.sep.length;k++){\n        var i0=PET.sep[k], i1=PET.sep[(k+1)%PET.sep.length], AR=[], idx=i0, g=0, dx, dy, ex, ey, rr, kf;\n        var LIN=INSET+(curIns[k]||0);\n        do{ dx=lp[idx][0]-CX; dy=lp[idx][1]-CY; ex=CX+dx*cs-dy*sn; ey=CY+dx*sn+dy*cs;\n            rr=Math.hypot(ex-CX,ey-CY)||1; kf=(rr-LIN)/rr; AR.push([CX+(ex-CX)*kf, CY+(ey-CY)*kf]); idx=(idx+1)%n; }while(idx!==i1 && ++g<n);\n        dx=lp[i1][0]-CX; dy=lp[i1][1]-CY; ex=CX+dx*cs-dy*sn; ey=CY+dx*sn+dy*cs;\n        rr=Math.hypot(ex-CX,ey-CY)||1; kf=(rr-LIN)/rr; AR.push([CX+(ex-CX)*kf, CY+(ey-CY)*kf]);\n        // lissage 3 points : adoucit les cassures près du croisement (torsion abandonnée)\n        var SM=AR.slice(), a;\n        for(a=1;a<AR.length-1;a++) SM[a]=[(AR[a-1][0]+AR[a][0]+AR[a+1][0])/3,(AR[a-1][1]+AR[a][1]+AR[a+1][1])/3];\n        AR=SM;\n        var f=Math.min(PET.tipAt[k], AR.length-1);                            // ancré au bord le plus loin du centre (la pointe) — figé, suit le nœud sans coulisser\n        if(curFlip[k]){ AR.reverse(); f=AR.length-1-f; }    // inverse le sens de lecture (le tip reste le point d'ancrage)\n        var d=\"M\"+AR[0][0].toFixed(1)+\" \"+AR[0][1].toFixed(1), sofar=0;\n        for(a=1;a<AR.length;a++){ d+=\"L\"+AR[a][0].toFixed(1)+\" \"+AR[a][1].toFixed(1);\n          if(a<=f) sofar+=Math.hypot(AR[a][0]-AR[a-1][0],AR[a][1]-AR[a-1][1]); }\n        labelPaths[k].setAttribute(\"d\", d);\n        labelTP[k].setAttribute(\"startOffset\", (sofar + (curOff[k]||0)).toFixed(1));\n      }\n      if(soinN){                                             // le \"n\" de Soin : respire calmement (Soi <-> Soin), en rouge\n        var _nf = reduce ? 1 : 0.5 + 0.5*Math.sin(T*0.7);    // respiration douce (~9 s)\n        soinN.setAttribute(\"opacity\", _nf.toFixed(2));\n      }"], "E7 bindRange échelle": ["  bindRange(\"rIris\",\"oIris\",function(v){ irisThick=v; },function(v){ return v.toFixed(1).replace(/\\.0$/,\"\"); });", "  bindRange(\"rIris\",\"oIris\",function(v){ irisThick=v; },function(v){ return v.toFixed(1).replace(/\\.0$/,\"\"); });\n  bindRange(\"rL\",\"oL\",function(v){ labelScale=v; },function(v){ return v.toFixed(2).replace(/0$/,\"\").replace(/\\.$/,\"\"); });"]}''')

c = open(F, encoding="utf-8").read()
orig = c

# ---- bornes du CORE -------------------------------------------------------
CB, CE = "/*==CORE==*/", "/*==/CORE==*/"
if CB not in c or CE not in c:
    sys.exit("ARRÊT — marqueurs de CORE introuvables. Aucune écriture.")
ci = c.index(CB)
cj = c.index(CE) + len(CE)
core_before = c[ci:cj]

# ---- anti-double-application ---------------------------------------------
for marker in ["petalsFor", "buildLabels", "LAB2POS", "labelScale"]:
    if marker in c:
        sys.exit("ARRÊT — semble déjà appliqué (« %s » présent). Aucune écriture." % marker)

# ---- vérifs dures : unicité + hors-CORE, AVANT toute écriture -------------
errs = []
for label, (old, new) in EDITS.items():
    n = c.count(old)
    if n != 1:
        errs.append("  ✗ [%s] ancre trouvée %d fois (attendu 1)" % (label, n))
        continue
    p = c.find(old)
    if not (p + len(old) <= ci or p >= cj):
        errs.append("  ✗ [%s] l'ancre tombe DANS le CORE — interdit" % label)
if errs:
    print("ARRÊT — aucune écriture :")
    print("\n".join(errs))
    sys.exit(1)

# ---- application ----------------------------------------------------------
for label, (old, new) in EDITS.items():
    assert c.count(old) == 1, "régression d'unicité sur [%s]" % label
    c = c.replace(old, new, 1)

# ---- garde-CORE a posteriori ---------------------------------------------
if CB not in c or CE not in c:
    sys.exit("ARRÊT — CORE perdu après application. Aucune écriture.")
if c[c.index(CB):c.index(CE) + len(CE)] != core_before:
    sys.exit("ARRÊT — le CORE a été modifié. Aucune écriture.")

# ---- rapport --------------------------------------------------------------
print("Fichier      : %s" % F)
print("Éditions     : %d (toutes hors-CORE, ancres uniques)" % len(EDITS))
for label in EDITS:
    print("  · %s" % label)
print("CORE         : intact (%d octets)" % len(core_before))
print("Δ caractères : %+d" % (len(c) - len(orig)))
print()

if not WRITE:
    print("=" * 72)
    print("DRY-RUN — rien n'a été écrit. Diff proposé :")
    print("=" * 72)
    d = difflib.unified_diff(orig.splitlines(keepends=True),
                             c.splitlines(keepends=True),
                             fromfile=F + " (actuel)", tofile=F + " (après patch)")
    try:                                    # tolère `| head` sans cracher de traceback
        sys.stdout.writelines(d)
        print()
        print("→ relis à froid. Si ça te va :  python3 %s --write" % os.path.basename(__file__))
        sys.stdout.flush()
    except BrokenPipeError:
        os.dup2(os.open(os.devnull, os.O_WRONLY), sys.stdout.fileno())
    sys.exit(0)

open(F, "w", encoding="utf-8").write(c)
print("✓ labels par strate inscrits. %s réécrit." % F)
print("  → lance mockup/run_test.sh (doit rester vert), relis le `git diff` à froid,")
print("    puis commite toi-même. NE PAS pousser sans relecture.")
