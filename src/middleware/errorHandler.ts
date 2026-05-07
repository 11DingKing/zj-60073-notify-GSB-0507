import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: AppError | Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  let error = err as AppError;

  if (err instanceof Error && !(err instanceof AppError)) {
    error = new AppError(err.message, 500);
  }

  const isDev = process.env.NODE_ENV === 'development';

  res.status(error.statusCode || 500).json({
    status: error.status || 'error',
    message: error.message,
    ...(isDev && { stack: error.stack }),
  });
};

export const notFoundHandler = (
  _req: Request,
  _res: Response,
  next: NextFunction
) => {
  next(new AppError('找不到请求的资源', 404));
};
