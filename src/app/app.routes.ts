import { Routes } from '@angular/router';
import { Categorias } from './pages/categorias/categorias';
import { Inicio } from './pages/inicio/inicio';

export const routes: Routes = [
    {
        path: 'categorias',
        component: Categorias
    },
    {
        path: 'inicio',
        component: Inicio
    },
    {
        path: '',
        redirectTo: 'inicio',
        pathMatch: 'full'
    },
    {
        path: '**',
        redirectTo: 'inicio',
        pathMatch: 'full'
    },

];
