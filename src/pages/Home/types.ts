export interface Entidade {
    id: number;
    x: number;
    y: number;
    tipo: 'inimigo' | 'vida' | 'meteoro' | 'escudo' | 'laser_duplo' | 'bomba';
}

export interface Tiro {
    id: number;
    x: number;
    y: number;
    tipo?: 'normal' | 'duplo' | 'boss';
}

export interface Particula {
    id: number;
    x: number;
    y: number;
    texto: string;
    cor: string;
}

export interface Chefao {
    ativo: boolean;
    x: number;
    y: number;
    vida: number;
    vidaMax: number;
    direcao: number;
}

export interface Nave {
    id: string;
    nome: string;
    corBorda: string;
    corBg: string;
    icone: any;
}
