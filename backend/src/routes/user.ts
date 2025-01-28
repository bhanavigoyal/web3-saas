import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET, TOTAL_DECIMALS } from "../config";
import { S3Client } from "@aws-sdk/client-s3";
import { authMiddleware } from "../middlewares";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { createTaskInput } from "../types";
import nacl from "tweetnacl";
import { Connection, PublicKey } from "@solana/web3.js";


const connection = new Connection(process.env.RPC_URL ?? "");

const PARENT_WALLET_ADDRESS = process.env.PARENT_WALLET_ADDRESS;

const s3Client = new S3Client({
    credentials:{
        accessKeyId:process.env.AWS_ACCESS_KEY_ID?? "",
        secretAccessKey:process.env.AWS_SECRET_ACCESS_KEY?? ""
    },
    region: "eu-north-1"
});

const router = Router();

const prismaClient = new PrismaClient();

router.post("/signin", async(req,res)=>{
    try{

        const {publicKey, signature} = req.body;
        const message = new TextEncoder().encode("Sign into mechanical Turks");
        const reconstructedSignature = new Uint8Array(signature.data)
    
        const result = nacl.sign.detached.verify(
            message,
            reconstructedSignature,
            new PublicKey(publicKey).toBytes()
        );
        if(!result){
            return res.status(411).json({
                message: "Incorrect Signature"
            });
        }
        
        const existingUser = await prismaClient.user.findFirst({
            where:{
                address: publicKey
            }
        });
        if(existingUser){
            const token = jwt.sign({
                userId: existingUser.id
            }, JWT_SECRET)
    
            res.json({
                token
            })
        }else{
            const user = await prismaClient.user.create({
                data:{
                    address: publicKey
                }
            })
    
            const token = jwt.sign({
                userId: user.id
            },JWT_SECRET)
    
            res.json({
                token
            })
        }
    }catch(error){
        console.error("Error in /signin route:", error);
    res.status(500).json({
      message: "Internal Server Error",
    });
    }

});

router.get("/generatepresignedURL",authMiddleware, async(req,res)=>{
    //@ts-ignore
    const userId = req.userId;

    const {url, fields} = await createPresignedPost(s3Client,{
        Bucket: "decentralizedweb-saas",
        Key:`thumbnails/${userId}/${Math.random()}/image.jpg`,
        Conditions: [
            ['content-length-range', 0, 5* 1024 * 1024] //5 MB max
        ],
        Fields:{
            success_action_status: '201',
            'Content-type': 'image/png'
        },
        Expires: 3600
    })

    res.json({
        preSignedURL: url,
        fields
    })
});

router.post("/task", authMiddleware, async(req, res)=>{
    //@ts-ignore
    const userId = req.userId
    const body = req.body;

    const parsedData = createTaskInput.safeParse(body);

    const user = await prismaClient.user.findFirst({
        where:{
            id:userId
        }
    })

    if(!user){
        return res.status(401).json({
            message:"no user found"
        })
    }

    if(!parsedData.success){
        return res.status(402).json({
            message: "wrong inputs"
        })
    }

    const transaction = await connection.getTransaction(parsedData.data.signature,{
        maxSupportedTransactionVersion:1,
        commitment: "confirmed"
    });

    // const transaction = await connection.getSignatureStatus(parsedData.data.signature, {
    //     searchTransactionHistory: true,
    // });

    if((transaction?.meta?.postBalances[1]??0)-(transaction?.meta?.preBalances[1]??0)!==100000000){
        return res.status(403).json({
            message: "transaction signature amount incorrect"
        })
    }

    if(transaction?.transaction.message.getAccountKeys().get(1)?.toString() !== PARENT_WALLET_ADDRESS){
        return res.status(404).json({
            message: "transaction sent to wrong address"
        })
    }

    // was this money paid by this user address or a different address?

    // const transaction = Transaction.from(parseData.data.signature);

    let response = await prismaClient.$transaction(async tx=>{
        const response = await tx.task.create({
            data:{
                title: parsedData.data.title,
                amount: 1 * TOTAL_DECIMALS,
                //todo: signature should be unique in the table
                payment_signature: parsedData.data.signature,
                user_id: userId
            }
        })

        await tx.option.createMany({
            data: parsedData.data.options.map(x=>({
                image_url: x.imageUrl,
                task_id: response.id
            }))
        })

        return response;
    })

    res.status(200).json({
        id: response.id
    })
})

router.get("/task/:taskId",authMiddleware, async(req,res)=>{
    //@ts-ignore
    const taskId: string = req.params.taskId;
    //@ts-ignore
    const userId: string = req.userId;

    const taskDetails = await prismaClient.task.findFirst({
        where:{
            user_id: Number(userId),
            id: Number(taskId)
        },
        include:{
            options: true
        }
    })


    if(!taskDetails){
        return res.status(411).json({
            message: "you don't have access to this task"
        })
    }

    const responses = await prismaClient.submission.findMany({
        where:{
            task_id:Number(taskId)
        },
        include:{
            option: true
        }
    })

    const result : Record<string,{
        count: number,
        option:{
            imageUrl: string
        }
    }> ={};
    
    taskDetails.options.forEach(option =>{
        result[option.id] = {
            count: 0,
            option: {
                imageUrl: option.image_url
            }
        }
    })

    responses.forEach(response=>{
        result[response.option_id].count ++;
    })

    res.status(200).json({
        result,
        taskDetails
    })
})

export default router;