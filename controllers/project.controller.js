const Project = require('../models/Project.model');
const Task = require('../models/Task.model');
const User = require('../models/User.model');

exports.createProject = async (req, res) => {
  try {
    const { name, description } = req.body;
    const ownerId = req.user.id;
    const newProject = new Project({ name, description, owner: ownerId, members: [ownerId] });
    await newProject.save();
    res.status(201).json(newProject);
  }

  catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

exports.getProjectsForUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const projects = await Project.find({ members: userId }).populate('owner', 'name email').populate('members', 'name email');
  }
  catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

exports.addMember = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { email } = req.body;
    const userId = req.user.id;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Proyecto no encontrado.' });
    }

    if (project.owner.toString() !== userId) {
      return res.status(403).json({ message: 'Acción no autorizada. Solo el dueño puede añadir miembros.' });
    }

    const memberToAdd = await User.findOne({ email });
    if (!memberToAdd) {
      return res.status(404).json({ message: 'Usuario no encontrado con ese email.' });
    }

    if (project.members.includes(memberToAdd._id)) {
      return res.status(400).json({ message: 'El usuario ya es miembro de este proyecto.' });
    }

    project.members.push(memberToAdd._id);
    await project.save();

    res.json(project);

  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error });
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    const project = await Project.findById(projectId)
      .populate('owner', 'name email')
      .populate('members', 'name email');

    if (!project) {
      return res.status(404).json({ message: 'Proyecto no encontrado.' });
    }

    if (!project.members.some(member => member._id.equals(userId))) {
      return res.status(403).json({ message: 'Acción no autorizada.' });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;
    const updateData = req.body;
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Proyecto no encontrado.' });
    }

    if (project.owner.toString() !== userId) {
      return res.status(403).json({ message: 'Acción no autorizada. Solo el dueño puede editar el proyecto.' });
    }

    const updatedProject = await Project.findByIdAndUpdate(projectId, updateData, { new: true });
    res.json(updatedProject);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error });
  }
};

exports.updateColumns = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;
    const { columns } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Proyecto no encontrado.' });
    }

    if (project.owner.toString() !== userId) {
      return res.status(403).json({ message: 'Acción no autorizada.' });
    }

    project.kanbanColumns = columns;
    await project.save();
    res.json(project.kanbanColumns);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error });
  }
};

exports.getProjectContextForAI = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    const project = await Project.findById(projectId);
    if (!project || !project.members.includes(userId)) {
      return res.status(403).json({ message: 'Acción no autorizada.' });
    }

    const tasks = await Task.find({ project: projectId })
      .populate('assignee', 'name')
      .populate('labels', 'name color');

    const currentUser = await User.findById(req.user.id);

    const context = {
      projectName: project.name,
      projectDescription: project.description,
      techStack: project.techStack,
      kanbanColumns: project.kanbanColumns,
      membersCount: project.members.length,
      aiBotName: project.aiBotName,
      aiBotInitialPrompt: project.aiBotPrompt,
      userAiBotName: currentUser.aiBotName,
      userAiBotPrompt: currentUser.aiBotPrompt,
      tasks: tasks.map(t => ({
        title: t.title,
        status: t.status,
        priority: t.priority,
        assignee: t.assignee ? t.assignee.name : 'No asignada',
        labels: t.labels.map(l => l.name)
      }))
    };

    res.json(context);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error });
  }
};