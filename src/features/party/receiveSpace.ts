import type { ReceiveSpace } from '../../api/vocabulary'

/** Texto do destino pronto do backend (REQ-88). */
export const receiveSpaceText: Record<ReceiveSpace, string> = {
  inventory: 'o inventário',
  tcgFolder: 'a pasta de TCG',
  mountInventory: 'o inventário extra',
  mountTcgFolder: 'a pasta extra',
}
