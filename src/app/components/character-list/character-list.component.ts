import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Character, Skill } from '../../models/character.model';
import { CharacterService } from '../../services/character.service';

@Component({
  selector: 'app-character-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './character-list.component.html',
  styleUrls: ['./character-list.component.scss']
})
export class CharacterListComponent implements OnInit {
  characters: Character[] = [];

  constructor(private characterService: CharacterService, private router: Router) {}

  ngOnInit(): void {
    this.characters = this.characterService.getCharacters();
  }

  editCharacter(id: number) {
    this.router.navigate(['/editar', id]);
  }

  deleteCharacter(id: number) {
    this.characterService.deleteCharacter(id);
    this.characters = this.characterService.getCharacters();
  }

  getSkillTooltip(skill: Skill): string {
    let tooltip = `${skill.name}\n`;
    tooltip += `Elemento: ${skill.elementType}\n`;
    tooltip += `Coste de maná: ${skill.manaCost} MP\n`;
    tooltip += `Tiempo de reutilización: ${skill.cooldown}s\n`;
    if (skill.description) {
      tooltip += `\nDescripción:\n${skill.description}`;
    }
    return tooltip;
  }
}