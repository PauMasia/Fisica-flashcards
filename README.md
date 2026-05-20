# PAU Física Quiz

Proyecto separado en:

- index.html
- styles.css
- app.js
- data.json

## Abrir

Como usa `data.json`, abre la carpeta con Live Server de VS Code o con:

```bash
python -m http.server 8000
```

Luego entra en:

```text
http://localhost:8000
```

## Cambios importantes

- Recupera la versión completa con quiz, flashcards, modo infinito y repaso completo.
- Añade tamaño de interfaz: pequeño, medio y grande.
- Guarda el tamaño elegido en localStorage.
- Al empezar, el menú de opciones se pliega automáticamente.
- Se puede volver a desplegar con “Mostrar opciones”.
- En móvil el modo pequeño reduce tamaños y prioriza que la pregunta/respuestas entren mejor en pantalla.
- El popup de solución sigue apareciendo al responder.
- Las preguntas se han revisado para evitar spoilers:
  - Las preguntas de unidades no muestran la variable resultado.
  - Las preguntas de variables no ponen respuestas con símbolo + significado, solo significados.
  - Las constantes preguntan valor, símbolo o qué representan.
  - Se elimina la pregunta absurda de “dónde aparece qₑ”.
