const User = require('../models/User.model');

exports.updateProfile = async (req, res) => {
  try {
    const { name, avatarUrl } = req.body;
    const userId = req.user.id;

    const updateData = {};
    if (name) updateData.name = name;
    if (avatarUrl) updateData.avatarUrl = avatarUrl;

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true })
        .select('-password'); 
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error });
  }
};


exports.updateAiProfile = async (req, res) => {
  try {
    const { aiBotName, aiBotPrompt } = req.body;
    const userId = req.user.id;

    const updateData = {};
    if (aiBotName) updateData.aiBotName = aiBotName;
    if (aiBotPrompt) updateData.aiBotPrompt = aiBotPrompt;

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });

    res.json({
      message: "Perfil de IA actualizado con éxito.",
      aiBotName: updatedUser.aiBotName,
      aiBotPrompt: updatedUser.aiBotPrompt
    });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error });
  }
};