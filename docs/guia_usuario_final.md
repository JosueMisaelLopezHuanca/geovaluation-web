# Guia rapida de usuario final

## Consulta publica

1. Abre el geovisor.
2. Busca tu predio por codigo catastral o navega el mapa.
3. En celular puedes tocar **Usar mi ubicacion** para acercarte a tu zona.
4. Selecciona el predio en el mapa.
5. Revisa el valor catastral estimado, impuesto estimado, superficie de calculo, zona tributaria y riesgo.
6. Usa el boton flotante **Consulta** para abrir u ocultar el panel y dejar mas espacio al mapa.

La consulta publica no modifica datos y no guarda avaluos. Es una vista de orientacion ciudadana basada en la informacion disponible.

## Acceso administrador

1. Toca **Acceso admin** o **Acceso**.
2. Ingresa con el usuario autorizado.
3. El administrador puede ver capas avanzadas, editar datos temporales, guardar avaluos, revisar historial y preparar reportes.

Usuario inicial de desarrollo:

```text
usuario: admin
contrasena: definida en CATASTRO_ADMIN_PASSWORD
```

La contrasena debe configurarse en el backend con `CATASTRO_ADMIN_PASSWORD` antes de una demo publica.

## Uso desde celular

1. La PC y el celular deben estar en la misma red Wi-Fi.
2. Ejecuta el backend con:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

3. En el frontend configura:

```env
VITE_API_BASE_URL=http://192.168.1.50:8000
```

4. Ejecuta:

```bash
npm run dev:host
```

5. Abre en el celular:

```text
http://192.168.1.50:5173
```

En celular el mapa es la vista principal. El panel de consulta aparece como una bandeja inferior y puede ocultarse para navegar mejor.

## Guion breve para presentacion

1. Mostrar que el sistema abre como geovisor publico.
2. Buscar o seleccionar un predio.
3. Explicar el resultado: valor catastral, impuesto estimado, superficie, zona y riesgo.
4. Usar **Usar mi ubicacion** para explicar el flujo ciudadano en celular.
5. Entrar como administrador y mostrar que aparecen capas, edicion tecnica, guardado e historial.
6. Cerrar indicando que el sistema separa consulta ciudadana de gestion tecnica institucional.
