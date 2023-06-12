const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const adminUsername = 'xyspg';
const users = ['test', 'test1', 'test2','test3'];
// let users = [];
const commands = [
  '1 你是第一个人。请你找到一位学长/学姐小声询问“游戏可以开始了吗”，当得到肯定的答案后，站起并大声喊出“大家注意 游戏已经开始了”然后坐下',
  '2 在听到有人说“游戏已经开始了”并坐下后，请你找到篮球并将其交给离你较近的任意一位学长/学姐，然 后回到座位',
  '3 在看到有人把篮球交给学长/学姐一个篮球并回到座位后，请过去将篮球放回原处并大声问出“去年新民女篮的名次是什么?”，然后回到座位',
  '4 有人问出“去年新民女篮的名次是什么?”然后回到座位后，请你站起并大声回答“冠军”，然后坐下',
  '5 听到有人喊出“冠军”并坐下后，请找到下沉剧场的灯并把它关掉(会有学长学姐引导你)，然后站在原地等到有人说完“...《不知去向》”之后，请你把灯打开，然后回到座位',
];
let userCommands = {};
let onlineUsers = [];

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('User connected');

  function verifyUser(username) {
    return users.includes(username) || username === adminUsername;
  }

  socket.on('join', (username) => {
    
    if (verifyUser(username)) {
      socket.username = username;
      username !== adminUsername && onlineUsers.push(username);
      console.log(`User ${username} joined`);
      if (username === adminUsername) {
        socket.isAdmin = true;
      } else {
        socket.isAdmin = false;
      }

      socket.emit('welcome', {
        username: username,
        isAdmin: socket.isAdmin,
      });

      if (socket.isAdmin) {
        socket.emit('user_commands', userCommands);
      }
      io.emit('user_list_update', onlineUsers);
      io.emit('user_count_update', onlineUsers.length);
    } else {
      socket.emit('authentication_failed');
    }

   
  });

  socket.on('start_game', (username) => {
    if (username === adminUsername) {
      userCommands = assignCommands(users, commands);
      io.emit('game_started', userCommands);
      io.emit('command_list_update', userCommands);
    }
  });

  socket.on('refresh', (username) => {
    if (socket.isAdmin) {
      userCommands = assignCommands(users, commands);
      io.emit('commands_refreshed', userCommands);
      io.emit('command_list_update', userCommands);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
    const index = onlineUsers.indexOf(socket.username);
    if (index !== -1) {
      onlineUsers.splice(index, 1);
      io.emit('user_list_update', onlineUsers);
    }
  });
});

function assignCommands(users, commands) {
  const shuffledCommands = shuffle([...commands]);
  return users.reduce((acc, user, idx) => {
    acc[user] = shuffledCommands[idx];
    return acc;
  }, {});
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
