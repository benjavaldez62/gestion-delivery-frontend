import { Component } from '@angular/core';

@Component({
  selector: 'app-login',
  template: `
    <section class="mx-auto my-5 text-center" aria-labelledby="login-title">
      <h1 id="login-title" class="h3">Iniciar sesión</h1>
      <p class="text-body-secondary">
        Tu sesión se cerró correctamente. El inicio de sesión estará disponible próximamente.
      </p>
    </section>
  `
})
export class Login {}
