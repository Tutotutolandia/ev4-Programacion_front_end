import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService, UnifiedCharacter, ApiSource } from '../../services/api.service';
import { CharacterService } from '../../services/character.service';
import { Character } from '../../models/character.model';

@Component({
  selector: 'app-api-characters',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './api-characters.component.html',
  styleUrls: ['./api-characters.component.scss']
})
export class ApiCharactersComponent implements OnInit {
  apiCharacters: UnifiedCharacter[] = [];
  apiSources: ApiSource[] = [];
  selectedSources: string[] = [];
  loading = false;
  error: string | null = null;
  searchTerm = '';
  currentPage = 1;
  searchMode = false;

  constructor(
    private apiService: ApiService,
    private characterService: CharacterService
  ) {}

  ngOnInit(): void {
    this.apiSources = this.apiService.getApiSources();
    this.selectedSources = this.apiSources.filter(source => source.enabled).map(source => source.id);
    this.loadCharacters();
  }

  async loadCharacters(page: number = 1): Promise<void> {
    if (this.selectedSources.length === 0) {
      this.error = 'Selecciona al menos una fuente de datos';
      return;
    }

    this.loading = true;
    this.error = null;
    this.currentPage = page;

    const result = await this.apiService.getCharactersFromMultipleAPIs(this.selectedSources, page);
    
    this.apiCharacters = result.characters;
    this.error = result.error;
    this.loading = false;
  }

  async searchCharacters(): Promise<void> {
    if (!this.searchTerm.trim()) {
      this.searchMode = false;
      this.loadCharacters();
      return;
    }

    if (this.selectedSources.length === 0) {
      this.error = 'Selecciona al menos una fuente de datos para buscar';
      return;
    }

    this.loading = true;
    this.error = null;
    this.searchMode = true;

    const result = await this.apiService.searchCharactersInMultipleAPIs(this.searchTerm, this.selectedSources);
    
    this.apiCharacters = result.characters;
    this.error = result.error;
    this.loading = false;
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.searchMode = false;
    this.loadCharacters();
  }

  onSourceToggle(sourceId: string): void {
    const index = this.selectedSources.indexOf(sourceId);
    if (index > -1) {
      this.selectedSources.splice(index, 1);
    } else {
      this.selectedSources.push(sourceId);
    }
    
    // Recargar datos si no estamos en modo búsqueda
    if (!this.searchMode) {
      this.loadCharacters();
    }
  }

  async nextPage(): Promise<void> {
    if (!this.searchMode) {
      await this.loadCharacters(this.currentPage + 1);
    }
  }

  async prevPage(): Promise<void> {
    if (!this.searchMode && this.currentPage > 1) {
      await this.loadCharacters(this.currentPage - 1);
    }
  }

  importCharacter(apiChar: UnifiedCharacter): void {
    // Convertir personaje unificado a nuestro formato
    const character: Character = {
      id: Date.now(),
      name: apiChar.name,
      class: this.mapTypeToClass(apiChar.type, apiChar.series),
      level: this.calculateLevel(apiChar.stats),
      skills: this.generateSkillsFromAbilities(apiChar.abilities, apiChar.series, apiChar.originalData),
      imageUrl: apiChar.image
    };

    this.characterService.addCharacter(character);
    
    // Mostrar confirmación
    alert(`¡Personaje "${character.name}" de ${apiChar.series} importado exitosamente!`);
  }

