# Clínica Veterinaria Patitas

Aplicación web sencilla (HTML + CSS + JavaScript, sin frameworks ni dependencias) para llevar el control básico de pacientes y visitas de una clínica veterinaria de barrio. Es un prototipo académico: los datos se guardan en el `localStorage` del navegador y todos los datos iniciales son ficticios.

## Funcionalidades

1. **Registrar paciente**: nombre, especie, raza, fecha de nacimiento, sexo y **uno o varios responsables** (cada uno con nombre y teléfono). Todos los campos son obligatorios; la fecha no puede ser futura y los teléfonos deben ser válidos.
2. **Registrar visita**: se elige un paciente existente y se guarda fecha, motivo y observaciones.
3. **Consultar pacientes e historial**: lista con buscador (por mascota o responsable); al seleccionar un paciente se muestra su ficha, **todos sus responsables** y sus visitas (más recientes primero).
4. **Consultar responsables**: la tarjeta "Responsables" lista a cada responsable; al seleccionarlo se muestran **todas sus mascotas**.
5. **Consultar visitas recientes**: la tarjeta "Visitas de los últimos 30 días" muestra solo las visitas del periodo actual y permite descargarlas en CSV con mascota, responsable, fecha y motivo.

### Múltiples responsables

Una mascota puede tener varios responsables (por ejemplo, una familia). En el formulario hay una fila inicial (nombre + teléfono) con un botón **+** a la derecha: al pulsarlo aparece otra fila debajo; las filas extra tienen un botón **×** para quitarlas. Un mismo responsable no puede repetirse en la misma mascota (se compara el nombre sin distinguir mayúsculas). Un responsable se identifica por su nombre, así que escribir el mismo nombre en otra mascota lo asocia a ambas; el campo sugiere los nombres ya existentes y completa su teléfono. Los datos guardados con el formato anterior (un solo responsable) se migran automáticamente.

## Ejecutar (menos de 5 minutos)

1. Descargue o clone el repositorio.
2. Abra `index.html` con doble clic en cualquier navegador moderno.

No requiere instalación ni servidor.

Estructura:

```
index.html
css/styles.css
js/storage.js   # persistencia y datos de ejemplo
js/app.js       # lógica e interfaz
```

Para reiniciar los datos de ejemplo, borre los datos del sitio (localStorage) en el navegador.

## Verificación manual

**Registrar paciente**
1. En "Registrar paciente" pulse el botón sin llenar nada: aparece un error y los campos inválidos se marcan en rojo.
2. Complete todos los campos (p. ej. Nube, Conejo, Enano, fecha pasada, Hembra, responsable "Responsable Prueba" con 555-0199) y registre. Aparece en "Pacientes registrados" y queda seleccionado.
3. Recargue la página: el paciente sigue ahí.

**Registrar visita**
1. En "Registrar visita" elija "Coco" (sin visitas), deje campos vacíos y envíe: se muestra el error.
2. Complete fecha, motivo y observaciones y envíe: aparece el mensaje de confirmación.

**Múltiples responsables**
1. *Un responsable:* registre "Toby" con un solo responsable ("Familia Prueba Uno", 555-0201). Queda en la lista.
2. *Dos responsables:* registre "Fido" y pulse **+** para añadir una segunda fila; use "Familia Prueba Uno" y "Familia Prueba Dos". Si repite el mismo nombre en dos filas aparece un error.
3. *Mascota → responsables:* haga clic en "Fido": la ficha muestra ambos responsables (el nombre es un enlace a su detalle).
4. *Responsable → mascotas:* en la tarjeta "Responsables" haga clic en "Familia Prueba Uno": se muestran Toby y Fido (con clic en una mascota se abre su ficha).

**Consultar pacientes e historial**
1. Haga clic en "Luna": se ven su ficha y 2 visitas.
2. Haga clic en "Coco": debe mostrar la visita recién agregada.
3. Escriba "max" en el buscador: la lista se filtra.

**Visitas recientes y CSV**
1. Registre una visita con fecha de hoy o dentro de los últimos 29 días: aparece en la tarjeta "Visitas de los últimos 30 días".
2. Las visitas anteriores al periodo no aparecen en esa tarjeta.
3. Pulse "Descargar CSV": se descarga `visitas-ultimos-30-dias.csv` con una fila por responsable de cada visita reciente.