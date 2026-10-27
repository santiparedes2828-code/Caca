import numpy as np, wave
sr=48000; T=35.0; out=np.zeros(int(sr*T)); rng=np.random.default_rng(3)
def add(t,sig):
    i=int(t*sr); out[i:i+len(sig)]+=sig[:len(out)-i]
def pop(f0=500,f1=1100,d=0.07,v=0.3):
    n=int(sr*d); tt=np.arange(n)/sr; f=np.linspace(f0,f1,n); return v*np.sin(2*np.pi*np.cumsum(f)/sr)*np.exp(-tt*40)
def whoosh(d=0.4,v=0.22):
    n=int(sr*d); y=np.convolve(rng.standard_normal(n),np.ones(14)/14,'same'); return v*y*np.sin(np.linspace(0,np.pi,n))**2
def ding(f=1320,d=0.6,v=0.2):
    n=int(sr*d); tt=np.arange(n)/sr; return v*(np.sin(2*np.pi*f*tt)+0.4*np.sin(2*np.pi*f*2*tt))*np.exp(-tt*7)
def plop(v=0.3):
    n=int(sr*0.12); tt=np.arange(n)/sr; f=np.linspace(900,250,n); return v*np.sin(2*np.pi*np.cumsum(f)/sr)*np.exp(-tt*30)
def bubbles(start,dur,v=0.08):
    for k in range(int(dur*14)): add(start+k/14+rng.random()*0.05, plop(v*(0.5+rng.random())))
def buzz(v=0.25):
    n=int(sr*0.25); tt=np.arange(n)/sr; return v*np.sign(np.sin(2*np.pi*140*tt))*np.exp(-tt*10)*0.5
for k in range(8): add(0.9+k*0.18,plop(0.25))
add(2.88,buzz())
add(5.2,whoosh(0.6))
add(8.3,whoosh(0.8,0.15)); add(10.72,ding(1046,0.4,0.12))
add(12.2,whoosh(0.5,0.18)); add(14.1,pop())
add(16.36,whoosh(0.5,0.15)); add(17.6,pop())
add(18.96,whoosh(0.5,0.25)); add(20.9,ding(880,0.4,0.12))
for k in range(5): add(22.3+k*0.18,plop(0.18))
add(23.6,whoosh(0.5,0.25))
for t in [25.04,26.32,27.12]: add(t,ding(1320,0.45,0.15))
bubbles(26.4,3.2)
add(29.6,whoosh(0.45,0.25)); add(30.56,pop(700,500,0.05,0.3)); add(32.1,ding(1568))
add(32.9,whoosh(0.5,0.2)); add(33.1,ding(1046,0.9,0.2))
pcm=(np.clip(out,-1,1)*32767).astype('<i2'); w=wave.open('sfx.wav','wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(pcm.tobytes()); w.close(); print('ok')
