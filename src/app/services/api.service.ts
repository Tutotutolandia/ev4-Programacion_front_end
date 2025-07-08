import { Injectable } from '@angular/core';

export interface ApiCharacter {
  id: number;
  name: string;
  status: string;
  species: string;
  type: string;
  gender: string;
  origin: {
    name: string;
    url: string;
  };
  location: {
    name: string;
    url: string;
  };
  image: string;
  episode: string[];
  url: string;
  created: string;
}

export interface ApiResponse {
  info: {
    count: number;
    pages: number;
    next: string | null;
    prev: string | null;
  };
  results: ApiCharacter[];
}

// Interfaces para diferentes APIs
export interface PokemonCharacter {
  id: number;
  name: string;
  height: number;
  weight: number;
  types: Array<{
    type: {
      name: string;
    };
  }>;
  sprites: {
    front_default: string;
    other: {
      'official-artwork': {
        front_default: string;
      };
    };
  };
  abilities: Array<{
    ability: {
      name: string;
    };
  }>;
  stats: Array<{
    base_stat: number;
    stat: {
      name: string;
    };
  }>;
}

export interface DragonBallCharacter {
  id: number;
  name: string;
  ki: string;
  maxKi: string;
  race: string;
  gender: string;
  description: string;
  image: string;
  affiliation: string;
  deletedAt: string | null;
}

export interface UnifiedCharacter {
  id: string;
  name: string;
  image: string;
  series: string;
  description: string;
  type: string;
  status?: string;
  abilities: string[];
  stats: {
    power?: number;
    speed?: number;
    defense?: number;
    intelligence?: number;
  };
  originalData: any;
}

export interface ApiSource {
  id: string;
  name: string;
  description: string;
  icon: string;
  baseUrl: string;
  enabled: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly API_SOURCES: ApiSource[] = [
    {
      id: 'rickandmorty',
      name: 'Rick and Morty',
      description: 'Personajes del multiverso de Rick y Morty',
      icon: '🛸',
      baseUrl: 'https://rickandmortyapi.com/api/character',
      enabled: true
    },
    {
      id: 'pokemon',
      name: 'Pokémon',
      description: 'Pokémon de todas las generaciones',
      icon: '⚡',
      baseUrl: 'https://pokeapi.co/api/v2/pokemon',
      enabled: true
    },
    {
      id: 'dragonball',
      name: 'Dragon Ball',
      description: 'Guerreros del universo Dragon Ball',
      icon: '🐉',
      baseUrl: 'https://dragonball-api.com/api/characters',
      enabled: true
    }
  ];

