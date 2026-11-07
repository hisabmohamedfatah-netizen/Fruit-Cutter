import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Play, RotateCcw, Volume2, VolumeX, Sparkles, Heart, Zap, Award } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundManager } from '../utils/audio';

interface FruitType {
  id: string;
  name: string;
  color: string;
  innerColor: string;
  radius: number;
  points: number;
  emoji: string;
}

const FRUIT_TYPES: FruitType[] = [
  { id: 'watermelon', name: 'بطيخ', color: '#16a34a', innerColor: '#ef4444', radius: 44, points: 10, emoji: '🍉' },
  { id: 'orange', name: 'برتقال', color: '#ea580c', innerColor: '#fed7aa', radius: 34, points: 15, emoji: '🍊' },
  { id: 'apple', name: 'تفاح', color: '#dc2626', innerColor: '#fef08a', radius: 32, points: 15, emoji: '🍎' },
  { id: 'banana', name: 'موز', color: '#eab308', innerColor: '#fef9c3', radius: 36, points: 20, emoji: '🍌' },
  { id: 'strawberry', name: 'فراولة', color: '#e11d48', innerColor: '#fda4af', radius: 26, points: 25, emoji: '🍓' },
  { id: 'pineapple', name: 'أناناس', color: '#ca8a04', innerColor: '#fde047', radius: 42, points: 30, emoji: '🍍' },
  { id: 'dragon', name: 'فاكهة التنين', color: '#db2777', innerColor: '#ffffff', radius: 38, points: 50, emoji: '🐉' },
];

interface ActiveFruit {
  id: number;
  type: FruitType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vRot: number;
  sliced: boolean;
  sliceAngle: number;
  sliceProgress: number;
  isBomb?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
}

interface Splatter {
  x: number;
  y: number;
  color: string;
  radius: number;
  alpha: number;
}

interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  alpha: number;
  vy: number;
}

interface BladeTrailPoint {
  x: number;
  y: number;
  time: number;
}

export const BLADES = [
  { id: 'ninja', name: 'سيف النينجا الأزرق', color: '#38bdf8', glow: 'rgba(56, 189, 248, 0.8)' },
  { id: 'katana', name: 'الكاتانا الذهبية', color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.8)' },
  { id: 'fire', name: 'خنجر اللهب الأحمر', color: '#ef4444', glow: 'rgba(239, 68, 68, 0.8)' },
  { id: 'emerald', name: 'شفرة الزمرد الخضراء', color: '#10b981', glow: 'rgba(16, 185, 129, 0.8)' },
];

interface Props {
  customFruit?: FruitType | null;
  customBackground?: string | null;
}

