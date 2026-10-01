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

#### Scenario: Calcular una asignación en la fila
- **WHEN** un usuario introduce una expresión válida formada por importes, suma y resta en la celda asignado
- **THEN** el sistema evalúa la expresión con precisión de dos decimales y guarda su resultado como asignación absoluta

#### Scenario: Rechazar una expresión inválida
- **WHEN** la celda asignado contiene texto, operadores no admitidos o una expresión incompleta
- **THEN** el sistema no cambia la asignación y muestra el error junto a la categoría

### Requirement: Movimiento de fondos entre sobres
El sistema SHALL permitir mover un importe positivo entre dos categorías activas distintas del mismo usuario y mes mediante una operación atómica. El movimiento SHALL restar el importe de la asignación mensual del origen y sumarlo a la asignación mensual del destino, sin modificar la actividad ni el dinero listo para asignar.

#### Scenario: Mover fondos desde el disponible
- **WHEN** un usuario pulsa el disponible de una categoría y confirma un destino e importe válidos
- **THEN** el sistema actualiza ambos sobres como una sola operación y presenta sus nuevos importes

#### Scenario: Permitir un origen negativo
- **WHEN** el importe movido supera el disponible del sobre origen
- **THEN** el sistema completa el movimiento y conserva el disponible negativo resultante

#### Scenario: Rechazar un movimiento inválido
- **WHEN** el importe no es positivo, los sobres coinciden, están archivados o no pertenecen al usuario
- **THEN** el sistema rechaza toda la operación sin cambiar ninguna asignación

### Requirement: Actividad mensual de categoría
El sistema SHALL calcular la actividad de una categoría para un mes a partir de los gastos e ingresos categorizados fechados en ese mes, representando los gastos como actividad negativa y los ingresos como actividad positiva.

#### Scenario: Gasto categorizado
- **WHEN** se registra un gasto fechado en el mes seleccionado
- **THEN** la actividad y el disponible de su categoría disminuyen por el importe del gasto

#### Scenario: Cambio de fecha o categoría
- **WHEN** un gasto o ingreso categorizado se mueve a otro mes o a otra categoría
- **THEN** el sistema recalcula la actividad y el disponible de todos los meses y categorías afectados

#### Scenario: Ingreso dirigido a un sobre
- **WHEN** se registra un ingreso con una categoría activa
- **THEN** la actividad y el disponible de esa categoría aumentan por el importe del ingreso

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
- **WHEN** se registra un ingreso sin categoría en una cuenta de efectivo o banco con fecha igual o anterior al mes seleccionado
- **THEN** el dinero listo para asignar aumenta por el importe del ingreso

#### Scenario: Ingreso categorizado
- **WHEN** se registra un ingreso dirigido a una categoría
- **THEN** el ingreso no aumenta el dinero listo para asignar porque incrementa directamente el disponible del sobre

#### Scenario: Saldo inicial presupuestable
- **WHEN** existe una cuenta de efectivo o banco con saldo inicial distinto de cero
- **THEN** ese saldo participa una sola vez en el dinero listo para asignar

#### Scenario: Sobreasignación
- **WHEN** las asignaciones acumuladas superan los fondos presupuestables
- **THEN** el sistema permite guardar el presupuesto y muestra el dinero listo para asignar como negativo
