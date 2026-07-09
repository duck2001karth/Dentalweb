

// Error genérico del cual heredan los demás
export class AppError extends Error {
  public statusCode: number;
  
  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "No autenticado. Por favor, inicia sesión.") {
    super(message, 401);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = "Acceso denegado. No tienes permisos de administrador.") {
    super(message, 403);
    this.name = "AuthorizationError";
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "El recurso solicitado no fue encontrado.") {
    super(message, 404);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string = "Datos de entrada inválidos o incompletos.") {
    super(message, 400);
    this.name = "ValidationError";
  }
}