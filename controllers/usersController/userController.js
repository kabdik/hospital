const { Patient, Doctor, Admin, User } = require("../../models/models");
const uuid = require("uuid");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const ApiError = require("../../exceptions/apiError");
const mailService = require("../../service/mailService");
const sequelize = require("../../db");
const generateJWT = (id, email, role) => {
    return jwt.sign({ id, email, role }, process.env.SECRET_KEY, { expiresIn: "24h" });
};

class UserController {
    async doctorRegistration(req, res, next) {
        try {
            const {
                iin,
                email,
                date_of_birth,
                government_id,
                name,
                surname,
                middle_name,
                contact_number,
                experience_in_year,
                category,
                degree,
                rating,
                address,
                departmentId,
            } = req.body;
            console.log(req.body);
            console.log();
            const candidate = await Doctor.findOne({ where: { email } });

            if (candidate) {
                return next(ApiError.BadRequest("User already exists"));
            }
            const { photo } = req.files;
            let fileName = uuid.v4() + ".jpg";
            photo.mv(path.resolve(__dirname, "..", "..", "static", fileName));

            const result = await sequelize.transaction(async (transaction) => {
                const user = await User.create({ email, role: "doctor" }, { transaction });
                const randomPassword = Math.random().toString(36).slice(-8);
                console.log(randomPassword);
                const hashPassword = await bcrypt.hash(randomPassword, 5);
                const doctor = await Doctor.create(
                    {
                        iin,
                        email,
                        date_of_birth,
                        government_id,
                        name,
                        surname,
                        middle_name,
                        contact_number,
                        experience_in_year,
                        category,
                        degree,
                        rating,
                        address,
                        password: hashPassword,
                        photo: fileName,
                        departmentId,
                        userId: user.id,
                    },
                    { transaction }
                );
                await mailService.sendPasswordMail(email, randomPassword);

                return doctor;
            });
            return res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async patientRegistration(req, res, next) {
        try {
            const {
                iin,
                email,
                date_of_birth,
                government_id,
                name,
                surname,
                middle_name,
                blood_group,
                emergency_contact_number,
                contact_number,
                address,
                marital_status,
            } = req.body;
            const candidate = await Patient.findOne({ where: { email } });
            if (candidate) {
                return next(ApiError.BadRequest("User already exists"));
            }

            const result = await sequelize.transaction(async (transaction) => {
                const user = await User.create({ email, role: "patient" }, { transaction });
                const randomPassword = Math.random().toString(36).slice(-8);
                console.log(randomPassword);
                const hashPassword = await bcrypt.hash(randomPassword, 5);
                const patient = await Patient.create(
                    {
                        iin,
                        email,
                        date_of_birth,
                        government_id,
                        name,
                        surname,
                        middle_name,
                        blood_group,
                        emergency_contact_number,
                        contact_number,
                        address,
                        marital_status,
                        password: hashPassword,
                        userId: user.id,
                    },
                    { transaction }
                );
                await mailService.sendPasswordMail(email, randomPassword);
                return patient;
            });
            return res.json(result);
        } catch (error) {
            next(error);
        }
    }

    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            let { role } = req.body;
            var user;
            console.log(role);
            if (role == "patient") {
                user = await Patient.findOne({ where: { email } });
            } else if (role == "doctor") {
                user = await Doctor.findOne({ where: { email } });
            } else if (role == "admin") {
                user = await Admin.findOne({ where: { email } });
            }
            if (!user) {
                return next(ApiError.BadRequest("No user with this email"));
            }

            const comparePassword = await bcrypt.compare(password, user.password);
            if (!comparePassword) {
                return next(ApiError.BadRequest("Wrong Password"));
            }
            console.log("kek");
            user = await User.findOne({ where: { email, role } });
            const token = generateJWT(user.id, email, role);
            return res.json({ token });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new UserController();
