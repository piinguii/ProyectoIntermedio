const Project = require('../models/Project');
const Client = require('../models/Client');
const { matchedData } = require('express-validator');
const { handleHttpError } = require('../utils/handleError');

// POST: Crear proyecto
const createProject = async (req, res) => {
  const data = matchedData(req);
  const user = req.user;

  try {
    const client = await Client.findOne({
      _id: data.clientId,
      createdBy: user._id
    });

    if (!client) return handleHttpError(res, 'Cliente no encontrado o sin permiso', 404);

    const exists = await Project.findOne({
      $or: [{ projectCode: data.projectCode }, { name: data.name }],
      createdBy: user._id
    });

    if (exists) return handleHttpError(res, 'Proyecto ya existe para este usuario', 409);

    const project = new Project({ ...data, createdBy: user._id });
    await project.save();

    res.status(201).json({ success: true, project });
  } catch (err) {
    console.error(err);
    handleHttpError(res, 'Error al crear proyecto');
  }
};

// PUT: Actualizar proyecto
const updateProject = async (req, res) => {
  const { id } = req.params;
  const data = matchedData(req);
  const user = req.user;

  try {
    const project = await Project.findById(id);
    if (!project) return handleHttpError(res, 'Proyecto no encontrado', 404);

    if (!project.createdBy.equals(user._id)) {
      return handleHttpError(res, 'Sin permisos para actualizar', 403);
    }

    const duplicate = await Project.findOne({
      projectCode: data.projectCode,
      _id: { $ne: id },
      createdBy: user._id
    });

    if (duplicate) return handleHttpError(res, 'Proyecto duplicado con ese código', 409);

    Object.assign(project, data);
    await project.save();

    res.status(200).json({ success: true, project });
  } catch (err) {
    console.error(err);
    handleHttpError(res, 'Error al actualizar proyecto');
  }
};

// GET: Todos los proyectos del usuario
const getAllProjects = async (req, res) => {
  const user = req.user;

  try {
    const projects = await Project.find({
      archived: false,
      createdBy: user._id
    }).populate('client');

    res.status(200).json({ success: true, projects });
  } catch (err) {
    console.error(err);
    handleHttpError(res, 'Error al obtener proyectos');
  }
};

// GET: Proyecto por ID
const getProjectById = async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  try {
    const project = await Project.findById(id).populate('client');

    if (!project || project.archived || !project.createdBy.equals(user._id)) {
      return handleHttpError(res, 'Proyecto no encontrado o sin acceso', 404);
    }

    res.status(200).json({ success: true, project });
  } catch (err) {
    console.error(err);
    handleHttpError(res, 'Error al obtener proyecto');
  }
};

// PATCH: Archivar proyecto
const archiveProject = async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  try {
    const project = await Project.findById(id);
    if (!project || !project.createdBy.equals(user._id)) {
      return handleHttpError(res, 'Sin acceso al proyecto', 403);
    }

    project.archived = true;
    await project.save();

    res.status(200).json({ success: true, message: 'Proyecto archivado correctamente' });
  } catch (err) {
    console.error(err);
    handleHttpError(res, 'Error al archivar proyecto');
  }
};

// DELETE: Eliminar proyecto
const deleteProject = async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  try {
    const project = await Project.findById(id);
    if (!project || !project.createdBy.equals(user._id)) {
      return handleHttpError(res, 'Sin acceso al proyecto', 403);
    }

    await project.deleteOne();

    res.status(200).json({ success: true, message: 'Proyecto eliminado permanentemente' });
  } catch (err) {
    console.error(err);
    handleHttpError(res, 'Error al eliminar proyecto');
  }
};

// GET: Proyectos archivados
const getArchivedProjects = async (req, res) => {
  const user = req.user;

  try {
    const projects = await Project.find({
      archived: true,
      createdBy: user._id
    }).populate('client');

    res.status(200).json({ success: true, projects });
  } catch (err) {
    console.error(err);
    handleHttpError(res, 'Error al obtener proyectos archivados');
  }
};

// PATCH: Restaurar proyecto
const unarchiveProject = async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  try {
    const project = await Project.findById(id);
    if (!project || !project.createdBy.equals(user._id)) {
      return handleHttpError(res, 'Sin acceso al proyecto', 403);
    }

    project.archived = false;
    await project.save();

    res.status(200).json({ success: true, message: 'Proyecto restaurado correctamente' });
  } catch (err) {
    console.error(err);
    handleHttpError(res, 'Error al restaurar proyecto');
  }
};

module.exports = {
  createProject,
  updateProject,
  getAllProjects,
  getProjectById,
  archiveProject,
  deleteProject,
  getArchivedProjects,
  unarchiveProject
};
