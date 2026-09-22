## Purpose

Organizar el presupuesto del usuario mediante categorías de gasto agrupadas, conservando su historial cuando dejan de utilizarse.

## ADDED Requirements

### Requirement: Gestión de grupos de categorías
El sistema SHALL permitir crear, renombrar y ordenar grupos de categorías pertenecientes al usuario autenticado.

#### Scenario: Crear un grupo
- **WHEN** un usuario registra un nombre válido para un nuevo grupo
- **THEN** el sistema crea el grupo al final del orden visible sin pedir al usuario un número de posición

#### Scenario: Reordenar grupos
- **WHEN** un usuario cambia la posición de sus grupos
- **THEN** el sistema conserva y utiliza el nuevo orden en las vistas posteriores

### Requirement: Gestión de categorías
El sistema SHALL permitir crear, renombrar, mover y ordenar categorías dentro de los grupos propios del usuario.

#### Scenario: Crear una categoría
- **WHEN** un usuario crea una categoría dentro de uno de sus grupos
- **THEN** el sistema la añade al final de ese grupo sin pedir al usuario un número de posición y la deja disponible para asignaciones y gastos

#### Scenario: Mover una categoría
- **WHEN** un usuario mueve una categoría propia a otro grupo propio
- **THEN** el sistema conserva sus asignaciones y actividad histórica y muestra la categoría al final del nuevo grupo

### Requirement: Organización contextual en el presupuesto
El sistema SHALL presentar grupos y categorías en la misma vista del presupuesto, mostrando cada categoría anidada visualmente bajo su grupo y permitiendo crear grupos o añadir categorías sin abandonar esa vista.

#### Scenario: Crear una categoría desde un grupo
- **WHEN** un usuario solicita añadir una categoría desde la fila de un grupo
- **THEN** el sistema crea la categoría asociada a ese grupo y la muestra inmediatamente debajo de él

#### Scenario: Consultar la jerarquía
- **WHEN** un usuario abre el presupuesto
- **THEN** el sistema muestra filas de grupo distinguibles y sus categorías anidadas, con la posibilidad de plegar o desplegar cada grupo

### Requirement: Archivo de categorías y grupos
El sistema SHALL permitir archivar categorías y grupos sin eliminar sus asignaciones ni transacciones históricas.

#### Scenario: Archivar una categoría
- **WHEN** un usuario archiva una categoría
- **THEN** el sistema impide nuevas asignaciones y gastos en ella, pero mantiene sus datos en meses anteriores

#### Scenario: Archivar un grupo con categorías activas
- **WHEN** un usuario intenta archivar un grupo que contiene categorías activas
- **THEN** el sistema exige archivar o mover primero esas categorías y no pierde información