  private mapTypeToClass(type: string, series: string): string {
    const mappings: { [key: string]: { [key: string]: string } } = {
      'Rick and Morty': {
        'Human': 'Guerrero',
        'Alien': 'Mago',
        'Humanoid': 'Pícaro',
        'Robot': 'Paladín',
        'Animal': 'Cazador',
        'Cronenberg': 'Bárbaro',
        'Disease': 'Sacerdote',
        'Mythological Creature': 'Bardo',
        'Poopybutthole': 'Monje'
      },
      'Pokémon': {
        'fire': 'Mago',
        'water': 'Sacerdote',
        'grass': 'Cazador',
        'electric': 'Mago',
        'psychic': 'Bardo',
        'ice': 'Mago',
        'dragon': 'Paladín',
        'dark': 'Pícaro',
        'fairy': 'Bardo',
        'fighting': 'Guerrero',
        'poison': 'Pícaro',
        'ground': 'Bárbaro',
        'flying': 'Cazador',
        'bug': 'Cazador',
        'rock': 'Bárbaro',
        'ghost': 'Pícaro',
        'steel': 'Paladín',
        'normal': 'Guerrero'
      },
      'Dragon Ball': {
        'Saiyan': 'Guerrero',
        'Human': 'Guerrero',
        'Namekian': 'Sacerdote',
        'Android': 'Paladín',
        'Majin': 'Bárbaro',
        'Angel': 'Bardo',
        'God': 'Paladín',
        'Frieza Race': 'Pícaro'
      }
    };

    const seriesMapping = mappings[series];
    if (seriesMapping && seriesMapping[type]) {
      return seriesMapping[type];
    }

    // Mapeo por defecto basado en el tipo
    const defaultMapping: { [key: string]: string } = {
      'warrior': 'Guerrero',
      'mage': 'Mago',
      'rogue': 'Pícaro',
      'paladin': 'Paladín',
      'priest': 'Sacerdote',
      'bard': 'Bardo',
      'barbarian': 'Bárbaro',
      'monk': 'Monje',
      'hunter': 'Cazador'
    };

    return defaultMapping[type.toLowerCase()] || 'Guerrero';
  }

  private calculateLevel(stats: any): number {
    if (!stats) return Math.floor(Math.random() * 20) + 1;
    
    const avgStat = (stats.power + stats.speed + stats.defense + stats.intelligence) / 4;
    return Math.max(1, Math.min(20, Math.floor(avgStat / 5) + 1));
  }

  private generateSkillsFromAbilities(abilities: string[], series: string, originalData?: any) {
    // Mapeo específico para Pokémon usando los datos originales
    if (series === 'Pokémon' && originalData && originalData.types) {
      return this.generatePokemonSkills(abilities, originalData.types);
    }

    // Mapeo general para otras series
    const elementMappings: { [key: string]: string } = {
      'fire': 'Fuego',
      'water': 'Agua',
      'electric': 'Rayo',
      'ice': 'Hielo',
      'earth': 'Tierra',
      'wind': 'Aire',
      'light': 'Luz',
      'dark': 'Oscuridad',
      'lightning': 'Rayo',
      'shadow': 'Oscuridad'
    };

    const seriesElements: { [key: string]: string[] } = {
      'Rick and Morty': ['Rayo', 'Luz', 'Oscuridad'],
      'Dragon Ball': ['Fuego', 'Rayo', 'Luz']
    };

    const skills = abilities.slice(0, 3).map((ability, index) => {
      let element = 'Neutro';
      
      // Intentar mapear elemento basado en la habilidad
      for (const [key, value] of Object.entries(elementMappings)) {
        if (ability.toLowerCase().includes(key)) {
          element = value;
          break;
        }
      }
      
      // Si no se encontró elemento, usar uno aleatorio de la serie
      if (element === 'Neutro' && seriesElements[series]) {
        const seriesElementList = seriesElements[series];
        element = seriesElementList[Math.floor(Math.random() * seriesElementList.length)];
      }

      return {
        name: ability,
        elementType: element,
        description: `Habilidad especial de ${series}`,
        manaCost: Math.floor(Math.random() * 50) + 10,
        cooldown: Math.floor(Math.random() * 30) + 5
      };
    });

    return skills.length > 0 ? skills : [{
      name: 'Ataque Básico',
      elementType: 'Neutro',
      description: 'Ataque básico del personaje',
      manaCost: 10,
      cooldown: 5
    }];
  }

