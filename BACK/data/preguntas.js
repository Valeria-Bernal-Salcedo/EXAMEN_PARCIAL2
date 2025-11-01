module.exports = [
    { 
        "id": 1,
        text: "¿Cuál es la etiqueta correcta para declarar el documento HTML5?",
        options: ["<html5>", "<!DOCTYPE html>", "<doctype html5>", "<!HTML>"],
        correct: "<!DOCTYPE html>"
    },
    {
        id: 2,
        text: "¿Cuál es el elemento semántico apropiado para el contenido principal de una página?",
        options: ["<section>", "<div>", "<main>", "<article>"],
        correct: "<main>"
    },
    {
        id: 3,
        text: "¿Qué atributo se usa para especificar la URL de destinación en un enlace?",
        options: ["src", "href", "link", "target"],
        correct: "href"
    },
    {
        id: 4,
        text: "¿Cuál es la diferencia principal entre elementos en línea (inline) y de bloque (block)?",
        options: [
            "Solo los inline pueden tener atributos.",
            "Los block ocupan toda la anchura disponible; los inline no comienzan en nueva línea.",
            "Los inline solo contienen texto; los block solo contienen otros bloques.",
            "No hay diferencia en comportamiento por defecto."
        ],
        correct: "Los block ocupan toda la anchura disponible; los inline no comienzan en nueva línea."
    },
    {
        id: 5,
        text: "¿Qué etiqueta se usa para incluir una imagen y cuál atributo es obligatorio por accesibilidad?",
        options: [
            '<img src="..." title="...">',
            '<image src="...">',
            '<img src="..." alt="...">',
            '<picture src="..." alt="...">'
        ],
        correct: '<img src="..." alt="...">'
    },
    {
        id: 6,
        text: "¿Cuál es la etiqueta recomendada para agrupar controles de formulario con una leyenda?",
        options: ["<group>", "<fieldset> y <legend>", "<formsection>", "<box>"],
        correct: "<fieldset> y <legend>"
    },
    {
        id: 7,
        text: "¿Qué atributo de <input> obliga a que el campo tenga contenido antes de enviar el formulario?",
        options: ["required", "validate", "pattern", "autofocus"],
        correct: "required"
    },
    {
        id: 8,
        text: "¿Cuál meta se usa para que el diseño sea responsivo en dispositivos móviles?",
        options: [
            '<meta name="viewport" content="width=device-width, initial-scale=1">',
            '<meta name="responsive" content="true">',
            '<meta http-equiv="X-UA-Compatible" content="IE=edge">',
            '<meta charset="utf-8">'
        ],
        correct: '<meta name="viewport" content="width=device-width, initial-scale=1">'
    },
    {
        id: 9,
        text: "¿Qué elemento se usa para incrustar un video reproducible por el navegador sin plugins?",
        options: ["<movie>", "<video>", '<embed src="video.mp4" type="video">', '<iframe src="video.mp4">'],
        correct: "<video>"
    },
    {
        id: 10,
        text: "¿Cuál es la forma correcta de incluir una hoja de estilos externa?",
        options: [
            '<script src="styles.css"></script>',
            '<link rel="stylesheet" href="styles.css">',
            '<style src="styles.css"></style>',
            '<css href="styles.css"></css>'
        ],
        correct: '<link rel="stylesheet" href="styles.css">'
    },
    {
        id: 11,
        text: "¿Qué atributo de <a> abre el enlace en una nueva pestaña?",
        options: ['open="_blank"', 'target="_new"', 'target="_blank"', 'rel="noopener"'],
        correct: 'target="_blank"'
    },
    {
        id: 12,
        text: "¿Cuál es la etiqueta semántica más apropiada para contenido independiente que podría distribuirse por separado (ej. una entrada de blog)?",
        options: ["<section>", "<div>", "<article>", "<aside>"],
        correct: "<article>"
    },
    {
        id: 13,
        text: "¿Qué atributo indica el juego de caracteres de la página (probablemente UTF-8)?",
        options: ['<meta charset="utf-8">', '<meta encoding="utf-8">', '<meta http-equiv="charset" content="utf-8">', '<charset=\"utf-8\">'],
        correct: '<meta charset="utf-8">'
    },
    {
        id: 14,
        text: "Para mejorar la accesibilidad, ¿qué atributo se usa en un <label> para asociarlo a un <input>?",
        options: [
            'for (que coincida con el id del input)',
            'id del label igual al name del input',
            'aria-label en el label',
            'No es necesario asociarlos'
        ],
        correct: 'for (que coincida con el id del input)'
    },
    {
        id: 15,
        text: "¿Qué elemento permite definir contenido alternativo o varias fuentes para imágenes responsivas?",
        options: [
            '<img srcset="..." sizes="..."> o <picture>',
            '<responsive-img>',
            '<img src-responsive="...">',
            '<source> fuera de <picture>'
        ],
        correct: '<img srcset="..." sizes="..."> o <picture>'
    },
    {
        id: 16,
        text: "¿Qué atributo en <script> evita que el script bloquee la carga del HTML y lo ejecuta de forma asíncrona?",
        options: [
            'defer o async (dependiendo del comportamiento)',
            'lazy',
            'delay',
            'background'
        ],
        correct: 'defer o async (dependiendo del comportamiento)'
    }
];
