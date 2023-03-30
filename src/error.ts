import {Request, Response, NextFunction} from 'express';

// 通用异常类型

export class HttpException extends Error {
    public message: string;
    public errorCode: number;
    public code: number;
    public data: any;

    constructor(
        data = {},
        msg = '服务器异常, 请联系管理员',
        errorCode = 10000,
        code = 400,
    ) {
        super();
        this.message = msg;
        this.errorCode = errorCode;
        this.code = code;
        this.data = data;
    }
}

export class Success extends HttpException {
    public data;
    public responseType;
    public session;

    constructor(
        data?: unknown,
        msg = 'ok',
        code = 200,
        errorCode = 0,
        responseType?: string,
        session?: string,
    ) {
        super();
        this.code = code;
        this.message = msg;
        this.errorCode = errorCode || 0;
        this.data = data;
        this.responseType = responseType;
        this.session = session;
    }
}

export class ParameterException extends HttpException {
    constructor(msg?: string, errorCode?: number) {
        super();
        this.code = 422;
        this.message = msg || '参数错误';
        this.errorCode = errorCode || 10000;
    }
}

export class ServerError extends HttpException {
    constructor(msg?: unknown, errorCode?: number) {
        super();
        this.code = 500;
        this.message = msg?.toString() || '服务器异常, 请联系管理员';
        this.errorCode = errorCode || 10000;
    }
}


export const defaultErrorHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    res.status(err.code || 500).send(err);
}
