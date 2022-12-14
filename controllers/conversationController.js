const ApiError = require("../exceptions/apiError");
const { Patient, Doctor, Conversation,User } = require("../models/models");

class ConversationController {
    async create(req, res, next) {
        try {
            const { firstId, secondId } = req.body;
            const user1 = await User.findOne({ where: { id: firstId } });
            if (!user1) {
                next(ApiError.BadRequest("No user with such firstId"));
            }
            const user2 = await User.findOne({ where: { id: secondId } });
            if (!user2) {
                next(ApiError.BadRequest("No user with such secondId"));
            }
            let conversation = await Conversation.findOne({where:{firstId,secondId}})
            if(conversation){
                next(ApiError.BadRequest("The conversation already exists"))
            }
            conversation = await Conversation.create({ firstId, secondId });
            res.json(conversation);
        } catch (error) {
            return next(error);
        }
    }
    async getAllConversations(req, res, next) {
        try {
            const { id:userId, role } = req.user;
            let conversations;
            if (role === "patient") {
                conversations = await Conversation.findAll({ where: { firstId: userId } });
            } else if (role === "doctor") {
                conversations = await Conversation.findAll({ where: { secondId: userId } });
            }
            res.json(conversations);
        } catch (error) {
            return next(error);
        }
    }
    async getOneConversation(req, res, next) {
        try {
            const {companionId}=req.params
            const { id:userId,role} = req.user;
            let conversation
            if(role=="patient"){
                conversation=await Conversation.findOne({where:{firstId:userId,secondId:companionId}})                
            }else if(role=="doctor"){
                conversation = await Conversation.findOne({ where: { firstId:companionId ,secondId:userId} });
            }
            res.json(conversation);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ConversationController();
