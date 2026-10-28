import {
  PutCommand,
  GetCommand,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { docClient } from '../config/dynamodb.js';
import { ENV } from '../config/env.js';
import { AppError } from '../middlewares/errorHandler.js';

export class AuthService {
  /**
   * Find user by email (using GSI EmailIndex with fallback to Scan)
   */
  static async findUserByEmail(email) {
    const normalizedEmail = email.toLowerCase().trim();

    try {
      // 1. Attempt efficient Query via Global Secondary Index (EmailIndex)
      const queryCmd = new QueryCommand({
        TableName: ENV.USERS_TABLE,
        IndexName: 'EmailIndex',
        KeyConditionExpression: 'email = :email',
        ExpressionAttributeValues: {
          ':email': normalizedEmail,
        },
      });

      const res = await docClient.send(queryCmd);
      if (res.Items && res.Items.length > 0) {
        return res.Items[0];
      }
    } catch (err) {
      // If GSI doesn't exist yet, fallback to Scan
      const scanCmd = new ScanCommand({
        TableName: ENV.USERS_TABLE,
        FilterExpression: 'email = :email',
        ExpressionAttributeValues: {
          ':email': normalizedEmail,
        },
      });

      const res = await docClient.send(scanCmd);
      if (res.Items && res.Items.length > 0) {
        return res.Items[0];
      }
    }

    return null;
  }

  /**
   * Find user by ID
   */
  static async findUserById(id) {
    const cmd = new GetCommand({
      TableName: ENV.USERS_TABLE,
      Key: { id },
    });

    const res = await docClient.send(cmd);
    return res.Item || null;
  }

  /**
   * Register / Sign up a new user
   */
  static async signup({ name, email, password, company = '' }) {
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existing = await this.findUserByEmail(normalizedEmail);
    if (existing) {
      throw new AppError('An account with this email address already exists', 409);
    }

    // Hash password securely with bcrypt salt rounds
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const now = new Date().toISOString();
    const id = `user_${uuidv4()}`;

    const newUser = {
      id,
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      company: company ? company.trim() : '',
      role: 'user',
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    };

    const putCmd = new PutCommand({
      TableName: ENV.USERS_TABLE,
      Item: newUser,
    });

    await docClient.send(putCmd);

    // Generate JWT token
    const token = this.generateToken(newUser);

    return {
      user: this.sanitizeUser(newUser),
      token,
    };
  }

  /**
   * Authenticate / Login user
   */
  static async login({ email, password }) {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await this.findUserByEmail(normalizedEmail);
    if (!user || user.isDeleted) {
      throw new AppError('Invalid email or password', 401);
    }

    // Verify password hash
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new AppError('Invalid email or password', 401);
    }

    // Generate JWT token
    const token = this.generateToken(user);

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  /**
   * Get current authenticated user profile
   */
  static async getMe(userId) {
    const user = await this.findUserById(userId);
    if (!user || user.isDeleted) {
      throw new AppError('User not found or account deactivated', 404);
    }

    return this.sanitizeUser(user);
  }

  /**
   * Generate signed JWT token
   */
  static generateToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role || 'user',
    };

    return jwt.sign(payload, ENV.JWT_SECRET, {
      expiresIn: ENV.JWT_EXPIRES_IN,
    });
  }

  /**
   * Verify token payload
   */
  static verifyToken(token) {
    try {
      return jwt.verify(token, ENV.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new AppError('Authentication token has expired. Please log in again.', 401);
      }
      throw new AppError('Invalid authentication token', 401);
    }
  }

  /**
   * Strip sensitive fields from user object before returning to client
   */
  static sanitizeUser(user) {
    const { password, ...sanitized } = user;
    return sanitized;
  }
}