export const FruitCutterGame: React.FC<Props> = ({ customFruit, customBackground }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    return parseInt(localStorage.getItem('fruit_cutter_high_score') || '0', 10);
  });
  const [lives, setLives] = useState<number>(3);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [soundOn, setSoundOn] = useState<boolean>(true);
  const [selectedBlade, setSelectedBlade] = useState(BLADES[0]);
  const [gameMode, setGameMode] = useState<'classic' | 'zen' | 'arcade'>('classic');
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [comboAlert, setComboAlert] = useState<string | null>(null);

  // Mutable Game State
  const gameStateRef = useRef({
    fruits: [] as ActiveFruit[],
    particles: [] as Particle[],
    splatters: [] as Splatter[],
    floatingTexts: [] as FloatingText[],
    bladeTrail: [] as BladeTrailPoint[],
    isPointerDown: false,
    lastSpawnTime: 0,
    spawnInterval: 1400,
    nextId: 1,
    comboCount: 0,
    lastSliceTime: 0,
    gameLoopId: 0,
    score: 0,
    lives: 3,
    gameOver: false,
    isPlaying: false,
    gameMode: 'classic' as 'classic' | 'zen' | 'arcade',
    timer: 60,
  });

  // Sound toggle
  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    soundManager.enabled = next;
  };

  // Add custom fruit if provided
  const availableFruits = customFruit ? [...FRUIT_TYPES, customFruit] : FRUIT_TYPES;

  // Start / Restart Game
  const startGame = useCallback((mode: 'classic' | 'zen' | 'arcade' = gameMode) => {
    gameStateRef.current = {
      fruits: [],
      particles: [],
      splatters: [],
      floatingTexts: [],
      bladeTrail: [],
      isPointerDown: false,
      lastSpawnTime: performance.now(),
      spawnInterval: mode === 'arcade' ? 900 : 1300,
      nextId: 1,
      comboCount: 0,
      lastSliceTime: 0,
      gameLoopId: 0,
      score: 0,
      lives: mode === 'zen' ? 999 : 3,
      gameOver: false,
      isPlaying: true,
      gameMode: mode,
      timer: mode === 'zen' ? 90 : 60,
    };
    setScore(0);
    setLives(mode === 'zen' ? 999 : 3);
    setGameOver(false);
    setIsPlaying(true);
    setGameMode(mode);
    setTimeLeft(mode === 'zen' ? 90 : 60);
    soundManager.playSwipe();
  }, [gameMode]);

  // Main Canvas Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrameId: number;

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    // Spawn fruit
    const spawnFruits = (now: number) => {
      const state = gameStateRef.current;
      if (!state.isPlaying || state.gameOver) return;

      if (now - state.lastSpawnTime > state.spawnInterval) {
        state.lastSpawnTime = now;
        state.spawnInterval = Math.max(750, state.spawnInterval - 6);

        // Batch spawn (1 to 3 fruits)
        const count = state.gameMode === 'arcade' ? Math.floor(Math.random() * 3) + 2 : Math.floor(Math.random() * 2) + 1;

        for (let i = 0; i < count; i++) {
          const isBomb = state.gameMode !== 'zen' && Math.random() < (state.gameMode === 'arcade' ? 0.28 : 0.18);
          const type = availableFruits[Math.floor(Math.random() * availableFruits.length)];
          const padding = 60;
          const x = padding + Math.random() * (canvas.width - padding * 2);
          const y = canvas.height + 30;

          // Velocity towards center
          const targetX = canvas.width / 2 + (Math.random() - 0.5) * (canvas.width * 0.4);
          const vx = (targetX - x) / (45 + Math.random() * 15);
          const vy = -(13 + Math.random() * 4.5);

          state.fruits.push({
            id: state.nextId++,
            type,
            x,
            y,
            vx,
            vy,
            rot: Math.random() * Math.PI * 2,
            vRot: (Math.random() - 0.5) * 0.12,
            sliced: false,
            sliceAngle: 0,
            sliceProgress: 0,
            isBomb,
          });
        }
      }
    };

    // Check intersection between segment (p1, p2) and circle (c, r)
    const checkLineCircleIntersect = (
      p1: { x: number; y: number },
      p2: { x: number; y: number },
      c: { x: number; y: number; r: number }
    ) => {
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const len = Math.hypot(dx, dy);
      if (len < 4) return false;

      const u = Math.max(0, Math.min(1, ((c.x - p1.x) * dx + (c.y - p1.y) * dy) / (len * len)));
      const nearestX = p1.x + u * dx;
      const nearestY = p1.y + u * dy;
      return Math.hypot(c.x - nearestX, c.y - nearestY) <= c.r;
    };

    // Handle blade slicing against fruits
    const handleSlicing = (p1: BladeTrailPoint, p2: BladeTrailPoint) => {
      const state = gameStateRef.current;
      if (!state.isPlaying || state.gameOver) return;

      const now = performance.now();
      let slicedThisStroke = 0;

      state.fruits.forEach((fruit) => {
        if (fruit.sliced) return;

        const radius = fruit.isBomb ? 32 : fruit.type.radius;
        if (checkLineCircleIntersect(p1, p2, { x: fruit.x, y: fruit.y, r: radius })) {
          fruit.sliced = true;
          fruit.sliceAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

          if (fruit.isBomb) {
            // Bomb exploded!
            soundManager.playBomb();
            // Explosion particles
            for (let i = 0; i < 40; i++) {
              const angle = Math.random() * Math.PI * 2;
              const spd = 4 + Math.random() * 10;
              state.particles.push({
                x: fruit.x,
                y: fruit.y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                color: i % 2 === 0 ? '#ef4444' : '#f59e0b',
                size: 4 + Math.random() * 5,
                alpha: 1,
                life: 45,
              });
            }

            if (state.gameMode === 'classic') {
              state.gameOver = true;
              setGameOver(true);
              setIsPlaying(false);
              return;
            } else if (state.gameMode === 'arcade') {
              state.score = Math.max(0, state.score - 50);
              setScore(state.score);
              state.floatingTexts.push({
                id: state.nextId++,
                text: '-50 قنبلة!',
                x: fruit.x,
                y: fruit.y,
                color: '#ef4444',
                alpha: 1,
                vy: -2,
              });
            }
          } else {
            // Fruit sliced successfully
            slicedThisStroke++;
            soundManager.playSlice(1 + slicedThisStroke * 0.15);

            // Add juice splatters
            state.splatters.push({
              x: fruit.x,
              y: fruit.y,
              color: fruit.type.color,
              radius: fruit.type.radius * (1.2 + Math.random() * 0.6),
              alpha: 0.35,
            });

            // Splatter particles
            for (let i = 0; i < 22; i++) {
              const angle = Math.random() * Math.PI * 2;
              const spd = 2 + Math.random() * 7;
              state.particles.push({
                x: fruit.x,
                y: fruit.y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                color: i % 3 === 0 ? fruit.type.innerColor : fruit.type.color,
                size: 3 + Math.random() * 4,
                alpha: 1,
                life: 30 + Math.random() * 20,
              });
            }

            // Points calculation
            const pts = fruit.type.points;
            state.score += pts;
            setScore(state.score);

            state.floatingTexts.push({
              id: state.nextId++,
              text: `+${pts}`,
              x: fruit.x,
              y: fruit.y,
              color: fruit.type.color,
              alpha: 1,
              vy: -2.2,
            });
          }
        }
      });

      // Combo management
      if (slicedThisStroke > 0) {
        if (now - state.lastSliceTime < 350) {
          state.comboCount += slicedThisStroke;
        } else {
          state.comboCount = slicedThisStroke;
        }
        state.lastSliceTime = now;

        if (state.comboCount >= 3) {
          const bonus = state.comboCount * 5;
          state.score += bonus;
          setScore(state.score);
          soundManager.playCombo(state.comboCount);

          const praiseWords = ['ضربة مزدوجة!', 'تقطيع رائع!', 'أسطوري!', 'سوبر كومبو! 🔥'];
          const word = praiseWords[Math.min(state.comboCount - 3, praiseWords.length - 1)];
          setComboAlert(`${word} (${state.comboCount}x) +${bonus}`);
          setTimeout(() => setComboAlert(null), 1200);

          state.floatingTexts.push({
            id: state.nextId++,
            text: `${word} +${bonus}`,
            x: canvas.width / 2,
            y: canvas.height * 0.35,
            color: '#facc15',
            alpha: 1,
            vy: -1.5,
          });
        }
      }
    };

    // Render loop
    const render = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background draw
      if (customBackground) {
        // Will draw canvas background if pattern/image loaded
      }

      const state = gameStateRef.current;

      // Draw Splatters on background
      state.splatters.forEach((splat) => {
        ctx.save();
        ctx.globalAlpha = splat.alpha;
        ctx.fillStyle = splat.color;
        ctx.beginPath();
        ctx.arc(splat.x, splat.y, splat.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Update & Draw Particles
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2; // gravity
        p.life--;
        p.alpha = Math.max(0, p.life / 35);

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (p.life <= 0) {
          state.particles.splice(i, 1);
        }
      }

      // Update & Draw Fruits
      const gravity = 0.28;
      for (let i = state.fruits.length - 1; i >= 0; i--) {
        const f = state.fruits[i];
        f.x += f.vx;
        f.y += f.vy;
        f.vy += gravity;
        f.rot += f.vRot;

        if (f.sliced) {
          f.sliceProgress += 0.08;
        }

        // Drop below screen
        if (f.y > canvas.height + 70) {
          // Missed fruit in classic mode
          if (!f.sliced && !f.isBomb && state.isPlaying && !state.gameOver && state.gameMode === 'classic') {
            state.lives = Math.max(0, state.lives - 1);
            setLives(state.lives);
            if (state.lives <= 0) {
              state.gameOver = true;
              setGameOver(true);
              setIsPlaying(false);
            }
          }
          state.fruits.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(f.x, f.y);

        if (f.isBomb) {
          // Draw Bomb
          ctx.rotate(f.rot);
          ctx.fillStyle = '#1e293b';
          ctx.beginPath();
          ctx.arc(0, 0, 28, 0, Math.PI * 2);
          ctx.fill();
          ctx.lineWidth = 3;
          ctx.strokeStyle = '#ef4444';
          ctx.stroke();

          // Fuse & Spark
          ctx.fillStyle = '#e2e8f0';
          ctx.fillRect(-4, -36, 8, 10);
          ctx.fillStyle = Math.random() > 0.5 ? '#f59e0b' : '#ef4444';
          ctx.beginPath();
          ctx.arc(0, -40, 5 + Math.random() * 3, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ef4444';
          ctx.font = 'bold 16px Cairo';
          ctx.textAlign = 'center';
          ctx.fillText('💣', 0, 6);
        } else if (!f.sliced) {
          // Whole Fruit
          ctx.rotate(f.rot);

          // Fruit Body
          ctx.fillStyle = f.type.color;
          ctx.beginPath();
          ctx.arc(0, 0, f.type.radius, 0, Math.PI * 2);
          ctx.fill();

          // Inner rim
          ctx.lineWidth = 4;
          ctx.strokeStyle = f.type.innerColor;
          ctx.stroke();

          // Emoji / Icon
          ctx.font = `${Math.floor(f.type.radius * 1.1)}px Cairo`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(f.type.emoji, 0, 2);
        } else {
          // Sliced fruit into two halves!
          const separation = f.sliceProgress * 35;
          const perpAngle = f.sliceAngle + Math.PI / 2;

          // Half 1
          ctx.save();
          ctx.translate(Math.cos(perpAngle) * separation, Math.sin(perpAngle) * separation);
          ctx.rotate(f.sliceAngle);
          ctx.fillStyle = f.type.innerColor;
          ctx.beginPath();
          ctx.arc(0, 0, f.type.radius, 0, Math.PI, false);
          ctx.fill();
          ctx.fillStyle = f.type.color;
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.restore();

          // Half 2
          ctx.save();
          ctx.translate(-Math.cos(perpAngle) * separation, -Math.sin(perpAngle) * separation);
          ctx.rotate(f.sliceAngle);
          ctx.fillStyle = f.type.innerColor;
          ctx.beginPath();
          ctx.arc(0, 0, f.type.radius, Math.PI, Math.PI * 2, false);
          ctx.fill();
          ctx.fillStyle = f.type.color;
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.restore();
        }

        ctx.restore();
      }

      // Update & Draw Blade Trail
      const now = performance.now();
      state.bladeTrail = state.bladeTrail.filter((pt) => now - pt.time < 180);

      if (state.bladeTrail.length > 1) {
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (let i = 1; i < state.bladeTrail.length; i++) {
          const pt1 = state.bladeTrail[i - 1];
          const pt2 = state.bladeTrail[i];
          const age = now - pt2.time;
          const progress = 1 - age / 180;

          ctx.beginPath();
          ctx.moveTo(pt1.x, pt1.y);
          ctx.lineTo(pt2.x, pt2.y);
          ctx.lineWidth = Math.max(1, progress * 14);
          ctx.strokeStyle = selectedBlade.color;
          ctx.shadowColor = selectedBlade.glow;
          ctx.shadowBlur = 12;
          ctx.globalAlpha = progress;
          ctx.stroke();
        }
        ctx.restore();
      }

      // Update & Draw Floating Texts
      for (let i = state.floatingTexts.length - 1; i >= 0; i--) {
        const ft = state.floatingTexts[i];
        ft.y += ft.vy;
        ft.alpha -= 0.02;

        ctx.save();
        ctx.globalAlpha = Math.max(0, ft.alpha);
        ctx.fillStyle = ft.color;
        ctx.font = 'bold 22px Cairo, sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 6;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();

        if (ft.alpha <= 0) {
          state.floatingTexts.splice(i, 1);
        }
      }

      spawnFruits(time);
      animFrameId = requestAnimationFrame(render);
    };

    animFrameId = requestAnimationFrame(render);

    // Pointer Event Listeners for slicing
    const handlePointerDown = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const state = gameStateRef.current;
      state.isPointerDown = true;
      state.bladeTrail = [{ x, y, time: performance.now() }];
      soundManager.playSwipe();
    };

    const handlePointerMove = (e: PointerEvent) => {
      const state = gameStateRef.current;
      if (!state.isPointerDown) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const currentPoint = { x, y, time: performance.now() };

      if (state.bladeTrail.length > 0) {
        const lastPoint = state.bladeTrail[state.bladeTrail.length - 1];
        handleSlicing(lastPoint, currentPoint);
      }

      state.bladeTrail.push(currentPoint);
    };

    const handlePointerUp = () => {
      gameStateRef.current.isPointerDown = false;
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [availableFruits, customBackground, selectedBlade, gameMode]);

  // High score tracking
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('fruit_cutter_high_score', score.toString());
    }
  }, [score, highScore]);

  // Confetti on game over with new high score
  useEffect(() => {
    if (gameOver) {
      if (score >= highScore && score > 0) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    }
  }, [gameOver, score, highScore]);

  return (
    <div className="relative w-full h-[620px] max-h-[85vh] rounded-3xl overflow-hidden border border-emerald-500/30 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 shadow-2xl flex flex-col">
      {/* Game Header Bar */}
      <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-slate-950/90 to-transparent pointer-events-auto">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/20 border border-emerald-500/40 px-3.5 py-1.5 rounded-2xl flex items-center gap-2">
            <span className="text-xs text-emerald-400 font-bold">النقاط:</span>
            <span className="text-2xl font-black text-emerald-300 font-mono">{score}</span>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-2xl flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-amber-300">الرقم القياسي:</span>
            <span className="text-sm font-bold text-amber-200 font-mono">{highScore}</span>
          </div>
        </div>

        {/* Lives / Time */}
        <div className="flex items-center gap-3">
          {gameMode === 'classic' ? (
            <div className="flex items-center gap-1 bg-red-500/10 border border-red-500/30 px-3 py-1.5 rounded-2xl">
              {[1, 2, 3].map((heartIndex) => (
                <Heart
                  key={heartIndex}
                  className={`w-5 h-5 transition-all ${
                    heartIndex <= lives
                      ? 'fill-red-500 text-red-500 scale-100'
                      : 'text-slate-600 scale-75 opacity-40'
                  }`}
                />
              ))}
            </div>
          ) : (
            <div className="bg-cyan-500/10 border border-cyan-500/30 px-3 py-1.5 rounded-2xl flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span className="text-xs text-cyan-300">الوضع: {gameMode === 'zen' ? 'استرخاء' : 'أركيد'}</span>
            </div>
          )}

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className="p-2 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            title={soundOn ? 'كتم الصوت' : 'تشغيل الصوت'}
          >
            {soundOn ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
          </button>
        </div>
      </div>

      {/* Combo Banner */}
      {comboAlert && (
        <div className="absolute top-20 inset-x-0 z-20 flex justify-center pointer-events-none animate-bounce">
          <div className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xl rounded-full shadow-lg shadow-amber-500/40 border border-amber-300">
            {comboAlert}
          </div>
        </div>
      )}

      {/* Main Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair touch-none"
        style={{
          backgroundImage: customBackground
            ? `url(${customBackground})`
            : 'radial-gradient(ellipse at 50% 30%, #1e293b 0%, #0b0f19 80%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Game Start / Over Overlay */}
      {(!isPlaying || gameOver) && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 bg-slate-950/85 backdrop-blur-md">
          <div className="max-w-md w-full bg-slate-900/90 border border-emerald-500/40 rounded-3xl p-6 text-center shadow-2xl shadow-emerald-950/50">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-600 to-green-400 flex items-center justify-center text-4xl shadow-xl shadow-emerald-500/30 mb-4 animate-pulse">
              🍉
            </div>

            <h2 className="text-3xl font-black text-white mb-2">
              {gameOver ? 'انتهت الجولة!' : 'قاطع الفواكه'}
            </h2>

            <p className="text-sm text-slate-300 mb-6">
              {gameOver
                ? `لقد سجلت ${score} نقطة! مرر إصبعك أو الفأرة لتقطيع الفواكه وتفادي القنابل السوداء!`
                : 'اقطع الفواكه الطائرة بتمرير إصبعك بسرعة، حقق ضربات متتالية وتجنب لمس القنابل!'}
            </p>

            {/* Mode Selector */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              <button
                onClick={() => setGameMode('classic')}
                className={`py-2 px-3 rounded-2xl text-xs font-bold transition-all border ${
                  gameMode === 'classic'
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                كلاسيكي (3 قلوب)
              </button>
              <button
                onClick={() => setGameMode('zen')}
                className={`py-2 px-3 rounded-2xl text-xs font-bold transition-all border ${
                  gameMode === 'zen'
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                استرخاء (بدون قنابل)
              </button>
              <button
                onClick={() => setGameMode('arcade')}
                className={`py-2 px-3 rounded-2xl text-xs font-bold transition-all border ${
                  gameMode === 'arcade'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                أركيد (جنون الفواكه)
              </button>
            </div>

            {/* Blade Selector */}
            <div className="mb-6">
              <div className="text-xs text-slate-400 mb-2 font-medium">اختر لون وسحر شفرتك:</div>
              <div className="flex items-center justify-center gap-2">
                {BLADES.map((blade) => (
                  <button
                    key={blade.id}
                    onClick={() => setSelectedBlade(blade)}
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center border-2 transition-transform ${
                      selectedBlade.id === blade.id ? 'scale-110 border-white' : 'border-transparent opacity-60'
                    }`}
                    style={{ backgroundColor: blade.color }}
                    title={blade.name}
                  />
                ))}
              </div>
            </div>

            {/* Play Button */}
            <button
              onClick={() => startGame(gameMode)}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-lg rounded-2xl shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-3 transition-transform active:scale-95"
            >
              {gameOver ? <RotateCcw className="w-6 h-6" /> : <Play className="w-6 h-6 fill-current" />}
              <span>{gameOver ? 'إعادة اللعب الآن' : 'ابدأ التقطيع الآن'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Footer controls */}
      <div className="absolute bottom-3 inset-x-4 z-20 flex items-center justify-between pointer-events-none text-xs text-slate-400">
        <div className="bg-slate-950/70 backdrop-blur-sm px-3 py-1 rounded-xl border border-slate-800 pointer-events-auto">
          مرر بإصبعك أو الفأرة لتقطيع الفواكه 🍉 🔪
        </div>
        <div className="bg-slate-950/70 backdrop-blur-sm px-3 py-1 rounded-xl border border-slate-800 pointer-events-auto flex items-center gap-1.5 text-emerald-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span>شفرة: {selectedBlade.name}</span>
        </div>
      </div>
    </div>
  );
};
