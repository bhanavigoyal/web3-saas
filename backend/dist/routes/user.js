"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const client_s3_1 = require("@aws-sdk/client-s3");
const middlewares_1 = require("../middlewares");
const s3_presigned_post_1 = require("@aws-sdk/s3-presigned-post");
const types_1 = require("../types");
const tweetnacl_1 = __importDefault(require("tweetnacl"));
const web3_js_1 = require("@solana/web3.js");
const connection = new web3_js_1.Connection((_a = process.env.RPC_URL) !== null && _a !== void 0 ? _a : "");
const PARENT_WALLET_ADDRESS = process.env.PARENT_WALLET_ADDRESS;
const s3Client = new client_s3_1.S3Client({
    credentials: {
        accessKeyId: (_b = process.env.AWS_ACCESS_KEY_ID) !== null && _b !== void 0 ? _b : "",
        secretAccessKey: (_c = process.env.AWS_SECRET_ACCESS_KEY) !== null && _c !== void 0 ? _c : ""
    },
    region: "eu-north-1"
});
const router = (0, express_1.Router)();
const prismaClient = new client_1.PrismaClient();
router.post("/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { publicKey, signature } = req.body;
        const message = new TextEncoder().encode("Sign into mechanical Turks");
        const reconstructedSignature = new Uint8Array(signature.data);
        const result = tweetnacl_1.default.sign.detached.verify(message, reconstructedSignature, new web3_js_1.PublicKey(publicKey).toBytes());
        if (!result) {
            return res.status(411).json({
                message: "Incorrect Signature"
            });
        }
        const existingUser = yield prismaClient.user.findFirst({
            where: {
                address: publicKey
            }
        });
        if (existingUser) {
            const token = jsonwebtoken_1.default.sign({
                userId: existingUser.id
            }, config_1.JWT_SECRET);
            res.json({
                token
            });
        }
        else {
            const user = yield prismaClient.user.create({
                data: {
                    address: publicKey
                }
            });
            const token = jsonwebtoken_1.default.sign({
                userId: user.id
            }, config_1.JWT_SECRET);
            res.json({
                token
            });
        }
    }
    catch (error) {
        console.error("Error in /signin route:", error);
        res.status(500).json({
            message: "Internal Server Error",
        });
    }
}));
router.get("/generatepresignedURL", middlewares_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //@ts-ignore
    const userId = req.userId;
    const { url, fields } = yield (0, s3_presigned_post_1.createPresignedPost)(s3Client, {
        Bucket: "decentralizedweb-saas",
        Key: `thumbnails/${userId}/${Math.random()}/image.jpg`,
        Conditions: [
            ['content-length-range', 0, 5 * 1024 * 1024] //5 MB max
        ],
        Fields: {
            success_action_status: '201',
            'Content-type': 'image/png'
        },
        Expires: 3600
    });
    res.json({
        preSignedURL: url,
        fields
    });
}));
router.post("/task", middlewares_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    //@ts-ignore
    const userId = req.userId;
    const body = req.body;
    const parsedData = types_1.createTaskInput.safeParse(body);
    const user = yield prismaClient.user.findFirst({
        where: {
            id: userId
        }
    });
    if (!user) {
        return res.status(401).json({
            message: "no user found"
        });
    }
    if (!parsedData.success) {
        return res.status(402).json({
            message: "wrong inputs"
        });
    }
    const transaction = yield connection.getTransaction(parsedData.data.signature, {
        maxSupportedTransactionVersion: 1,
        commitment: "confirmed"
    });
    // const transaction = await connection.getSignatureStatus(parsedData.data.signature, {
    //     searchTransactionHistory: true,
    // });
    if (((_b = (_a = transaction === null || transaction === void 0 ? void 0 : transaction.meta) === null || _a === void 0 ? void 0 : _a.postBalances[1]) !== null && _b !== void 0 ? _b : 0) - ((_d = (_c = transaction === null || transaction === void 0 ? void 0 : transaction.meta) === null || _c === void 0 ? void 0 : _c.preBalances[1]) !== null && _d !== void 0 ? _d : 0) !== 100000000) {
        return res.status(403).json({
            message: "transaction signature amount incorrect"
        });
    }
    if (((_e = transaction === null || transaction === void 0 ? void 0 : transaction.transaction.message.getAccountKeys().get(1)) === null || _e === void 0 ? void 0 : _e.toString()) !== PARENT_WALLET_ADDRESS) {
        return res.status(404).json({
            message: "transaction sent to wrong address"
        });
    }
    // was this money paid by this user address or a different address?
    // const transaction = Transaction.from(parseData.data.signature);
    let response = yield prismaClient.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield tx.task.create({
            data: {
                title: parsedData.data.title,
                amount: 1 * config_1.TOTAL_DECIMALS,
                //todo: signature should be unique in the table
                payment_signature: parsedData.data.signature,
                user_id: userId
            }
        });
        yield tx.option.createMany({
            data: parsedData.data.options.map(x => ({
                image_url: x.imageUrl,
                task_id: response.id
            }))
        });
        return response;
    }));
    res.status(200).json({
        id: response.id
    });
}));
router.get("/task/:taskId", middlewares_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //@ts-ignore
    const taskId = req.params.taskId;
    //@ts-ignore
    const userId = req.userId;
    const taskDetails = yield prismaClient.task.findFirst({
        where: {
            user_id: Number(userId),
            id: Number(taskId)
        },
        include: {
            options: true
        }
    });
    if (!taskDetails) {
        return res.status(411).json({
            message: "you don't have access to this task"
        });
    }
    const responses = yield prismaClient.submission.findMany({
        where: {
            task_id: Number(taskId)
        },
        include: {
            option: true
        }
    });
    const result = {};
    taskDetails.options.forEach(option => {
        result[option.id] = {
            count: 0,
            option: {
                imageUrl: option.image_url
            }
        };
    });
    responses.forEach(response => {
        result[response.option_id].count++;
    });
    res.status(200).json({
        result,
        taskDetails
    });
}));
exports.default = router;
