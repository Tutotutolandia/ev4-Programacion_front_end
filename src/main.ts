import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { CharacterListComponent } from './app/components/character-list/character-list.component';
import { CharacterFormComponent } from './app/components/character-form/character-form.component';
import { ApiCharactersComponent } from './app/components/api-characters/api-characters.component';

const routes = [
  { path: '', component: CharacterListComponent },
  { path: 'crear', component: CharacterFormComponent },
  { path: 'editar/:id', component: CharacterFormComponent },
  { path: 'api-characters', component: ApiCharactersComponent },
  { path: '**', redirectTo: '' }
];

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes)
  ]
}).catch(err => console.error(err));