// seed.js
const axios = require('axios');
const { faker } = require('@faker-js/faker');
const FormData = require('form-data');

// --- Configuración ---
const API_BASE_URL = 'http://localhost:4000/api'; // Asegúrate de que el puerto sea correcto
const USER_COUNT = 10;
const PROJECT_COUNT = 5;
const TASKS_PER_PROJECT = 3;
const COMMENTS_PER_TASK = 2;

// --- Instancia de Axios ---
const api = axios.create({
  baseURL: API_BASE_URL,
});

// --- Funciones de Ayuda ---

/**
 * Genera un usuario aleatorio con datos completos.
 */
const createRandomUser = () => ({
  name: faker.person.fullName(),
  email: faker.internet.email().toLowerCase(),
  password: 'password123',
  jobTitle: faker.person.jobTitle(),
  bio: faker.lorem.paragraph(),
  skills: faker.helpers.arrayElements(['JavaScript', 'TypeScript', 'React', 'Node.js', 'MongoDB'], 3),
});

/**
 * Genera un proyecto aleatorio.
 */
const createRandomProject = () => ({
  name: faker.commerce.productName() + ' Project',
  description: faker.lorem.sentence(),
  color: faker.color.rgb(),
  dueDate: faker.date.future(),
});

/**
 * Genera una tarea aleatoria.
 */
const createRandomTask = (projectId) => ({
    title: faker.hacker.phrase(),
    description: faker.lorem.paragraph(),
    priority: faker.helpers.arrayElement(['low', 'medium', 'high', 'critical']),
    status: 'todo',
    project: projectId
});

/**
 * Función para pausar la ejecución y evitar saturar el servidor.
 */
const delay = (ms) => new Promise(res => setTimeout(res, ms));


// --- Lógica Principal del Script ---

async function main() {
  console.log('🚀 Iniciando script de simulación...');
  
  const users = [];
  const projects = [];

  try {
    // --- 1. Crear y autenticar usuarios ---
    console.log(`\n👤 Creando ${USER_COUNT} usuarios...`);
    for (let i = 0; i < USER_COUNT; i++) {
      const userData = createRandomUser();
      try {
        // Registrar
        const registerResponse = await api.post('/auth/register', userData);
        
        const registeredUser = registerResponse.data.user;
        const token = registerResponse.data.token;
        
        users.push({ ...registeredUser, token });
        console.log(`   ✅ Usuario creado: ${registeredUser.name} (${registeredUser.email})`);
        
        // Actualizar perfil con más datos (bio, skills, etc.)
        await api.put('/user/profile', {
            bio: userData.bio,
            jobTitle: userData.jobTitle,
            skills: userData.skills,
        }, { headers: { Authorization: `Bearer ${token}` } });
        
      } catch (error) {
        console.error(`   ❌ Error creando usuario ${userData.email}:`, error.response?.data?.error || error.message);
      }
      await delay(100); // Pausa breve
    }

    if (users.length === 0) {
        console.error("\nNo se pudo crear ningún usuario. Abortando script.");
        return;
    }

    // --- 2. Crear Proyectos ---
    console.log(`\n🏗️  Creando ${PROJECT_COUNT} proyectos...`);
    for (let i = 0; i < PROJECT_COUNT; i++) {
        const owner = users[i % users.length]; // Los primeros usuarios serán los dueños
        const projectData = createRandomProject();
        
        // La API espera `multipart/form-data`, así que lo simulamos
        const form = new FormData();
        form.append('data', JSON.stringify(projectData));

        try {
            const response = await api.post('/projects', form, {
                headers: {
                    ...form.getHeaders(),
                    Authorization: `Bearer ${owner.token}`,
                },
            });
            projects.push({ ...response.data, ownerId: owner.id });
            console.log(`   ✅ Proyecto creado: "${response.data.name}" por ${owner.name}`);
        } catch (error) {
            console.error(`   ❌ Error creando proyecto:`, error.response?.data?.message || error.message);
        }
        await delay(100);
    }
    
    if (projects.length === 0) {
        console.error("\nNo se pudo crear ningún proyecto. Abortando script.");
        return;
    }

    // --- 3. Invitar usuarios a proyectos ---
    console.log('\n🤝 Invitando usuarios a los proyectos...');
    for (const project of projects) {
        const owner = users.find(u => u.id === project.ownerId);
        // Invitar a 2 usuarios aleatorios que no sean el dueño
        const usersToInvite = faker.helpers.arrayElements(
            users.filter(u => u.id !== owner.id), 2
        );

        for (const userToInvite of usersToInvite) {
            try {
                await api.post(`/projects/${project.id}/invitations`, {
                    userIdToInvite: userToInvite.id
                }, { headers: { Authorization: `Bearer ${owner.token}` } });
                console.log(`   ✅ ${owner.name} invitó a ${userToInvite.name} a "${project.name}"`);
            } catch(error) {
                console.error(`   ❌ Error invitando a usuario:`, error.response?.data?.message || error.message);
            }
            await delay(50);
        }
        // Añadimos los invitados al objeto del proyecto para simular que aceptaron
        project.members = [...project.members, ...usersToInvite.map(u => ({ id: u.id, name: u.name, avatarUrl: u.avatarUrl }))];
    }
    
    // --- 4 & 5. Crear Tareas y Comentarios ---
    console.log('\n📝 Creando tareas y añadiendo comentarios...');
    for (const project of projects) {
        console.log(`   --- Interactuando en el proyecto: "${project.name}" ---`);
        const projectMembers = users.filter(u => project.members.some(m => m.id === u.id));

        for (let i = 0; i < TASKS_PER_PROJECT; i++) {
            const taskCreator = faker.helpers.arrayElement(projectMembers);
            const taskData = createRandomTask(project.id);

            try {
                // Crear Tarea
                const taskResponse = await api.post(`/projects/${project.id}/tasks`, taskData, {
                    headers: { Authorization: `Bearer ${taskCreator.token}` }
                });
                const task = taskResponse.data;
                console.log(`     ✅ Tarea creada: "${task.title}" por ${taskCreator.name}`);
                await delay(100);

                // Añadir Comentarios
                const commenters = faker.helpers.arrayElements(
                    projectMembers.filter(u => u.id !== taskCreator.id), 
                    COMMENTS_PER_TASK
                );
                for (const commenter of commenters) {
                    await api.post(`/tasks/${task.id}/comments`, {
                        content: faker.lorem.sentence()
                    }, { headers: { Authorization: `Bearer ${commenter.token}` } });
                    console.log(`       💬 Comentario de ${commenter.name} en "${task.title}"`);
                    await delay(50);
                }

            } catch(error) {
                console.error(`   ❌ Error creando tarea o comentario:`, error.response?.data?.message || error.message);
            }
        }
    }

  } catch (e) {
    console.error('\n💥 Ha ocurrido un error fatal en el script:', e.message);
  } finally {
    console.log('\n🏁 Script de simulación finalizado.');
  }
}

main();