import { Injectable } from '@angular/core';
import { Character, Skill } from '../models/character.model';

@Injectable({
  providedIn: 'root'
})
export class CharacterService {
  private characters: Character[] = [];
  private readonly STORAGE_KEY = 'character-manager-characters';

  constructor() {
    this.loadCharactersFromStorage();
  }

  private loadCharactersFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsedCharacters = JSON.parse(stored);
        // Migrar datos antiguos si es necesario
        this.characters = parsedCharacters.map((char: any) => {
          if (char.skills && char.skills.length > 0) {
            // Migrar habilidades antiguas
            char.skills = char.skills.map((skill: any) => {
              if (typeof skill === 'string') {
                // Convertir habilidades de string a objeto Skill
                return {
                  name: skill,
                  elementType: 'Neutro',
                  description: '',
                  manaCost: 0,
                  cooldown: 0
                };
              } else if (!skill.hasOwnProperty('description')) {
                // Agregar propiedades faltantes a habilidades existentes
                return {
                  ...skill,
                  description: skill.description || '',
                  manaCost: skill.manaCost || 0,
                  cooldown: skill.cooldown || 0
                };
              }
              return skill;
            });
          }
          return char;
        });
        this.saveCharactersToStorage(); // Guardar la migración
      }
    } catch (error) {
      console.error('Error loading characters from localStorage:', error);
      this.characters = [];
    }
  }

  private saveCharactersToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.characters));
    } catch (error) {
      console.error('Error saving characters to localStorage:', error);
    }
  }

  getCharacters(): Character[] {
    return this.characters;
  }

  getCharacterById(id: number): Character | undefined {
    return this.characters.find(char => char.id === id);
  }

  addCharacter(character: Character): void {
    this.characters.push(character);
    this.saveCharactersToStorage();
  }

  updateCharacter(updatedCharacter: Character): void {
    const index = this.characters.findIndex(char => char.id === updatedCharacter.id);
    if (index !== -1) {
      this.characters[index] = updatedCharacter;
      this.saveCharactersToStorage();
    }
  }

  deleteCharacter(id: number): void {
    this.characters = this.characters.filter(char => char.id !== id);
    this.saveCharactersToStorage();
  }
}