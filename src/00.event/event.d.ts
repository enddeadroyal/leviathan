export interface Request<T = string> {
    data: T,
}

export interface Response<T = string> {
    status: string,
    err?: Error,
    data?: T,
}