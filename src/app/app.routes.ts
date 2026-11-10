import { Routes } from '@angular/router';
import { Categorias } from './pages/categorias/categorias';
import { Menu } from './pages/menu/menu';
import { Inicio } from './pages/inicio/inicio';
import { Carrito } from './pages/carrito/carrito';
import { Checkout } from './pages/checkout/checkout';
import { Login } from './pages/login/login';
import { Cocina } from './pages/cocina/cocina';
import { authGuard } from './guards/auth-guard';
import { guardRole } from './guards/role-guard';
import { Pedidos } from './pages/pedidos/pedidos';

export const routes: Routes = [
    {
        path: 'categorias',
        component: Categorias,
        canActivate: [authGuard, guardRole],
        data: { roles: ['Administrador', 'Cliente'] }
    },
    {
        path: 'menu',
        component: Menu,
        canActivate: [guardRole],
        data: { roles: ['Administrador', 'Cliente'], allowAnonymous: true }
    },
    {
        path: 'inicio',
        component: Inicio,
        canActivate: [guardRole],
        data: { roles: ['Cliente'], allowAnonymous: true }
    },
    {
        path: 'carrito',
        component: Carrito,
        canActivate: [guardRole],
        data: { roles: ['Cliente'], allowAnonymous: true }
    },
    {
        path: 'login',
        component: Login
    },
    {
        path: 'checkout',
        component: Checkout,
        canActivate: [guardRole],
        data: { roles: ['Cliente'], allowAnonymous: true }
    },
    {
        path: 'cocina',
        component: Cocina,
        canActivate: [authGuard, guardRole],
        data: { roles: ['Cocinero'] }
    },
    {
        path: 'pedidos',
        component: Pedidos,
        canActivate: [authGuard, guardRole],
        data: { roles: ['Administrador', 'SuperAdmin'] }
    },
    {
        path: 'repartos',
        children: [],
        canActivate: [authGuard, guardRole],
        data: { roles: ['Repartidor'] }
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
