import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/db';

// [POST] API Đăng ký tài khoản
export const register = async (req: Request, res: Response): Promise<void> => {
  const { email, password, full_name } = req.body;

  try {
    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      res.status(400).json({ error: 'Email này đã được sử dụng!' });
      return;
    }
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = await pool.query(
      'INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3) RETURNING id, email, full_name, role',
      [email, hashedPassword, full_name]
    );

    res.status(201).json({
      message: 'Đăng ký thành công!',
      user: newUser.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server khi đăng ký' });
  }
};

// [POST] API Đăng nhập
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Email hoặc mật khẩu không đúng!' });
      return;
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ error: 'Email hoặc mật khẩu không đúng!' });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '1d' }
    );

    res.json({
      message: 'Đăng nhập thành công!',
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server khi đăng nhập' });
  }
};

// [GET] Lấy thông tin profile của người dùng hiện tại
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const result = await pool.query(
      'SELECT id, email, full_name, role, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Người dùng không tìm thấy' });
      return;
    }

    res.json({
      message: 'Lấy profile thành công!',
      user: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server khi lấy profile' });
  }
};

// [PUT] Cập nhật role của người dùng (chỉ ADMIN)
export const updateUserRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    // Validate role
    if (!['ADMIN', 'STAFF', 'AGENT'].includes(role)) {
      res.status(400).json({ error: 'Role không hợp lệ. Phải là ADMIN, STAFF hoặc AGENT' });
      return;
    }

    const result = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, email, full_name, role',
      [role, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Người dùng không tìm thấy' });
      return;
    }

    res.json({
      message: `Cập nhật role thành ${role} thành công!`,
      user: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server khi cập nhật role' });
  }
};