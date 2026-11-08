import { Routes } from '@angular/router';
import { Categorias } from './pages/categorias/categorias';
import { Menu } from './pages/menu/menu';
import { Inicio } from './pages/inicio/inicio';
import { Carrito } from './pages/carrito/carrito';
import { Checkout } from './pages/checkout/checkout';
import { Login } from './pages/login/login';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
    {
        path: 'categorias',
        component: Categorias,
        canActivate: [authGuard]
    },
    {
        path: 'menu',
        component: Menu
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
        path: 'login',
        component: Login
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
