// Raymarched 3D scene: cut-away pot with water, oil, pasta, starch, bubbles, spoon; plus close-up strand mode.
window.FRAG = `#version 300 es
precision highp float;
out vec4 outColor;
uniform vec2 uRes;
uniform float uT;
uniform vec3 uCamPos, uCamTgt;
uniform float uMode;      // 0 pot scene, 1 strand close-up
uniform float uOil;       // 0 = drops falling/sinking, 1 = floating layer
uniform float uOilVis;    // oil visibility 0..1
uniform float uSpread;    // pasta 0 clumped .. 1 separated
uniform float uStarch;    // 0..1 starch particles
uniform float uBoil;      // 0..1 bubbles
uniform float uSpoon;     // 0..1 spoon presence
uniform float uLevel;     // water level
uniform float uPasta;     // pasta visibility 0..1
uniform float uCoat;      // close-up: oil coat 0..1
uniform float uSauce;     // close-up: sauce slide 0..1
uniform float uGlow;      // highlight pulse on oil
uniform float uHiPasta;   // highlight pulse on pasta

#define PI 3.14159265
float hash(float n){ return fract(sin(n)*43758.5453); }
float sdCapsule(vec3 p, vec3 a, vec3 b, float r){ vec3 pa=p-a, ba=b-a; float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.); return length(pa-ba*h)-r; }
float sdEllipsoid(vec3 p, vec3 r){ float k0=length(p/r); float k1=length(p/(r*r)); return k0*(k0-1.0)/k1; }
float smin(float a,float b,float k){ float h=clamp(.5+.5*(b-a)/k,0.,1.); return mix(b,a,h)-k*h*(1.-h); }

vec2 opU(vec2 a, vec2 b){ return a.x<b.x?a:b; }

vec3 oilPos(int i){
  float fi=float(i);
  float x = -0.55 + 0.18*fi + 0.05*sin(fi*3.1);
  float z = -0.25 - 0.45*hash(fi*7.3);
  // start: sinking in the middle of the water, end: at surface
  float yStart = 0.35 + 0.25*hash(fi*1.7);
  float k = uOil + hash(fi*2.9)*0.25*(uOil<0.?1.:-1.);
  float y = k < 0. ? mix(yStart, 1.7 + 0.4*hash(fi*4.4), clamp(-k,0.,1.)) : mix(yStart, uLevel - 0.015, smoothstep(0.0,1.0,clamp(k*1.15,0.,1.)));
  return vec3(x + 0.03*sin(uT*1.3+fi), y, z);
}

vec2 mapPot(vec3 p){
  vec2 res = vec2(1e5, 0.);
  // floor
  res = opU(res, vec2(p.y + 0.02, 8.));
  // pot: hollow cylinder, cut away front half (z>0)
  float r = length(p.xz);
  float wall = max(abs(r-1.0)-0.05, abs(p.y-0.62)-0.62);
  float bottom = max(r-1.05, abs(p.y-0.03)-0.05);
  float pot = min(wall, bottom);
  // handles
  vec3 hp = vec3(abs(p.x)-1.12, p.y-1.05, p.z);
  pot = min(pot, max(length(vec2(length(hp.xy)-0.09, hp.z))-0.035, -hp.x));
  pot = max(pot, p.z); // cut-away
  res = opU(res, vec2(pot, 1.));
  // bounding volume for interior objects (big speedup)
  float bnd = max(max(length(p.xz)-0.98, abs(p.y-0.75)-0.85), p.z-0.05);
  if (uSpoon > 0.01) bnd = min(bnd, max(length(p.xz-vec2(0.2,-0.2))-0.9, abs(p.y-1.3)-1.3));
  if (bnd > 0.08) { res.x = min(res.x, bnd); return res; }
  // pasta strands
  if (uPasta > 0.01) {
    float pd = 1e5;
    for (int i=0;i<9;i++){
      float fi=float(i);
      float ang = (hash(fi*3.7)-.5)*2.2;
      float cy = 0.16 + 0.05*mod(fi,3.) + 0.07*uSpread*hash(fi*5.1);
      float cx = mix(-0.05 + 0.05*(hash(fi)-.5), -0.62 + 1.24*fi/8., uSpread);
      float cz = mix(-0.42, -0.2 - 0.55*hash(fi*9.1), uSpread);
      vec3 c = vec3(cx, cy, cz);
      vec3 d = vec3(cos(ang)*0.12, 0.02*(hash(fi*4.)-.5), sin(ang)*0.35) * (1.0 + 0.5*uSpread);
      vec3 q = p; q.y += 0.015*sin(p.x*9.+fi);
      pd = min(pd, sdCapsule(q, c-d*2.0, c+d*2.0, 0.026));
    }
    pd = max(pd, p.z + 0.02);
    pd += (1.0-uPasta)*0.2;
    res = opU(res, vec2(pd, 2.));
  }
  // oil drops
  if (uOilVis > 0.01) {
    float od = 1e5;
    for (int i=0;i<8;i++){
      vec3 c = oilPos(i);
      float flat_ = mix(1.0, 0.45, smoothstep(0.7,1.0,uOil));
      od = min(od, sdEllipsoid(p-c, vec3(0.075, 0.075*flat_, 0.075)/flat_*0.85));
    }
    od += (1.0-uOilVis)*0.2;
    res = opU(res, vec2(od, 3.));
  }
  // starch particles
  if (uStarch > 0.01) {
    float sd = 1e5;
    for (int i=0;i<12;i++){
      float fi=float(i);
      vec3 c = vec3(-0.5+hash(fi*1.3), 0.13+0.35*hash(fi*2.1)+0.05*sin(uT+fi), -0.15-0.6*hash(fi*3.3));
      sd = min(sd, length(p-c) - 0.03*uStarch);
    }
    res = opU(res, vec2(sd, 4.));
  }
  // bubbles
  if (uBoil > 0.01) {
    float bd = 1e5;
    for (int i=0;i<12;i++){
      float fi=float(i);
      float y = 0.08 + fract(uT*0.55 + hash(fi*6.1)) * (uLevel-0.08);
      vec3 c = vec3(-0.8+1.6*hash(fi*2.7), y, -0.1-0.75*hash(fi*8.3));
      bd = min(bd, length(p-c) - (0.025+0.03*hash(fi))*uBoil*(0.5+y));
    }
    res = opU(res, vec2(bd, 5.));
  }
  // spoon (stirring)
  if (uSpoon > 0.01) {
    float a = uT*3.0;
    vec3 tip = vec3(0.45*cos(a), 0.22, -0.4+0.3*sin(a));
    vec3 top = tip + vec3(0.25, 1.4, 0.35);
    top = mix(top + vec3(0,2.,0), top, uSpoon); tip = mix(tip + vec3(0,2.,0), tip, uSpoon);
    float sp = sdCapsule(p, tip, top, 0.035);
    sp = smin(sp, sdEllipsoid(p-tip, vec3(0.1,0.04,0.14)), 0.03);
    res = opU(res, vec2(sp, 6.));
  }
  return res;
}

vec2 mapStrand(vec3 p){
  vec2 res = vec2(1e5,0.);
  vec3 q = p; q.y += 0.06*sin(q.x*1.6);
  float s = sdCapsule(q, vec3(-3.,0.,0.), vec3(3.,0.,0.), 0.32);
  res = opU(res, vec2(s, 2.));
  if (uCoat > 0.01) res = opU(res, vec2(sdCapsule(q, vec3(-3.,0.,0.), vec3(3.,0.,0.), 0.32 + 0.045*uCoat), 3.));
  // sauce drops sliding off
  for (int i=0;i<5;i++){
    float fi=float(i);
    float x = -1.6 + 0.8*fi;
    float k = clamp(uSauce*1.3 - fi*0.06, 0., 1.);
    float ang = mix(0.4, 1.0, k) * PI * (0.5 + 0.5*k);
    float rad = 0.32 + 0.045*uCoat + 0.06;
    vec3 c = vec3(x, 0.06*sin(x*1.6)*-1., 0.) + vec3(0., cos(ang)*rad, sin(ang)*rad);
    c.y -= smoothstep(0.75,1.0,k)*1.2;
    res = opU(res, vec2(sdEllipsoid(p-c, vec3(0.13,0.1,0.1)), 7.));
  }
  return res;
}

vec2 map(vec3 p){ return uMode < 0.5 ? mapPot(p) : mapStrand(p); }

vec3 calcNormal(vec3 p){
  const float h = 0.0015; const vec2 k = vec2(1,-1);
  return normalize(k.xyy*map(p+k.xyy*h).x + k.yyx*map(p+k.yyx*h).x + k.yxy*map(p+k.yxy*h).x + k.xxx*map(p+k.xxx*h).x);
}
float softShadow(vec3 ro, vec3 rd){
  float res=1., t=0.02;
  for(int i=0;i<18;i++){ float h=map(ro+rd*t).x; res=min(res, 6.*h/t); t+=clamp(h,0.015,0.15); if(res<0.01||t>4.) break; }
  return clamp(res,0.,1.);
}
float ao(vec3 p, vec3 n){ float o=0., s=1.; for(int i=1;i<=3;i++){ float h=0.05*float(i); o+=(h-map(p+n*h).x)*s; s*=0.6; } return clamp(1.-2.5*o,0.,1.); }

// analytic water volume: cylinder r=.95, y in [.06, level], z<=0
vec2 waterInterval(vec3 ro, vec3 rd){
  float r=0.95;
  float a = dot(rd.xz,rd.xz), b = dot(ro.xz,rd.xz), c = dot(ro.xz,ro.xz)-r*r;
  float h = b*b - a*c; if (h<0.) return vec2(1e5,-1e5);
  h = sqrt(h); vec2 tc = vec2(-b-h, -b+h)/a;
  vec2 ty = vec2((0.06-ro.y)/rd.y, (uLevel-ro.y)/rd.y); if (ty.x>ty.y) ty=ty.yx;
  vec2 tz = rd.z>0. ? vec2(-1e5, (0.-ro.z)/rd.z) : vec2((0.-ro.z)/rd.z, 1e5);
  if (abs(rd.z)<1e-5) tz = ro.z<=0. ? vec2(-1e5,1e5) : vec2(1e5,-1e5);
  return vec2(max(max(tc.x,ty.x),max(tz.x,0.)), min(min(tc.y,ty.y),tz.y));
}

vec3 matColor(float id, vec3 p){
  if (id<1.5) return vec3(0.55,0.56,0.6);
  if (id<2.5) return mix(vec3(0.93,0.8,0.55), vec3(1.0,0.6,0.25), uHiPasta);
  if (id<3.5) return vec3(1.0,0.72,0.18);
  if (id<4.5) return vec3(0.95,0.95,0.92);
  if (id<5.5) return vec3(0.85,0.92,1.0);
  if (id<6.5) return vec3(0.55,0.35,0.2);
  if (id<7.5) return vec3(0.75,0.12,0.06);
  return vec3(0.06,0.055,0.05);
}

void main(){
  vec2 uv = (gl_FragCoord.xy*2.-uRes)/uRes.y;
  vec3 ro = uCamPos;
  vec3 fw = normalize(uCamTgt-ro), rt = normalize(cross(fw, vec3(0,1,0))), up = cross(rt, fw);
  vec3 rd = normalize(fw*2.1 + uv.x*rt + uv.y*up);
  // background: dark with warm radial glow
  float g = exp(-dot(uv-vec2(0.,0.05), uv-vec2(0.,0.05))*1.6);
  vec3 bg = mix(vec3(0.003,0.0025,0.002), vec3(0.06,0.03,0.008), g);
  vec3 col = bg;
  float t=0.; vec2 hit=vec2(-1.);
  for(int i=0;i<90;i++){ vec2 h=map(ro+rd*t); if(h.x<0.0012){hit=vec2(t,h.y);break;} t+=h.x*0.9; if(t>14.) break; }
  float tHit = hit.x>0. ? hit.x : 1e5;
  if (hit.x>0.){
    vec3 p = ro+rd*t, n = calcNormal(p);
    float id = hit.y;
    vec3 base = matColor(id,p);
    vec3 L = normalize(vec3(0.5,0.9,0.7)), L2 = normalize(vec3(-0.7,0.4,-0.3));
    float dif = clamp(dot(n,L),0.,1.); if (id > 1.5 && id < 7.5) dif *= softShadow(p+n*0.003, L); else if (id < 1.5) dif *= mix(0.55, 1.0, softShadow(p+n*0.01, L));
    float dif2 = clamp(dot(n,L2),0.,1.);
    float occ = ao(p,n);
    float spec = pow(clamp(dot(reflect(rd,n),L),0.,1.), id<1.5?40.:(id<3.5?60.:20.));
    float fres = pow(1.-clamp(dot(n,-rd),0.,1.),3.);
    vec3 lin = vec3(1.0,0.86,0.68)*dif*1.5 + vec3(0.35,0.4,0.55)*dif2*0.35 + vec3(0.18,0.14,0.1)*occ;
    col = base*lin;
    col += spec*(id<1.5?0.9:(id<3.5?1.2:0.25))*vec3(1.,0.9,0.75);
    col += fres*vec3(1.0,0.7,0.35)*0.25*occ;
    if (id>7.5){ // floor fades into glow
      col = mix(bg, bg*1.2 + vec3(0.012,0.007,0.003)*dif, exp(-length(p.xz)*0.6));
    }
    if (id<1.5 && abs(p.z)<0.004) col = vec3(0.95,0.62,0.22); // glowing cut face
    if (id>2.5 && id<3.5) col += vec3(1.,0.6,0.1)*0.35*uGlow;
    if (id>1.5 && id<2.5) col += vec3(1.,0.45,0.1)*0.25*uHiPasta;
    if (id>4.5 && id<5.5) col = mix(col, vec3(1.), 0.3);
  }
  // water volume
  if (uMode < 0.5 && uLevel > 0.07) {
    vec2 wi = waterInterval(ro, rd);
    float t0 = wi.x, t1 = min(wi.y, tHit);
    if (t1 > t0) {
      float L = t1-t0;
      vec3 wc = vec3(0.1,0.32,0.55);
      col = mix(col, wc*0.9 + col*0.25, 1.-exp(-L*1.4));
      vec3 pe = ro+rd*t0;
      if (abs(pe.y-uLevel)<0.003) col += vec3(0.35,0.55,0.75)*0.35; // surface sheen
      if (abs(pe.z)<0.003) col += vec3(0.05,0.12,0.2)*(1.-pe.y);       // cut face
      float edge = smoothstep(0.012,0.0,abs(pe.y-uLevel)) ;
      col += vec3(0.6,0.85,1.)*0.0*edge;
    }
  }
  col = pow(col, vec3(0.4545));
  col *= 1.0 - 0.25*dot(uv*0.6,uv*0.6);
  outColor = vec4(col,1.);
}`;
