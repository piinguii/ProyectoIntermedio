const handleHttpError = (res, message = 'Error inesperado', code = 500) => {
    res.status(code).json({
      success: false,
      error: message
    });
  };
  
  module.exports = { handleHttpError };
  