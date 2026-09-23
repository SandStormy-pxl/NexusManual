import { Sparkles, Rocket, Zap } from 'lucide-preact';
import { Nave } from './types';

export const NAVES: Nave[] = [
    { id: 'padrao', nome: 'Poco Interceptor', corBorda: 'border-cyan-500', corBg: 'bg-cyan-950/80', icone: Rocket },
    { id: 'furia', nome: 'Fúria Vermelha', corBorda: 'border-rose-500', corBg: 'bg-rose-950/80', icone: Sparkles },
    { id: 'tita', nome: 'Titã Blindado', corBorda: 'border-amber-500', corBg: 'bg-amber-950/80', icone: Zap }
];

export const MUSICAS = [
    { id: 'trilha-1', nome: 'Trilha Padrão (Cyber)', arquivo: '/trilha-1.mp3' },
    { id: 'trilha-2', nome: 'Bass Boosted Minimal', arquivo: '/trilha-2.mp3' },
    { id: 'boss-theme', nome: 'Boss: Dark Synth (Pânico)', arquivo: '/boss-theme.mp3' }
];
