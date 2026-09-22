## Purpose

Aplicar un presupuesto mensual por categorías que muestre cuánto dinero se asignó, cuánto se gastó y cuánto queda disponible, con continuidad entre meses.

## ADDED Requirements

### Requirement: Asignación mensual por categoría
El sistema SHALL permitir establecer para cada categoría activa un importe asignado en un mes directamente en su celda de la vista unificada, incluyendo valores positivos, cero o negativos para añadir o retirar fondos de la categoría.

#### Scenario: Asignar dinero
- **WHEN** un usuario aumenta la asignación de una categoría en el mes seleccionado
- **THEN** el disponible de la categoría aumenta por el mismo importe y el dinero listo para asignar disminuye por ese importe

#### Scenario: Retirar dinero de una categoría
- **WHEN** un usuario reduce la asignación mensual de una categoría
- **THEN** el disponible de la categoría disminuye y el dinero listo para asignar aumenta por la diferencia

#### Scenario: Editar la asignación en la fila
- **WHEN** un usuario modifica la celda asignado de una categoría y confirma el valor
- **THEN** el sistema guarda la asignación sin exigir un formulario o botón global y actualiza los importes calculados del mes

### Requirement: Actividad mensual de categoría
El sistema SHALL calcular la actividad de una categoría para un mes a partir de los gastos fechados en ese mes, representando los gastos como actividad negativa.

#### Scenario: Gasto categorizado
- **WHEN** se registra un gasto fechado en el mes seleccionado
- **THEN** la actividad y el disponible de su categoría disminuyen por el importe del gasto

#### Scenario: Cambio de fecha o categoría
- **WHEN** un gasto se mueve a otro mes o a otra categoría
- **THEN** el sistema recalcula la actividad y el disponible de todos los meses y categorías afectados

### Requirement: Disponible con arrastre mensual
El sistema SHALL calcular el disponible de una categoría como su disponible del mes anterior más la asignación del mes actual más la actividad del mes actual. Tanto valores positivos como negativos SHALL trasladarse al mes siguiente.

#### Scenario: Arrastre positivo
- **WHEN** una categoría termina un mes con disponible positivo
- **THEN** ese importe forma parte del disponible inicial de la categoría en el mes siguiente

#### Scenario: Arrastre negativo
- **WHEN** una categoría termina un mes con disponible negativo
- **THEN** ese déficit reduce el disponible de la categoría en el mes siguiente

### Requirement: Dinero listo para asignar
El sistema SHALL calcular el dinero listo para asignar a partir de los ingresos y saldos iniciales presupuestables acumulados, menos las asignaciones acumuladas. Las transferencias y el saldo inicial de una tarjeta SHALL NOT crear dinero listo para asignar.

#### Scenario: Registrar un ingreso
- **WHEN** se registra un ingreso en una cuenta de efectivo o banco con fecha igual o anterior al mes seleccionado
- **THEN** el dinero listo para asignar aumenta por el importe del ingreso

#### Scenario: Saldo inicial presupuestable
- **WHEN** existe una cuenta de efectivo o banco con saldo inicial distinto de cero
- **THEN** ese saldo participa una sola vez en el dinero listo para asignar

#### Scenario: Sobreasignación
- **WHEN** las asignaciones acumuladas superan los fondos presupuestables
- **THEN** el sistema permite guardar el presupuesto y muestra el dinero listo para asignar como negativo
