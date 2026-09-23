import { useState, useEffect, useRef } from 'preact/hooks';
import { Entidade, Tiro, Particula, Chefao, Nave } from './types';
import { NAVES, MUSICAS } from './constants';

export function useGameEngine() {
    const [iniciado, setIniciado] = useState(false);
    const [pausado, setPausado] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const bossAudioRef = useRef<HTMLAudioElement | null>(null);
    
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [vida, setVida] = useState(100);
    const [temEscudo, setTemEscudo] = useState(false);
    const [laserDuploAtivo, setLaserDuploAtivo] = useState(false);
    const [superCarga, setSuperCarga] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [shake, setShake] = useState(false);

    const [naveSelecionada, setNaveSelecionada] = useState<Nave>(NAVES[0]);
    const [musicaSelecionada] = useState(MUSICAS[0]);

    const posPlayerRef = useRef(50);
    const [posRender, setPosRender] = useState(50);

    const [objetosRender, setObjetosRender] = useState<Entidade[]>([]);
    const [tirosRender, setTirosRender] = useState<Tiro[]>([]);
    const [particulasRender, setParticulasRender] = useState<Particula[]>([]);
    const [chefaoRender, setChefaoRender] = useState<Chefao | null>(null);
    
    const objetosRef = useRef<Entidade[]>([]);
    const tirosRef = useRef<Tiro[]>([]);
    const particulasRef = useRef<Particula[]>([]);
    const chefaoRef = useRef<Chefao>({ ativo: false, x: 50, y: 15, vida: 200, vidaMax: 200, direcao: 1 });
    
    const containerRef = useRef<HTMLDivElement>(null);
    const gameState = useRef({ iniciado: false, pausado: false, gameOver: false });
    const laserDuploRef = useRef(false);
    laserDuploRef.current = laserDuploAtivo;
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
    const laserTimerRef = useRef(0);

    useEffect(() => {
        const salvo = localStorage.getItem('nexus_highscore');
        if (salvo) {
            const val = Number(salvo);
            setHighScore(val);
            highScoreRef.current = val;
        }
    }, []);

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        } else if (document.exitFullscreen) {
            document.exitFullscreen();
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

    const ativarBombaNuclear = () => {
        dispararTremido();
        objetosRef.current = [];
        setObjetosRender([]);
        if (chefaoRef.current.ativo) {
            chefaoRef.current.vida -= 80;
            if (chefaoRef.current.vida <= 0) {
                chefaoRef.current.ativo = false;
                setChefaoRender(null);
                setScore(s => s + 500);
                adicionarParticula(50, 20, "+500 CHEFÃO DESTRUÍDO!", "#a855f7");
                if (bossAudioRef.current) bossAudioRef.current.pause();
                if (audioRef.current && !pausado) audioRef.current.play().catch(() => {});
            } else {
                setChefaoRender({ ...chefaoRef.current });
            }
        }
        adicionarParticula(50, 50, "BOMBA LIMPOU A TELA!", "#ef4444");
    };

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

                if (laserDuploRef.current) {
                    laserTimerRef.current += delta;
                    if (laserTimerRef.current > 7) {
                        setLaserDuploAtivo(false);
                        laserTimerRef.current = 0;
                    }
                }

                const mult = multiplicadorRef.current;
                const taxaSpawn = Math.max(0.30, 1.0 - (mult * 0.06));

                if (scoreRef.current > 0 && scoreRef.current % 1000 === 0 && !chefaoRef.current.ativo) {
                    chefaoRef.current = {
                        ativo: true, x: 50, y: 18,
                        vida: 250 + (mult * 50), vidaMax: 250 + (mult * 50), direcao: 1
                    };
                    setChefaoRender({ ...chefaoRef.current });
                    adicionarParticula(50, 20, "ALERTA: CHEFÃO DETECTADO!", "#ef4444");
                    if (audioRef.current) audioRef.current.pause();
                    if (bossAudioRef.current) {
                        bossAudioRef.current.volume = 0.6;
                        bossAudioRef.current.play().catch(() => {});
                    }
                }

                if (tiroTimerRef.current >= 0.32) {
                    tiroTimerRef.current = 0;
                    const xAtual = posPlayerRef.current;
                    if (laserDuploRef.current) {
                        tirosRef.current.push(
                            { id: Date.now() + Math.random(), x: xAtual - 3, y: 75, tipo: 'duplo' },
                            { id: Date.now() + Math.random() + 1, x: xAtual + 3, y: 75, tipo: 'duplo' }
                        );
                    } else {
                        tirosRef.current.push({ id: Date.now() + Math.random(), x: xAtual, y: 75, tipo: 'normal' });
                    }
                }

                if (!chefaoRef.current.ativo && spawnTimer >= taxaSpawn && objetosRef.current.length < 14) {
                    spawnTimer = 0;
                    const rand = Math.random();
                    let tipoAleatorio: Entidade['tipo'] = 'inimigo';
                    if (rand > 0.94) tipoAleatorio = 'bomba';
                    else if (rand > 0.88) tipoAleatorio = 'laser_duplo';
                    else if (rand > 0.80) tipoAleatorio = 'escudo';
                    else if (rand > 0.70) tipoAleatorio = 'vida';
                    else if (rand > 0.52) tipoAleatorio = 'meteoro';

                    objetosRef.current.push({ id: Date.now() + Math.random(), x: Math.random() * 82 + 9, y: 0, tipo: tipoAleatorio });
                }

                if (chefaoRef.current.ativo) {
                    chefaoRef.current.x += chefaoRef.current.direcao * 25 * delta;
                    if (chefaoRef.current.x > 80 || chefaoRef.current.x < 20) chefaoRef.current.direcao *= -1;
                    setChefaoRender({ ...chefaoRef.current });
                }

                const velocidadeQueda = (40 + (mult * 9)) * delta;
                const velocidadeTiro = 110 * delta;
                const playerX = posPlayerRef.current;

                let novosTiros: Tiro[] = [];
                for (let t = 0; t < tirosRef.current.length; t++) {
                    let tiro = tirosRef.current[t];
                    let novoTiroY = tiro.y - velocidadeTiro;
                    if (novoTiroY > 0) novosTiros.push({ ...tiro, y: novoTiroY });
                }
                tirosRef.current = novosTiros;

                if (chefaoRef.current.ativo) {
                    for (let t = 0; t < tirosRef.current.length; t++) {
                        let tiro = tirosRef.current[t];
                        if (Math.abs(tiro.x - chefaoRef.current.x) < 14 && Math.abs(tiro.y - chefaoRef.current.y) < 8) {
                            tirosRef.current.splice(t, 1);
                            chefaoRef.current.vida -= (tiro.tipo === 'duplo' ? 12 : 7);
                            adicionarParticula(tiro.x, tiro.y, "-DANO", "#a855f7");
                            if (chefaoRef.current.vida <= 0) {
                                chefaoRef.current.ativo = false;
                                setChefaoRender(null);
                                setScore(s => s + 800);
                                adicionarParticula(50, 25, "+800 CHEFÃO!", "#f59e0b");
                                if (bossAudioRef.current) bossAudioRef.current.pause();
                                if (audioRef.current && !pausado) audioRef.current.play().catch(() => {});
                            } else {
                                setChefaoRender({ ...chefaoRef.current });
                            }
                            break;
                        }
                    }
                }

                let novasEntidades: Entidade[] = [];
                for (let i = 0; i < objetosRef.current.length; i++) {
                    let obj = objetosRef.current[i];
                    let velAtual = obj.tipo === 'meteoro' ? velocidadeQueda * 1.6 : velocidadeQueda;
                    let novoY = obj.y + velAtual;

                    let atingidoPorTiro = false;
                    for (let t = 0; t < tirosRef.current.length; t++) {
                        let tiro = tirosRef.current[t];
                        if (Math.abs(tiro.x - obj.x) < 7 && Math.abs(tiro.y - novoY) < 7) {
                            atingidoPorTiro = true;
                            tirosRef.current.splice(t, 1);
                            if (obj.tipo === 'meteoro' || obj.tipo === 'inimigo') {
                                const pts = obj.tipo === 'meteoro' ? 35 : 12;
                                setScore(s => s + pts);
                                adicionarParticula(obj.x, novoY, `+${pts}`, obj.tipo === 'meteoro' ? '#f59e0b' : '#38bdf8');
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
                            adicionarParticula(playerX, 75, "ESCUDO!", "#3b82f6");
                        } else if (obj.tipo === 'laser_duplo') {
                            setLaserDuploAtivo(true);
                            laserTimerRef.current = 0;
                            adicionarParticula(playerX, 75, "DUPLO!", "#06b6d4");
                        } else if (obj.tipo === 'bomba') {
                            ativarBombaNuclear();
                        } else {
                            if (temEscudoRef.current) {
                                setTemEscudo(false);
                                adicionarParticula(playerX, 75, "BLOQUEADO!", "#3b82f6");
                            } else {
                                const dano = obj.tipo === 'meteoro' ? 35 : (15 + (mult * 2));
                                const novaVida = Math.max(0, vidaRef.current - dano);
                                setVida(novaVida);
                                dispararTremido();
                                if (novaVida <= 0) {
                                    setGameOver(true);
                                    if (bossAudioRef.current) bossAudioRef.current.pause();
                                    if (audioRef.current) audioRef.current.pause();
                                }
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
        let porcentagem = ((clientX - rect.left) / rect.width) * 100;
        porcentagem = Math.max(5, Math.min(95, porcentagem));
        posPlayerRef.current = porcentagem;
        setPosRender(porcentagem);
    };

    const resetarJogo = () => {
        if (bossAudioRef.current) bossAudioRef.current.pause();
        setScore(0); setVida(100); setTemEscudo(false); setLaserDuploAtivo(false); setSuperCarga(0);
        objetosRef.current = []; tirosRef.current = []; particulasRef.current = [];
        chefaoRef.current = { ativo: false, x: 50, y: 15, vida: 200, vidaMax: 200, direcao: 1 };
        setChefaoRender(null); setObjetosRender([]); setTirosRender([]);
        setGameOver(false); setIniciado(true); setPausado(false);
    };

    return {
        iniciado, setIniciado, pausado, setPausado, score, highScore, vida, temEscudo,
        laserDuploAtivo, superCarga, gameOver, isFullScreen, shake, naveSelecionada,
        setNaveSelecionada, musicaSelecionada, posRender, objetosRender, tirosRender,
        particulasRender, chefaoRender, containerRef, audioRef, bossAudioRef,
        toggleFullScreen, handleMove, resetarJogo
    };
}