  // Mapeos de tipos a elementos
  private readonly POKEMON_TYPE_TO_ELEMENT: { [key: string]: string } = {
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

  private readonly RICK_MORTY_SPECIES_TO_ELEMENT: { [key: string]: string } = {
    'Human': 'Neutro',
    'Alien': 'Luz',
    'Humanoid': 'Neutro',
    'Robot': 'Rayo',
    'Animal': 'Tierra',
    'Cronenberg': 'Oscuridad',
    'Disease': 'Oscuridad',
    'Mythological Creature': 'Luz',
    'Poopybutthole': 'Neutro'
  };

  private readonly DRAGON_BALL_RACE_TO_ELEMENT: { [key: string]: string } = {
    'Saiyan': 'Fuego',
    'Human': 'Neutro',
    'Namekian': 'Tierra',
    'Android': 'Rayo',
    'Majin': 'Oscuridad',
    'Angel': 'Luz',
    'God': 'Luz',
    'Frieza Race': 'Hielo'
  };
  
  constructor() {}

  /**
   * Obtiene todas las fuentes de API disponibles
   */
  getApiSources(): ApiSource[] {
    return this.API_SOURCES;
  }

  /**
   * Obtiene personajes unificados de múltiples APIs
   */
  async getCharactersFromMultipleAPIs(sources: string[], page: number = 1): Promise<{ characters: UnifiedCharacter[], error: string | null }> {
    try {
      const promises = sources.map(source => this.getCharactersFromSource(source, page));
      const results = await Promise.allSettled(promises);
      
      const allCharacters: UnifiedCharacter[] = [];
      const errors: string[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.characters) {
          allCharacters.push(...result.value.characters);
        } else if (result.status === 'rejected') {
          errors.push(`Error en ${sources[index]}: ${result.reason}`);
        }
      });

      return {
        characters: allCharacters,
        error: errors.length > 0 ? errors.join('; ') : null
      };
    } catch (error) {
      return {
        characters: [],
        error: 'Error general al cargar personajes de múltiples fuentes'
      };
    }
  }

  /**
   * Obtiene personajes de una fuente específica
   */
  private async getCharactersFromSource(sourceId: string, page: number = 1): Promise<{ characters: UnifiedCharacter[], error: string | null }> {
    switch (sourceId) {
      case 'rickandmorty':
        return this.getRickAndMortyCharacters(page);
      case 'pokemon':
        return this.getPokemonCharacters(page);
      case 'dragonball':
        return this.getDragonBallCharacters(page);
      default:
        return { characters: [], error: `Fuente desconocida: ${sourceId}` };
    }
  }

  /**
   * Rick and Morty API
   */
  private async getRickAndMortyCharacters(page: number): Promise<{ characters: UnifiedCharacter[], error: string | null }> {
    try {
      const response = await fetch(`https://rickandmortyapi.com/api/character?page=${page}`);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data: ApiResponse = await response.json();
      
      const characters: UnifiedCharacter[] = data.results.map(char => {
        const abilities = this.generateRickMortyAbilities(char);
        
        return {
          id: `rm-${char.id}`,
          name: char.name,
          image: char.image,
          series: 'Rick and Morty',
          description: `${char.species} de ${char.origin.name}`,
          type: char.species,
          status: char.status,
          abilities,
          stats: {
            power: Math.floor(Math.random() * 100) + 1,
            speed: Math.floor(Math.random() * 100) + 1,
            defense: Math.floor(Math.random() * 100) + 1,
            intelligence: Math.floor(Math.random() * 100) + 1
          },
          originalData: char
        };
      });

      return { characters, error: null };
    } catch (error) {
      return { characters: [], error: 'Error al cargar personajes de Rick and Morty' };
    }
  }

  /**
   * Pokémon API
   */
  private async getPokemonCharacters(page: number): Promise<{ characters: UnifiedCharacter[], error: string | null }> {
    try {
      const limit = 20;
      const offset = (page - 1) * limit;
      
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      // Obtener detalles de cada Pokémon
      const pokemonPromises = data.results.map((pokemon: any) => 
        fetch(pokemon.url).then(res => res.json())
      );
      
      const pokemonDetails: PokemonCharacter[] = await Promise.all(pokemonPromises);
      
      const characters: UnifiedCharacter[] = pokemonDetails.map(pokemon => {
        const abilities = this.generatePokemonAbilities(pokemon);
        
        return {
          id: `pk-${pokemon.id}`,
          name: pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1),
          image: pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default,
          series: 'Pokémon',
          description: `Pokémon tipo ${pokemon.types.map(t => t.type.name).join('/')}`,
          type: pokemon.types[0].type.name,
          abilities,
          stats: {
            power: pokemon.stats.find(s => s.stat.name === 'attack')?.base_stat || 0,
            speed: pokemon.stats.find(s => s.stat.name === 'speed')?.base_stat || 0,
            defense: pokemon.stats.find(s => s.stat.name === 'defense')?.base_stat || 0,
            intelligence: pokemon.stats.find(s => s.stat.name === 'special-attack')?.base_stat || 0
          },
          originalData: pokemon
        };
      });

      return { characters, error: null };
    } catch (error) {
      return { characters: [], error: 'Error al cargar Pokémon' };
    }
  }

  /**
   * Dragon Ball API
   */
  private async getDragonBallCharacters(page: number): Promise<{ characters: UnifiedCharacter[], error: string | null }> {
    try {
      const limit = 20;
      const response = await fetch(`https://dragonball-api.com/api/characters?page=${page}&limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      const characters: UnifiedCharacter[] = data.items.map((char: DragonBallCharacter) => {
        const abilities = this.generateDragonBallAbilities(char);
        
        return {
          id: `db-${char.id}`,
          name: char.name,
          image: char.image,
          series: 'Dragon Ball',
          description: char.description || `Guerrero ${char.race}`,
          type: char.race,
          abilities,
          stats: {
            power: this.parseKiValue(char.ki),
            speed: Math.floor(Math.random() * 100) + 1,
            defense: Math.floor(Math.random() * 100) + 1,
            intelligence: Math.floor(Math.random() * 100) + 1
          },
          originalData: char
        };
      });

      return { characters, error: null };
    } catch (error) {
      return { characters: [], error: 'Error al cargar personajes de Dragon Ball' };
    }
  }

  // Métodos para generar habilidades consistentes con elementos

  private generatePokemonAbilities(pokemon: PokemonCharacter): string[] {
    const abilities: string[] = [];
    
    // Generar habilidades basadas en TODOS los tipos del Pokémon
    pokemon.types.forEach((typeInfo) => {
      const typeName = typeInfo.type.name;
      const typeAbilities = this.getPokemonTypeAbilities(typeName);
      
      // Agregar la primera habilidad de cada tipo
      if (typeAbilities.length > 0) {
        abilities.push(typeAbilities[0]);
      }
    });

    // Si el Pokémon tiene solo un tipo, agregar una segunda habilidad de ese tipo
    if (pokemon.types.length === 1) {
      const typeName = pokemon.types[0].type.name;
      const typeAbilities = this.getPokemonTypeAbilities(typeName);
      if (typeAbilities.length > 1) {
        abilities.push(typeAbilities[1]);
      }
    }

    // Si aún no tenemos suficientes habilidades, agregar una tercera del tipo principal
    if (abilities.length < 3 && pokemon.types.length > 0) {
      const primaryType = pokemon.types[0].type.name;
      const typeAbilities = this.getPokemonTypeAbilities(primaryType);
      if (typeAbilities.length > 2) {
        abilities.push(typeAbilities[2]);
      } else if (typeAbilities.length > 1) {
        abilities.push(typeAbilities[1]);
      }
    }

    // Asegurar que tenemos exactamente 3 habilidades
    while (abilities.length < 3) {
      abilities.push('Tackle');
    }

    return abilities.slice(0, 3);
  }

  private getPokemonTypeAbilities(type: string): string[] {
    const typeAbilities: { [key: string]: string[] } = {
      'fire': ['Flamethrower', 'Fire Blast', 'Ember'],
      'water': ['Water Gun', 'Hydro Pump', 'Bubble Beam'],
      'grass': ['Vine Whip', 'Solar Beam', 'Leaf Storm'],
      'electric': ['Thunderbolt', 'Thunder', 'Thunder Shock'],
      'psychic': ['Psychic', 'Confusion', 'Telekinesis'],
      'ice': ['Ice Beam', 'Blizzard', 'Frost Breath'],
      'dragon': ['Dragon Pulse', 'Dragon Claw', 'Dragon Breath'],
      'dark': ['Dark Pulse', 'Bite', 'Crunch'],
      'fairy': ['Moonblast', 'Dazzling Gleam', 'Fairy Wind'],
      'fighting': ['Close Combat', 'Focus Punch', 'Karate Chop'],
      'poison': ['Poison Sting', 'Sludge Bomb', 'Toxic'],
      'ground': ['Earthquake', 'Dig', 'Earth Power'],
      'flying': ['Air Slash', 'Hurricane', 'Wing Attack'],
      'bug': ['Bug Bite', 'Signal Beam', 'Bug Buzz'],
      'rock': ['Rock Slide', 'Stone Edge', 'Rock Throw'],
      'ghost': ['Shadow Ball', 'Night Shade', 'Lick'],
      'steel': ['Iron Tail', 'Metal Claw', 'Steel Wing'],
      'normal': ['Hyper Beam', 'Body Slam', 'Scratch']
    };
    
    return typeAbilities[type] || ['Tackle', 'Quick Attack', 'Defense Curl'];
  }

  private generateRickMortyAbilities(char: ApiCharacter): string[] {
    const abilities: string[] = [];
    
    // Habilidades basadas en la especie
    const speciesAbilities = this.getRickMortySpeciesAbilities(char.species);
    abilities.push(...speciesAbilities);

    // Habilidades basadas en el estado
    if (char.status === 'Alive') {
      abilities.push('Supervivencia');
    } else if (char.status === 'Dead') {
      abilities.push('Resistencia Espectral');
    }

    // Habilidades interdimensionales (común en Rick and Morty)
    abilities.push('Portal Gun');

    return abilities.slice(0, 3);
  }

  private getRickMortySpeciesAbilities(species: string): string[] {
    const speciesAbilities: { [key: string]: string[] } = {
      'Human': ['Ingenio Humano', 'Adaptabilidad'],
      'Alien': ['Tecnología Alienígena', 'Telepatía'],
      'Humanoid': ['Forma Híbrida', 'Resistencia'],
      'Robot': ['Sistemas Avanzados', 'Análisis Digital'],
      'Animal': ['Instintos Salvajes', 'Agilidad Natural'],
      'Cronenberg': ['Mutación Caótica', 'Regeneración'],
      'Disease': ['Infección Viral', 'Propagación'],
      'Mythological Creature': ['Magia Ancestral', 'Poderes Místicos'],
      'Poopybutthole': ['Optimismo Eterno', 'Resistencia Cómica']
    };
    
    return speciesAbilities[species] || ['Habilidad Desconocida'];
  }

  private generateDragonBallAbilities(char: DragonBallCharacter): string[] {
    const abilities: string[] = [];
    
    // Habilidades basadas en la raza
    const raceAbilities = this.getDragonBallRaceAbilities(char.race);
    abilities.push(...raceAbilities);

    // Habilidades basadas en el Ki
    if (char.ki && char.ki !== 'unknown') {
      abilities.push('Control de Ki');
    }

    // Habilidades basadas en la afiliación
    if (char.affiliation) {
      if (char.affiliation.includes('Z Fighter')) {
        abilities.push('Técnicas Z');
      } else if (char.affiliation.includes('Red Ribbon')) {
        abilities.push('Tecnología Militar');
      }
    }

    return abilities.slice(0, 3);
  }

  private getDragonBallRaceAbilities(race: string): string[] {
    const raceAbilities: { [key: string]: string[] } = {
      'Saiyan': ['Super Saiyan', 'Kamehameha', 'Zenkai Boost'],
      'Human': ['Técnicas Marciales', 'Kienzan', 'Kamehameha'],
      'Namekian': ['Regeneración', 'Fusión', 'Makankosappo'],
      'Android': ['Energía Infinita', 'Absorción', 'Barrera'],
      'Majin': ['Absorción', 'Regeneración', 'Magia'],
      'Angel': ['Ultra Instinto', 'Manipulación Temporal', 'Teletransporte'],
      'God': ['Poder Divino', 'Creación', 'Destrucción'],
      'Frieza Race': ['Transformación', 'Death Beam', 'Telekinesis']
    };
    
    return raceAbilities[race] || ['Técnica Básica'];
  }

  /**
   * Búsqueda unificada en múltiples APIs
   */
  async searchCharactersInMultipleAPIs(query: string, sources: string[]): Promise<{ characters: UnifiedCharacter[], error: string | null }> {
    try {
      const promises = sources.map(source => this.searchInSource(source, query));
      const results = await Promise.allSettled(promises);
      
      const allCharacters: UnifiedCharacter[] = [];
      const errors: string[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.characters) {
          allCharacters.push(...result.value.characters);
        } else if (result.status === 'rejected') {
          errors.push(`Error en ${sources[index]}: ${result.reason}`);
        }
      });

      return {
        characters: allCharacters,
        error: errors.length > 0 ? errors.join('; ') : null
      };
    } catch (error) {
      return {
        characters: [],
        error: 'Error general en la búsqueda'
      };
    }
  }

  /**
   * Búsqueda en una fuente específica
   */
  private async searchInSource(sourceId: string, query: string): Promise<{ characters: UnifiedCharacter[], error: string | null }> {
    switch (sourceId) {
      case 'rickandmorty':
        return this.searchRickAndMorty(query);
      case 'pokemon':
        return this.searchPokemon(query);
      case 'dragonball':
        return this.searchDragonBall(query);
      default:
        return { characters: [], error: `Fuente desconocida: ${sourceId}` };
    }
  }

  private async searchRickAndMorty(query: string): Promise<{ characters: UnifiedCharacter[], error: string | null }> {
    try {
      const response = await fetch(`https://rickandmortyapi.com/api/character?name=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return { characters: [], error: null };
        }
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data: ApiResponse = await response.json();
      const characters = data.results.map(char => ({
        id: `rm-${char.id}`,
        name: char.name,
        image: char.image,
        series: 'Rick and Morty',
        description: `${char.species} de ${char.origin.name}`,
        type: char.species,
        status: char.status,
        abilities: this.generateRickMortyAbilities(char),
        stats: {
          power: Math.floor(Math.random() * 100) + 1,
          speed: Math.floor(Math.random() * 100) + 1,
          defense: Math.floor(Math.random() * 100) + 1,
          intelligence: Math.floor(Math.random() * 100) + 1
        },
        originalData: char
      }));

      return { characters, error: null };
    } catch (error) {
      return { characters: [], error: null };
    }
  }

  private async searchPokemon(query: string): Promise<{ characters: UnifiedCharacter[], error: string | null }> {
    try {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${query.toLowerCase()}`);
      
      if (!response.ok) {
        return { characters: [], error: null };
      }

      const pokemon: PokemonCharacter = await response.json();
      
      const character: UnifiedCharacter = {
        id: `pk-${pokemon.id}`,
        name: pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1),
        image: pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default,
        series: 'Pokémon',
        description: `Pokémon tipo ${pokemon.types.map(t => t.type.name).join('/')}`,
        type: pokemon.types[0].type.name,
        abilities: this.generatePokemonAbilities(pokemon),
        stats: {
          power: pokemon.stats.find(s => s.stat.name === 'attack')?.base_stat || 0,
          speed: pokemon.stats.find(s => s.stat.name === 'speed')?.base_stat || 0,
          defense: pokemon.stats.find(s => s.stat.name === 'defense')?.base_stat || 0,
          intelligence: pokemon.stats.find(s => s.stat.name === 'special-attack')?.base_stat || 0
        },
        originalData: pokemon
      };

      return { characters: [character], error: null };
    } catch (error) {
      return { characters: [], error: null };
    }
  }

  private async searchDragonBall(query: string): Promise<{ characters: UnifiedCharacter[], error: string | null }> {
    try {
      const response = await fetch(`https://dragonball-api.com/api/characters?name=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        return { characters: [], error: null };
      }

      const data = await response.json();
      
      const characters = data.map((char: DragonBallCharacter) => ({
        id: `db-${char.id}`,
        name: char.name,
        image: char.image,
        series: 'Dragon Ball',
        description: char.description || `Guerrero ${char.race}`,
        type: char.race,
        abilities: this.generateDragonBallAbilities(char),
        stats: {
          power: this.parseKiValue(char.ki),
          speed: Math.floor(Math.random() * 100) + 1,
          defense: Math.floor(Math.random() * 100) + 1,
          intelligence: Math.floor(Math.random() * 100) + 1
        },
        originalData: char
      }));

      return { characters, error: null };
    } catch (error) {
      return { characters: [], error: null };
    }
  }

  /**
   * Utilidades
   */
  private parseKiValue(ki: string): number {
    if (!ki || ki === 'unknown') return Math.floor(Math.random() * 50) + 1;
    
    const numericValue = ki.replace(/[^\d]/g, '');
    const parsed = parseInt(numericValue);
    
    if (isNaN(parsed)) return Math.floor(Math.random() * 50) + 1;
    
    // Normalizar a escala 1-100
    return Math.min(Math.floor(parsed / 1000000) + 1, 100);
  }

  /**
   * Valida si una URL de imagen es accesible
   */
  async validateImageUrl(url: string): Promise<{ isValid: boolean, error: string | null }> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      
      if (!response.ok) {
        return {
          isValid: false,
          error: `La imagen no está disponible (${response.status})`
        };
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.startsWith('image/')) {
        return {
          isValid: false,
          error: 'La URL no apunta a una imagen válida'
        };
      }

      return {
        isValid: true,
        error: null
      };
    } catch (error) {
      return {
        isValid: false,
        error: 'No se pudo verificar la imagen. Verifica la URL.'
      };
    }
  }
}