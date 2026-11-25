import React, { useEffect, useRef, useState } from 'react';
import './DrinkAnimation.css';

const COLORS = {
  'Milk Tea': '#c89c73', 'Green Tea': '#9abf70', 'Black Tea': '#a66c42',
  'Thai Tea': '#e99a48', 'Taro': '#b9a0d7', 'Strawberry': '#e9a2b5',
  'Mango': '#f5bc52', 'Passion Fruit': '#efc75e', 'Coconut': '#eee2d4',
  'Winter Melon': '#b88c5c', 'Cocoa': '#8a5d49', 'Honey': '#d8b675',
  'Coffee': '#957052', 'Matcha': '#9abf70', 'Lemon': '#e7d775'
};

function drinkColor(name = '') {
  const match = Object.entries(COLORS).find(([key]) => name.toLowerCase().includes(key.toLowerCase()));
  return match?.[1] || '#c99b78';
}

/** Pass a stable drink identifier and an array of selected toppings. */
export default function DrinkAnimation({ baseDrink, toppings = [], color, logo = 'PEARL GARDEN', size = 'M', sealing = false }) {
  const [stage, setStage] = useState('idle');
  const [pourKey, setPourKey] = useState(0);
  const [toppingKey, setToppingKey] = useState(0);
  const [hasBoba, setHasBoba] = useState(false);
  const [activeTopping, setActiveTopping] = useState('');
  const prevToppings = useRef([]);
  const timers = useRef([]);
  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  const later = (fn, ms) => { timers.current.push(setTimeout(fn, ms)); };
  const baseId = typeof baseDrink === 'object' ? (baseDrink?.itemid ?? baseDrink?.id ?? baseDrink?.item_name ?? baseDrink?.name) : baseDrink;
  const baseName = typeof baseDrink === 'object' ? (baseDrink?.item_name ?? baseDrink?.name ?? '') : (baseDrink ?? '');
  const selected = toppings.map(t => typeof t === 'string' ? t : (t.name ?? t.item_name ?? String(t.id ?? 'Topping')));
  const selectedKey = JSON.stringify(selected);

  useEffect(() => {
    clearTimers();
    prevToppings.current = selected;
    setHasBoba(selected.length > 0);
    setActiveTopping('');
    if (!baseId) { setStage('idle'); return clearTimers; }
    setStage('spin');
    setPourKey(k => k + 1);
    later(() => setStage('pour'), 1050);
    later(() => setStage('ready'), 3150);
    return clearTimers;
  }, [baseId]);

  useEffect(() => {
    if (!baseId) return;
    const previous = prevToppings.current;
    const counts = {};
    previous.forEach(t => { counts[t] = (counts[t] || 0) + 1; });
    const added = selected.find(t => counts[t] ? (counts[t]--, false) : true);
    prevToppings.current = selected;
    if (!added) return;
    setActiveTopping(added);
    setToppingKey(k => k + 1);
    setHasBoba(true);
    const timeout = setTimeout(() => setActiveTopping(''), 1150);
    return () => clearTimeout(timeout);
  }, [selectedKey, baseId]);

  const fill = color || drinkColor(baseName);
  const filled = stage === 'pour' || stage === 'ready';
  const pearls = [[129,337,8],[148,345,8],[167,337,8],[187,344,8],[207,336,8],[139,324,7],[158,327,8],[178,325,7],[198,322,7],[154,311,6],[183,310,6]];
  const drops = [[142,-8],[166,-34],[187,-13],[207,-46],[155,-64],[197,-76],[177,-93]];
  return (
    <div className="pg-animation" aria-label={`${baseName || 'Empty'} drink animation`}>
      <svg className={`pg-svg ${size === 'L' ? 'pg-svg-large' : 'pg-svg-medium'}`} viewBox="0 0 340 420" role="img" aria-label={`Animated ${baseName || 'bubble tea'} cup`}>
        <defs>
          <clipPath id="pg-cup-interior"><path d="M104 133 L236 133 L221 350 Q170 366 119 350 Z" /></clipPath>
          <linearGradient id="pg-glass" x1="0" y1="0" x2="1" y2="0"><stop stopColor="#fff" stopOpacity=".34"/><stop offset=".45" stopColor="#fff" stopOpacity=".05"/><stop offset="1" stopColor="#fff" stopOpacity=".3"/></linearGradient>
          <linearGradient id="pg-liquid-shade" x1="0" y1="0" x2="1" y2="0"><stop stopColor="#302013" stopOpacity=".14"/><stop offset=".45" stopColor="#fff" stopOpacity=".13"/><stop offset="1" stopColor="#302013" stopOpacity=".18"/></linearGradient>
        </defs>
        <ellipse cx="170" cy="374" rx="91" ry="13" fill="#443525" opacity=".09" />
        <g className={`pg-cup-group ${stage === 'spin' ? 'pg-spin' : ''}`}>
          <g clipPath="url(#pg-cup-interior)">
            <rect className={`pg-liquid ${filled ? 'pg-filled' : ''}`} x="99" y="153" width="145" height="210" fill={fill}/>
            <rect className={`pg-liquid pg-shading ${filled ? 'pg-filled' : ''}`} x="99" y="153" width="145" height="210" fill="url(#pg-liquid-shade)" />
            {hasBoba && filled && <g className="pg-settled-pearls">{pearls.map(([x,y,r],i) => <g key={i}><circle cx={x} cy={y} r={r} fill="#272021"/><circle cx={x-2} cy={y-2} r={r*.25} fill="#fff" opacity=".3"/></g>)}</g>}
          </g>
          <path d="M101 128 L239 128 L223 353 Q170 371 117 353 Z" fill="url(#pg-glass)" stroke="#b9a9a0" strokeWidth="2.5" />
          <path d="M112 143 L125 342" stroke="white" strokeWidth="5" strokeLinecap="round" opacity=".38" />
          <path d="M227 145 L215 343" stroke="white" strokeWidth="3" strokeLinecap="round" opacity=".25" />
          <ellipse cx="170" cy="130" rx="71" ry="9" fill="#fff" fillOpacity=".45" stroke="#b9a9a0" strokeWidth="3"/>
          <g className="pg-logo"><text x="170" y="243" textAnchor="middle" fontSize="13" fontWeight="800" letterSpacing="1.2" fill="#35654a">{logo}</text><path d="M147 253 Q170 269 193 253" fill="none" stroke="#35654a" strokeWidth="2"/></g>
        </g>
        {sealing && <g className="pg-sealing-lid">
          <ellipse cx="170" cy="126" rx="76" ry="14" fill="#e9d6eb" stroke="#a877ad" strokeWidth="3" />
          <ellipse cx="170" cy="123" rx="68" ry="10" fill="#f8eaf5" stroke="#bc93c6" strokeWidth="1.5" />
          <text x="170" y="127" textAnchor="middle" fontSize="10" fontWeight="800" letterSpacing="1.2" fill="#6d467a">PEARL GARDEN</text>
          <path d="M111 130 Q170 143 229 130" fill="none" stroke="#b789bd" strokeWidth="4" strokeLinecap="round" />
        </g>}
        {stage === 'pour' && <g key={pourKey} className="pg-pour-stream" fill={fill}><path d="M161 -10 Q155 28 161 62 L158 143 Q170 153 180 143 L177 62 Q183 28 178 -10 Z"/><ellipse cx="169" cy="147" rx="12" ry="5" opacity=".7"/></g>}
        {activeTopping && <g key={toppingKey} className="pg-falling-toppings">{drops.map(([x,y],i) => <circle key={i} cx={x} cy={y} r={/jelly|pudding|aloe/i.test(activeTopping) ? 7 : 6} fill={/jelly|pudding|aloe/i.test(activeTopping) ? '#e9b66d' : '#342526'} style={{animationDelay:`${i*75}ms`}}/>)}</g>}
        {activeTopping && <g className="pg-splash"><path d="M145 155 Q156 139 165 155 M175 154 Q188 136 199 154" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".8"/></g>}
      </svg>
      <div className="pg-animation-caption">{sealing ? 'Sealing your drink…' : stage === 'spin' ? 'Getting your cup ready…' : stage === 'pour' ? `Pouring ${baseName}…` : activeTopping ? `Adding ${activeTopping}…` : baseId ? 'Made just for you ✨' : 'Choose your drink to begin'}</div>
    </div>
  );
}
