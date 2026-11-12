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
    admin_nombre: 'Benjamín Valdez',
    kpis: {
      ingresos_totales: 65500,
      total_pedidos: 5,
      pedidos_validos: 4,
      pedidos_entregados: 1,
      pedidos_cancelados: 1,
      pedidos_en_curso: 3,
      pedidos_sin_asignar: 2,
      ticket_promedio: 16375,
      tasa_entrega: 20,
    },
    por_estado: [
      { id: 1, nombre: 'Sin asignar', cantidad: 0, monto_total: 0, porcentaje: 0 },
      { id: 2, nombre: 'Pendiente', cantidad: 1, monto_total: 16000, porcentaje: 20 },
      { id: 3, nombre: 'En preparación', cantidad: 1, monto_total: 13000, porcentaje: 20 },
      { id: 4, nombre: 'Listo para entregar', cantidad: 0, monto_total: 0, porcentaje: 0 },
      { id: 5, nombre: 'En camino', cantidad: 1, monto_total: 25500, porcentaje: 20 },
      { id: 6, nombre: 'Entregado', cantidad: 1, monto_total: 11000, porcentaje: 20 },
      { id: 7, nombre: 'Cancelado', cantidad: 1, monto_total: 15000, porcentaje: 20 },
    ],
    por_metodo_pago: [
      { id: 1, nombre: 'Transferencia bancaria', cantidad: 2, monto_total: 41500, porcentaje: 63 },
      { id: 2, nombre: 'Efectivo', cantidad: 2, monto_total: 24000, porcentaje: 37 },
    ],
    staff: {
      cocineros: [
        {
          id: 2,
          name: 'Felipe Martínez',
          email: 'felipe@test.com',
          rol: 'Cocinero',
          disponible: false,
          pedidos_activos_count: 2,
          pedidos_completados_periodo: 1,
          pedidos_activos: [
            {
              id: 2,
              codigo: 'PED-002',
              estado: 'En preparación',
              cliente: 'gusmachax779',
              monto_total: 13000,
            },
            {
              id: 3,
              codigo: 'PED-003',
              estado: 'En camino',
              cliente: 'cata_lopez001',
              monto_total: 25500,
            },
          ],
        },
        {
          id: 4,
          name: 'Benjamín Valdez',
          email: 'benja@test.com',
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
          disponible: false,
          pedidos_activos_count: 1,
          pedidos_completados_periodo: 1,
          pedidos_activos: [
            {
              id: 3,
              codigo: 'PED-003',
              estado: 'En camino',
              cliente: 'cata_lopez001',
              monto_total: 25500,
            },
          ],
        },
        {
          id: 5,
          name: 'Fabricio Alanis',
          email: 'fabri@test.com',
          rol: 'Repartidor',
          disponible: true,
          pedidos_activos_count: 0,
          pedidos_completados_periodo: 2,
          pedidos_activos: [],
        },
      ],
    },
    pedidos_para_asignar: [
      {
        id: 1,
        codigo: 'PED-001',
        monto_total: 16000,
        created_at: '2026-11-12T10:00:00.000000Z',
        cliente: { id: 1, username: 'juan-martin96' },
        estado: { id: 2, nombre: 'Pendiente' },
        metodo_pago: 'Transferencia bancaria',
        cocinero: null,
        repartidor: null,
      },
      {
        id: 2,
        codigo: 'PED-002',
        monto_total: 13000,
        created_at: '2026-11-12T10:05:00.000000Z',
        cliente: { id: 2, username: 'gusmachax779' },
        estado: { id: 3, nombre: 'En preparación' },
        metodo_pago: 'Efectivo',
        cocinero: { id: 2, name: 'Felipe Martínez' },
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
    expect(component.totalDisponibles).toBe(2);
    expect(component.porcentajeEntregados).toBe(20);
  });

  it('debe renderizar el encabezado, KPIs, pedidos pendientes de asignación, equipo y resumen inferior', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain(component.saludoEncabezado);
    expect(compiled.textContent).toContain('$65,500');
    expect(compiled.textContent).toContain('4 pedidos cobrados');
    expect(compiled.textContent).toContain('$16,375');
    expect(compiled.textContent).toContain('2 sin asignar');
    expect(compiled.textContent).toContain('Requieren asignación');
    expect(compiled.textContent).toContain('juan-martin96');
    expect(compiled.textContent).toContain('Falta: cocinero y repartidor');
    expect(compiled.textContent).toContain('Falta: repartidor');
    expect(compiled.textContent).toContain('2 de 4 disponibles');
    expect(compiled.textContent).toContain('FM');
    expect(compiled.textContent).toContain('Pedidos #2, #3');
    expect(compiled.textContent).toContain('Sin asignar y Listo para entregar: 0');
    expect(compiled.textContent).toContain('Transferencia bancaria');
  });

  it('debe calcular correctamente las iniciales y el detalle de pedidos del personal', () => {
    expect(component.iniciales('Benjamín Valdez')).toBe('BV');
    expect(component.iniciales('Admin')).toBe('AD');
    expect(component.detalleStaff(resumenMock.staff.cocineros[0])).toBe('Pedidos #2, #3');
    expect(component.detalleStaff(resumenMock.staff.repartidores[0])).toBe('Pedido #3');
    expect(component.detalleStaff(resumenMock.staff.cocineros[1])).toBe('Sin pedidos');
  });

  it('debe alternar el filtro de solo disponibles en la lista del equipo', () => {
    expect(component.soloDisponibles).toBe(false);
    expect(component.personalFiltrado.length).toBe(4);

    component.toggleSoloDisponibles();
    fixture.detectChanges();

    expect(component.soloDisponibles).toBe(true);
    expect(component.personalFiltrado.length).toBe(2);
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).not.toContain('Pedidos #2, #3');
    expect(compiled.textContent).toContain('Benjamín Valdez');
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
    const alert = (fixture.nativeElement as HTMLElement).querySelector('.dash-alert');
    expect(alert?.textContent).toContain('Error interno del servidor.');
  });
});
