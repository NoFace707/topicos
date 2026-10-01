## 1. Preparación de la arquitectura

- [x] 1.1 Crear los módulos Django de usuarios y presupuesto, registrarlos en la configuración y verificar que `python manage.py check` termina sin errores.
- [x] 1.2 Configurar autenticación por sesión, CORS, CSRF y permisos autenticados por defecto, conservando públicos solo salud, registro e inicio de sesión; verificar con pruebas de configuración y solicitudes anónimas.
- [x] 1.3 Añadir en el frontend el enrutamiento y la estructura por funcionalidades, actualizar el cliente API para cookies y CSRF, y verificar que `npm run build` termina correctamente.
- [x] 1.4 Preparar la estructura de pruebas de backend y frontend necesaria para el cambio y verificar que las suites vacías o iniciales pueden ejecutarse localmente.

## 2. Autenticación y aislamiento

- [x] 2.1 Implementar registro con nombre único y contraseña mínima de 6 caracteres usando el hash de Django, y verificar casos válido, duplicado y contraseña corta con pruebas de API.
- [x] 2.2 Implementar inicio, cierre y consulta de sesión, y verificar con pruebas que una sesión válida persiste, las credenciales erróneas usan un mensaje genérico y el cierre invalida el acceso.
- [x] 2.3 Crear la pantalla de acceso y registro, el estado de sesión y las rutas protegidas, y verificar manualmente que un visitante es redirigido y un usuario autenticado puede entrar y salir.
- [x] 2.4 Añadir pruebas de autorización reutilizables y verificar que dos usuarios no pueden leer ni modificar mutuamente ningún recurso financiero por identificador.

## 3. Modelo financiero

- [x] 3.1 Implementar los modelos de cuenta, grupo, categoría, asignación mensual y transacción con importes decimales, restricciones, índices, estados archivados y propiedad, y verificar `python manage.py makemigrations --check` después de crear la migración.
- [x] 3.2 Aplicar la migración en una base limpia y verificar que `python manage.py migrate` y `python manage.py check` finalizan sin errores.
- [x] 3.3 Implementar validaciones de dominio para cuentas activas, pertenencia, categoría requerida en gastos y cuentas distintas en transferencias, y verificar cada rechazo con pruebas unitarias.
- [x] 3.4 Implementar archivo y reactivación sin pérdida histórica, incluyendo la restricción de grupos con categorías activas, y verificar el comportamiento con pruebas de modelo o API.

## 4. Cálculos presupuestarios

- [x] 4.1 Implementar el cálculo de saldo por cuenta desde saldo inicial, ingresos, gastos y ambos lados de transferencias, y verificarlo con pruebas de cada tipo de movimiento.
- [x] 4.2 Implementar el cálculo mensual de actividad por categoría y verificar gastos en diferentes fechas y la reasignación al editar mes o categoría.
- [x] 4.3 Implementar asignado y disponible acumulado con arrastre positivo y negativo, y verificar una secuencia de al menos tres meses con pruebas unitarias.
- [x] 4.4 Implementar dinero listo para asignar usando saldos iniciales presupuestables, ingresos y asignaciones acumuladas, excluyendo transferencias y saldo inicial de tarjeta, y verificar sobreasignación y valores negativos.
- [x] 4.5 Optimizar las consultas agregadas con índices, agregaciones y carga anticipada, y verificar mediante pruebas que el resultado no cambia al crecer el número de categorías.

## 5. API de cuentas y categorías

- [x] 5.1 Implementar endpoints REST para listar, crear, editar, archivar y reactivar cuentas propias, incluyendo saldo calculado, y verificar CRUD, tipos admitidos y aislamiento con pruebas de API.
- [x] 5.2 Implementar endpoints REST para grupos y categorías con creación, renombrado, movimiento, orden y archivo, y verificar las reglas de orden e historial con pruebas de API.
- [x] 5.3 Implementar endpoints de asignación mensual por categoría con actualización idempotente, y verificar valores positivos, cero, negativos y rechazo de categorías archivadas.

## 6. API de transacciones y dashboard

- [x] 6.1 Implementar endpoints de ingresos y gastos con listado, creación, edición, eliminación y filtros por cuenta, tipo y fechas, y verificar que cada operación recalcula los resultados esperados.
- [x] 6.2 Implementar transferencias atómicas como una operación canónica entre cuentas propias, y verificar que actualizan ambos saldos sin alterar categorías ni listo para asignar.
- [x] 6.3 Implementar el endpoint agregado del dashboard por mes con cuentas, saldo neto, listo para asignar y categorías agrupadas, y verificar mes actual, navegación histórica y arrastres.
- [x] 6.4 Añadir pruebas de regresión que creen, editen y eliminen movimientos en meses distintos y verificar que todos los meses posteriores mantienen resultados coherentes.

