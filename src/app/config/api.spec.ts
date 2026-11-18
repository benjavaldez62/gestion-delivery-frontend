import { apiUrl, resolverApiUrl } from './api';

describe('resolverApiUrl', () => {
  it('retorna la URL local IPv4 cuando el hostname esta vacio o contiene solo espacios', () => {
    expect(resolverApiUrl('')).toBe('http://127.0.0.1:8000/api');
    expect(resolverApiUrl('   ')).toBe('http://127.0.0.1:8000/api');
  });

  it('mantiene http://127.0.0.1:8000/api para localhost y 127.0.0.1', () => {
    expect(resolverApiUrl('localhost')).toBe('http://127.0.0.1:8000/api');
    expect(resolverApiUrl('127.0.0.1')).toBe('http://127.0.0.1:8000/api');
    expect(resolverApiUrl('localhost', 'https:')).toBe('http://127.0.0.1:8000/api');
  });

  it('resuelve automaticamente el puerto 8000 para una IP privada en red local', () => {
    expect(resolverApiUrl('192.168.1.50')).toBe('http://192.168.1.50:8000/api');
    expect(resolverApiUrl(' 192.168.1.50 ', 'http:')).toBe('http://192.168.1.50:8000/api');
  });

  it('conserva el protocolo https cuando se indica explicitamente y normaliza otros a http', () => {
    expect(resolverApiUrl('192.168.1.50', 'https:')).toBe('https://192.168.1.50:8000/api');
    expect(resolverApiUrl('192.168.1.50', 'file:')).toBe('http://192.168.1.50:8000/api');
  });

  it('exporta apiUrl apuntando al backend local en el entorno de pruebas', () => {
    expect(apiUrl).toBe('http://127.0.0.1:8000/api');
  });
});
