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
    const chefaoRef = useRef<Chefao>({ ativo: false, x: 50, y: 15, vida: 250, vidaMax: 250, direcao: 1 });
    
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
    const bossShootTimerRef = useRef(0);

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
        // Bomba limpa apenas inimigos e meteoros, preservando itens úteis na tela
        objetosRef.current = objetosRef.current.filter(o => o.tipo === 'vida' || o.tipo === 'escudo' || o.tipo === 'laser_duplo' || o.tipo === 'bomba');
        setObjetosRender([...objetosRef.current]);
        tirosRef.current = tirosRef.current.filter(t => t.tipo !== 'boss');
        if (chefaoRef.current.ativo) {
            chefaoRef.current.vida -= 70;
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
        adicionarParticula(50, 50, "BOMBA LIMPOU A TELA!", "#38bdf8");
    };

    const multiplicador = Math.floor(score / 250) + 1;
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
                const taxaSpawn = Math.max(0.35, 1.0 - (mult * 0.05));

                // Chefão agora ativa exatamente a cada 1000 pontos
                if (scoreRef.current > 0 && scoreRef.current % 1000 === 0 && !chefaoRef.current.ativo) {
                    chefaoRef.current = {
                        ativo: true, x: 50, y: 18,
                        vida: 280 + (mult * 50), vidaMax: 280 + (mult * 50), direcao: 1
                    };
                    setChefaoRender({ ...chefaoRef.current });
                    adicionarParticula(50, 20, "ALERTA: CHEFÃO DETECTADO!", "#ef4444");
                    if (audioRef.current) audioRef.current.pause();
                    if (bossAudioRef.current) {
                        bossAudioRef.current.volume = 0.6;
                        bossAudioRef.current.play().catch(() => {});
                    }
                }

                if (tiroTimerRef.current >= 0.30) {
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

                if (chefaoRef.current.ativo) {
                    chefaoRef.current.x += chefaoRef.current.direcao * (28 + mult * 3) * delta;
                    if (chefaoRef.current.x > 82 || chefaoRef.current.x < 18) chefaoRef.current.direcao *= -1;
                    
                    bossShootTimerRef.current += delta;
                    if (bossShootTimerRef.current >= 0.85) {
                        bossShootTimerRef.current = 0;
                        tirosRef.current.push(
                            { id: Date.now() + Math.random(), x: chefaoRef.current.x - 4, y: 25, tipo: 'boss' },
                            { id: Date.now() + Math.random(), x: chefaoRef.current.x + 4, y: 25, tipo: 'boss' }
                        );
                    }
                    setChefaoRender({ ...chefaoRef.current });
                }

                if (!chefaoRef.current.ativo && spawnTimer >= taxaSpawn && objetosRef.current.length < 12) {
                    spawnTimer = 0;
                    const rand = Math.random();
                    let tipoAleatorio: Entidade['tipo'] = 'inimigo';
                    if (rand > 0.93) tipoAleatorio = 'bomba';
                    else if (rand > 0.86) tipoAleatorio = 'laser_duplo';
                    else if (rand > 0.78) tipoAleatorio = 'escudo';
                    else if (rand > 0.68) tipoAleatorio = 'vida';
                    else if (rand > 0.50) tipoAleatorio = 'meteoro';

                    objetosRef.current.push({ id: Date.now() + Math.random(), x: Math.random() * 80 + 10, y: 0, tipo: tipoAleatorio });
                }

                const velocidadeQueda = (45 + (mult * 8)) * delta;
                const velocidadeTiro = 120 * delta;
                const playerX = posPlayerRef.current;

                let novosTiros: Tiro[] = [];
                for (let t = 0; t < tirosRef.current.length; t++) {
                    let tiro = tirosRef.current[t];
                    if (tiro.tipo === 'boss') {
                        let novoTiroY = tiro.y + (velocidadeQueda * 1.2);
                        if (Math.abs(novoTiroY - 75) <= 5 && Math.abs(tiro.x - playerX) < 7) {
                            if (temEscudoRef.current) {
                                setTemEscudo(false);
                                adicionarParticula(playerX, 75, "ESCUDO BLOQUEOU!", "#38bdf8");
                            } else {
                                const novaVida = Math.max(0, vidaRef.current - 18);
                                setVida(novaVida);
                                dispararTremido();
                                if (novaVida <= 0) {
                                    setGameOver(true);
                                    if (bossAudioRef.current) bossAudioRef.current.pause();
                                    if (audioRef.current) audioRef.current.pause();
                                }
                            }
                            continue;
                        }
                        if (novoTiroY < 100) novosTiros.push({ ...tiro, y: novoTiroY });
                    } else {
                        let novoTiroY = tiro.y - velocidadeTiro;
                        if (novoTiroY > 0) novosTiros.push({ ...tiro, y: novoTiroY });
                    }
                }
                tirosRef.current = novosTiros;

                if (chefaoRef.current.ativo) {
                    for (let t = 0; t < tirosRef.current.length; t++) {
                        let tiro = tirosRef.current[t];
                        if (tiro.tipo !== 'boss' && Math.abs(tiro.x - chefaoRef.current.x) < 12 && Math.abs(tiro.y - chefaoRef.current.y) < 8) {
                            tirosRef.current.splice(t, 1);
                            chefaoRef.current.vida -= (tiro.tipo === 'duplo' ? 14 : 8);
                            adicionarParticula(tiro.x, tiro.y, "-HIT", "#f43f5e");
                            if (chefaoRef.current.vida <= 0) {
                                chefaoRef.current.ativo = false;
                                setChefaoRender(null);
                                setScore(s => s + 1000);
                                adicionarParticula(50, 25, "+1000 CHEFE ELIMINADO!", "#38bdf8");
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
                    let velAtual = obj.tipo === 'meteoro' ? velocidadeQueda * 1.5 : velocidadeQueda;
                    let novoY = obj.y + velAtual;

                    let atingidoPorTiro = false;
                    // Tiros só destroem meteoros e inimigos comuns. Power-ups e itens bons são TOTALMENTE IGNORADOS pelos tiros!
                    if (obj.tipo === 'meteoro' || obj.tipo === 'inimigo') {
                        for (let t = 0; t < tirosRef.current.length; t++) {
                            let tiro = tirosRef.current[t];
                            if (tiro.tipo !== 'boss' && Math.abs(tiro.x - obj.x) < 6 && Math.abs(tiro.y - novoY) < 6) {
                                atingidoPorTiro = true;
                                tirosRef.current.splice(t, 1);
                                const pts = obj.tipo === 'meteoro' ? 30 : 15;
                                setScore(s => s + pts);
                                adicionarParticula(obj.x, novoY, `+${pts}`, '#38bdf8');
                                break;
                            }
                        }
                    }

                    if (atingidoPorTiro) continue;

                    // Colisão do Player com os itens ou inimigos
                    if (novoY >= 72 && novoY <= 85 && Math.abs(obj.x - playerX) < 9) {
                        if (obj.tipo === 'vida') {
                            setVida(v => Math.min(100, v + 25));
                            adicionarParticula(playerX, 75, "+25 HP", "#f43f5e");
                        } else if (obj.tipo === 'escudo') {
                            setTemEscudo(true);
                            adicionarParticula(playerX, 75, "ESCUDO ATIVO", "#38bdf8");
                        } else if (obj.tipo === 'laser_duplo') {
                            setLaserDuploAtivo(true);
                            laserTimerRef.current = 0;
                            adicionarParticula(playerX, 75, "LASER DUPLO", "#06b6d4");
                        } else if (obj.tipo === 'bomba') {
                            ativarBombaNuclear();
                        } else {
                            if (temEscudoRef.current) {
                                setTemEscudo(false);
                                adicionarParticula(playerX, 75, "BLOQUEADO", "#38bdf8");
                            } else {
                                const dano = obj.tipo === 'meteoro' ? 30 : 15;
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
        porcentagem = Math.max(6, Math.min(94, porcentagem));
        posPlayerRef.current = porcentagem;
        setPosRender(porcentagem);
    };

    const resetarJogo = () => {
        if (bossAudioRef.current) bossAudioRef.current.pause();
        setScore(0); setVida(100); setTemEscudo(false); setLaserDuploAtivo(false);
        objetosRef.current = []; tirosRef.current = []; particulasRef.current = [];
        chefaoRef.current = { ativo: false, x: 50, y: 15, vida: 280, vidaMax: 280, direcao: 1 };
        setChefaoRender(null); setObjetosRender([]); setTirosRender([]);
        setGameOver(false); setIniciado(true); setPausado(false);
    };

    return {
        iniciado, setIniciado, pausado, setPausado, score, highScore, vida, temEscudo,
        laserDuploAtivo, gameOver, isFullScreen, shake, naveSelecionada,
        setNaveSelecionada, musicaSelecionada, posRender, objetosRender, tirosRender,
        particulasRender, chefaoRender, containerRef, audioRef, bossAudioRef,
        toggleFullScreen, handleMove, resetarJogo, ativarBombaNuclear
    };
}
