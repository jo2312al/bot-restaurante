# Bot Restaurante / Room Service WhatsApp

Bot de WhatsApp para recibir pedidos de servicio al cuarto en un hotel o restaurante. El bot muestra un menu, administra un carrito por cliente, valida cantidad, habitacion y nombre, y envia el pedido confirmado a un grupo de cocina.

## Que hace

- Atiende mensajes privados de WhatsApp usando Baileys.
- Ignora mensajes enviados por el propio bot y mensajes de grupos.
- Muestra el menu principal cuando el cliente escribe `hola`, `inicio` o `menu`.
- Permite ver productos, agregar cantidades y notas por producto.
- Mantiene un carrito temporal por usuario.
- Permite usar comandos naturales durante el pedido: `menu`, `carrito`, `confirmar` y `0`.
- Calcula el total del pedido.
- Valida que el servicio este abierto en horarios definidos.
- Solicita habitacion y nombre completo antes de confirmar.
- Envia el pedido final al grupo configurado en `config/config.js`.
- Registra eventos en `logs/bot.log`.

## Flujo del cliente

1. El cliente escribe `hola`, `inicio` o `menu`.
2. El bot responde con las opciones:
   - `1` Ver menu
   - `2` Ver carrito
   - `3` Confirmar pedido
   - `4` Cancelar pedido
3. Al elegir productos, el bot pide cantidad y permite agregar una nota.
4. Despues de agregar un producto, el cliente puede escribir otro numero de producto, `carrito` o `confirmar`.
5. Al confirmar, pide habitacion y nombre completo.
6. El pedido se envia al grupo de cocina y el cliente recibe confirmacion.

En cualquier momento se puede escribir `cancelar` o `0` para reiniciar el pedido.

## Estructura del proyecto

- `index.js`: inicializa la conexion con WhatsApp, muestra el QR y escucha eventos.
- `handlers/messageHandler.js`: decide que hacer con cada mensaje recibido.
- `handlers/roomServiceHandler.js`: maneja los pasos del flujo de pedido.
- `flows/roomServiceFlow.js`: genera el texto del menu agrupado por categoria.
- `data/menu.js`: contiene los productos, categorias y precios.
- `messages/roomMessages.js`: centraliza los mensajes usados por el bot.
- `services/cartService.js`: agrega productos y calcula totales.
- `services/scheduleService.js`: valida horarios de servicio.
- `services/whatsappService.js`: envia mensajes con una pequena pausa.
- `services/loggerService.js`: escribe logs de ejecucion.
- `state/userState.js`: guarda el estado temporal de cada usuario.
- `validators/roomValidators.js`: valida cantidades, habitaciones y nombres.
- `config/config.js`: configuracion general, como grupo destino y limites.

## Menu incluido

El bot incluye 51 productos del menu RLM 2025:

- Desayunos
- Antojitos
- Especialidades tabasqueñas
- Comida o cena
- Medias ordenes
- Bebidas

## Instalacion

```bash
npm install
```

## Uso

```bash
npm start
```

Al iniciar, el bot imprime un QR en la terminal. Escanealo desde WhatsApp para iniciar sesion.

## Configuracion importante

Edita `config/config.js` antes de usarlo en produccion:

```js
module.exports = {
    GROUP_ID: "120363000000000000@g.us",
    DELAY_MS: 1000,
    MAX_QUANTITY: 10
};
```

`GROUP_ID` debe ser el ID real del grupo donde cocina o recepcion recibira los pedidos.

## Notas de seguridad

La carpeta `auth/` contiene credenciales de sesion de WhatsApp generadas por Baileys. No debe subirse al repositorio. Tambien se excluyen `logs/`, `node_modules/` y archivos `.env`.
