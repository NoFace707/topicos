## Purpose

Permitir que cada usuario represente manualmente el dinero y las deudas que administra mediante cuentas de efectivo, banco y tarjeta.

## ADDED Requirements

### Requirement: Gestión de cuentas manuales
El sistema SHALL permitir crear y editar cuentas propias con nombre, tipo efectivo, banco o tarjeta, y saldo inicial. Todos los importes del MVP SHALL pertenecer a una única moneda sin conversión.

#### Scenario: Crear cuenta de efectivo o banco
- **WHEN** un usuario crea una cuenta de efectivo o banco con nombre, tipo y saldo inicial válidos
- **THEN** el sistema guarda la cuenta y refleja su saldo inicial en los cálculos financieros del usuario

#### Scenario: Crear cuenta de tarjeta
- **WHEN** un usuario crea una cuenta de tarjeta con su saldo inicial
- **THEN** el sistema guarda la cuenta como pasivo y muestra el saldo conforme a las transacciones registradas

#### Scenario: Editar datos de la cuenta
- **WHEN** un usuario cambia el nombre de una cuenta propia
- **THEN** el sistema conserva su historial y presenta el nuevo nombre en todas las vistas

### Requirement: Saldo de cuenta calculado
El sistema SHALL calcular el saldo actual de cada cuenta a partir de su saldo inicial y todas las transacciones que la afecten.

#### Scenario: Movimiento que aumenta el saldo
- **WHEN** se registra un ingreso o una transferencia entrante en una cuenta
- **THEN** el saldo calculado de esa cuenta aumenta por el importe del movimiento

#### Scenario: Movimiento que reduce el saldo
- **WHEN** se registra un gasto o una transferencia saliente en una cuenta
- **THEN** el saldo calculado de esa cuenta disminuye por el importe del movimiento

### Requirement: Archivo de cuentas
El sistema SHALL permitir archivar una cuenta sin eliminar su historial ni alterar cálculos históricos.

#### Scenario: Archivar una cuenta
- **WHEN** un usuario archiva una cuenta propia
- **THEN** la cuenta deja de estar disponible para nuevas transacciones y permanece visible en consultas históricas

#### Scenario: Reactivar una cuenta
- **WHEN** un usuario reactiva una cuenta archivada
- **THEN** la cuenta vuelve a estar disponible para nuevas transacciones con su historial intacto

