## Purpose

Proporcionar acceso básico y seguro a la aplicación y garantizar que cada usuario solo pueda consultar o modificar sus propios datos financieros.

## ADDED Requirements

### Requirement: Registro básico de usuario
El sistema SHALL permitir crear una cuenta con un nombre de usuario único y una contraseña de al menos 6 caracteres, sin exigir otras reglas de complejidad.

#### Scenario: Registro válido
- **WHEN** una persona envía un nombre de usuario disponible y una contraseña de 6 o más caracteres
- **THEN** el sistema crea la cuenta y permite iniciar una sesión autenticada

#### Scenario: Contraseña demasiado corta
- **WHEN** una persona intenta registrarse con una contraseña de menos de 6 caracteres
- **THEN** el sistema rechaza el registro e informa el requisito mínimo

#### Scenario: Nombre de usuario duplicado
- **WHEN** una persona intenta registrarse con un nombre de usuario ya utilizado
- **THEN** el sistema rechaza el registro sin modificar la cuenta existente

### Requirement: Inicio y cierre de sesión
El sistema SHALL permitir iniciar sesión con credenciales válidas, mantener la sesión durante la navegación y cerrarla explícitamente.

#### Scenario: Inicio de sesión válido
- **WHEN** un usuario presenta su nombre y contraseña correctos
- **THEN** el sistema establece una sesión autenticada y permite acceder a las funciones financieras

#### Scenario: Credenciales inválidas
- **WHEN** una persona presenta un nombre o contraseña incorrectos
- **THEN** el sistema rechaza el acceso con un mensaje genérico que no revela cuál dato falló

#### Scenario: Cierre de sesión
- **WHEN** un usuario autenticado solicita cerrar sesión
- **THEN** el sistema invalida su sesión y deja de permitir acceso a recursos protegidos

### Requirement: Aislamiento de datos por usuario
El sistema MUST exigir autenticación para los recursos financieros y MUST limitar cada lectura y modificación a los datos pertenecientes al usuario autenticado.

#### Scenario: Acceso sin autenticación
- **WHEN** una persona no autenticada solicita un recurso financiero
- **THEN** el sistema rechaza la solicitud sin exponer datos

#### Scenario: Acceso a un recurso ajeno
- **WHEN** un usuario autenticado intenta consultar o modificar un identificador perteneciente a otro usuario
- **THEN** el sistema responde como recurso no disponible y no revela su contenido ni su propietario

