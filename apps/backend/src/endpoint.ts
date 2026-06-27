import { Request, RequestHandler } from "express";

export type HttpMethod = "get" | "post" | "put" | "delete" | "patch";

export interface Endpoint {
    method: HttpMethod;
    path: string;
    handler: RequestHandler;
}

export interface EndpointError {
    success: false;
    status: number;
    error: string;
}

export type HandlerResult<T> = T | EndpointError;
export type EndpointHandler<T> = (req: Request) => HandlerResult<T> | Promise<HandlerResult<T>>;

export function createEndpoint<T>(method: HttpMethod, path: string, handler: EndpointHandler<T>): Endpoint {
    const requestHandler: RequestHandler = async (req, res, next) => {
        try {
            const result = await handler(req);
            if (isEndpointError(result)) {
                res.status(result.status).json({
                    success: false,
                    error: result.error,
                });
                return;
            }
            res.json(result);
        } catch (error) {
            next(error);
        }
    };

    return {
        method,
        path,
        handler: requestHandler,
    };
}

export function createEndpointError(status: number, error: string): EndpointError {
    return { success: false, status, error };
}

function isEndpointError(value: HandlerResult<unknown>): value is EndpointError {
    if (typeof value !== "object" || value === null) {
        return false;
    }
    const candidate = value as EndpointError;
    return candidate.success === false && typeof candidate.status === "number" && typeof candidate.error === "string";
}
