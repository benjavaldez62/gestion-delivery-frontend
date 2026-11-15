import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Adicionales } from './adicionales';

describe('Adicionales', () => {
  let component: Adicionales;
  let fixture: ComponentFixture<Adicionales>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Adicionales],
    }).compileComponents();

    fixture = TestBed.createComponent(Adicionales);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
