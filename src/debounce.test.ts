import { debounce } from './debounce';

// Define una función mock para usar como argumento en debounce
const mockFunc = jest.fn();

// Usa jest.useFakeTimers() para simular el avance del tiempo
jest.useFakeTimers();

describe('debounce function', () => {
  it('should debounce function calls', () => {
    // Llama a debounce con mockFunc y un tiempo de espera de 1000ms
    const debouncedFunc = debounce(mockFunc, 1000);

    // Llama a la función debounced
    debouncedFunc();

    // Verifica que mockFunc no haya sido llamada aún
    expect(mockFunc).not.toHaveBeenCalled();

    // Avanza el temporizador en 500ms
    jest.advanceTimersByTime(500);

    // Verifica nuevamente que mockFunc no haya sido llamada
    expect(mockFunc).not.toHaveBeenCalled();

    // Avanza el temporizador en 500ms adicionales (total de 1000ms desde la primera llamada)
    jest.advanceTimersByTime(500);

    // Verifica que mockFunc haya sido llamada exactamente una vez
    expect(mockFunc).toHaveBeenCalledTimes(1);

    // Puedes llamar a la función debounce nuevamente antes de que se ejecute si lo necesitas
  });

  it('should debounce multiple calls', () => {
    // Llama a debounce con mockFunc y un tiempo de espera de 1000ms
    const debouncedFunc = debounce(mockFunc, 1000);

    // Llama a la función debounced tres veces seguidas
    debouncedFunc();
    debouncedFunc();
    debouncedFunc();

    // Avanza el temporizador en 500ms
    jest.advanceTimersByTime(500);

    // Verifica que mockFunc haya sido llamada exactamente una vez después de 500ms
    expect(mockFunc).toHaveBeenCalledTimes(1);

    // Puedes llamar a la función debounce con diferentes argumentos si es necesario
  });
});