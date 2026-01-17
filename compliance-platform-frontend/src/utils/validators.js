import * as yup from 'yup';

export const loginSchema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().required('Password is required'),
});

export const registerSchema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

export const assessmentSchema = yup.object({
  name: yup.string().required('Assessment name is required'),
  description: yup.string(),
  framework: yup.string().required('Framework is required'),
});
