import { useState, useEffect, useRef } from 'preact/hooks';
import { Shield, Sparkles, Rocket, Trophy, Play, RotateCcw, Pause, Heart, Flame, Award, Maximize, Minimize, Sparkle, Disc, Zap } from 'lucide-preact';

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

interface Nave {
    id: string;
    nome: string;
    corBorda: string;
    corBg: string;
    icone: any;
}

const NAVES: Nave[] = [
    { id: 'padrao', nome: 'Poco Interceptor', corBorda: 'border-cyan-400', corBg: 'bg-cyan-950/80', icone: Rocket },
    { id: 'furia', nome: 'Fúria Vermelha', corBorda: 'border-rose-500', corBg: 'bg-rose-950/80', icone: Sparkles },
    { id: 'tita', nome: 'Titã Blindado', corBorda: 'border-amber-400', corBg: 'bg-amber-950/80', icone: Zap }
];

const MUSICAS = [
    { id: 'trilha-1', nome: 'Trilha Padrão (Cyber)', arquivo: '/trilha-1.mp3' },
    { id: 'trilha-2', nome: 'Bass Boosted Minimal', arquivo: '/trilha-2.mp3' }
];

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

    const [naveSelecionada, setNaveSelecionada] = useState<Nave>(NAVES[0]);
    const [musicaSelecionada, setMusicaSelecionada] = useState(MUSICAS[0]);

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
    }, [iniciado, pausado, gameOver, musicaSelecionada]);

    const multiplicador = Math.floor(score / 200) + 1;
    const multiplicadorRef = useRef(multiplicador);
    multiplicadorRef.current = multiplicador;

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

                let novosTiros: Tiro[] = [];
                for (let t = 0; t < tirosRef.current.length; t++) {
                    let tiro = tirosRef.current[t];
                    let novoTiroY = tiro.y - velocidadeTiro;
                    if (novoTiroY > 0) {
                        novosTiros.push({ ...tiro, y: novoTiroY });
                    }
                }
                tirosRef.current = novosTiros;

                let novasEntidades: Entidade[] = [];
                for (let i = 0; i < objetosRef.current.length; i++) {
                    let obj = objetosRef.current[i];
                    let velAtual = obj.tipo === 'meteoro' ? velocidadeQueda * 1.7 : velocidadeQueda;
                    let novoY = obj.y + velAtual;

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

      const handleMove = (clientX: number) => {
        if (!containerRef.current || !iniciado || pausado || gameOver) return;
        const rect = containerRef.current.getBoundingClientRect();
        const xRelativo = clientX - rect.left;
        let porcentagem = (xRelativo / rect.width) * 100;
        if (porcentagem < 5) porcentagem = 5;
        if (porcentagem > 95) porcentagem = 95;
        posPlayerRef.current = porcentagem;
        setPosRender(porcentagem);
    };

    const handleTouchMove = (e: TouchEvent) => {
        if (e.touches.length > 0) handleMove(e.touches[0].clientX);
    };

    const handleMouseMove = (e: MouseEvent) => {
        handleMove(e.clientX);
    };

    const resetarJogo = () => {
        setScore(0);
        setVida(100);
        setTemEscudo(false);
        setSuperCarga(0);
        objetosRef.current = [];
        tirosRef.current = [];
        particulasRef.current = [];
        setObjetosRender([]);
        setTirosRender([]);
        setGameOver(false);
        setIniciado(true);
        setPausado(false);
    };

    const IconeNave = naveSelecionada.icone;

    return (
        <div className="w-full max-w-md mx-auto min-h-screen bg-slate-950 text-slate-100 flex flex-col font-mono select-none overflow-hidden relative border-x border-slate-900 shadow-2xl">
            <audio ref={audioRef} src={musicaSelecionada.arquivo} loop />

            {!iniciado ? (
                <div className="flex-1 flex flex-col justify-between p-6 bg-gradient-to-b from-slate-900 via-slate-950 to-black z-10">
                    <div className="flex justify-between items-center pt-2">
                        <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-full">
                            <Flame className="w-4 h-4 text-cyan-400 animate-pulse" />
                            <span className="text-xs tracking-wider uppercase text-cyan-400 font-bold">NEXUS INTERCEPTOR</span>
                        </div>
                        <button onClick={toggleFullScreen} className="p-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-full text-slate-400 hover:text-white transition">
                            {isFullScreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                        </button>
                    </div>

                    <div className="my-auto space-y-6 text-center">
                        <div className="relative inline-block">
                            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl blur-md opacity-40 animate-pulse"></div>
                            <div className="relative bg-slate-900 border border-slate-700/80 p-6 rounded-2xl shadow-xl">
                                <Rocket className="w-16 h-16 mx-auto text-cyan-400 mb-2 animate-bounce" />
                                <h1 className="text-2xl font-black tracking-tight text-white uppercase">Nexus Strike</h1>
                                <p className="text-xs text-slate-400 mt-1">Arcade Espacial Mobile</p>
                            </div>
                        </div>

                        <div className="space-y-3 text-left bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 text-xs text-slate-300">
                            <p className="font-bold text-cyan-400 uppercase tracking-wide">Configurar Esquadrão:</p>
                            <div className="grid grid-cols-3 gap-2">
                                {NAVES.map((n) => {
                                    const Icon = n.icone;
                                    const selecionada = naveSelecionada.id === n.id;
                                    return (
                                        <button key={n.id} onClick={() => setNaveSelecionada(n)} className={`p-2 rounded-lg border flex flex-col items-center gap-1 transition ${selecionada ? `${n.corBorda}${n.corBg} text-white shadow-lg` : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'}`}>
                                            <Icon className="w-5 h-5" />
                                            <span className="text-[10px] text-center leading-tight">{n.nome.split(' ')[0]}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 pb-4">
                        <button onClick={() => setIniciado(true)} className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black uppercase tracking-wider rounded-xl shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition active:scale-95">
                            <Play className="w-5 h-5 fill-black" /> Iniciar Missão
                        </button>
                        <div className="text-center text-[10px] text-slate-500">Mente de Anti-Herói • Foco & Eficiência</div>
                    </div>
                </div>
            ) : (
                <div 
                    ref={containerRef}
                    onMouseMove={handleMouseMove}
                    onTouchMove={handleTouchMove}
                    className={`flex-1 relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black ${shake ? 'animate-bounce' : ''}`}
                >
                    <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20 bg-gradient-to-b from-slate-950/90 to-transparent">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setPausado(!pausado)} className="p-2 bg-slate-900/80 border border-slate-800 rounded-lg text-slate-300 hover:text-white transition">
                                {pausado ? <Play className="w-4 h-4 fill-white" /> : <Pause className="w-4 h-4 fill-white" />}
                            </button>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-slate-500 uppercase tracking-widest">Score</span>
                                <span className="text-sm font-bold text-cyan-400">{score}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] text-slate-500 uppercase tracking-widest">Recorde</span>
                                <span className="text-sm font-bold text-amber-400">{highScore}</span>
                            </div>
                            <button onClick={toggleFullScreen} className="p-2 bg-slate-900/80 border border-slate-800 rounded-lg text-slate-300 hover:text-white transition">
                                {isFullScreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="absolute top-16 left-4 right-4 z-20 space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-bold">
                            <span className="text-rose-400 flex items-center gap-1">
                                <Heart className="w-3 h-3 fill-rose-500 text-rose-500" /> HP: {vida}%
                            </span>
                            {temEscudo && <span className="text-blue-400 flex items-center gap-1"><Shield className="w-3 h-3" /> ESCUDO</span>}
                            <span className="text-purple-400">SUPER: {superCarga}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                            <div className="h-full bg-rose-500 transition-all duration-200" style={{ width: `${vida}%` }}></div>
                        </div>
                    </div>

                    {tirosRender.map(t => (
                        <div key={t.id} className="absolute w-1 h-3 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.8)] -translate-x-1/2 -translate-y-1/2" style={{ left: `${t.x}%`, top: `${t.y}%` }} />
                    ))}

                    {objetosRender.map(o => (
                        <div key={o.id} className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center transition-all" style={{ left: `${o.x}%`, top: `${o.y}%` }}>
                            {o.tipo === 'meteoro' && <div className="w-8 h-8 rounded-full bg-amber-900/80 border border-amber-500 flex items-center justify-center shadow-lg"><Disc className="w-5 h-5 text-amber-400 animate-spin" /></div>}
                            {o.tipo === 'inimigo' && <div className="w-7 h-7 rounded-lg bg-rose-950/80 border border-rose-500 flex items-center justify-center shadow-lg"><Flame className="w-4 h-4 text-rose-400" /></div>}
                            {o.tipo === 'vida' && <div className="w-6 h-6 rounded-full bg-rose-900 border border-rose-400 flex items-center justify-center shadow-lg animate-pulse"><Heart className="w-3 h-3 text-white fill-white" /></div>}
                            {o.tipo === 'escudo' && <div className="w-6 h-6 rounded-full bg-blue-900 border border-blue-400 flex items-center justify-center shadow-lg animate-pulse"><Shield className="w-3 h-3 text-white" /></div>}
                        </div>
                    ))}

                    {particulasRender.map(p => (
                        <div key={p.id} className="absolute -translate-x-1/2 -translate-y-1/2 text-xs font-black animate-fade-out pointer-events-none z-30" style={{ left: `${p.x}%`, top: `${p.y}%`, color: p.cor }}>
                            {p.texto}
                        </div>
                    ))}

                    <div className="absolute bottom-8 -translate-x-1/2 -translate-y-1/2 transition-all duration-75 pointer-events-none" style={{ left: `${posRender}%` }}>
                        <div className={`p-3 rounded-xl border ${naveSelecionada.corBorda} ${naveSelecionada.corBg} shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center justify-center`}>
                            {temEscudo && <div className="absolute -inset-1 rounded-xl border-2 border-blue-400 animate-ping opacity-55"></div>}
                            <IconeNave className="w-6 h-6 text-white" />
                        </div>
                    </div>

                    {pausado && !gameOver && (
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-40 flex flex-col items-center justify-center p-6 text-center space-y-4">
                            <h2 className="text-xl font-black text-white uppercase tracking-wider">Jogo Pausado</h2>
                            <button onClick={() => setPausado(false)} className="w-full max-w-xs py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl transition">Retomar</button>
                        </div>
                    )}

                    {gameOver && (
                        <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center space-y-6">
                            <div className="space-y-2">
                                <div className="inline-block p-3 bg-rose-950/60 border border-rose-500/50 rounded-2xl mb-2">
                                    <Award className="w-10 h-10 text-rose-400 mx-auto" />
                                </div>
                                <h2 className="text-2xl font-black text-rose-500 uppercase tracking-wider">Missão Fracassada</h2>
                                <p className="text-xs text-slate-400">Sua nave foi destruída no setor.</p>
                            </div>

                            <div className="w-full max-w-xs bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2 text-sm">
                                <div className="flex justify-between text-slate-400">
                                    <span>Pontuação Final:</span>
                                    <span className="text-cyan-400 font-bold">{score}</span>
                                </div>
                                <div className="flex justify-between text-slate-400">
                                    <span>Recorde:</span>
                                    <span className="text-amber-400 font-bold">{highScore}</span>
                                </div>
                            </div>

                            <div className="w-full max-w-xs space-y-3">
                                <button onClick={resetarJogo} className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black uppercase tracking-wider rounded-xl shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition active:scale-95">
                                    <RotateCcw className="w-5 h-5" /> Tentar Novamente
                                </button>
                                <button onClick={() => setIniciado(false)} className="w-full py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold uppercase text-xs rounded-xl transition">
                                    Menu Principal
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
