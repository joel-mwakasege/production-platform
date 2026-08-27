import app from '../apps/api/src/app';

export default function handler(req: any, res: any) {
  return app(req, res);
}