import { CorsOptions } from "cors";
import { CORSError } from "../Utils/ErrorClass.js";

// List of allowed origins for CORS
const allowedOrigins : string[] = [
    'http://localhost:5713',
]

/*
CORS configuration options to control which origins are allowed to access the resources.
- origin: A function that checks if the request's origin is in the allowedOrigins list. If it is, the request is allowed; otherwise, an error is returned.
- methods: Specifies the allowed HTTP methods for CORS requests.
- credentials: Indicates whether or not the response to the request can be exposed when the credentials flag is true. When used as part of a response to a preflight request, it indicates that the actual request can include user credentials.    

Dependencies:
- cors : For handling CORS in Express applications
- Custom CORSError class for handling CORS related errors
*/
export const corsOptions : CorsOptions = {
    origin: (origin, callback) => {
        if(origin && allowedOrigins.includes(origin)){
            callback(null, true);
        } else {
            callback(new CORSError());
        }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', 
    credentials: true, 
}