import { useState, useEffect, useRef } from 'preact/hooks';
import { Shield, Zap, Skull, Trophy, Play, RotateCcw, Pause, Heart, Castle, Flame, Award, Maximize, Minimize } from 'lucide-preact';

interface Entidade {
    id: number;
    x: number;
    y: number;
    tipo: 'inimigo' | 'vida';
}

export function Home() {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [iniciado, setIniciado] = useState(false);
    const [pausado, setPausado] = useState(false);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [vida, setVida] = useState(100);
    const [gameOver, setGameOver] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);

    const posPlayerRef = useRef(50);
    const [posRender, setPosRender] = useState(50);

    const [objetosRender, setObjetosRender] = useState<Entidade[]>([]);
    
    const objetosRef = useRef<Entidade[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const gameState = useRef({ iniciado: false, pausado: false, gameOver: false });

    gameState.current = { iniciado, pausado, gameOver };

    const scoreRef = useRef(score);
    scoreRef.current = score;

    const vidaRef = useRef(vida);
    vidaRef.current = vida;

    const highScoreRef = useRef(highScore);
    highScoreRef.current = highScore;

    const scoreTimerRef = useRef(0);

    useEffect(() => {
        const salvo = localStorage.getItem('nexus_highscore');
        if (salvo) {
            const val = Number(salvo);
            setHighScore(val);
            highScoreRef.current = val;
        }
    }, []);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullScreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error("Erro ao ativar tela cheia:", err);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && iniciado && !gameOver && !pausado) {
                setGameOver(true);
                setVida(0);
            }
        };

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (iniciado && !gameOver) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [iniciado, gameOver, pausado]);

    // CONTROLE CENTRALIZADO DE ÁUDIO (Sem travar o loop de física)
    useEffect(() => {
        if (!audioRef.current) return;

        if (iniciado && !pausado && !gameOver) {
            audioRef.current.volume = 0.4;
            audioRef.current.play().catch(err => console.log("Áudio bloqueado:", err));
        } else {
            audioRef.current.pause();
        }
    }, [iniciado, pausado, gameOver]);

    const multiplicador = Math.floor(score / 100) + 1;
    const multiplicadorRef = useRef(multiplicador);
    multiplicadorRef.current = multiplicador;

    // LOOP DE FÍSICA LIMPO
    useEffect(() => {
        let animationFrameId: number;
        let lastTime = performance.now();
        let spawnTimer = 0;

        const loop = (time: number) => {
            const delta = Math.min((time - lastTime) / 1000, 0.01);
            lastTime = time;

            if (gameState.current.iniciado && !gameState.current.pausado && !gameState.current.gameOver) {
                spawnTimer += delta;
                scoreTimerRef.current += delta;

                const mult = multiplicadorRef.current;
                const taxaSpawn = Math.max(0.4, 1.2 - (mult * 0.08));

                if (spawnTimer >= taxaSpawn && objetosRef.current.length < 8) {
                    spawnTimer = 0;
                    const tipoAleatorio: 'inimigo' | 'vida' = Math.random() > 0.88 ? 'vida' : 'inimigo';
                    objetosRef.current.push({
                        id: Date.now() + Math.random(),
                        x: Math.random() * 84 + 8,
                        y: 0,
                        tipo: tipoAleatorio
                    });
                }

                const velocidadeQueda = (35 + (mult * 8)) * delta;
                const playerX = posPlayerRef.current;

                let novasEntidades: Entidade[] = [];
                for (let i = 0; i < objetosRef.current.length; i++) {
                    let obj = objetosRef.current[i];
                    let novoY = obj.y + velocidadeQueda;

                    if (novoY >= 72 && novoY <= 85 && Math.abs(obj.x - playerX) < 10) {
                        if (obj.tipo === 'vida') {
                            const novaVida = Math.min(100, vidaRef.current + 25);
                            setVida(novaVida);
                        } else {
                            const dano = 15 + (mult * 2);
                            const novaVida = Math.max(0, vidaRef.current - dano);
                            setVida(novaVida);
                            if (novaVida <= 0) {
                                setGameOver(true);
                            }
                        }
                        continue;
                    }

                    if (novoY >= 100) {
                        continue;
                    }

                    novasEntidades.push({ ...obj, y: novoY });
                }

                objetosRef.current = novasEntidades;
                setObjetosRender([...novasEntidades]);

                if (scoreTimerRef.current >= 0.2) { // Ajustado para 0.2s padrão para não subir insano
                    scoreTimerRef.current = 0;
                    setScore(s => {
                        const novoScore = s + 1;
                        if (novoScore > highScoreRef.current) {
                            setHighScore(novoScore);
                            localStorage.setItem('nexus_highscore', String(novoScore));
                        }
                        return novoScore;
                    });
                }
            }

            animationFrameId = requestAnimationFrame(loop);
        };

        animationFrameId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animationFrameId);
    }, []);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const handleTouch = (e: TouchEvent) => {
            if (pausado || gameOver) return;
            const target = e.target as HTMLElement;
            if (target.closest('button')) return;

            e.preventDefault();
            const touch = e.touches[0];
            const xPercent = Math.max(5, Math.min(95, (touch.clientX / window.innerWidth) * 100));
            
            posPlayerRef.current = xPercent;
            setPosRender(xPercent);
        };

        el.addEventListener('touchmove', handleTouch, { passive: false });
        el.addEventListener('touchstart', handleTouch, { passive: false });

        return () => {
            el.removeEventListener('touchmove', handleTouch);
            el.removeEventListener('touchstart', handleTouch);
        };
    }, [pausado, gameOver]);

    const reiniciar = () => {
        setVida(100);
        setScore(0);
        scoreTimerRef.current = 0;
        objetosRef.current = [];
        setObjetosRender([]);
        setGameOver(false);
        setPausado(false);
        posPlayerRef.current = 50;
        setPosRender(50);
        setIniciado(true);
    };

    return (
        <div 
            ref={containerRef}
            className="relative w-full h-screen bg-zinc-950 text-white overflow-hidden select-none flex flex-col justify-between p-3 touch-none">
          <audio ref={audioRef} src="/trilha.mp3" loop preload="auto" />
            <div className="w-full flex justify-between items-center bg-zinc-900/90 p-2.5 rounded-xl border border-zinc-800 z-30 shadow-lg gap-1">
                <div className="flex items-center gap-1 text-cyan-400 font-bold text-xs">
                    <Shield className="w-4 h-4" />
                    <span>{vida}%</span>
                </div>

                <div className="flex items-center gap-1 text-purple-400 font-bold text-xs">
                    <Award className="w-4 h-4" />
                    <span>{highScore}</span>
                </div>

                <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-lg text-amber-400 font-black text-xs">
                    <Flame className="w-3.5 h-3.5 animate-bounce" />
                    <span>{multiplicador}x</span>
                </div>

                <div className="flex items-center gap-1">
                    <button 
                        onClick={toggleFullScreen}
                        className="bg-zinc-800 p-1.5 rounded-lg text-zinc-300 active:scale-95 cursor-pointer"
                        title="Tela Cheia"
                    >
                        {isFullScreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                    </button>

                    {iniciado && !gameOver && (
                        <button 
                            onClick={() => setPausado(!pausado)}
                            className="bg-zinc-800 p-1.5 rounded-lg text-zinc-300 active:scale-95 cursor-pointer"
                        >
                            <Pause className="w-4 h-4" />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-1 text-yellow-400 font-bold text-xs">
                    <Trophy className="w-4 h-4" />
                    <span>{score}</span>
                </div>
            </div>

            {(!iniciado || gameOver || pausado) && (
                <div className="absolute inset-0 bg-black/85 z-40 flex flex-col items-center justify-center gap-6 p-6 text-center backdrop-blur-sm">
                    <h1 className="text-3xl font-black text-cyan-400 tracking-wider">
                        {gameOver ? "FIM DE JOGO" : pausado ? "JOGO PAUSADO" : "NEXUS DEFENSE"}
                    </h1>
                    <p className="text-zinc-400 text-sm max-w-xs">
                        {gameOver 
                            ? `Sua torre caiu. Pontuação final: ${score} pts (Recorde: ${highScore}).` 
                            : pausado 
                            ? "Jogo pausado." 
                            : "Áudio sincronizado com o estado do jogo. Defenda a torre!"}
                    </p>
                    <div className="flex gap-4">
                        {pausado ? (
                            <button
                                onClick={() => setPausado(false)}
                                className="flex items-center gap-2 bg-cyan-500 text-black font-bold px-6 py-3 rounded-xl active:scale-95 cursor-pointer"
                            >
                                <Play className="w-5 h-5" /> RETORNAR
                            </button>
                        ) : (
                            <button
                                onClick={reiniciar}
                                className="flex items-center gap-2 bg-cyan-500 text-black font-bold px-6 py-3 rounded-xl active:scale-95 shadow-[0_0_20px_rgba(6,182,212,0.4)] cursor-pointer"
                            >
                                {gameOver ? <RotateCcw className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                                {gameOver ? "TENTAR DE NOVO" : "INICIAR MISSÃO"}
                            </button>
                        )}
                    </div>
                </div>
            )}

            <div className="relative w-full flex-1">
                {objetosRender.map(obj => (
                    <div
                        key={obj.id}
                        className="absolute transform -translate-x-1/2 will-change-transform pointer-events-none"
                        style={{ left: `${obj.x}%`, top: `${obj.y}%` }}
                    >
                        {obj.tipo === 'vida' ? (
                            <Heart className="w-7 h-7 text-red-500 animate-bounce fill-red-500" />
                        ) : (
                            <Skull className="w-8 h-8 text-rose-600 animate-pulse" />
                        )}
                    </div>
                ))}

                <div 
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 text-zinc-600 z-10 will-change-transform"
                    style={{ left: `${posRender}%`, top: `80%` }}
                >
                    <Castle className="w-20 h-20 opacity-40 text-cyan-900" />
                </div>

                <div
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 text-cyan-400 z-20 will-change-transform"
                    style={{ left: `${posRender}%`, top: `78%` }}
                >
                    <div className="relative flex items-center justify-center w-12 h-12 bg-cyan-950/80 border-2 border-cyan-400 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.6)]">
                        <Zap className="w-6 h-6 text-cyan-300" />
                    </div>
                </div>
            </div>

            <div className="text-xs text-zinc-600 text-center pb-1 z-10">
                Áudio Blindado • 60 FPS
            </div>
        </div>
    );
}

export default Home;
