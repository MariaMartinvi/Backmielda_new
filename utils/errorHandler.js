// Función para manejar errores comunes
const handleError = (error, res) => {
  console.error('Error:', error);

  // Determinar el tipo de error y el código de estado apropiado
  let statusCode = 500;
  let errorMessage = 'Error interno del servidor';

  if (error.name === 'ValidationError') {
    statusCode = 400;
    errorMessage = 'Error de validación: ' + error.message;
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401;
    errorMessage = 'No autorizado';
  } else if (error.name === 'NotFoundError') {
    statusCode = 404;
    errorMessage = 'Recurso no encontrado';
  } else if (error.name === 'StripeError') {
    statusCode = 400;
    errorMessage = 'Error de Stripe: ' + error.message;
  }

  // Enviar respuesta de error
  return res.status(statusCode).json({
    success: false,
    error: errorMessage,
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
};

module.exports = {
  handleError
}; 