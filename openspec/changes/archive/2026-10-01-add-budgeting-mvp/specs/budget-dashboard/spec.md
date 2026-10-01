## Purpose

Ofrecer una vista resumida y comprensible de la posición financiera del usuario y del estado de su presupuesto para el mes seleccionado.

## ADDED Requirements

### Requirement: Resumen de saldos
El sistema SHALL mostrar el saldo actual de cada cuenta no archivada y un saldo total neto que incluya efectivo, banco y tarjeta.

#### Scenario: Consultar saldos actuales
- **WHEN** un usuario abre el dashboard
- **THEN** el sistema muestra únicamente sus cuentas activas con sus saldos calculados y la suma neta de esos saldos

### Requirement: Resumen del mes seleccionado
El sistema SHALL permitir seleccionar un mes y mostrar su dinero listo para asignar y los importes asignado, actividad y disponible de cada categoría, agrupados en el orden configurado.

#### Scenario: Abrir el mes actual
- **WHEN** un usuario entra al dashboard sin seleccionar otro mes
- **THEN** el sistema presenta el resumen correspondiente al mes calendario actual

#### Scenario: Navegar a otro mes
- **WHEN** un usuario selecciona un mes anterior o posterior
- **THEN** el sistema recalcula y presenta el resumen de ese mes, incluyendo los arrastres aplicables

### Requirement: Estados negativos visibles
El sistema MUST destacar el dinero listo para asignar negativo y las categorías con disponible negativo sin ocultar ni modificar sus valores.

#### Scenario: Presupuesto con déficit
- **WHEN** el mes seleccionado contiene sobreasignación o una categoría tiene disponible negativo
- **THEN** el dashboard muestra el valor negativo y una indicación visual de atención

### Requirement: Estado inicial orientativo
El sistema SHALL mostrar una guía de primera acción cuando el usuario todavía no tenga cuentas o categorías suficientes para utilizar el presupuesto.

#### Scenario: Usuario sin cuentas
- **WHEN** un usuario nuevo abre el dashboard sin cuentas
- **THEN** el sistema le indica que debe crear su primera cuenta antes de registrar transacciones

