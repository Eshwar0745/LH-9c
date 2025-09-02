import Joi from "joi";

export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  name: Joi.string().required(),
  phone: Joi.string().required(),
  role: Joi.string().valid("customer", "provider", "admin").required(),
  businessName: Joi.string().optional(),
  experience: Joi.number().optional(),
  services: Joi.array().items(Joi.string()).optional(),
  hourlyRate: Joi.number().optional(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// ...add more schemas for each endpoint as needed...
