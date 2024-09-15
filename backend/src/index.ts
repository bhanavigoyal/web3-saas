import express from "express";
import userRouter from "./routes/user";
import workerRouter from "./routes/worker";
import cors from "cors";

const app = express();

app.use(express.json());
app.use(cors());

app.use("/v1/user", userRouter);
app.use("/v1/worker", workerRouter);

app.listen(5000,()=>{
    console.log("listening on port 5000")
})