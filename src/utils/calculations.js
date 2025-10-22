// Utilidades para cálculos de inventario

export const calculateInventoryDifferences = (cantidadDeseada, cantidadReal, cantidadSistema) => {
  // Pedido: diferencia entre cantidad deseada y cantidad real
  const pedido = cantidadDeseada - cantidadReal

  // Faltante: si cantidad real < cantidad sistema
  const faltante = cantidadReal < cantidadSistema ? cantidadSistema - cantidadReal : 0

  // Sobrante: si cantidad real > cantidad sistema
  const sobrante = cantidadReal > cantidadSistema ? cantidadReal - cantidadSistema : 0

  return {
    pedido,
    faltante,
    sobrante,
  }
}

export const calcularFaltante = (cantidadReal, cantidadSistema) => {
  return cantidadReal < cantidadSistema ? cantidadSistema - cantidadReal : 0
}

export const calcularSobrante = (cantidadReal, cantidadSistema) => {
  return cantidadReal > cantidadSistema ? cantidadReal - cantidadSistema : 0
}

export const calcularPedido = (cantidadDeseada, cantidadReal) => {
  return cantidadDeseada - cantidadReal
}

export const formatNumber = (num) => {
  return new Intl.NumberFormat("es-AR").format(num)
}

export const getStatusColor = (value) => {
  if (value > 0) return "success"
  if (value < 0) return "error"
  return "default"
}
