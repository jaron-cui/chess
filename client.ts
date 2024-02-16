import WebSocket from 'ws';
import { ClientMessage, ServerMessage } from './message';

const ws = new WebSocket('ws://localhost:8080');

ws.on('error', console.error);

ws.on('open', function open() {
  const create: ClientMessage = {
    type: 'createGame'
  };
  
  ws.send(JSON.stringify(create));
});

ws.on('message', function message(data: string) {
  const message = JSON.parse(data);
  console.log('got message ' + data);
  if (message.type === 'createGame') {
    console.log('client received create game');
    const join: ClientMessage = {
      type: 'registration',
      roomID: message.roomID,
      name: 'johnny'
    }
    ws.send(JSON.stringify(join));
  } else if (message.type === 'registration') {
    console.log('client got key ' + message.key);
  }
});