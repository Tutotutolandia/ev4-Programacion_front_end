import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Character, Skill } from '../../models/character.model';
import { CharacterService } from '../../services/character.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-character-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './character-form.component.html',
  styleUrls: ['./character-form.component.scss']
})
export class CharacterFormComponent implements OnInit {
  character: Character = {
    id: Date.now(),
    name: '',
    class: '',
    level: 1,
    skills: [],
    imageUrl: ''
  };

  skillInput: Skill = {
    name: '',
    elementType: 'Neutro',
    description: '',
    manaCost: 0,
    cooldown: 0
  };

  editing = false;
  imageOption: 'url' | 'file' = 'url';
  selectedFileName: string = '';
  imageError: string = '';
  validatingUrl = false;

  characterClasses = [
    'Mago',
    'Pícaro',
    'Paladín',
    'Guerrero',
    'Sacerdote',
    'Bardo',
    'Bárbaro',
    'Monje',
    'Cazador'
  ];

  elementTypes = [
    'Fuego',
    'Agua',
    'Tierra',
    'Aire',
    'Rayo',
    'Hielo',
    'Luz',
    'Oscuridad',
    'Neutro'
  ];

  constructor(
    private characterService: CharacterService,
    private apiService: ApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const existing = this.characterService.getCharacterById(Number(id));
      if (existing) {
        this.character = { ...existing };
        this.editing = true;
        // Determinar el tipo de imagen basado en si es base64 o URL
        this.imageOption = this.character.imageUrl?.startsWith('data:') ? 'file' : 'url';
      }
    }
  }

  onImageOptionChange(): void {
    // Limpiar la imagen actual cuando se cambia de opción
    this.character.imageUrl = '';
    this.selectedFileName = '';
    this.imageError = '';
  }

  async onImageUrlChange(): Promise<void> {
    if (!this.character.imageUrl || this.character.imageUrl.trim() === '') {
      this.imageError = '';
      return;
    }

    // Validar URL usando la API service
    this.validatingUrl = true;
    this.imageError = '';

    const result = await this.apiService.validateImageUrl(this.character.imageUrl);
    
    this.validatingUrl = false;
    
    if (!result.isValid) {
      this.imageError = result.error || 'URL de imagen no válida';
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (!file) {
      return;
    }

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      this.imageError = 'Formato de archivo no soportado. Use JPG, PNG, GIF o WebP.';
      return;
    }

    // Validar tamaño (5MB máximo)
    const maxSize = 5 * 1024 * 1024; // 5MB en bytes
    if (file.size > maxSize) {
      this.imageError = 'El archivo es demasiado grande. El tamaño máximo es 5MB.';
      return;
    }

    this.imageError = '';
    this.selectedFileName = file.name;

    // Convertir archivo a base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      this.character.imageUrl = result;
    };
    reader.onerror = () => {
      this.imageError = 'Error al leer el archivo. Intente nuevamente.';
      this.selectedFileName = '';
    };
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.character.imageUrl = '';
    this.selectedFileName = '';
    this.imageError = '';
  }

  addSkill(): void {
    if (this.skillInput.name.trim()) {
      const newSkill: Skill = {
        name: this.skillInput.name.trim(),
        elementType: this.skillInput.elementType,
        description: this.skillInput.description.trim(),
        manaCost: this.skillInput.manaCost || 0,
        cooldown: this.skillInput.cooldown || 0
      };
      this.character.skills.push(newSkill);
      this.resetSkillInput();
    }
  }

  removeSkill(index: number): void {
    this.character.skills.splice(index, 1);
  }

  resetSkillInput(): void {
    this.skillInput = {
      name: '',
      elementType: 'Neutro',
      description: '',
      manaCost: 0,
      cooldown: 0
    };
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

  saveCharacter(): void {
    if (this.editing) {
      this.characterService.updateCharacter(this.character);
    } else {
      this.character.id = Date.now();
      this.characterService.addCharacter(this.character);
    }
    this.router.navigate(['/']);
  }
}