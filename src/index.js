const express = require('express');
const cors = require('cors');

const { v4: uuidv4, validate } = require('uuid');

const app = express();
app.use(express.json());
app.use(cors());

const users = [];

function checksExistsUserAccount(request, response, next) {
  // Complete aqui
  const { username } = request.headers;
  const exists = users.find(user => user.username === username);

  if (!exists) {
    return response.status(404).json({ error: 'User not found' });
  }

  request.user = exists;
  return next();

}

function checksCreateTodosUserAvailability(request, response, next) {
  // Complete aqui
  const { user } = request;
  if (user.pro || (!user.pro && user.todos.length < 10)) {
    return next();
  }

  return response.status(403).json({
    error: 'Limit todo'
  });
}

function checksTodoExists(request, response, next) {
  if (!request?.user) {
    return response.status(404).json({
      error: 'User not found'
    });
  }

  if (!request.params.id) {
    return response.status(400).json({
      error: 'Not valid id'
    });
  }

  console.log('request.params.id: ', request.params.id);
  if (!validate(request.params.id)) {
    console.log('invalid: ', request.params.id);
    return response.status(400).json({
      error: 'UUID is not valid'
    });
  }

  const { todos } = request.user;
  const { id } = request.params;

  const existsTodo = todos.find(_todo => _todo.id === id);
  if (!existsTodo) {
    return response.status(404).json({
      error: 'Todo not found'
    });
  }

  request.todo = existsTodo;
  return next();
}

function findUserById(request, response, next) {
  // Complete aqui
  const { id } = request.params;
  const exists = users.find(user => user.id === id);
  if (!exists) {
    return response.status(404).json({ error: 'User not found' });
  }

  request.user = exists;
  return next();
}

app.post('/users', (request, response) => {
  const { name, username } = request.body;

  const usernameAlreadyExists = users.some((user) => user.username === username);

  if (usernameAlreadyExists) {
    return response.status(400).json({ error: 'Username already exists' });
  }

  const user = {
    id: uuidv4(),
    name,
    username,
    pro: false,
    todos: []
  };

  users.push(user);

  return response.status(201).json(user);
});

app.get('/users/:id', findUserById, (request, response) => {
  const { user } = request;

  return response.json(user);
});

app.patch('/users/:id/pro', findUserById, (request, response) => {
  const { user } = request;

  if (user.pro) {
    return response.status(400).json({ error: 'Pro plan is already activated.' });
  }

  user.pro = true;

  return response.json(user);
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request;

  return response.json(user.todos);
});

app.post('/todos', checksExistsUserAccount, checksCreateTodosUserAvailability, (request, response) => {
  const { title, deadline } = request.body;
  const { user } = request;

  const newTodo = {
    id: uuidv4(),
    title,
    deadline: new Date(deadline),
    done: false,
    created_at: new Date()
  };

  user.todos.push(newTodo);

  return response.status(201).json(newTodo);
});

app.put('/todos/:id', checksExistsUserAccount, checksTodoExists, (request, response) => {
  const { title, deadline } = request.body;
  const { todo } = request;

  todo.title = title;
  todo.deadline = new Date(deadline);

  return response.json(todo);
});

app.patch('/todos/:id/done', checksExistsUserAccount, checksTodoExists, (request, response) => {
  const { todo } = request;

  todo.done = true;

  return response.json(todo);
});

app.delete('/todos/:id', checksExistsUserAccount, checksTodoExists, (request, response) => {
  const { user, todo } = request;

  const todoIndex = user.todos.indexOf(todo);

  if (todoIndex === -1) {
    return response.status(404).json({ error: 'Todo not found' });
  }

  user.todos.splice(todoIndex, 1);

  return response.status(204).send();
});


module.exports = {
  app,
  users,
  checksExistsUserAccount,
  checksCreateTodosUserAvailability,
  checksTodoExists,
  findUserById
};