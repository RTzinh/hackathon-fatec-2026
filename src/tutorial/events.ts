/** Evento de janela que pede ao `<Tour>` para abrir o tour do perfil atual desde o primeiro passo. */
export const TOUR_EVENT = 'integrae:tour'

export function requestTour(): void {
  window.dispatchEvent(new CustomEvent(TOUR_EVENT))
}
