const createHttpApp = require("../httpHelper");
const router = createHttpApp.Router();
const { contactUsController } = require("../controllers/ContactUs")

router.post("/contact", contactUsController)

module.exports = router