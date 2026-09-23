import { Shield, Sparkles, Rocket, Play, RotateCcw, Pause, Heart, Flame, Award, Maximize, Minimize, Disc, Zap, Bomb } from 'lucide-preact';
import { NAVES } from './constants';
import { useGameEngine } from './useGameEngine';

export function Home() {
    const game = useGameEngine();
    const IconeNave = game.naveSelecionada.icone;

    return (
        <div className="w-full max-w-md mx-auto min-h-screen bg-slate-950 text-slate-100 flex flex-col font-mono select-none overflow-hidden relative border-x border-slate-900 shadow-2xl">
            <audio ref={game.audioRef} src={game.musicaSelecionada.arquivo} loop />
            <audio ref={game.bossAudioRef} src="/boss-theme.mp3" loop />
          
            {!game.iniciado ? (
                <div className="flex-1 flex flex-col justify-between p-6 bg-gradient-to-b from-slate-900 via-slate-950 to-black z-10">
                    <div className="flex justify-between items-center pt-2">
                        <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-full">
                            <Flame className="w-4 h-4 text-cyan-400 animate-pulse" />
                            <span className="text-xs tracking-wider uppercase text-cyan-400 font-bold">NEXUS STRIKE</span>
                        </div>
                        <button onClick={game.toggleFullScreen} className="p-2 bg-slate-900/80 border border-slate-800 rounded-full text-slate-400 hover:text-white">
                            {game.isFullScreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                        </button>
                    </div>

                    <div className="my-auto space-y-6 text-center">
                        <div className="relative inline-block">
                            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl blur-md opacity-40 animate-pulse"></div>
                            <div className="relative bg-slate-900 border border-slate-700/80 p-6 rounded-2xl shadow-xl">
                                <Rocket className="w-16 h-16 mx-auto text-cyan-400 mb-2 animate-bounce" />
                                <h1 className="text-2xl font-black tracking-tight text-white uppercase">Nexus Strike</h1>
                                <p className="text-xs text-slate-400 mt-1">Arcade Espacial Mobile</p>
                            </div>
                        </div>

                        <div className="space-y-3 text-left bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 text-xs text-slate-300">
                            <p className="font-bold text-cyan-400 uppercase tracking-wide">Esquadrão:</p>
                            <div className="grid grid-cols-3 gap-2">
                                {NAVES.map((n) => {
                                    const Icon = n.icone;
                                    const selecionada = game.naveSelecionada.id === n.id;
                                    return (
                                        <button 
                                            key={n.id} 
                                            onClick={() => game.setNaveSelecionada(n)} 
                                            className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition ${selecionada ? `${n.corBorda}${n.corBg} text-white shadow-lg` : 'border-slate-800 bg-slate-950 text-slate-400'}`}
                                        >
                                            <Icon className="w-5 h-5" />
                                            <span className="text-[10px] text-center">{n.nome.split(' ')[0]}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 pb-4">
                        <button onClick={() => game.setIniciado(true)} className="w-full py-4 bg-gradient-to-r from-cyan-500 to-purple-600 text-black font-black uppercase tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-2">
                            <Play className="w-5 h-5 fill-black" /> Iniciar Missão
                        </button>
                    </div>
                </div>
            ) : (
                <div 
                    ref={game.containerRef}
                    onMouseMove={(e) => game.handleMove(e.clientX)}
                    onTouchMove={(e) => e.touches.length > 0 && game.handleMove(e.touches[0].clientX)}
                    className={`flex-1 relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black ${game.shake ? 'animate-bounce' : ''}`}
                >
                    <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20 bg-gradient-to-b from-slate-950/90 to-transparent">
                        <div className="flex items-center gap-3">
                            <button onClick={() => game.setPausado(!game.pausado)} className="p-2 bg-slate-900/80 border border-slate-800 rounded-lg text-slate-300">
                                {game.pausado ? <Play className="w-4 h-4 fill-white" /> : <Pause className="w-4 h-4 fill-white" />}
                            </button>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-slate-500">Score</span>
                                <span className="text-sm font-bold text-cyan-400">{game.score}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] text-slate-500">Recorde</span>
                                <span className="text-sm font-bold text-amber-400">{game.highScore}</span>
                            </div>
                        </div>
                    </div>

                    <div className="absolute top-16 left-4 right-4 z-20 space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-bold">
                            <span className="text-rose-400 flex items-center gap-1"><Heart className="w-3 h-3 fill-rose-500 text-rose-500" /> HP: {game.vida}%</span>
                            {game.temEscudo && <span className="text-blue-400">ESCUDO</span>}
                            {game.laserDuploAtivo && <span className="text-cyan-400">DUPLO</span>}
                        </div>
                        <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                            <div className="h-full bg-rose-500 transition-all duration-200" style={{ width: `${game.vida}%` }}></div>
                        </div>
                    </div>

                    {game.chefaoRender?.ativo && (
                        <div className="absolute top-24 left-4 right-4 z-20 bg-rose-950/40 border border-rose-500/60 p-2 rounded-xl backdrop-blur-sm">
                            <div className="flex justify-between items-center text-[10px] font-bold text-rose-400 mb-1">
                                <span>CHEFÃO</span>
                                <span>{Math.max(0, game.chefaoRender.vida)} / {game.chefaoRender.vidaMax} HP</span>
                            </div>
                            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-rose-900">
                                <div className="h-full bg-rose-600 transition-all duration-100" style={{ width: `${(game.chefaoRender.vida / game.chefaoRender.vidaMax) * 100}%` }}></div>
                            </div>
                        </div>
                    )}

                    {game.chefaoRender?.ativo && (
                        <div className="absolute -translate-x-1/2 -translate-y-1/2 z-20 transition-all duration-75" style={{ left: `${game.chefaoRender.x}%`, top: `${game.chefaoRender.y}%` }}>
                            <div className="w-20 h-12 bg-rose-950 border-2 border-rose-500 rounded-2xl flex items-center justify-center animate-pulse shadow-[0_0_20px_rgba(244,63,94,0.7)]">
                                <Flame className="w-6 h-6 text-rose-400" />
                            </div>
                        </div>
                    )}

                    {game.tirosRender.map(t => (
                        <div key={t.id} className="absolute w-1 h-3 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.8)] -translate-x-1/2 -translate-y-1/2" style={{ left: `${t.x}%`, top: `${t.y}%` }} />
                    ))}

                    {game.objetosRender.map(o => (
                        <div key={o.id} className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center" style={{ left: `${o.x}%`, top: `${o.y}%` }}>
                            {o.tipo === 'meteoro' && <div className="w-8 h-8 rounded-full bg-amber-900/80 border border-amber-500 flex items-center justify-center"><Disc className="w-5 h-5 text-amber-400 animate-spin" /></div>}
                            {o.tipo === 'inimigo' && <div className="w-7 h-7 rounded-lg bg-rose-950/80 border border-rose-500 flex items-center justify-center"><Flame className="w-4 h-4 text-rose-400" /></div>}
                            {o.tipo === 'vida' && <div className="w-6 h-6 rounded-full bg-rose-900 border border-rose-400 flex items-center justify-center"><Heart className="w-3 h-3 text-white fill-white" /></div>}
                            {o.tipo === 'escudo' && <div className="w-6 h-6 rounded-full bg-blue-900 border border-blue-400 flex items-center justify-center"><Shield className="w-3 h-3 text-white" /></div>}
                            {o.tipo === 'laser_duplo' && <div className="w-6 h-6 rounded-full bg-cyan-900 border border-cyan-400 flex items-center justify-center"><Zap className="w-3 h-3 text-cyan-300" /></div>}
                            {o.tipo === 'bomba' && <div className="w-6 h-6 rounded-full bg-amber-950 border border-amber-500 flex items-center justify-center"><Bomb className="w-3 h-3 text-amber-400" /></div>}
                        </div>
                    ))}

                    {game.particulasRender.map(p => (
                        <div key={p.id} className="absolute -translate-x-1/2 -translate-y-1/2 text-xs font-black pointer-events-none z-30" style={{ left: `${p.x}%`, top: `${p.y}%`, color: p.cor }}>
                            {p.texto}
                        </div>
                    ))}

                    <div className="absolute bottom-8 -translate-x-1/2 -translate-y-1/2 transition-all duration-75 pointer-events-none" style={{ left: `${game.posRender}%` }}>
                        <div className={`p-3 rounded-xl border ${game.naveSelecionada.corBorda} ${game.naveSelecionada.corBg} shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center justify-center`}>
                            {game.temEscudo && <div className="absolute -inset-1 rounded-xl border-2 border-blue-400 animate-ping opacity-55"></div>}
                            <IconeNave className="w-6 h-6 text-white" />
                        </div>
                    </div>

                    {game.pausado && !game.gameOver && (
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-40 flex flex-col items-center justify-center p-6 text-center space-y-4">
                            <h2 className="text-xl font-black text-white uppercase">Jogo Pausado</h2>
                            <button onClick={() => game.setPausado(false)} className="w-full max-w-xs py-3 bg-cyan-500 text-black font-bold rounded-xl">Retomar</button>
                        </div>
                    )}

                    {game.gameOver && (
                        <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center space-y-6">
                            <div className="space-y-2">
                                <Award className="w-10 h-10 text-rose-400 mx-auto" />
                                <h2 className="text-2xl font-black text-rose-500 uppercase">Missão Fracassada</h2>
                            </div>
                            <div className="w-full max-w-xs bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2 text-sm">
                                <div className="flex justify-between text-slate-400"><span>Pontuação:</span> <span className="text-cyan-400 font-bold">{game.score}</span></div>
                                <div className="flex justify-between text-slate-400"><span>Recorde:</span> <span className="text-amber-400 font-bold">{game.highScore}</span></div>
                            </div>
                            <div className="w-full max-w-xs space-y-3">
                                <button onClick={game.resetarJogo} className="w-full py-4 bg-gradient-to-r from-cyan-500 to-purple-600 text-black font-black uppercase rounded-xl flex items-center justify-center gap-2">
                                    <RotateCcw className="w-5 h-5" /> Tentar Novamente
                                </button>
                                <button onClick={() => game.setIniciado(false)} className="w-full py-3 bg-slate-900 border border-slate-800 text-slate-300 font-bold uppercase text-xs rounded-xl">
                                    Menu
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
