import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import walletRouter from "./wallet";
import roomsRouter from "./rooms";
import matchmakingRouter from "./matchmaking";
import depositsRouter from "./deposits";
import withdrawalsRouter from "./withdrawals";
import referralsRouter from "./referrals";
import notificationsRouter from "./notifications";
import adminRouter from "./admin";
import settingsRouter from "./settings";
import gameRouter from "./game";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(walletRouter);
router.use(roomsRouter);
router.use(matchmakingRouter);
router.use(depositsRouter);
router.use(withdrawalsRouter);
router.use(referralsRouter);
router.use(notificationsRouter);
router.use(adminRouter);
router.use(settingsRouter);
router.use(gameRouter);

export default router;
