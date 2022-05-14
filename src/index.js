const express = require('express');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function respondWithError(response, status, message) {
  return response.status(status).json({ error: message });
}

function checkIfUserAccountExists(request, response, next) {
  const { username } = request.headers;
  const user = users.find((user) => user.username === username);
  if (!user) {
    return response.status(400).json({ error: 'User not found.' });
  }
  request.user = user;
  return next();
}

app.post('/users', (request, response) => {
  const { name, username } = request.body;
  const userAlreadyExists = users.some((user) => user.username === username);
  if (userAlreadyExists) {
    return respondWithError(response, 400, 'User already exists.');
  }

  const newUser = {
    id: uuidv4(),
    name,
    username,
    todos: []
  };
  users.push(newUser);

  return response.status(201).json(newUser);
});

app.get('/todos', checkIfUserAccountExists, (request, response) => {
  const user = request.user;
  return response.json(user.todos);
});

app.post('/todos', checkIfUserAccountExists, (request, response) => {
  const user = request.user;
  const { title, deadline } = request.body;

  const newTodo = {
    id: uuidv4(),
    title,
    done: false,
    deadline,
    created_at: new Date(),
  };
  user.todos.push(newTodo);

  return response.status(201).json(newTodo);
});

app.put('/todos/:id', checkIfUserAccountExists, (request, response) => {
  const user = request.user;
  const { id } = request.params;
  const { title, deadline } = request.body;

  let todoToUpdate = user.todos.find((todo) => todo.id === id);
  if (!todoToUpdate) {
    return respondWithError(response, 404, 'TODO not found.');
  }
  todoToUpdate.title = title;
  todoToUpdate.deadline = deadline;

  return response.json(todoToUpdate);
});

app.patch('/todos/:id/done', checkIfUserAccountExists, (request, response) => {
  const user = request.user;
  const { id } = request.params;

  let todoToUpdate = user.todos.find((todo) => todo.id === id);
  if (!todoToUpdate) {
    return respondWithError(response, 404, 'TODO not found.');
  }
  todoToUpdate.done = true;

  return response.json(todoToUpdate);
});

app.delete('/todos/:id', checkIfUserAccountExists, (request, response) => {
  const user = request.user;
  const { id } = request.params;

  let todoToDelete = user.todos.find((todo) => todo.id === id);
  if (!todoToDelete) {
    return respondWithError(response, 404, 'TODO not found.');
  }
  user.todos.splice(todoToDelete, 1);

  return response.status(204).send();
});

module.exports = app;