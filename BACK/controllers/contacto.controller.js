const mensajes = []; // arreglo para guardar los mensajes recibidos

const enviarMensaje = (req, res) => {
  const { nombre, correo, mensaje } = req.body;

  if (!nombre || !correo || !mensaje) {
    return res.status(400).json({ message: 'Faltan datos en el formulario.' });
  }

  const nuevoMensaje = {
    nombre,
    correo,
    mensaje,
    fecha: new Date().toLocaleString()
  };

  mensajes.push(nuevoMensaje);

  console.log('Nuevo mensaje de contacto recibido:');
  console.log(mensajes); // mostrar el arreglo completo

  res.status(200).json({ message: 'Mensaje recibido correctamente.' });
}

module.exports = {enviarMensaje} ;