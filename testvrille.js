var window={matchMedia:function(){return{matches:false}}};
var SET={ plume:false, w:6, gap:1.8, contrast:1.85, nib:35*Math.PI/180 };
var POOL=20;
eval(require('fs').readFileSync('core.js','utf8'));
var fs=require('fs'), fails=0;
function ok(c,m){ console.log((c?'ok — ':'ÉCHEC — ')+m); if(!c)fails++; }

// croisements par forme (CO=1 central, dashboard=3, patient=5)
[[KF[0],1,'nœud 2-lobes (CO)'],[KF[1],3,'3 lobes'],[KF[2],5,'5 lobes']].forEach(function(e){
  var X=selfX(e[0]); ok(X.length===e[1], e[2]+' : '+X.length+' croisement(s) (attendu '+e[1]+')');
});
ok(KN[0].length===1 && KN[1].length===3 && KN[2].length===5, 'KN : 1/3/5 nœuds réels');
// premier nœud en haut (le lobe 0 reste ancré au sommet malgré l'asymétrie)
[[KN[1],'3 lobes'],[KN[2],'5 lobes']].forEach(function(e){
  var t=e[0][0]; ok(t[1]<CY-20 && Math.abs(t[0]-CX)<28, e[1]+' : premier nœud en haut ('+t.map(v=>v.toFixed(0))+')');
});

// ASYMÉTRIE effective (loi générale) : les LOBES ont des étendues inégales.
// Pour chaque lobe, on projette tous les points sur sa direction et on prend l'extrémité.
function lobeTips(P, L){
  var tips=[];
  for(var l=0;l<L;l++){ var a=(l/L)*2*Math.PI - Math.PI/2, dx=Math.cos(a), dy=Math.sin(a), mx=-1e9;
    for(var i=0;i<P.length;i++){ var pr=(P[i][0]-CX)*dx+(P[i][1]-CY)*dy; if(pr>mx)mx=pr; }
    tips.push(mx); }
  return tips;
}
[[KF[1],3,'3 lobes'],[KF[2],5,'5 lobes']].forEach(function(e){
  var tp=lobeTips(e[0],e[1]), mn=Math.min.apply(0,tp), mx=Math.max.apply(0,tp);
  ok((mx-mn)>12, e[2]+' : lobes d\'étendues inégales (écart '+(mx-mn).toFixed(1)+'px > 12)');
});

// DOUCEUR de la vrille (pas d'angle) — virage max par segment
function maxTurn(P){ var mx=0,n=P.length;
  for(var i=0;i<n;i++){ var a=P[(i-1+n)%n],b=P[i],c=P[(i+1)%n];
    var u=[b[0]-a[0],b[1]-a[1]], v=[c[0]-b[0],c[1]-b[1]];
    var cs=Math.max(-1,Math.min(1,(u[0]*v[0]+u[1]*v[1])/((Math.hypot(u[0],u[1])||1)*(Math.hypot(v[0],v[1])||1))));
    var t=Math.acos(cs)*180/Math.PI; if(t>mx)mx=t; }
  return mx; }
ok(maxTurn(KF[0])<14, 'CO : virage max/segment '+maxTurn(KF[0]).toFixed(1)+'° (<14 — le pli, franc par intention)');
ok(maxTurn(KF[1])<13, '3 lobes : virage max '+maxTurn(KF[1]).toFixed(1)+'° (<13)');
ok(maxTurn(KF[2])<13, '5 lobes : virage max '+maxTurn(KF[2]).toFixed(1)+'° (<13)');

// douceur AU NŒUD (le cœur de la critique vrille : brins lisses, jamais de pincement)
function turnNear(P, nd, R){ var mx=0, n=P.length;
  for(var i=0;i<n;i++){ var b=P[i]; if(Math.hypot(b[0]-nd[0],b[1]-nd[1])>R) continue;
    var a=P[(i-1+n)%n], c=P[(i+1)%n];
    var u=[b[0]-a[0],b[1]-a[1]], v=[c[0]-b[0],c[1]-b[1]];
    var cs=Math.max(-1,Math.min(1,(u[0]*v[0]+u[1]*v[1])/((Math.hypot(u[0],u[1])||1)*(Math.hypot(v[0],v[1])||1))));
    var tt=Math.acos(cs)*180/Math.PI; if(tt>mx)mx=tt; }
  return mx; }
// les boucles de SOIN (dashboard/patient) : brins lisses stricts, jamais de pincement
[[KF[1],KN[1],'3 lobes'],[KF[2],KN[2],'5 lobes']].forEach(function(e){
  var w=0; e[1].forEach(function(nd){ var m=turnNear(e[0],nd,15); if(m>w)w=m; });
  ok(w<8, e[2]+' : virage max à 15px des nœuds '+w.toFixed(1)+'° (<8 — brins lisses)');
});
// le CO : le nœud est le PLI de la signature (le gros point du dessin) — franc par intention, mais borné
(function(){ var w=0; KN[0].forEach(function(nd){ var m=turnNear(KF[0],nd,15); if(m>w)w=m; });
  ok(w<14, 'CO : coude au pli '+w.toFixed(1)+'° (<14 — le pli est franc, pas un pincement)');
})();

// croisements transversaux francs
[[KF[1],'3 lobes'],[KF[2],'5 lobes']].forEach(function(e){
  var X=selfX(e[0]), mn=1; X.forEach(function(c){ if(c.s<mn)mn=c.s; });
  ok(mn>0.4, e[1]+' : croisements francs (sinθ min '+mn.toFixed(2)+' > 0.4)');
});

// morphose : pas de NaN, croisements bornés
var bad=false, mxX=0;
for(var s=0;s<=2.001;s+=0.05){ var P=shapeAt(s);
  for(var i=0;i<P.length;i++) if(!isFinite(P[i][0])||!isFinite(P[i][1])) bad=true;
  var x=selfX(P).length; if(x>mxX)mxX=x; }
ok(!bad, 'morphose sans NaN'); ok(mxX<=POOL, 'croisements transitoires ≤ pool (max '+mxX+')');

fs.writeFileSync('xv_2.svg', sceneSVG(KF[0], KN[0][0], 1, 'v2', 8.5));
fs.writeFileSync('xv_3.svg', sceneSVG(KF[1], KN[1][0], 1, 'v3', 8.5));
fs.writeFileSync('xv_5.svg', sceneSVG(KF[2], KN[2][0], 1, 'v5', 8.5));
console.log(fails? fails+' échec(s)' : 'Tout vert.');
process.exit(fails?1:0);
