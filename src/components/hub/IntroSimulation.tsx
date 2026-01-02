'use client';

import { motion, useAnimation } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function IntroSimulation() {
  // --- RECURSOS (Gen 3 FireRed/LeafGreen) ---
  const GENGAR_BACK_URL = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iii/firered-leafgreen/back/94.png';
  const NIDORINO_FRONT_URL = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iii/firered-leafgreen/33.png';

  // --- ESTADOS DE ANIMACIÓN ---
  const [isHit, setIsHit] = useState(false);
  const nidorinoControls = useAnimation();

  // --- SECUENCIA DE BATALLA ---
  useEffect(() => {
    const battleLoop = async () => {
      // 1. Fase Idle
      await nidorinoControls.start("idle");

      // 2. Loop de ataque
      const attackInterval = setInterval(async () => {
        // Nidorino Ataca
        nidorinoControls.start({
          x: -80,
          y: 40,
          scale: 1.2,
          transition: { duration: 0.3, ease: "easeOut" }
        }).then(async () => {
           // Retorno
           nidorinoControls.start({
             x: 0, 
             y: 0, 
             scale: 1,
             transition: { duration: 0.4, ease: "backOut" }
           });
        });

        // Impacto en Gengar
        setTimeout(() => {
          setIsHit(true);
          setTimeout(() => setIsHit(false), 150); 
        }, 200);

      }, 4000); 

      return () => clearInterval(attackInterval);
    };

    battleLoop();
  }, [nidorinoControls]);

  return (
    <div className="relative w-full h-[350px] md:h-[450px] flex items-center justify-center overflow-hidden rounded-2xl border border-slate-800 bg-[#050810] shadow-2xl perspective-[1000px] group select-none">
      
      {/* 1. LAYER: THE HOLOGRAPHIC TABLE (FLOOR) */}
      <div 
        className="absolute w-[200%] h-[200%] bg-transparent opacity-30"
        style={{
          transform: 'rotateX(60deg) translateY(-100px) translateZ(-100px)',
          backgroundImage: `
            linear-gradient(rgba(34, 211, 238, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34, 211, 238, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(circle at center, black 30%, transparent 70%)'
        }}
      />
      <div className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 w-3/4 h-32 bg-brand-cyan/10 blur-[60px] rounded-full" />

      {/* 2. LAYER: UI OVERLAYS (Scanlines) */}
      <div className="absolute inset-0 z-40 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.4)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,6px_100%] opacity-40 mix-blend-hard-light" />
      

      {/* --- HUD DE COMBATE (NUEVO) --- */}
      
      {/* 2.1 RIVAL INFO (Top Left) */}
      <div className="absolute top-6 left-6 z-50">
        <div className="bg-slate-950/80 border border-slate-700/50 rounded-lg p-2.5 shadow-lg backdrop-blur-sm w-44 transform -skew-x-6 hover:skew-x-0 transition-transform duration-300">
           {/* Info Row */}
           <div className="flex justify-between items-end mb-1 px-1">
             <span className="font-bold text-white font-mono text-xs tracking-wide">NIDORINO</span>
             <span className="text-[10px] font-mono text-yellow-400">Lv48</span>
           </div>
           {/* HP Bar Container */}
           <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-600 flex items-center p-[1px]">
             {/* Fill (Yellow/Warning) */}
             <div className="w-[65%] h-full bg-yellow-500 rounded-full" />
           </div>
        </div>
      </div>

      {/* 2.2 PLAYER INFO (Bottom Right) */}
      <div className="absolute bottom-8 right-6 z-50">
         <div className="bg-slate-950/80 border border-slate-700/50 rounded-lg p-3 shadow-lg backdrop-blur-sm w-48 transform -skew-x-6 hover:skew-x-0 transition-transform duration-300">
           {/* Info Row */}
           <div className="flex justify-between items-end mb-1.5 px-1">
             <span className="font-bold text-white font-mono text-xs tracking-wide">GENGAR</span>
             <span className="text-[10px] font-mono text-brand-cyan">Lv50</span>
           </div>
           {/* HP Bar Container */}
           <div className="relative w-full h-2 bg-slate-800 rounded-full border border-slate-600 overflow-hidden mb-1">
             {/* Fill (Green/Healthy) - Reacts to Hit */}
             <motion.div 
               className="h-full bg-emerald-500 rounded-full"
               animate={{ width: isHit ? "85%" : "90%" }} // Se reduce un poco al golpe
               transition={{ duration: 0.2 }}
             />
           </div>
           {/* Numerical HP */}
           <div className="text-right text-[9px] font-mono font-bold text-slate-400">
             <span className={isHit ? "text-red-400" : "text-white"}>
               {isHit ? 128 : 135}
             </span> 
             / 150
           </div>
        </div>
      </div>

      {/* 2.3 REC INDICATOR */}
      <div className="absolute top-6 right-6 z-50 flex items-center gap-2 px-2 py-1 bg-black/40 rounded-full border border-white/5">
         <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_red]" />
         <span className="text-[9px] font-mono text-slate-300 tracking-widest opacity-80">SIM_REC</span>
      </div>


      {/* 3. LAYER: THE ACTORS (SPRITES) */}
      <div className="relative w-full max-w-lg h-full">

        {/* --- NIDORINO (RIVAL / ARRIBA DERECHA) --- */}
        <motion.div
          className="absolute top-12 right-8 md:top-16 md:right-16 z-10 w-32 h-32 md:w-40 md:h-40"
          animate={nidorinoControls}
          variants={{
            idle: { 
              y: [0, -10, 0], 
              transition: { repeat: Infinity, duration: 1.2, ease: "easeInOut" } 
            }
          }}
        >
          {/* Hologram Base Ring */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-24 h-8 bg-cyan-500/10 rounded-[100%] blur-sm border border-cyan-500/20" />
          
          {/* Sprite */}
          <img 
            src={NIDORINO_FRONT_URL} 
            alt="Nidorino"
            className="w-full h-full object-contain"
            style={{ 
              imageRendering: 'pixelated',
              filter: 'drop-shadow(0 0 8px rgba(34, 211, 238, 0.4)) opacity(0.9)',
            }}
          />
        </motion.div>


        {/* --- GENGAR (PLAYER / ABAJO IZQUIERDA) --- */}
        <motion.div
          className="absolute bottom-4 left-4 md:bottom-8 md:left-12 z-20 w-40 h-40 md:w-56 md:h-56"
          animate={{
            y: [0, 5, 0], 
            scale: [1, 1.02, 1]
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {/* Hologram Base Ring */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-32 h-10 bg-purple-500/10 rounded-[100%] blur-sm border border-purple-500/20" />

          {/* Sprite */}
          <motion.img 
            src={GENGAR_BACK_URL} 
            alt="Gengar"
            className="w-full h-full object-contain"
            style={{ 
              imageRendering: 'pixelated',
              filter: isHit 
                ? 'brightness(3) drop-shadow(0 0 20px white)' 
                : 'drop-shadow(0 0 10px rgba(168, 85, 247, 0.5)) opacity(0.95)',
            }}
            animate={isHit ? { x: [-5, 5, -5, 5, 0] } : {}}
            transition={{ duration: 0.2 }}
          />
        </motion.div>

      </div>

    </div>
  );
}