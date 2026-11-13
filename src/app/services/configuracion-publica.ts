import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { apiUrl } from '../config/api';
import { esUsernameTelegramValido } from './telegram-username';

@Injectable({ providedIn: 'root' })
export class ConfiguracionPublicaService {
  private readonly http = inject(HttpClient);

  obtenerBotTelegram(): Observable<string> {
    return this.http.get<unknown>(`${apiUrl}/configuracion-publica`).pipe(
      map(respuesta => {
        if (typeof respuesta !== 'object' || respuesta === null || !('telegram_bot_username' in respuesta)
          || !esUsernameTelegramValido(respuesta.telegram_bot_username)) {
          throw new Error('La configuración de Telegram es inválida.');
        }
        return respuesta.telegram_bot_username;
      }),
    );
  }
}
