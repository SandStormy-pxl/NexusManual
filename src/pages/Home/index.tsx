import { useState, useEffect, useRef } from 'preact/hooks';
import { Shield, Sparkles, Rocket, Trophy, Play, RotateCcw, Pause, Heart, Flame, Award, Maximize, Minimize, Sparkle, Zap } from 'lucide-preact';

interface Entidade {
    id: number;
    x: number;
    y: number;
    tipo: 'inimigo' | 'vida' | 'meteoro' | 'escudo';
}

interface Tiro {
    id: number;
    x: number;
    y: number;
}

interface Particula {
    id: number;
    x: number;
    y: number;
    texto: string;
    cor: string;
}

export function Home() {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [iniciado, setIniciado] = useState(false);
    const [pausado, setPausado] = useState(false);
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [vida, setVida] = useState(100);
    const [temEscudo, setTemEscudo] = useState(false);
    const [superCarga, setSuperCarga] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [shake, setShake] = useState(false);

    const posPlayerRef = useRef(50);
    const [posRender, setPosRender] = useState(50);

    const [objetosRender, setObjetosRender] = useState<Entidade[]>([]);
    const [tirosRender, setTirosRender] = useState<Tiro[]>([]);
    const [particulasRender, setParticulasRender] = useState<Particula[]>([]);
    
    const objetosRef = useRef<Entidade[]>([]);
    const tirosRef = useRef<Tiro[]>([]);
    const particulasRef = useRef<Particula[]>([]);
    
    const containerRef = useRef<HTMLDivElement>(null);
    const gameState = useRef({ iniciado: false, pausado: false, gameOver: false });

    gameState.current = { iniciado, pausado, gameOver };

    const scoreRef = useRef(score);
    scoreRef.current = score;

    const vidaRef = useRef(vida);
    vidaRef.current = vida;

    const highScoreRef = useRef(highScore);
    highScoreRef.current = highScore;

    const temEscudoRef = useRef(temEscudo);
    temEscudoRef.current = temEscudo;

    const scoreTimerRef = useRef(0);
    const tiroTimerRef = useRef(0);

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
                console.error("Erro tela cheia:", err);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

    const dispararTremido = () => {
        setShake(true);
        setTimeout(() => setShake(false), 200);
    };

    const adicionarParticula = (x: number, y: number, texto: string, cor: string) => {
        const novaParticula = { id: Date.now() + Math.random(), x, y, texto, cor };
        particulasRef.current.push(novaParticula);
        setTimeout(() => {
            particulasRef.current = particulasRef.current.filter(p => p.id !== novaParticula.id);
            setParticulasRender([...particulasRef.current]);
        }, 600);
    };

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && iniciado && !gameOver && !pausado) {
                setGameOver(true);
                setVida(0);
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [iniciado, gameOver, pausado]);

    useEffect(() => {
        if (!audioRef.current) return;
        if (iniciado && !pausado && !gameOver) {
            audioRef.current.volume = 0.4;
            audioRef.current.play().catch(err => console.log("Áudio bloqueado:", err));
        } else {
            audioRef.current.pause();
        }
    }, [iniciado, pausado, gameOver]);

    const multiplicador = Math.floor(score / 200) + 1;
    const multiplicadorRef = useRef(multiplicador);
    multiplicadorRef.current = multiplicador;

    // LOOP DE FÍSICA E MECÂNICAS COMPLETAS
    useEffect(() => {
        let animationFrameId: number;
        let lastTime = performance.now();
        let spawnTimer = 0;

        const loop = (time: number) => {
            const delta = Math.min((time - lastTime) / 1000, 1);
            lastTime = time;

            if (gameState.current.iniciado && !gameState.current.pausado && !gameState.current.gameOver) {
                spawnTimer += delta;
                scoreTimerRef.current += delta;
                tiroTimerRef.current += delta;

                const mult = multiplicadorRef.current;
                const taxaSpawn = Math.max(0.35, 1.1 - (mult * 0.07));

                // Disparo de tiros automáticos
                if (tiroTimerRef.current >= 0.35) {
                    tiroTimerRef.current = 0;
                    const xAtual = posPlayerRef.current;
                    tirosRef.current.push({ id: Date.now() + Math.random(), x: xAtual, y: 75 });
                }

                if (spawnTimer >= taxaSpawn && objetosRef.current.length < 12) {
                    spawnTimer = 0;
                    const rand = Math.random();
                    let tipoAleatorio: Entidade['tipo'] = 'inimigo';
                    if (rand > 0.92) tipoAleatorio = 'escudo';
                    else if (rand > 0.82) tipoAleatorio = 'vida';
                    else if (rand > 0.65) tipoAleatorio = 'meteoro';

                    objetosRef.current.push({
                        id: Date.now() + Math.random(),
                        x: Math.random() * 84 + 8,
                        y: 0,
                        tipo: tipoAleatorio
                    });
                }

                const velocidadeQueda = (38 + (mult * 8)) * delta;
                const velocidadeTiro = 100 * delta;
                const playerX = posPlayerRef.current;

                // Atualizar Tiros
                let novosTiros: Tiro[] = [];
                for (let t = 0; t < tirosRef.current.length; t++) {
                    let tiro = tirosRef.current[t];
                    let novoTiroY = tiro.y - velocidadeTiro;
                    if (novoTiroY > 0) {
                        novosTiros.push({ ...tiro, y: novoTiroY });
                    }
                }
                tirosRef.current = novosTiros;

                // Atualizar Entidades e Colisões
                let novasEntidades: Entidade[] = [];
                for (let i = 0; i < objetosRef.current.length; i++) {
                    let obj = objetosRef.current[i];
                    let velAtual = obj.tipo === 'meteoro' ? velocidadeQueda * 1.7 : velocidadeQueda;
                    let novoY = obj.y + velAtual;

                    // Colisão Tiro vs Objeto
                    let atingidoPorTiro = false;
                    for (let t = 0; t < tirosRef.current.length; t++) {
                        let tiro = tirosRef.current[t];
                        if (Math.abs(tiro.x - obj.x) < 7 && Math.abs(tiro.y - novoY) < 7) {
                            atingidoPorTiro = true;
                            tirosRef.current.splice(t, 1);
                            
                            if (obj.tipo === 'meteoro' || obj.tipo === 'inimigo') {
                                const pts = obj.tipo === 'meteoro' ? 30 : 10;
                                setScore(s => s + pts);
                                adicionarParticula(obj.x, novoY, `+${pts}`, obj.tipo === 'meteoro' ? '#f59e0b' : '#38bdf8');
                                setSuperCarga(sc => {
                                    const novaCarga = sc + 15;
                                    if (novaCarga >= 100) {
                                        // Super Laser automático que limpa a tela de inimigos
                                        objetosRef.current = objetosRef.current.filter(o => o.y > 50);
                                        adicionarParticula(playerX, 70, "SUPER LASER!", "#a855f7");
                                        return 0;
                                    }
                                    return novaCarga;
                                });
                            }
                            break;
                        }
                    }

                    if (atingidoPorTiro) continue;

                    // Colisão Objeto vs Base do Jogador
                    if (novoY >= 72 && novoY <= 85 && Math.abs(obj.x - playerX) < 10) {
                        if (obj.tipo === 'vida') {
                            setVida(v => Math.min(100, v + 25));
                            adicionarParticula(playerX, 75, "+25 HP", "#ef4444");
                        } else if (obj.tipo === 'escudo') {
                            setTemEscudo(true);
                            adicionarParticula(playerX, 75, "ESCUDO ATIVO!", "#3b82f6");
                        } else {
                            if (temEscudoRef.current) {
                                setTemEscudo(false);
                                adicionarParticula(playerX, 75, "BLOQUEADO!", "#3b82f6");
                            } else {
                                const dano = obj.tipo === 'meteoro' ? 35 : (15 + (mult * 2));
                                const novaVida = Math.max(0, vidaRef.current - dano);
                                setVida(novaVida);
                                dispararTremido();
                                adicionarParticula(playerX, 75, `-${dano}`, "#f43f5e");
                                if (novaVida <= 0) setGameOver(true);
                            }
                        }
                        continue;
                    }

                    if (novoY >= 100) continue;

                    novasEntidades.push({ ...obj, y: novoY });
                }

                objetosRef.current = novasEntidades;
                setObjetosRender([...novasEntidades]);
                setTirosRender([...tirosRef.current]);

                if (scoreTimerRef.current >= 0.2) {
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
        setSuperCarga(0);
        setTemEscudo(false);
        scoreTimerRef.current = 0;
        objetosRef.current = [];
        tirosRef.current = [];
        particulasRef.current = [];
        setObjetosRender([]);
        setTirosRender([]);
        setParticulasRender([]);
        setGameOver(false);
        setPausado(false);
        posPlayerRef.current = 50;
        setPosRender(50);
        setIniciado(true);
    };

    return (
        <div 
            ref={containerRef}
            className={`relative w-full h-screen bg-zinc-950 text-white overflow-hidden select-none flex flex-col justify-between p-3 touch-none ${shake ? 'animate-bounce' : ''}`}
        >
            <audio ref={audioRef} src="/trilha-1.mp3" loop preload="auto" />
            
            {/* Header / Painel Superior */}
            <div className="w-full flex flex-col gap-1.5 bg-zinc-900/90 p-2.5 rounded-xl border border-zinc-800 z-30 shadow-lg">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-xs">
                        <Shield className="w-4 h-4" />
                        <span>{vida}%</span>
                        {temEscudo && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1 rounded border border-blue-500/40">ESCUDO</span>}
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
                        <button onClick={toggleFullScreen} className="bg-zinc-800 p-1.5 rounded-lg text-zinc-300 active:scale-95 cursor-pointer">
                            {isFullScreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                        </button>
                        {iniciado && !gameOver && (
                            <button onClick={() => setPausado(!pausado)} className="bg-zinc-800 p-1.5 rounded-lg text-zinc-300 active:scale-95 cursor-pointer">
                                <Pause className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-1 text-yellow-400 font-bold text-xs">
                        <Trophy className="w-4 h-4" />
                        <span>{score}</span>
                    </div>
                </div>

                {/* Barra de Carga do Super Laser */}
                <div className="w-full bg-zinc-950 h-1.5 rounded-full overflow-hidden border border-zinc-800">
                    <div className="bg-gradient-to-r from-cyan-500 to-purple-500 h-full transition-all duration-100" style={{ width: `${superCarga}%` }} />
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
                            : "Escudos, tiros automáticos e meteoros ativos. Defenda o núcleo!"}
                    </p>
                    <div className="flex gap-4">
                        {pausado ? (
                            <button onClick={() => setPausado(false)} className="flex items-center gap-2 bg-cyan-500 text-black font-bold px-6 py-3 rounded-xl active:scale-95 cursor-pointer">
                                <Play className="w-5 h-5" /> RETORNAR
                            </button>
                        ) : (
                            <button onClick={reiniciar} className="flex items-center gap-2 bg-cyan-500 text-black font-bold px-6 py-3 rounded-xl active:scale-95 shadow-[0_0_20px_rgba(6,182,212,0.4)] cursor-pointer">
                                {gameOver ? <RotateCcw className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                                {gameOver ? "TENTAR DE NOVO" : "INICIAR MISSÃO"}
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Área de Jogo */}
            <div className="relative w-full flex-1">
                {/* Tiros */}
                {tirosRender.map(tiro => (
                    <div
                        key={tiro.id}
                        className="absolute transform -translate-x-1/2 w-1.5 h-4 bg-cyan-300 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.9)] pointer-events-none z-15"
                        style={{ left: `${tiro.x}%`, top: `${tiro.y}%` }}
                    />
                ))}

                {/* Partículas / Textos Flutuantes */}
                {particulasRender.map(p => (
                    <div
                        key={p.id}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 font-black text-xs pointer-events-none z-30 animate-fade-out"
                        style={{ left: `${p.x}%`, top: `${p.y}%`, color: p.cor, textShadow: '0 0 8px rgba(0,0,0,0.8)' }}
                    >
                        {p.texto}
                    </div>
                ))}

                {/* Entidades */}
                {objetosRender.map(obj => (
                    <div
                        key={obj.id}
                        className="absolute transform -translate-x-1/2 will-change-transform pointer-events-none"
                        style={{ left: `${obj.x}%`, top: `${obj.y}%` }}
                    >
                        {obj.tipo === 'vida' ? (
                            <Heart className="w-7 h-7 text-red-500 animate-bounce fill-red-500" />
                        ) : obj.tipo === 'escudo' ? (
                            <Shield className="w-7 h-7 text-blue-400 animate-pulse fill-blue-500/30" />
                        ) : obj.tipo === 'meteoro' ? (
                            <Sparkle className="w-8 h-8 text-amber-400 animate-spin -rotate-45 fill-amber-500" />
                        ) : (
                            <Sparkles className="w-8 h-8 text-rose-600 animate-pulse" />
                        )}
                    </div>
                ))}

                {/* Base do Jogador */}
                <div
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 text-cyan-400 z-20 will-change-transform"
                    style={{ left: `${posRender}%`, top: `78%` }}
                >
                    <div className={`relative flex items-center justify-center w-12 h-12 bg-cyan-950/80 border-2 ${temEscudo ? 'border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.8)]' : 'border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.6)]'} rounded-full`}>
                        <Rocket className="w-6 h-6 text-cyan-300 -rotate-45" />
                    </div>
                </div>
            </div>

            <div