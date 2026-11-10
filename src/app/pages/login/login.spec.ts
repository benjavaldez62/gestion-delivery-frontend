import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Login } from './login';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('muestra el enlace para recuperar la contraseña', () => {
    fixture.detectChanges();
    const enlace = (fixture.nativeElement as HTMLElement).querySelector('a[href="/recuperar-contrasena"]');
    expect(enlace?.textContent).toContain('Olvidaste tu contraseña');
  });
});
