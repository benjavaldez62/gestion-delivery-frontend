import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { apiUrl } from '../../config/api';
import { Pagos } from './pagos';

describe('Pagos', () => {
  let fixture: ComponentFixture<Pagos>;
  let component: Pagos;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Pagos],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(Pagos);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    const dialogo = (fixture.nativeElement as HTMLElement).querySelector('dialog') as HTMLDialogElement;
    // jsdom no implementa los métodos de diálogo nativos.
    dialogo.showModal = () => { dialogo.open = true; };
    dialogo.close = () => { dialogo.open = false; };
    http.expectOne(`${apiUrl}/pagos/resumen`).flush({
      fecha: '2026-03-15', zona_horaria: 'America/Argentina/Buenos_Aires', ingreso_diario: 100.25, ingreso_mensual: 300.75,
    });
    http.expectOne(`${apiUrl}/pagos/envios`).flush({
      fecha: '2026-03-15', zona_horaria: 'America/Argentina/Buenos_Aires', total_envios: 250,
      repartidores: [{ id: 1, nombre: 'Ana', total: 250, envios: [{ pedido_id: 8, importe: 250 }] }],
      pendientes_revision: [{ pedido_id: 9, motivo: 'Falta el subtotal.' }],
    });
    http.expectOne(`${apiUrl}/metodos-pago`).flush({ metodosPago: [
      { id: 1, nombre: 'Efectivo', activo: true },
      { id: 2, nombre: 'Transferencia bancaria', activo: true },
    ] });
    http.expectOne(`${apiUrl}/estado-pagos`).flush({ estadoPagos: [{ id: 1, nombre: 'Pendiente' }, { id: 2, nombre: 'Fallido' }] });
    http.expectOne(`${apiUrl}/pagos`).flush({ pagos: [{
      id: 4, pedido_id: 8, monto: 2500, fecha_pago: '2026-03-15T00:00:00.000000Z', referencia: null,
      pedido: { cliente_id: 3, nombre_cliente: 'Ana López', usuario_cliente: 'web_351', telefono_cliente: '(351) 123-4567' },
      metodo_pago: { id: 1, nombre: 'Efectivo' }, estado_pago: { id: 1, nombre: 'Pendiente' },
      comprobantes: [{ id: 7, tipo_comprobante: 'Ticket no fiscal', numero_comprobante: 'T-007', titular: 'Cliente' }],
    }] });
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
  });

  it('muestra pagos y métodos sin habilitar transferencias', () => {
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('#8');
    expect(texto).toContain('Ana López');
    expect(texto).toContain('(351) 123-4567');
    expect(texto).toContain('Cliente #3');
    expect(texto).toContain('$100.25');
    expect(texto).toContain('$300.75');
    expect(texto).toContain('Zona horaria: America/Argentina/Buenos_Aires');
    expect(texto).toContain('15/03/2026');
    expect(texto).toContain('Los cobros anteriores al cambio pueden conservar fecha UTC');
    expect(texto).toContain('Envíos cobrados por repartidor');
    expect(texto).toContain('Ana');
    expect(texto).toContain('Pedido #8');
    expect(texto).toContain('$250.00');
    expect(texto).toContain('Pedido #9: Falta el subtotal.');
    expect(texto).toContain('No registra pagos al repartidor');
    const metodos = (fixture.nativeElement as HTMLElement).querySelectorAll('.method-item');
    expect(metodos[1].querySelector('.method-name')?.textContent).toContain('Transferencia bancaria');
    expect(metodos[1].querySelector('.method-status')?.textContent).toContain('No disponible');
    expect(texto).toContain('Efectivo operativo');
    expect((fixture.nativeElement as HTMLElement).querySelector('.payment-status.status-pending')?.textContent).toContain('Pendiente');
    expect(texto).not.toContain('Registrar pago pendiente en efectivo');
    expect(texto).not.toContain('Marcar Fallido');
    expect(texto).not.toContain('Marcar Pendiente');
    expect(texto).not.toContain('Anular');
    expect((fixture.nativeElement as HTMLElement).querySelector('#nuevo-pedido')).toBeNull();
  });

  it('filtra pagos y muestra vacío ante un 404 de listado', () => {
    component.busqueda = '  Ana  ';
    component.estado = '1';
    component.metodo = '1';
    component.buscar();
    const solicitud = http.expectOne(req => req.url === `${apiUrl}/pagos` && req.params.get('busqueda') === 'Ana');
    expect(solicitud.request.params.get('estado_pago_id')).toBe('1');
    expect(solicitud.request.params.get('metodo_pago_id')).toBe('1');
    solicitud.flush({ message: 'No hay pagos disponibles.' }, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No hay pagos para los filtros');
  });

  it('permite buscar un teléfono desde el formulario', () => {
    const pagina = fixture.nativeElement as HTMLElement;
    const input = pagina.querySelector('#filtro-busqueda') as HTMLInputElement;
    input.value = '3511234567';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    (pagina.querySelector('.filters-form') as HTMLFormElement).dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    http.expectOne(req => req.url === `${apiUrl}/pagos` && req.params.get('busqueda') === '3511234567')
      .flush({ pagos: [] });
    fixture.detectChanges();
    expect(pagina.textContent).toContain('No hay pagos para los filtros seleccionados.');
  });

  it('informa errores al consultar los pagos', () => {
    component.buscar();
    http.expectOne(`${apiUrl}/pagos`).flush({ message: 'Error al consultar pagos.' }, { status: 500, statusText: 'Error' });
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Error al consultar pagos.');
    expect(component.pagos).toEqual([]);
  });

  it('informa fallos al actualizar ingresos sin mostrarlos como cero', () => {
    component.cargarResumen();
    http.expectOne(`${apiUrl}/pagos/resumen`).flush({}, { status: 500, statusText: 'Error' });
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No se pudieron cargar los ingresos');
    expect(component.resumen).toBeNull();
  });

  it('consulta otra fecha y muestra resultados vacíos', () => {
    component.fechaEnvios = '2026-03-14';
    component.cargarEnvios();
    http.expectOne(req => req.url === `${apiUrl}/pagos/envios` && req.params.get('fecha') === '2026-03-14')
      .flush({ fecha: '2026-03-14', zona_horaria: 'UTC', total_envios: 0, repartidores: [], pendientes_revision: [] });
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No hay envíos calculables para esta fecha.');
  });

  it('informa errores de envíos sin mostrar datos anteriores', () => {
    component.cargarEnvios();
    http.expectOne(req => req.url === `${apiUrl}/pagos/envios`).flush({}, { status: 500, statusText: 'Error' });
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No se pudieron cargar los envíos.');
    expect(component.resumenEnvios).toBeNull();
  });

  it('abre el ticket original al seleccionar el código y lo muestra de forma segura', () => {
    const pagina = fixture.nativeElement as HTMLElement;
    (pagina.querySelector('.receipt-link') as HTMLButtonElement).click();
    const solicitud = http.expectOne(`${apiUrl}/comprobantes/7`);
    solicitud.flush({ comprobante: {
      id: 7, numero_comprobante: 'T-007',
      contenido_ticket: '<b>Ticket no fiscal</b>\nCliente: Juan &amp; Ana\nFecha y hora de emisión: 15/03/2026 23:23:51\n<script>alert(1)</script>Total: $2500',
    } });
    fixture.detectChanges();
    const dialogo = pagina.querySelector('dialog') as HTMLDialogElement;
    expect(dialogo.open).toBe(true);
    expect(dialogo.textContent).toContain('Comprobante T-007');
    expect(dialogo.querySelector('.ticket-content')?.textContent).toContain('Cliente: Juan & Ana');
    expect(dialogo.querySelector('.ticket-content')?.textContent).toContain('Fecha y hora de emisión: 15/03/2026 23:23:51');
    expect(dialogo.querySelector('.ticket-content')?.textContent).not.toContain('America/Argentina/Buenos_Aires');
    expect(dialogo.querySelector('.ticket-content')?.textContent).toContain('Total: $2500');
    expect(dialogo.querySelector('script')).toBeNull();
    (dialogo.querySelector('button') as HTMLButtonElement).click();
    expect(dialogo.open).toBe(false);
  });

  it('informa cuando el comprobante no tiene ticket guardado o falla la consulta', () => {
    component.verTicket(7, 'T-007');
    http.expectOne(`${apiUrl}/comprobantes/7`).flush({ comprobante: { id: 7, numero_comprobante: 'T-007', contenido_ticket: null } });
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('no tiene un ticket guardado');
    component.cerrarTicket();
    component.verTicket(7, 'T-007');
    http.expectOne(`${apiUrl}/comprobantes/7`).flush({}, { status: 500, statusText: 'Error' });
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No se pudo cargar el comprobante.');
    component.cerrarTicket();
  });

  it('cancela la consulta al cerrar el ticket', () => {
    component.verTicket(7, 'T-007');
    const solicitud = http.expectOne(`${apiUrl}/comprobantes/7`);
    component.cerrarTicket();
    expect(solicitud.cancelled).toBe(true);
  });

  it('cancela la consulta al cerrar con Escape', () => {
    component.verTicket(7, 'T-007');
    const solicitud = http.expectOne(`${apiUrl}/comprobantes/7`);
    const dialogo = (fixture.nativeElement as HTMLElement).querySelector('dialog') as HTMLDialogElement;
    dialogo.dispatchEvent(new Event('cancel', { cancelable: true }));
    expect(solicitud.cancelled).toBe(true);
  });

});
