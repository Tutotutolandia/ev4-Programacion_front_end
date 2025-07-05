export interface Skill {
  name: string;
  elementType: string;
  description: string;
  manaCost: number;
  cooldown: number; // en segundos
}

export interface Character {
  id: number;
  name: string;
  class: string;
  level: number;
  skills: Skill[];
  imageUrl: string;
}