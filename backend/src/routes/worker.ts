import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { TOTAL_DECIMALS, WORKER_JWT_SECRET } from "../config";
import { workerMiddleware } from "../middlewares";
import { getNextTask } from "../db";
import { createSubmissionInput } from "../types";
import nacl from "tweetnacl";
import { Connection, Keypair, PublicKey, sendAndConfirmTransaction, SystemProgram, Transaction } from "@solana/web3.js";
import bs58 from "bs58";

const router = Router();

const TOTAL_SUBMISSIONS = 100;
const prismaClient = new PrismaClient();
const connection = new Connection(process.env.RPC_URL ?? "");

const privateKey = process.env.PRIVATE_KEY;
const parentAddress = process.env.PARENT_WALLET_ADDRESS;

router.post("/signin", async(req,res)=>{

    const {publicKey, signature} = req.body;
    const message = new TextEncoder().encode("Sign into mechanical Turks as a worker");

    const result = nacl.sign.detached.verify(
        message,
        new Uint8Array(signature.data),
        new PublicKey(publicKey).toBytes(),
    );

    if (!result) {
        return res.status(411).json({
            message: "Incorrect signature"
        })
    }
    
    const existingUser = await prismaClient.worker.findFirst({
        where:{
            address: publicKey
        }
    });

    if(existingUser){
        const token = jwt.sign({
            userId: existingUser.id
        }, WORKER_JWT_SECRET)

        res.json({
            token,
            amount: existingUser.pending_amount/TOTAL_DECIMALS
        })
    }else{
        const user = await prismaClient.worker.create({
            data:{
                address: publicKey,
                pending_amount: 0,
                locked_amount: 0
            }
        })

        const token = jwt.sign({
            userId: user.id
        },WORKER_JWT_SECRET)

        res.json({
            token,
            amount:0
        })
    }

});

router.get("/nextpost", workerMiddleware, async(req, res)=>{
    //@ts-ignore
    const userId = req.userId;

    const task = await getNextTask(Number(userId));

    if(!task){
        res.status(411).json({
            message:"no more task left for you to do"
        })
    } else{
        res.json({
            task
        })
    }
})

router.post("/submission",workerMiddleware, async(req,res)=>{
    const body = req.body;
    //@ts-ignore
    const userId = req.userId;
    const parsedData = createSubmissionInput.safeParse(body)

    if(!parsedData.success){
        return res.status(411).json({
            message:"wrong inputs"
        })
    }

    const task = await getNextTask(Number(userId))
    if(!task || task?.id !== Number(parsedData.data.taskId)){
        return res.status(411).json({
            message: "incorrect task id"
        })
    }
    const amount = (Number(task.amount)/TOTAL_SUBMISSIONS)

    const submission = await prismaClient.$transaction(async tx =>{

        const submission = await tx.submission.create({
            data:{
                option_id: Number(parsedData.data.selection),
                worker_id: userId,
                task_id: Number(parsedData.data.taskId),
                amount 
            }
        })

        await tx.worker.update({
            where:{
                id: userId,
            },
            data:{
                pending_amount:{
                    increment: Number(amount)
                }
            }
        })

        return submission;
    })

    const nextTask = await getNextTask(Number(userId));
    res.json({
        nextTask,
        amount
    })
})

router.get("/balance", workerMiddleware, async(req, res)=>{
    //@ts-ignore
    const userId:string = req.userId;

    const worker = await prismaClient.worker.findFirst({
        where:{
            id: Number(userId)
        }
    })

    res.json({
        pendingAmount:worker?.pending_amount,
        lockedAmount: worker?.locked_amount
    })
})

router.post("/payout", workerMiddleware, async(req,res)=>{
    //@ts-ignore
    const userId: string = req.userId;

    const worker = await prismaClient.worker.findFirst({
        where:{
            id: Number(userId)
        }
    })

    if(!worker){
        return res.status(411).json({
            message: "user not found"
        })
    }

    if (!parentAddress){
        console.log("no parentAddress");
        return
    }

    if (!privateKey){
        console.log("no privatekey of parent wallet");
        return
    }

    const transaction = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey: new PublicKey(parentAddress),
            toPubkey:new PublicKey(worker.address),
            lamports:1000_000_000 * worker.pending_amount / TOTAL_DECIMALS,
        })
    )

    const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));

    // TODO: There's a double spending problem here
    // The user can request the withdrawal multiple times
    // Can u figure out a way to fix it?

    let signature = "";

    try{
        signature = await sendAndConfirmTransaction(
            connection,
            transaction,
            [keypair]
        );
    }catch(e){
        return res.json({
            message: "transaction failed"
        })
    }

    //add lock to db here

    await prismaClient.$transaction(async tx=>{
        await tx.worker.update({
            where:{
                id: Number(userId)
            },
            data:{
                pending_amount:{
                    decrement: worker.pending_amount
                },
                locked_amount:{
                    increment: worker.pending_amount
                }
            }
        })

        await tx.payouts.create({
            data:{
                user_id: Number(userId),
                amount: worker.pending_amount,
                status: "Processing",
                signature: signature
            }
        })
    })

    res.json({
        message: "processing payout",
        amount: worker.pending_amount
    })
})

export default router;