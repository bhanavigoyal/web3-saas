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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const middlewares_1 = require("../middlewares");
const db_1 = require("../db");
const types_1 = require("../types");
const tweetnacl_1 = __importDefault(require("tweetnacl"));
const web3_js_1 = require("@solana/web3.js");
const bs58_1 = __importDefault(require("bs58"));
const router = (0, express_1.Router)();
const TOTAL_SUBMISSIONS = 100;
const prismaClient = new client_1.PrismaClient();
const connection = new web3_js_1.Connection((_a = process.env.RPC_URL) !== null && _a !== void 0 ? _a : "");
const privateKey = process.env.PRIVATE_KEY;
const parentAddress = process.env.PARENT_WALLET_ADDRESS;
router.post("/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { publicKey, signature } = req.body;
    const message = new TextEncoder().encode("Sign into mechanical Turks as a worker");
    const result = tweetnacl_1.default.sign.detached.verify(message, new Uint8Array(signature.data), new web3_js_1.PublicKey(publicKey).toBytes());
    if (!result) {
        return res.status(411).json({
            message: "Incorrect signature"
        });
    }
    const existingUser = yield prismaClient.worker.findFirst({
        where: {
            address: publicKey
        }
    });
    if (existingUser) {
        const token = jsonwebtoken_1.default.sign({
            userId: existingUser.id
        }, config_1.WORKER_JWT_SECRET);
        res.json({
            token,
            amount: existingUser.pending_amount / config_1.TOTAL_DECIMALS
        });
    }
    else {
        const user = yield prismaClient.worker.create({
            data: {
                address: publicKey,
                pending_amount: 0,
                locked_amount: 0
            }
        });
        const token = jsonwebtoken_1.default.sign({
            userId: user.id
        }, config_1.WORKER_JWT_SECRET);
        res.json({
            token,
            amount: 0
        });
    }
}));
router.get("/nextpost", middlewares_1.workerMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //@ts-ignore
    const userId = req.userId;
    const task = yield (0, db_1.getNextTask)(Number(userId));
    if (!task) {
        res.status(411).json({
            message: "no more task left for you to do"
        });
    }
    else {
        res.json({
            task
        });
    }
}));
router.post("/submission", middlewares_1.workerMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = req.body;
    //@ts-ignore
    const userId = req.userId;
    const parsedData = types_1.createSubmissionInput.safeParse(body);
    if (!parsedData.success) {
        return res.status(411).json({
            message: "wrong inputs"
        });
    }
    const task = yield (0, db_1.getNextTask)(Number(userId));
    if (!task || (task === null || task === void 0 ? void 0 : task.id) !== Number(parsedData.data.taskId)) {
        return res.status(411).json({
            message: "incorrect task id"
        });
    }
    const amount = (Number(task.amount) / TOTAL_SUBMISSIONS);
    const submission = yield prismaClient.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        const submission = yield tx.submission.create({
            data: {
                option_id: Number(parsedData.data.selection),
                worker_id: userId,
                task_id: Number(parsedData.data.taskId),
                amount
            }
        });
        yield tx.worker.update({
            where: {
                id: userId,
            },
            data: {
                pending_amount: {
                    increment: Number(amount)
                }
            }
        });
        return submission;
    }));
    const nextTask = yield (0, db_1.getNextTask)(Number(userId));
    res.json({
        nextTask,
        amount
    });
}));
router.get("/balance", middlewares_1.workerMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //@ts-ignore
    const userId = req.userId;
    const worker = yield prismaClient.worker.findFirst({
        where: {
            id: Number(userId)
        }
    });
    res.json({
        pendingAmount: worker === null || worker === void 0 ? void 0 : worker.pending_amount,
        lockedAmount: worker === null || worker === void 0 ? void 0 : worker.locked_amount
    });
}));
router.post("/payout", middlewares_1.workerMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //@ts-ignore
    const userId = req.userId;
    const worker = yield prismaClient.worker.findFirst({
        where: {
            id: Number(userId)
        }
    });
    if (!worker) {
        return res.status(411).json({
            message: "user not found"
        });
    }
    if (!parentAddress) {
        console.log("no parentAddress");
        return;
    }
    if (!privateKey) {
        console.log("no privatekey of parent wallet");
        return;
    }
    const transaction = new web3_js_1.Transaction().add(web3_js_1.SystemProgram.transfer({
        fromPubkey: new web3_js_1.PublicKey(parentAddress),
        toPubkey: new web3_js_1.PublicKey(worker.address),
        lamports: 1000000000 * worker.pending_amount / config_1.TOTAL_DECIMALS,
    }));
    const keypair = web3_js_1.Keypair.fromSecretKey(bs58_1.default.decode(privateKey));
    // TODO: There's a double spending problem here
    // The user can request the withdrawal multiple times
    // Can u figure out a way to fix it?
    let signature = "";
    try {
        signature = yield (0, web3_js_1.sendAndConfirmTransaction)(connection, transaction, [keypair]);
    }
    catch (e) {
        return res.json({
            message: "transaction failed"
        });
    }
    //add lock to db here
    yield prismaClient.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        yield tx.worker.update({
            where: {
                id: Number(userId)
            },
            data: {
                pending_amount: {
                    decrement: worker.pending_amount
                },
                locked_amount: {
                    increment: worker.pending_amount
                }
            }
        });
        yield tx.payouts.create({
            data: {
                user_id: Number(userId),
                amount: worker.pending_amount,
                status: "Processing",
                signature: signature
            }
        });
    }));
    res.json({
        message: "processing payout",
        amount: worker.pending_amount
    });
}));
exports.default = router;
