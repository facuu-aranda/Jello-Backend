const User = require('../models/User.model');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email});
    if (existingUser) {
      return res.status(400).json({ message: 'El correo ya esta en uso' });
    }

    const newUser = new User({ name, email, password, role });
    await newUser.save();

  res.status(201).json({ message: 'Usuario registrado exitosamente' });
  }

  catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

exports.login = async (req, res) => {

  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const payload = { id: user._id, name: user.name, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token, user: payload });

    } 
    catch (error) {
      res.status(500).json({ message: 'Error en el servidor', error: error.message });
    }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: 'Usuario no encontrado' });
  }
  const token = crypto.randomBytes(20).toString('hex');
  user.passwordResetToken = token;
  user.passwordResetExpires = Date.now() + 3600000; 
  await user.save();

const resetURL = `${req.protocol}://${req.get('host')}/api/auth/reset-password/${token}`;

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  await transporter.sendMail({
    from: '"Jello Support" <noreply@jelloapp.com>',
    to: user.email,
    subject: 'Recuperacion de contraseña',
    text: `Usa el siguiente link para resetear tu contraseña: ${resetURL}`
  });

  res.json({ message: 'Email de recuperación enviado' });
};

exports.resetPassword = async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
        return res.status(400).json({ message: 'El token es inválido o ha expirado.' });
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({ message: 'Contraseña actualizada con éxito.' });
};