  private generatePokemonSkills(abilities: string[], pokemonTypes: any[]) {
    // Mapeo correcto de tipos de Pokémon a elementos
    const pokemonTypeToElement: { [key: string]: string } = {
      'fire': 'Fuego',
      'water': 'Agua',
      'grass': 'Tierra',
      'electric': 'Rayo',
      'psychic': 'Luz',
      'ice': 'Hielo',
      'dragon': 'Fuego',
      'dark': 'Oscuridad',
      'fairy': 'Luz',
      'fighting': 'Neutro',
      'poison': 'Tierra',
      'ground': 'Tierra',
      'flying': 'Aire',
      'bug': 'Tierra',
      'rock': 'Tierra',
      'ghost': 'Oscuridad',
      'steel': 'Neutro',
      'normal': 'Neutro'
    };

    // Mapeo de habilidades específicas a tipos
    const abilityToType: { [key: string]: string } = {
      // Fuego
      'Flamethrower': 'fire',
      'Fire Blast': 'fire',
      'Ember': 'fire',
      // Agua
      'Water Gun': 'water',
      'Hydro Pump': 'water',
      'Bubble Beam': 'water',
      // Planta/Tierra
      'Vine Whip': 'grass',
      'Solar Beam': 'grass',
      'Leaf Storm': 'grass',
      // Eléctrico
      'Thunderbolt': 'electric',
      'Thunder': 'electric',
      'Thunder Shock': 'electric',
      // Psíquico
      'Psychic': 'psychic',
      'Confusion': 'psychic',
      'Telekinesis': 'psychic',
      // Hielo
      'Ice Beam': 'ice',
      'Blizzard': 'ice',
      'Frost Breath': 'ice',
      // Dragón
      'Dragon Pulse': 'dragon',
      'Dragon Claw': 'dragon',
      'Dragon Breath': 'dragon',
      // Oscuridad
      'Dark Pulse': 'dark',
      'Bite': 'dark',
      'Crunch': 'dark',
      // Hada
      'Moonblast': 'fairy',
      'Dazzling Gleam': 'fairy',
      'Fairy Wind': 'fairy',
      // Lucha
      'Close Combat': 'fighting',
      'Focus Punch': 'fighting',
      'Karate Chop': 'fighting',
      // Veneno
      'Poison Sting': 'poison',
      'Sludge Bomb': 'poison',
      'Toxic': 'poison',
      // Tierra
      'Earthquake': 'ground',
      'Dig': 'ground',
      'Earth Power': 'ground',
      // Volador
      'Air Slash': 'flying',
      'Hurricane': 'flying',
      'Wing Attack': 'flying',
      // Bicho
      'Bug Bite': 'bug',
      'Signal Beam': 'bug',
      'Bug Buzz': 'bug',
      // Roca
      'Rock Slide': 'rock',
      'Stone Edge': 'rock',
      'Rock Throw': 'rock',
      // Fantasma
      'Shadow Ball': 'ghost',
      'Night Shade': 'ghost',
      'Lick': 'ghost',
      // Acero
      'Iron Tail': 'steel',
      'Metal Claw': 'steel',
      'Steel Wing': 'steel',
      // Normal
      'Hyper Beam': 'normal',
      'Body Slam': 'normal',
      'Scratch': 'normal',
      'Tackle': 'normal',
      'Quick Attack': 'normal',
      'Defense Curl': 'normal'
    };

    const skills = abilities.slice(0, 3).map((ability) => {
      // Determinar el tipo de la habilidad
      const abilityType = abilityToType[ability];
      let element = 'Neutro';

      if (abilityType) {
        element = pokemonTypeToElement[abilityType] || 'Neutro';
      } else {
        // Si no conocemos la habilidad específica, usar el primer tipo del Pokémon
        if (pokemonTypes.length > 0) {
          const firstType = pokemonTypes[0].type.name;
          element = pokemonTypeToElement[firstType] || 'Neutro';
        }
      }

      return {
        name: ability,
        elementType: element,
        description: `Movimiento Pokémon de tipo ${abilityType || 'desconocido'}`,
        manaCost: Math.floor(Math.random() * 50) + 10,
        cooldown: Math.floor(Math.random() * 30) + 5
      };
    });

    return skills.length > 0 ? skills : [{
      name: 'Tackle',
      elementType: 'Neutro',
      description: 'Ataque básico Pokémon',
      manaCost: 10,
      cooldown: 5
    }];
  }

  getSeriesColor(series: string): string {
    const colors: { [key: string]: string } = {
      'Rick and Morty': '#00b4d8',
      'Pokémon': '#ffcb05',
      'Dragon Ball': '#ff6b35'
    };
    return colors[series] || '#6b7280';
  }

  getSeriesIcon(series: string): string {
    const icons: { [key: string]: string } = {
      'Rick and Morty': '🛸',
      'Pokémon': '⚡',
      'Dragon Ball': '🐉'
    };
    return icons[series] || '🎭';
  }
}