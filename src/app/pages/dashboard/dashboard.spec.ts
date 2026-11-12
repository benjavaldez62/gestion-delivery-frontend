import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { DashboardResumen, DashboardService } from '../../services/dashboard';
import { Dashboard } from './dashboard';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;
  let dashboardServiceSpy: {
    obtenerResumen: ReturnType<typeof vi.fn>;
  };

  const resumenMock: DashboardResumen = {
    periodo: 'historico',
    kpis: {
      ingresos_totales: 84500,
      total_pedidos: 14,
      pedidos_validos: 13,
      pedidos_entregados: 8,
      pedidos_cancelados: 1,
      pedidos_en_curso: 5,
      pedidos_sin_asignar: 2,
      ticket_promedio: 6500,
      tasa_entrega: 61.5,
    },
    por_estado: [
      { id: 1, nombre: 'Sin asignar', cantidad: 2, monto_total: 13000, porcentaje: 14.3 },
      { id: 2, nombre: 'En preparación', cantidad: 3, monto_total: 21500, porcentaje: 21.4 },
      { id: 5, nombre: 'Entregado', cantidad: 8, monto_total: 50000, porcentaje: 57.1 },
    ],
    por_metodo_pago: [
      { id: 1, nombre: 'Transferencia bancaria', cantidad: 8, monto_total: 52000, porcentaje: 61.5 },
      { id: 2, nombre: 'Efectivo', cantidad: 5, monto_total: 32500, porcentaje: 38.5 },
    ],
    staff: {
      cocineros: [
        {
          id: 2,
          name: 'Felipe Martinez',
          email: 'felipe@test.com',
          rol: 'Cocinero',
          disponible: false,
          pedidos_activos_count: 1,
          pedidos_completados_periodo: 5,
          pedidos_activos: [
            {
              id: 110,
              codigo: 'PED-110',
              estado: 'En preparación',
              cliente: 'juanperez',
              monto_total: 7800,
            },
          ],
        },
        {
          id: 4,
          name: 'Lucía Fernández',
          email: 'lucia@test.com',
          rol: 'Cocinero',
          disponible: true,
          pedidos_activos_count: 0,
          pedidos_completados_periodo: 3,
          pedidos_activos: [],
        },
      ],
      repartidores: [
        {
          id: 3,
          name: 'Sebastián Gómez',
          email: 'sebastian@test.com',
          rol: 'Repartidor',
          disponible: true,
          pedidos_activos_count: 0,
          pedidos_completados_periodo: 4,
          pedidos_activos: [],
        },
      ],
    },
    pedidos_para_asignar: [
      {
        id: 113,
        codigo: 'PED-113',
        monto_total: 6500,
        created_at: '2026-11-11T20:00:00.000000Z',
        cliente: { id: 1, username: 'mariagomez' },
        estado: { id: 1, nombre: 'Sin asignar' },
        metodo_pago: 'Transferencia bancaria',
        cocinero: null,
        repartidor: null,
      },
    ],
  };

  beforeEach(async () => {
    dashboardServiceSpy = {
      obtenerResumen: vi.fn().mockReturnValue(of(resumenMock)),
    };

    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideRouter([]),
        { provide: DashboardService, useValue: dashboardServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('debe crear el componente y cargar el resumen histórico por defecto', () => {
    expect(component).toBeTruthy();
    expect(dashboardServiceSpy.obtenerResumen).toHaveBeenCalledWith('historico');
    expect(component.resumen).toEqual(resumenMock);
    expect(component.cocinerosDisponiblesCount).toBe(1);
    expect(component.repartidoresDisponiblesCount).toBe(1);
  });

  it('debe renderizar los bloques de KPIs, estado del personal y notificaciones de pedidos por asignar sin selectores', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Dashboard General');
    expect(compiled.textContent).toContain('$84,500');
    expect(compiled.textContent).toContain('13 cobrados');
    expect(compiled.textContent).toContain('$6,500');
    expect(compiled.textContent).toContain('2 sin asignar');
    expect(compiled.textContent).toContain('1 cancelado');
    expect(compiled.textContent).toContain('Felipe Martinez');
    expect(compiled.textContent).toContain('1 act.');
    expect(compiled.textContent).toContain('En: #110');
    expect(compiled.textContent).toContain('Lucía Fernández');
    expect(compiled.textContent).toContain('Disponible para asignar');
    expect(compiled.textContent).toContain('Pedido #113 · mariagomez');
    expect(compiled.textContent).toContain('Falta asignar cocinero y repartidor');
    expect(compiled.textContent).toContain('Asignar en Pedidos →');
    expect(compiled.querySelector('select')).toBeNull();
  });

  it('debe describir correctamente qué personal falta asignar en cada notificación', () => {
    const basePedido = resumenMock.pedidos_para_asignar[0];
    expect(component.descripcionFaltante(basePedido)).toBe('Falta asignar cocinero y repartidor');
    expect(
      component.descripcionFaltante({
        ...basePedido,
        cocinero: { id: 2, name: 'Felipe Martinez' },
        repartidor: null,
      }),
    ).toBe('Falta asignar repartidor');
    expect(
      component.descripcionFaltante({
        ...basePedido,
        cocinero: null,
        repartidor: { id: 3, name: 'Sebastián Gómez' },
      }),
    ).toBe('Falta asignar cocinero');
  });

  it('debe alternar el filtro de solo personal disponible con toggleSoloDisponibles()', () => {
    expect(component.soloDisponibles).toBe(false);
    expect(component.personalFiltrado.length).toBe(3);

    component.toggleSoloDisponibles();
    fixture.detectChanges();

    expect(component.soloDisponibles).toBe(true);
    expect(component.personalFiltrado.length).toBe(2);
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).not.toContain('En: #110');
    expect(compiled.textContent).toContain('Ver todo el personal');
  });

  it('debe mostrar y ocultar los gráficos de barras con toggleDesglose()', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(component.mostrarDesglose).toBe(false);
    expect(compiled.querySelector('.bar-chart-list')).toBeNull();

    component.toggleDesglose();
    fixture.detectChanges();

    expect(component.mostrarDesglose).toBe(true);
    expect(compiled.querySelectorAll('.bar-chart-list').length).toBe(2);
    expect(compiled.querySelectorAll('.bar-fill').length).toBe(5);
    expect(compiled.textContent).toContain('Transferencia bancaria');
    expect(compiled.textContent).toContain('$52,000');
  });

  it('debe cambiar el período seleccionado y volver a consultar el servicio', () => {
    component.cambiarPeriodo('7d');

    expect(component.periodoActual).toBe('7d');
    expect(dashboardServiceSpy.obtenerResumen).toHaveBeenCalledWith('7d');
  });

  it('debe mostrar un mensaje de error cuando falla la carga del dashboard', () => {
    dashboardServiceSpy.obtenerResumen.mockReturnValueOnce(
      throwError(() => new HttpErrorResponse({ status: 500, error: { message: 'Error interno del servidor.' } })),
    );

    component.recargar();
    fixture.detectChanges();

    expect(component.error).toBe('Error interno del servidor.');
    const alert = (fixture.nativeElement as HTMLElement).querySelector('.dashboard-alert-error');
    expect(alert?.textContent).toContain('Error interno del servidor.');
  });
});
