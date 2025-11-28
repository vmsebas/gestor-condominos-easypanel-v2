// Exportar todos los servicios API desde un único punto
export { buildingsAPI } from './buildings';
export { membersAPI } from './members';
export { convocatoriasAPI } from './convocatorias';
export { financeAPI } from './finance';
export { communicationsAPI } from './communications';
export { lettersAPI } from './letters';

// También exportar el cliente API por si se necesita para casos especiales
export { default as apiClient } from '@/lib/api-v2';

// Tipos comunes
export type * from './convocatorias';
export type * from './finance';
export type * from './communications';
export type * from './letters';