## 7. Interfaz financiera

- [x] 7.1 Sustituir la página técnica inicial por el layout autenticado con navegación a dashboard, cuentas, categorías, presupuesto y transacciones, y verificar navegación adaptable y `npm run build`.
- [x] 7.2 Implementar la vista de cuentas con creación, edición, archivo, reactivación y saldos, y verificar manualmente los tres tipos de cuenta y sus estados vacío, carga y error.
- [x] 7.3 Implementar la gestión de grupos y categorías con orden, movimiento y archivo, y verificar que el orden persiste y no se pierden datos históricos.
- [x] 7.4 Implementar el presupuesto mensual editable con columnas asignado, actividad y disponible y navegación entre meses, y verificar arrastres y alertas negativas contra respuestas reales de la API.
- [x] 7.5 Implementar formularios e historial de ingresos, gastos y transferencias con edición, eliminación y filtros, y verificar que las validaciones del servidor se presentan al usuario.
- [x] 7.6 Implementar el dashboard con saldo neto, cuentas, listo para asignar, resumen agrupado y guía inicial, y verificar los estados sin cuentas, normal y con déficit.

## 8. Verificación integral y documentación

- [x] 8.1 Ejecutar la suite completa del backend y corregir fallos hasta verificar que todas las pruebas de autenticación, aislamiento, dominio, cálculos y API pasan.
- [x] 8.2 Ejecutar las pruebas disponibles y `npm run build` del frontend, y corregir fallos hasta verificar que la aplicación compila sin errores.
- [x] 8.3 Levantar el entorno con Docker y verificar manualmente el recorrido registro -> cuenta -> categoría -> ingreso -> asignación -> gasto -> transferencia -> mes siguiente.
- [x] 8.4 Actualizar README y variables de entorno de ejemplo con arranque, CSRF/sesión, moneda única y límites del MVP, y verificar que una instalación limpia puede seguir las instrucciones sin configuración implícita.

## 9. Presupuesto y categorías unificados

- [x] 9.1 Unificar la navegación de categorías y presupuesto, conservando compatibilidad de la ruta anterior, y verificar que solo exista una entrada principal para administrar ambos conceptos.
- [x] 9.2 Rediseñar el presupuesto como una tabla jerárquica de grupos plegables y categorías anidadas, con creación y administración contextual dentro de la misma vista.
- [x] 9.3 Permitir editar y guardar el importe asignado directamente en cada fila de categoría, manteniendo actividad y disponible como cálculos de solo lectura y actualizando el resumen mensual.
- [x] 9.4 Añadir pruebas frontend de la lógica incorporada, ejecutar pruebas y build, y verificar visualmente los estados vacío, normal, guardado y error de la experiencia unificada.

## 10. Orden automático de grupos y categorías

- [x] 10.1 Asignar desde la API la siguiente posición al crear grupos o categorías sin orden explícito, conservarla al editar y enviar al final las categorías movidas, con pruebas de regresión.
- [x] 10.2 Ocultar el campo de orden en los formularios unificados, dejar de enviarlo desde el frontend y verificar pruebas, build y formularios en ejecución.

## 11. Importe sugerido al registrar gastos

- [x] 11.1 Añadir una función frontend probada que encuentre el disponible de una categoría en el resumen mensual y solo sugiera importes positivos.
- [x] 11.2 Precargar el importe editable al seleccionar una categoría durante la creación de un gasto, conservar importes al editar y verificar pruebas, build e interacción real.

## 12. Contraparte, detalles y hora de movimientos

- [x] 12.1 Añadir contraparte y hora al modelo y API de transacciones, crear una migración compatible con datos existentes y cubrir creación, edición y serialización con pruebas de Django.
- [x] 12.2 Ampliar el formulario e historial de movimientos con contraparte dinámica, detalles y hora editables, y verificar pruebas, build e interacción real.

## 13. Operaciones avanzadas de sobres e ingresos

- [x] 13.1 Implementar la API atómica de movimiento entre sobres y los cálculos de ingresos categorizados, incluyendo validaciones, aislamiento y pruebas de regresión contable.
- [x] 13.2 Añadir expresiones seguras de suma/resta, el diálogo de movimiento desde Disponible y la categoría opcional de ingresos en el frontend, con pruebas unitarias de la evaluación.
- [x] 13.3 Ejecutar pruebas completas de backend y frontend, build, comprobaciones Django y validación estricta de OpenSpec, corrigiendo cualquier regresión.
