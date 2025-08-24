const User = require('../models/User.model');
const jwt = require('jsonwebtoken');

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