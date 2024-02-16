import { WebSocketServer } from 'ws';
import { ClientMessage, ServerMessage } from './message';

interface Player {
  name?: string;
  key: string;
}

interface ServerRoster {
  player1?: Player;
  player2?: Player;
  spectators: Player[];
}

interface Lobby {
  id: string;
  roster: ServerRoster;
}

interface GameSession {
  id: string;
  state: any;
  roster: ServerRoster;
}

const wss = new WebSocketServer({ port: 8080 });
const state: {lobbies: Map<string, Lobby>, games: Map<string, GameSession>} = {
  lobbies: new Map(),
  games: new Map()
};

let x = 0;
function generateNewPlayerID(): string {
  x += 1;
  return 'id' + x;
}

function generateNewRoomID(): string {
  x += 1;
  return 'roomid' + x;
}

function registerPlayer(roomID: string, name?: string): string | undefined {
  const lobby = state.lobbies.get(roomID);
  if (lobby !== undefined) {
    const key = generateNewPlayerID();
    lobby.roster.spectators.push({
      name: name,
      key: key
    });
    return key;
  }
  const game = state.games.get(roomID);
  if (game !== undefined) {
    const key = generateNewPlayerID();
    game.roster.spectators.push({
      name: name,
      key: key
    });
    return key
  }
  // invalid room ID
  return undefined;
}

function handleMessage(data: ClientMessage) {
  console.log('received: %s', data);
  let response: ServerMessage | undefined;
  switch(data.type) {
    case 'registration':
      const key = registerPlayer(data.roomID, data.name);
      if (key) {
        response = {
          type: 'registration',
          key: key
        };
      } else {

      }
      break;
    case 'createGame':
      const id = generateNewRoomID();
      state.lobbies.set(id, {
        id: id,
        roster: {
          spectators: []
        }
      });
      response = {
        type: 'createGame',
        roomID: id
      };
      break;
  }
  return response;
}

wss.on('connection', function connection(ws) {
  ws.on('error', console.error);

  ws.on('message', function message(data: string) {
    const response = handleMessage(JSON.parse(data));
    console.log('sending response ' + response);
    if (response) {
      ws.send(JSON.stringify(response));
    }
  });
});
console.log('Started websocket server on ' + 8080)