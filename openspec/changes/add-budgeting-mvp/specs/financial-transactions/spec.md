## Purpose

Registrar manualmente ingresos, gastos y transferencias para mantener coherentes los saldos de cuentas y la actividad del presupuesto.

## ADDED Requirements

### Requirement: Registro de ingresos
El sistema SHALL permitir registrar un ingreso con cuenta de destino, fecha, importe positivo y concepto opcional.

#### Scenario: Crear un ingreso
- **WHEN** un usuario registra un ingreso válido en una cuenta activa propia
- **THEN** el saldo de la cuenta y el dinero listo para asignar aumentan por el importe registrado

### Requirement: Registro de gastos
El sistema SHALL permitir registrar un gasto con cuenta de origen, categoría activa, fecha, importe positivo y concepto opcional.

#### Scenario: Crear un gasto
- **WHEN** un usuario registra un gasto válido en una cuenta activa y categoría propias
- **THEN** el saldo de la cuenta disminuye y la actividad de la categoría refleja el gasto en el mes de la fecha

#### Scenario: Gasto con fondos insuficientes
- **WHEN** un usuario registra un gasto superior al saldo de la cuenta o al disponible de la categoría
- **THEN** el sistema permite el registro y presenta los saldos negativos correspondientes

### Requirement: Importe sugerido desde la categoría
Al crear un gasto, el sistema SHALL precargar el importe editable con el disponible positivo de la categoría seleccionada para el mes de la fecha del movimiento, sin registrar el gasto hasta que el usuario confirme el formulario.

#### Scenario: Seleccionar una categoría con dinero disponible
- **WHEN** un usuario selecciona una categoría con disponible positivo mientras crea un gasto
- **THEN** el sistema coloca ese disponible en el campo importe y permite modificarlo antes de guardar

#### Scenario: Seleccionar una categoría sin dinero disponible
- **WHEN** un usuario selecciona una categoría cuyo disponible es cero o negativo
- **THEN** el sistema deja vacío el campo importe para que el usuario decida el valor

#### Scenario: Editar un movimiento existente
- **WHEN** un usuario abre un movimiento existente para editarlo
- **THEN** el sistema conserva su importe registrado y no lo sustituye por el disponible actual de la categoría

### Requirement: Transferencias entre cuentas
El sistema SHALL permitir transferir un importe positivo entre dos cuentas activas distintas del mismo usuario mediante una operación atómica y sin categoría.

#### Scenario: Transferencia válida
- **WHEN** un usuario transfiere dinero entre dos cuentas activas propias
- **THEN** el saldo de origen disminuye, el saldo de destino aumenta y la operación no modifica la actividad de categorías ni el dinero listo para asignar

#### Scenario: Transferencia inválida
- **WHEN** las cuentas son iguales, están archivadas o alguna pertenece a otro usuario
- **THEN** el sistema rechaza toda la transferencia sin cambiar ningún saldo

### Requirement: Edición y eliminación de transacciones
El sistema SHALL permitir editar o eliminar una transacción propia y SHALL recalcular todos los saldos y valores presupuestarios afectados.

#### Scenario: Editar una transacción
- **WHEN** un usuario modifica el importe, fecha, cuenta, categoría o destino de una transacción propia
- **THEN** el sistema revierte el efecto anterior y aplica el nuevo efecto como una sola operación consistente

#### Scenario: Eliminar una transacción
- **WHEN** un usuario elimina una transacción propia
- **THEN** el sistema elimina su efecto de las cuentas y del presupuesto sin afectar otras transacciones

### Requirement: Consulta manual del historial
El sistema SHALL presentar el historial de transacciones propias y permitir filtrarlo por cuenta, tipo y rango de fechas, sin importar movimientos desde entidades bancarias.

#### Scenario: Filtrar movimientos
- **WHEN** un usuario aplica uno o más filtros al historial
- **THEN** el sistema devuelve únicamente sus transacciones que cumplen todos los filtros
