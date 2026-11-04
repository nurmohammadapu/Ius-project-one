const createHttpApp = require("../httpHelper");
const router = createHttpApp.Router();

const {
  getAllDoubts,
  getDoubtDetails,
  createDoubt,
  addComment,
  toggleResolveDoubt,
  deleteDoubt,
} = require("../controllers/Doubt");

const { auth } = require("../middlewares/auth");

router.get("/getAllDoubts", auth, getAllDoubts);
router.get("/getDoubtDetails", auth, getDoubtDetails);
router.post("/createDoubt", auth, createDoubt);
router.post("/addComment", auth, addComment);
router.post("/toggleResolve", auth, toggleResolveDoubt);
router.post("/deleteDoubt", auth, deleteDoubt);

module.exports = router;

