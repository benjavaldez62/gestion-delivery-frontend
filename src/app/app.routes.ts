import { Routes } from '@angular/router';
import { Categorias } from './pages/categorias/categorias';
import { Inicio } from './pages/inicio/inicio';
import { Carrito } from './pages/carrito/carrito';
import { Checkout } from './pages/checkout/checkout';

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
        path: 'carrito',
        component: Carrito
    },
    {
        path: 'checkout',
        component: Checkout
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
