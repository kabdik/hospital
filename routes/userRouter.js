const Router=require('express')
const doctorController = require('../controllers/usersController/doctorController')
const patientController = require('../controllers/usersController/patientController')
const router=Router()
const userController=require('../controllers/usersController/userController')
router.post("/login",userController.login)
router.get('/doctors',doctorController.getAll)
router.get('/patients',patientController.getAll)
router.get('/doctor/:id',doctorController.getDoctor)
module.exports=router