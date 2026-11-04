const createHttpApp = require("../httpHelper");
const router = createHttpApp.Router();

const { getLectureNote, saveLectureNote } = require("../controllers/LectureNote");
const { auth } = require("../middlewares/auth");

router.get("/getNote", auth, getLectureNote);
router.post("/saveNote", auth, saveLectureNote);

module.exports = router;

