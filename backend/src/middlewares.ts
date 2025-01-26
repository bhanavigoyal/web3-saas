import jwt from "jsonwebtoken"
import { NextFunction, Request, Response } from "express";
import { JWT_SECRET, WORKER_JWT_SECRET } from "./config";

export function authMiddleware(req: Request, res: Response, next: NextFunction){
    const authHeader = req.headers["authorization"] ?? "";

        // const token = authHeader.split(" ")[1];
        const token = authHeader;

        try{
            const decoded = jwt.verify(token, JWT_SECRET)
            //@ts-ignore
            if(decoded.userId){
                //@ts-ignore
                req.userId = decoded.userId
                return next();
            }else{
                return res.status(403).json({
                    message: "You are not logged in"
                })
            }
        }catch(e){
            return res.status(403).json({
                message: "You are not logged in"
            })
        }

}

export function workerMiddleware(req: Request, res: Response, next: NextFunction){
    const authHeader = req.headers["authorization"] ?? "";

    try{
        const decoded = jwt.verify(authHeader, WORKER_JWT_SECRET)
        //@ts-ignore
        if(decoded.userId){
            //@ts-ignore
            req.userId = decoded.userId
            return next();
        }else{
            return res.status(403).json({
                message: "You are not logged in"
            })
        }
    }catch(e){
        return res.status(403).json({
            message: "You are not logged in"
        })
    }
}