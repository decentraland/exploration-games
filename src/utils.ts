import Joi from 'joi'

export const uuidSchema = Joi.string().uuid()
