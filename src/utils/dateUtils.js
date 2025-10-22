// Utilidades para manejo de fechas

import { format, formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

export const formatDate = (date) => {
  return format(new Date(date), "dd/MM/yyyy 'a las' HH:mm", { locale: es })
}

export const formatDateShort = (date) => {
  return format(new Date(date), "dd/MM/yyyy", { locale: es })
}

export const formatTimeAgo = (date) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es })
}
