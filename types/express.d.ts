import { tokenPayload } from '../src/Utils/tokenUtils.ts'; 

declare global {
  namespace Express {
    interface Request {
      interviewer?: tokenPayload;
    }
  }
}

export {}