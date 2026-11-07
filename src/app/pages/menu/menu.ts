//conecta la página de Menú con su componente visual.
import { Component } from '@angular/core';
import { MenuListComponent } from '../../components/menu-list/menu-list';

@Component({
  imports: [MenuListComponent],
  selector: 'app-menu',
  standalone: true,
  styleUrl: './menu.css',
  templateUrl: './menu.html',
})
export class Menu {}
