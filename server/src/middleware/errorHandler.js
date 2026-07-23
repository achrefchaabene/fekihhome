export function errorHandler(error, _request, response, _next) {
  console.error(error);
  response.status(error.status || 500).json({
    message: error.message || "Erreur serveur."
  });
}
