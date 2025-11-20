// src/services/authService.js (BACKEND)
import { PrismaClient } from '@prisma/client';
import { hashPassword, comparePassword } from '../utils/bcryptUtils.js';
import { generateToken } from '../utils/jwtUtils.js';
import { JWT_EXPIRES_IN_FREE, JWT_EXPIRES_IN_PREMIUM } from '../config/jwt.js';

const prisma = new PrismaClient();

/**
 * Registrar un nuevo usuario (lógica de negocio)
 */
export const registerUser = async ({ email, password, firstName, lastName }) => {
	try {
		// Verificar si el usuario ya existe
		const existingUser = await prisma.user.findUnique({ where: { email } });
		
		if (existingUser) {
			const err = new Error('Este email ya está registrado');
			err.status = 409; // Conflict
			throw err;
		}

		// Validar formato de email
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			const err = new Error('El formato del email no es válido');
			err.status = 400;
			throw err;
		}

		// Validar contraseña
		if (password.length < 6) {
			const err = new Error('La contraseña debe tener al menos 6 caracteres');
			err.status = 400;
			throw err;
		}

		// Validar nombres
		if (!firstName || firstName.trim().length < 2) {
			const err = new Error('El nombre debe tener al menos 2 caracteres');
			err.status = 400;
			throw err;
		}

		if (!lastName || lastName.trim().length < 2) {
			const err = new Error('El apellido debe tener al menos 2 caracteres');
			err.status = 400;
			throw err;
		}

		// Hashear la contraseña
		const hashedPassword = await hashPassword(password);

		// Crear el usuario (sin verificar)
		const user = await prisma.user.create({
			data: {
				email: email.toLowerCase().trim(),
				password: hashedPassword,
				firstName: firstName.trim(),
				lastName: lastName.trim(),
				role: 'FREE',
				isVerified: false,
			},
			select: {
				id: true,
				email: true,
				firstName: true,
				lastName: true,
				role: true,
				isVerified: true,
				createdAt: true,
			},
		});

		return { user, requiresVerification: true };
	} catch (error) {
		// Si es un error que ya creamos, simplemente lo propagamos
		if (error.status) {
			throw error;
		}
		
		// Si es un error de Prisma por clave duplicada
		if (error.code === 'P2002') {
			const err = new Error('Este email ya está registrado');
			err.status = 409;
			throw err;
		}
		
		// Error genérico
		console.error('Error en registerUser:', error);
		const err = new Error('Error al crear el usuario');
		err.status = 500;
		throw err;
	}
};

/**
 * Iniciar sesión (lógica de negocio)
 */
export const loginUser = async ({ email, password }) => {
	try {
		// Buscar usuario
		const user = await prisma.user.findUnique({ 
			where: { email: email.toLowerCase().trim() } 
		});

		if (!user) {
			const err = new Error('Email o contraseña incorrectos');
			err.status = 401; // Unauthorized
			throw err;
		}

		// Verificar si el usuario está activo
		if (!user.isActive) {
			const err = new Error('Tu cuenta está inactiva. Por favor contacta al administrador');
			err.status = 403; // Forbidden
			throw err;
		}

		// Verificar si el email está verificado
		if (!user.isVerified) {
			const err = new Error('Por favor verifica tu email antes de iniciar sesión');
			err.status = 403; // Forbidden
			throw err;
		}

		// Verificar contraseña
		const isPasswordValid = await comparePassword(password, user.password);

		if (!isPasswordValid) {
			const err = new Error('Email o contraseña incorrectos');
			err.status = 401;
			throw err;
		}

		// Generar token con duración según el rol
		const expiresIn = user.role === 'PREMIUM' ? JWT_EXPIRES_IN_PREMIUM : JWT_EXPIRES_IN_FREE;

		const token = generateToken(
			{
				userId: user.id,
				email: user.email,
				role: user.role,
			},
			expiresIn
		);

		// Preparar datos del usuario (sin contraseña)
		const userData = {
			id: user.id,
			email: user.email,
			firstName: user.firstName,
			lastName: user.lastName,
			role: user.role,
			createdAt: user.createdAt,
		};

		return { user: userData, token };
	} catch (error) {
		// Si es un error que ya creamos, simplemente lo propagamos
		if (error.status) {
			throw error;
		}
		
		// Error genérico
		console.error('Error en loginUser:', error);
		const err = new Error('Error al iniciar sesión');
		err.status = 500;
		throw err;
	}
};